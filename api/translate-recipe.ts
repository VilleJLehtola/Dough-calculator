// Force Node (not Edge) on Vercel
export const config = { runtime: 'nodejs18.x' };

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// ---- ENV ----
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) console.error('[translate] Missing NEXT_PUBLIC_SUPABASE_URL');
if (!SERVICE_KEY)   console.error('[translate] Missing SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(SUPABASE_URL!, SERVICE_KEY!, { auth: { persistSession: false } });

// Small, dependency-free hash (FNV-1a) so we don’t depend on Node crypto
function hash(text: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return ('0000000' + h.toString(16)).slice(-8);
}

// Normalizers
const normalizeIngredients = (raw: any) => {
  if (!raw) return [] as { name: string; amount?: string; bakers_pct?: string }[];
  if (Array.isArray(raw) && raw.every(o => typeof o === 'object')) return raw;
  if (Array.isArray(raw)) return raw.map(t => ({ name: String(t ?? '') }));
  if (typeof raw === 'string')
    return raw.split('\n').map(s => s.trim()).filter(Boolean).map(name => ({ name }));
  return [];
};

const normalizeSteps = (raw: any) => {
  if (!raw) return [] as { position: number; text: string; time?: number | null }[];
  if (Array.isArray(raw) && raw.every(o => typeof o === 'object'))
    return raw.map((s: any, i: number) => ({
      position: s.position ?? i + 1,
      text: s.text ?? s.content ?? s.description ?? String(s ?? ''),
      time: s.time ?? s.minutes ?? null,
    }));
  if (Array.isArray(raw)) return raw.map((t: any, i: number) => ({ position: i + 1, text: String(t ?? '') }));
  if (typeof raw === 'string')
    return raw.split('\n').map(s => s.trim()).filter(Boolean).map((text, i) => ({ position: i + 1, text }));
  return [];
};

// Free providers
const LIBRE_ENDPOINTS = [
  'https://translate.astian.org/translate',
  'https://libretranslate.com/translate',
];

async function translateText(q: string, target: string) {
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
        const j: any = await r.json();
        if (j?.translatedText) return j.translatedText;
      }
    } catch {}
  }

  // 2) MyMemory
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(q)}&langpair=auto|${encodeURIComponent(target)}`;
    const r = await fetch(url);
    if (r.ok) {
      const j: any = await r.json();
      const out = j?.responseData?.translatedText as string | undefined;
      if (out) return out;
    }
  } catch {}

  return q;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'content-type');
      return res.status(204).end();
    }

    if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });

    const { recipeId, targetLang } = req.body as { recipeId?: string; targetLang?: string };
    if (!recipeId || !targetLang) return res.status(400).json({ error: 'recipeId + targetLang required' });

    if (!SUPABASE_URL || !SERVICE_KEY) {
      return res.status(500).json({ error: 'Server env not configured (URL/KEY)' });
    }

    // Load recipe
    const { data: rcp, error: rErr } = await supabase
      .from('recipes')
      .select('id,title,description,ingredients,steps')
      .eq('id', recipeId)
      .single();

    if (rErr || !rcp) return res.status(404).json({ error: 'Recipe not found', detail: rErr?.message });

    const ing = normalizeIngredients(rcp.ingredients);
    const st  = normalizeSteps(rcp.steps);

    const canonical = JSON.stringify({
      t: rcp.title ?? '',
      d: rcp.description ?? '',
      ing: ing.map(i => i.name),
      st:  st.map(s => s.text),
    });
    const content_hash = hash(canonical);

    // Cache hit?
    const { data: cached } = await supabase
      .from('recipe_translations')
      .select('title,description,ingredients,steps,content_hash')
      .eq('recipe_id', recipeId)
      .eq('lang', targetLang)
      .maybeSingle();

    if (cached && cached.content_hash === content_hash) {
      return res.status(200).json({ recipe_id: recipeId, lang: targetLang, content_hash, ...cached, source: 'cache' });
    }

    // Translate
    const [titleTr, descTr] = await Promise.all([
      translateText(rcp.title ?? '', targetLang),
      translateText(rcp.description ?? '', targetLang),
    ]);

    const ingredientsTr = [];
    for (const i of ing) {
      ingredientsTr.push({ ...i, name: await translateText(i.name ?? '', targetLang) });
    }

    const stepsTr = [];
    for (const s of st) {
      stepsTr.push({ position: s.position, time: s.time ?? null, text: await translateText(s.text ?? '', targetLang) });
    }

    // Upsert cache
    const { error: upErr } = await supabase.from('recipe_translations').upsert(
      {
        recipe_id: recipeId,
        lang: targetLang,
        content_hash,
        title: titleTr,
        description: descTr,
        ingredients: ingredientsTr,
        steps: stepsTr,
      },
      { onConflict: 'recipe_id,lang' }
    );
    if (upErr) {
      console.error('[translate] upsert error', upErr);
    }

    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({
      recipe_id: recipeId,
      lang: targetLang,
      content_hash,
      title: titleTr,
      description: descTr,
      ingredients: ingredientsTr,
      steps: stepsTr,
      source: 'live',
    });
  } catch (e: any) {
    console.error('[translate] fatal', e);
    return res.status(500).json({ error: e?.message || 'translate failed' });
  }
}
