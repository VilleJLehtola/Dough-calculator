// /api/translate-recipe.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export const config = { runtime: 'nodejs' }; // <-- important

type Step = { position?: number; text?: string; time?: number | null } | string;
type Ingredient = { name?: string; amount?: string; bakers_pct?: string } | string;

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const LT_URL = process.env.LIBRETRANSLATE_URL || ''; // e.g. https://libretranslate.de

/* ------------------------- normalizers (same as UI) ------------------------ */
function normIngredients(raw: any) {
  if (!raw) return [] as { name: string; amount?: string; bakers_pct?: string }[];
  if (Array.isArray(raw) && raw.every((x) => typeof x === 'object')) return raw;
  if (Array.isArray(raw)) return raw.map((s: Ingredient) => ({ name: String(s ?? '') }));
  if (typeof raw === 'string') {
    return raw
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((name) => ({ name }));
  }
  return [];
}

function normSteps(raw: any) {
  if (!raw) return [] as { position: number; text: string; time?: number | null }[];
  if (Array.isArray(raw) && raw.every((x) => typeof x === 'object')) {
    return raw.map((s: any, i: number) => ({
      position: s.position ?? i + 1,
      text: s.text ?? s.content ?? s.description ?? '',
      time: s.time ?? s.minutes ?? null,
    }));
  }
  if (Array.isArray(raw))
    return raw.map((s: Step, i: number) => ({ position: i + 1, text: String(s ?? '') }));
  if (typeof raw === 'string') {
    return raw
      .split('\n')
      .map((t) => t.trim())
      .filter(Boolean)
      .map((text, i) => ({ position: i + 1, text }));
  }
  return [];
}

/* -------------------------- translation provider -------------------------- */
async function translateOne(q: string, target: string) {
  if (!q || !LT_URL || target === 'auto') return q;
  try {
    const r = await fetch(`${LT_URL}/translate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ q, source: 'auto', target, format: 'text' }),
    });
    if (!r.ok) return q;
    const j = await r.json();
    return j?.translatedText ?? q;
  } catch {
    return q;
  }
}

/* --------------------------------- handler -------------------------------- */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { recipeId, targetLang } = (req.body || {}) as {
      recipeId?: string;
      targetLang?: string;
    };
    if (!recipeId || !targetLang) {
      res.status(400).json({ error: 'recipeId and targetLang are required' });
      return;
    }

    // Admin client for read/write cache (service role)
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // 1) Fetch recipe
    const { data: rcp, error } = await admin
      .from('recipes')
      .select('id,title,description,ingredients,steps')
      .eq('id', recipeId)
      .single();

    if (error || !rcp) {
      res.status(404).json({ error: 'Recipe not found' });
      return;
    }

    // 2) Normalize + hash content
    const ing = normIngredients(rcp.ingredients);
    const st = normSteps(rcp.steps);

    const contentHash = crypto
      .createHash('sha256')
      .update(
        JSON.stringify({
          t: rcp.title ?? '',
          d: rcp.description ?? '',
          ing,
          st,
        })
      )
      .digest('hex');

    // 3) Cache lookup (exact content hash)
    const { data: cached } = await admin
      .from('recipe_translations')
      .select('title,description,ingredients,steps')
      .eq('recipe_id', recipeId)
      .eq('lang', targetLang)
      .eq('content_hash', contentHash)
      .maybeSingle();

    if (cached) {
      res.status(200).json({ cached: true, ...cached });
      return;
    }

    // 4) Translate (or echo if no provider)
    const [tTitle, tDesc, tIngNames, tStepTexts] = await Promise.all([
      translateOne(String(rcp.title || ''), targetLang),
      translateOne(String(rcp.description || ''), targetLang),
      Promise.all(ing.map((row) => translateOne(row.name || '', targetLang))),
      Promise.all(st.map((row) => translateOne(row.text || '', targetLang))),
    ]);

    const translatedIngredients = ing.map((row, i) => ({
      ...row,
      name: tIngNames[i] ?? row.name,
    }));
    const translatedSteps = st.map((row, i) => ({
      ...row,
      text: tStepTexts[i] ?? row.text,
    }));

    // 5) Upsert into cache (unique on recipe_id,lang,content_hash)
    await admin.from('recipe_translations').upsert(
      {
        recipe_id: recipeId,
        lang: targetLang,
        content_hash: contentHash,
        title: tTitle,
        description: tDesc,
        ingredients: translatedIngredients,
        steps: translatedSteps,
      },
      { onConflict: 'recipe_id,lang,content_hash' }
    );

    res.status(200).json({
      cached: false,
      title: tTitle,
      description: tDesc,
      ingredients: translatedIngredients,
      steps: translatedSteps,
    });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Internal error' });
  }
}
