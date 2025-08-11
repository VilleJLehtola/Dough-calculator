// Vercel Edge/Node API route
// Translates a recipe to targetLang using free providers (LibreTranslate with MyMemory fallback)
// Caches per (recipe_id, lang, content_hash) in Supabase.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// You can replace with your own self-hosted LibreTranslate endpoint for higher limits
const LIBRE_ENDPOINTS = [
  'https://translate.astian.org/translate',
  'https://libretranslate.com/translate', // often throttled
];

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

// ---------- helpers ----------
const sha256 = (s: string) => crypto.createHash('sha256').update(s).digest('hex');

function normalizeIngredients(raw: any): { name: string; amount?: string; bakers_pct?: string }[] {
  if (!raw) return [];
  if (Array.isArray(raw) && raw.every((x) => typeof x === 'object')) return raw;
  if (Array.isArray(raw)) return raw.map((t) => ({ name: String(t ?? '') }));
  if (typeof raw === 'string')
    return raw
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((name) => ({ name }));
  return [];
}

function normalizeSteps(raw: any): { position: number; text: string; time?: number | null }[] {
  if (!raw) return [];
  if (Array.isArray(raw) && raw.every((x) => typeof x === 'object')) {
    return raw.map((s, i) => ({
      position: s.position ?? i + 1,
      text: s.text ?? s.content ?? s.description ?? String(s ?? ''),
      time: s.time ?? s.minutes ?? null,
    }));
  }
  if (Array.isArray(raw)) return raw.map((t, i) => ({ position: i + 1, text: String(t ?? '') }));
  if (typeof raw === 'string')
    return raw
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((text, i) => ({ position: i + 1, text }));
  return [];
}

// try LibreTranslate first; if it fails, fall back to MyMemory
async function translateText(text: string, target: string): Promise<string> {
  const q = text ?? '';
  if (!q) return q;

  // 1) LibreTranslate
  for (const base of LIBRE_ENDPOINTS) {
    try {
      const r = await fetch(base, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ q, source: 'auto', target, format: 'text' }),
      });
      if (r.ok) {
        const j = (await r.json()) as { translatedText?: string };
        if (j?.translatedText) return j.translatedText;
      }
    } catch {
      // continue
    }
  }

  // 2) MyMemory (very free, but noisy)
  try {
    const pair = `auto|${encodeURIComponent(target)}`;
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(q)}&langpair=${pair}`;
    const r = await fetch(url);
    if (r.ok) {
      const j = await r.json();
      const out = j?.responseData?.translatedText as string | undefined;
      if (out) return out;
    }
  } catch {
    // ignore
  }

  // last resort: original
  return q;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });

  try {
    const { recipeId, targetLang } = req.body as { recipeId?: string; targetLang?: string };
    if (!recipeId || !targetLang) return res.status(400).json({ error: 'recipeId + targetLang required' });

    // 1) load recipe
    const { data: rcp, error } = await supabase
      .from('recipes')
      .select('id, title, description, ingredients, steps')
      .eq('id', recipeId)
      .single();

    if (error || !rcp) return res.status(404).json({ error: 'Recipe not found' });

    const ing = normalizeIngredients(rcp.ingredients);
    const st = normalizeSteps(rcp.steps);
    const canonical = JSON.stringify({
      t: rcp.title ?? '',
      d: rcp.description ?? '',
      ing: ing.map((i) => i.name),
      st: st.map((s) => s.text),
    });
    const content_hash = sha256(canonical);

    // 2) cache hit?
    const { data: cached } = await supabase
      .from('recipe_translations')
      .select('title, description, ingredients, steps, content_hash')
      .eq('recipe_id', recipeId)
      .eq('lang', targetLang)
      .single()
      .catch(() => ({ data: null as any }));

    if (cached && cached.content_hash === content_hash) {
      return res.status(200).json({
        recipe_id: recipeId,
        lang: targetLang,
        content_hash,
        title: cached.title,
        description: cached.description,
        ingredients: cached.ingredients,
        steps: cached.steps,
        source: 'cache',
      });
    }

    // 3) translate
    const [title, description] = await Promise.all([
      translateText(rcp.title ?? '', targetLang),
      translateText(rcp.description ?? '', targetLang),
    ]);

    const ingredients = [];
    for (const i of ing) {
      ingredients.push({
        ...i,
        name: await translateText(i.name ?? '', targetLang),
      });
    }

    const steps = [];
    for (const s of st) {
      steps.push({
        position: s.position,
        time: s.time ?? null,
        text: await translateText(s.text ?? '', targetLang),
      });
    }

    // 4) upsert cache
    await supabase.from('recipe_translations').upsert(
      {
        recipe_id: recipeId,
        lang: targetLang,
        content_hash,
        title,
        description,
        ingredients,
        steps,
      },
      { onConflict: 'recipe_id,lang' }
    );

    // 5) return
    return res.status(200).json({
      recipe_id: recipeId,
      lang: targetLang,
      content_hash,
      title,
      description,
      ingredients,
      steps,
      source: 'live',
    });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'translate failed' });
  }
}
