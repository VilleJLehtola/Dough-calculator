// /api/translate-recipe.ts
import type { VercelRequest, VercelResponse } from 'vercel';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

function json(res: VercelResponse, code: number, body: any) {
  res.status(code).setHeader('content-type', 'application/json; charset=utf-8');
  res.send(JSON.stringify(body));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS (also handles preflights)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  // Accept both GET and POST (handy for smoke tests)
  const isPost = req.method === 'POST';
  const isGet = req.method === 'GET';
  if (!isPost && !isGet) return json(res, 405, { error: 'method_not_allowed' });

  const SUPABASE_URL =
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const LT_URL =
    (process.env.LT_URL || process.env.LIBRETRANSLATE_URL || '').replace(/\/+$/, '');

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return json(res, 500, { error: 'supabase_env_missing' });
  }
  if (!LT_URL) {
    // Translator not configured → client should fall back to original content.
    return json(res, 503, { error: 'translator_not_configured' });
  }

  // Inputs
  const body = isPost
    ? (typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {}))
    : { recipeId: req.query.recipeId, targetLang: req.query.targetLang, debug: req.query.debug === 'true' };

  const recipeId = String(body.recipeId || '').trim();
  const targetLang = String(body.targetLang || '').trim();
  const force = Boolean(body.force);
  const debug = Boolean(body.debug);

  if (!recipeId || !targetLang) return json(res, 400, { error: 'missing_params' });

  // Admin client
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

  // Fetch recipe
  const { data: rcp, error: rErr } = await admin
    .from('recipes')
    .select('id,title,description,ingredients,steps,updated_at,created_at')
    .eq('id', recipeId)
    .maybeSingle();

  if (rErr || !rcp) return json(res, 404, { error: 'recipe_not_found' });

  // Normalize
  const normIng = (raw: any) => {
    if (!raw) return [] as { name: string; [k: string]: any }[];
    if (Array.isArray(raw) && raw.every((x) => typeof x === 'object')) return raw;
    if (Array.isArray(raw)) return raw.map((s) => ({ name: String(s ?? '') }));
    if (typeof raw === 'string')
      return raw.split('\n').map((s) => s.trim()).filter(Boolean).map((name) => ({ name }));
    return [];
  };
  const normSteps = (raw: any) => {
    if (!raw) return [] as { position?: number; text: string; time?: number | null }[];
    if (Array.isArray(raw) && raw.every((x) => typeof x === 'object')) {
      return raw.map((s, i) => ({
        position: s.position ?? i + 1,
        text: s.text ?? s.content ?? s.description ?? String(s ?? ''),
        time: s.time ?? s.minutes ?? null,
      }));
    }
    if (Array.isArray(raw)) return raw.map((t, i) => ({ position: i + 1, text: String(t ?? '') }));
    if (typeof raw === 'string')
      return raw.split('\n').map((s) => s.trim()).filter(Boolean).map((text, i) => ({ position: i + 1, text }));
    return [];
  };

  const ingredients = normIng(rcp.ingredients);
  const steps = normSteps(rcp.steps);

  const contentHash = crypto
    .createHash('sha256')
    .update(JSON.stringify({ t: rcp.title || '', d: rcp.description || '', ingredients, steps }))
    .digest('hex');

  // Cache hit
  if (!force) {
    const { data: hit } = await admin
      .from('recipe_translations')
      .select('title,description,ingredients,steps,content_hash')
      .eq('recipe_id', recipeId)
      .eq('lang', targetLang)
      .eq('content_hash', contentHash)
      .maybeSingle();
    if (hit) return json(res, 200, { cached: true, ...hit });
  }

  // LibreTranslate call
  async function lt(text: string) {
    if (!text) return text;
    const r = await fetch(`${LT_URL}/translate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ q: text, source: 'auto', target: targetLang, format: 'text' }),
    });
    if (!r.ok) throw new Error(`LT ${r.status}`);
    const j = await r.json().catch(() => ({}));
    return j?.translatedText ?? text;
  }

  try {
    const outTitle = await lt(String(rcp.title || ''));
    const outDesc = await lt(String(rcp.description || ''));

    const srcIng = ingredients.map((r) => r.name || '');
    const outIng = await Promise.all(srcIng.map((s) => lt(s)));
    const outSteps = await Promise.all(steps.map((s) => lt(s.text || '')));

    const ingredientsOut = ingredients.map((row, i) => ({ ...row, name: outIng[i] ?? row.name }));
    const stepsOut = steps.map((row, i) => ({ ...row, text: outSteps[i] ?? row.text }));

    const changed =
      outTitle !== (rcp.title || '') ||
      outDesc !== (rcp.description || '') ||
      outIng.some((t, i) => t !== srcIng[i]) ||
      outSteps.some((t, i) => t !== (steps[i]?.text || ''));

    if (changed) {
      await admin.from('recipe_translations').upsert(
        {
          recipe_id: recipeId,
          lang: targetLang,
          content_hash: contentHash,
          title: outTitle,
          description: outDesc,
          ingredients: ingredientsOut,
          steps: stepsOut,
        },
        { onConflict: 'recipe_id,lang,content_hash' }
      );
    }

    return json(res, 200, {
      cached: false,
      translated: changed,
      title: outTitle,
      description: outDesc,
      ingredients: ingredientsOut,
      steps: stepsOut,
      ...(debug ? { content_hash: contentHash, lt_url: LT_URL } : null),
    });
  } catch (e: any) {
    return json(res, 502, { error: 'translator_failed', message: String(e?.message || e) });
  }
}
