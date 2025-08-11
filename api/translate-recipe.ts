// /api/translate-recipe.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export const config = { runtime: 'nodejs' }; // <-- fix

type Step = { position?: number; text?: string; time?: number | null } | string;
type Ingredient =
  | { name?: string; amount?: string; bakers_pct?: string }
  | string;

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

const LT_URL = process.env.LIBRETRANSLATE_URL || ''; // e.g. https://libretranslate.de

async function translateOne(q: string, target: string): Promise<string> {
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

function normIngredients(raw: any): { name: string; amount?: string; bakers_pct?: string }[] {
  if (!raw) return [];
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

function normSteps(raw: any): { position: number; text: string; time?: number | null }[] {
  if (!raw) return [];
  if (Array.isArray(raw) && raw.every((x) => typeof x === 'object')) {
    return raw.map((s: any, i: number) => ({
      position: s.position ?? i + 1,
      text: s.text ?? s.content ?? s.description ?? '',
      time: s.time ?? s.minutes ?? null,
    }));
  }
  if (Array.isArray(raw)) {
    return raw.map((s: Step, i: number) => ({ position: i + 1, text: String(s ?? '') }));
  }
  if (typeof raw === 'string') {
    return raw
      .split('\n')
      .map((t) => t.trim())
      .filter(Boolean)
      .map((text, i) => ({ position: i + 1, text }));
  }
  return [];
}

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

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: rcp, error } = await supabase
      .from('recipes')
      .select('id,title,description,ingredients,steps')
      .eq('id', recipeId)
      .single();

    if (error || !rcp) {
      res.status(404).json({ error: 'Recipe not found' });
      return;
    }

    const ing = normIngredients(rcp.ingredients);
    const st = normSteps(rcp.steps);

    // Translate fields (title, description, ingredient names, step texts)
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

    const contentHash = crypto
      .createHash('sha256')
      .update(
        JSON.stringify({
          t: rcp.title,
          d: rcp.description,
          ing,
          st,
          lang: targetLang,
        })
      )
      .digest('hex');

    res.status(200).json({
      recipe_id: recipeId,
      lang: targetLang,
      content_hash: contentHash,
      title: tTitle,
      description: tDesc,
      ingredients: translatedIngredients,
      steps: translatedSteps,
    });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Internal error' });
  }
}
