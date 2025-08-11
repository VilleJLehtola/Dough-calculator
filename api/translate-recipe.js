// api/translate-recipe.js
// Node function (no TS types). Uses LibreTranslate + Supabase cache (recipe_translations).

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const LT_URL = process.env.LT_URL;                 // e.g. https://libretranslate.com
const LT_API_KEY = process.env.LT_API_KEY || '';   // optional

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type,authorization');
}

function hashContent(rcp) {
  const src = JSON.stringify({
    title: rcp.title ?? '',
    description: rcp.description ?? '',
    ingredients: rcp.ingredients ?? [],
    steps: rcp.steps ?? []
  });
  let h = 5381;
  for (let i = 0; i < src.length; i++) h = (h * 33) ^ src.charCodeAt(i);
  return (h >>> 0).toString(16);
}

async function ltTranslateArray(arr, target) {
  if (!arr.length) return [];
  const text = arr.join('\n');
  const body = { q: text, source: 'auto', target, format: 'text' };
  if (LT_API_KEY) body.api_key = LT_API_KEY;

  const r = await fetch(`${LT_URL}/translate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!r.ok) {
    const msg = await r.text().catch(() => '');
    throw new Error(`LibreTranslate ${r.status}: ${msg}`);
  }
  const json = await r.json();
  const translatedText = json.translatedText ?? json.data ?? '';
  return String(translatedText).split('\n');
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const isGet = req.method === 'GET';
  const recipeId   = isGet ? (req.query.recipeId || '') : (req.body?.recipeId || '');
  const targetLang = isGet ? (req.query.targetLang || '') : (req.body?.targetLang || '');
  const force      = isGet ? (req.query.force === 'true') : !!req.body?.force;
  const debug      = isGet ? (req.query.debug === 'true') : !!req.body?.debug;

  if (!recipeId || !targetLang) {
    return res.status(400).json({ error: 'missing_params', needed: ['recipeId','targetLang'] });
  }
  if (!LT_URL) {
    return res.status(503).json({ error: 'translator_not_configured' });
  }
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'supabase_env_missing' });
  }

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

  try {
    // -------- 1) Load recipe (only columns that exist) --------
    const { data: rcp, error: rErr } = await sb
      .from('recipes')
      .select('id,title,description,ingredients,steps') // <- removed updated_at/created_at
      .eq('id', recipeId)
      .single();

    if (rErr || !rcp) {
      return res.status(404).json({
        error: 'recipe_not_found',
        ...(debug ? { recipeId, supabaseUrl: SUPABASE_URL, supabaseError: rErr?.message ?? null } : {})
      });
    }

    // -------- 2) Cache check --------
    const contentHash = hashContent(rcp);
    const { data: cached } = await sb
      .from('recipe_translations')
      .select('title,description,ingredients,steps,content_hash')
      .eq('recipe_id', recipeId)
      .eq('lang', targetLang)
      .maybeSingle();

    if (cached && cached.content_hash === contentHash && !force) {
      return res.status(200).json({
        cached: true,
        title: cached.title,
        description: cached.description,
        ingredients: cached.ingredients,
        steps: cached.steps
      });
    }

    // -------- 3) Prepare arrays and translate in batches --------
    const ingRows  = Array.isArray(rcp.ingredients) ? rcp.ingredients : [];
    const stepRows = Array.isArray(rcp.steps) ? rcp.steps : [];

    const ingNames  = ingRows.map(i => (typeof i === 'object' ? (i.name ?? '') : String(i ?? '')));
    const stepTexts = stepRows.map(s => (typeof s === 'object' ? (s.text ?? '') : String(s ?? '')));

    const [titleTrArr, descTrArr, ingTrArr, stepsTrArr] = await Promise.all([
      ltTranslateArray([rcp.title ?? ''], targetLang),
      ltTranslateArray([rcp.description ?? ''], targetLang),
      ltTranslateArray(ingNames, targetLang),
      ltTranslateArray(stepTexts, targetLang)
    ]);

    const titleTr = titleTrArr[0] ?? rcp.title ?? '';
    const descTr  = descTrArr[0] ?? rcp.description ?? '';

    const ingredientsTr = ingRows.map((row, i) => {
      const name = ingTrArr[i] ?? (typeof row === 'object' ? (row.name ?? '') : String(row ?? ''));
      return typeof row === 'object'
        ? { ...row, name }
        : { name, amount: '', bakers_pct: '' };
    });

    const stepsTrOut = stepRows.map((row, i) => {
      const text = stepsTrArr[i] ?? (typeof row === 'object' ? (row.text ?? '') : String(row ?? ''));
      return typeof row === 'object'
        ? { ...row, text }
        : { position: i + 1, text };
    });

    // -------- 4) Upsert cache --------
    await sb
      .from('recipe_translations')
      .upsert({
        recipe_id: recipeId,
        lang: targetLang,
        title: titleTr,
        description: descTr,
        ingredients: ingredientsTr,
        steps: stepsTrOut,
        content_hash: contentHash
      }, { onConflict: 'recipe_id,lang' });

    return res.status(200).json({
      cached: false,
      title: titleTr,
      description: descTr,
      ingredients: ingredientsTr,
      steps: stepsTrOut
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return res.status(500).json({ error: 'internal_error', message: msg });
  }
}
