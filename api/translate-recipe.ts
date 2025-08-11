// /api/translate-recipe.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

export const config = { runtime: 'nodejs' };

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const LT_URL       = process.env.LIBRETRANSLATE_URL || ''; // e.g. https://libretranslate.com

const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

function sha(input: unknown) {
  return crypto.createHash('sha256').update(JSON.stringify(input ?? '')).digest('hex');
}

const normIngredients = (raw: any) => {
  if (!raw) return [] as { name: string; amount?: any; bakers_pct?: any }[];
  if (Array.isArray(raw) && raw.every((x) => typeof x === 'object')) return raw;
  if (Array.isArray(raw)) return raw.map((s) => ({ name: String(s ?? '') }));
  if (typeof raw === 'string') {
    return raw
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((name) => ({ name }));
  }
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
  if (typeof raw === 'string') {
    return raw
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((text, i) => ({ position: i + 1, text }));
  }
  return [];
};

async function ltTranslate(q: string, target: string) {
  const r = await fetch(`${LT_URL}/translate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ q, source: 'auto', target, format: 'text' }),
  });
  if (!r.ok) throw new Error(`LT ${r.status}`);
  const j = await r.json().catch(() => ({}));
  return (j?.translatedText as string) ?? q;
}

// crude change detector: counts how many outputs differ
function changedCount(orig: string[], out: string[]) {
  let c = 0;
  for (let i = 0; i < Math.max(orig.length, out.length); i++) {
    if ((orig[i] || '') !== (out[i] || '')) c++;
  }
  return c;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const { recipeId, targetLang, force = false, debug = false } = req.body || {};
  if (!recipeId || !targetLang) {
    return res.status(400).json({ error: 'missing_params' });
  }

  // If translator not configured, don’t cache non-translation
  if (!LT_URL) {
    return res.status(503).json({ error: 'translator_not_configured' });
  }

  // fetch recipe
  const { data: rcp, error: rErr } = await admin
    .from('recipes')
    .select('id,title,description,ingredients,steps,updated_at,created_at')
    .eq('id', recipeId)
    .maybeSingle();

  if (rErr || !rcp) {
    return res.status(404).json({ error: 'recipe_not_found' });
  }

  const ing = normIngredients(rcp.ingredients);
  const steps = normSteps(rcp.steps);
  const contentHash = sha({ t: rcp.title ?? '', d: rcp.description ?? '', ing, steps });

  // cache hit?
  if (!force) {
    const { data: cached } = await admin
      .from('recipe_translations')
      .select('title,description,ingredients,steps')
      .eq('recipe_id', recipeId)
      .eq('lang', targetLang)
      .eq('content_hash', contentHash)
      .maybeSingle();

    if (cached) {
      return res.status(200).json({ cached: true, ...cached });
    }
  }

  // translate
  let tTitle = String(rcp.title ?? '');
  let tDesc  = String(rcp.description ?? '');

  try {
    tTitle = await ltTranslate(tTitle, targetLang);
    tDesc  = await ltTranslate(tDesc, targetLang);
  } catch (e) {
    return res.status(502).json({ error: 'translator_failed', details: String(e) });
  }

  const srcIng = ing.map((r) => r.name || '');
  const srcSteps = steps.map((r) => r.text || '');
  let outIng: string[] = [];
  let outSteps: string[] = [];

  try {
    outIng = await Promise.all(srcIng.map((s) => ltTranslate(s, targetLang)));
    outSteps = await Promise.all(srcSteps.map((s) => ltTranslate(s, targetLang)));
  } catch (e) {
    // partial failure → treat as failure
    return res.status(502).json({ error: 'translator_failed', details: String(e) });
  }

  // decide if this is a real translation (anything changed?)
  const diffTitle = tTitle !== (rcp.title ?? '');
  const diffDesc  = tDesc  !== (rcp.description ?? '');
  const diffIng   = changedCount(srcIng, outIng) > 0;
  const diffSteps = changedCount(srcSteps, outSteps) > 0;

  const looksTranslated = diffTitle || diffDesc || diffIng || diffSteps;

  const ingredientsOut = ing.map((row, i) => ({ ...row, name: outIng[i] ?? row.name }));
  const stepsOut = steps.map((row, i) => ({ ...row, text: outSteps[i] ?? row.text }));

  // only cache when it actually changed
  if (looksTranslated) {
    await admin.from('recipe_translations').upsert(
      {
        recipe_id: recipeId,
        lang: targetLang,
        content_hash: contentHash,
        title: tTitle,
        description: tDesc,
        ingredients: ingredientsOut,
        steps: stepsOut,
      },
      { onConflict: 'recipe_id,lang,content_hash' }
    );
  }

  return res.status(200).json({
    cached: false,
    translated: looksTranslated,
    title: tTitle,
    description: tDesc,
    ingredients: ingredientsOut,
    steps: stepsOut,
    ...(debug
      ? {
          lang: targetLang,
          content_hash: contentHash,
          lt_url: LT_URL,
          diffs: { diffTitle, diffDesc, diffIng, diffSteps },
        }
      : null),
  });
}
