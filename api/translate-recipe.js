// /api/translate-recipe.js
// Serverless API (Vercel). Writes to recipe_translations using the SERVICE ROLE key.
// Env (Vercel > Settings > Environment Variables):
//   SUPABASE_URL                -> https://xxxx.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY   -> service role key (NOT anon)
//   DEEPL_API_KEY               -> your DeepL key (Free or Pro)
// If you use DeepL Pro, change api-free.deepl.com to api.deepl.com below.

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL;

const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DEEPL_API_KEY = process.env.DEEPL_API_KEY;

// Create admin client (bypasses RLS)
const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!SUPABASE_URL) {
      return res.status(500).json({ error: 'missing_supabase_url' });
    }
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({ error: 'missing_service_role_key' });
    }

    const { recipeId, targetLang, force = false, skipTranslate = false } = req.body || {};
    if (!recipeId || !targetLang) {
      return res.status(400).json({ error: 'recipeId and targetLang are required' });
    }

    // Load base recipe (title, description, ingredients, steps)
    const { data: recipe, error: recErr } = await admin
      .from('recipes')
      .select('id,title,description,ingredients,steps')
      .eq('id', recipeId)
      .single();

    if (recErr || !recipe) {
      return res.status(404).json({ error: 'recipe_not_found', details: recErr?.message });
    }

    // Build translation batch
    const src = {
      title: recipe.title ?? '',
      description: recipe.description ?? '',
      steps: Array.isArray(recipe.steps) ? recipe.steps : [],
      ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
    };

    const texts = [];
    const mapIdx = { title: null, description: null, steps: [], ings: [] };

    if (src.title.trim()) {
      mapIdx.title = texts.length;
      texts.push(src.title.trim());
    }
    if (src.description.trim()) {
      mapIdx.description = texts.length;
      texts.push(src.description.trim());
    }

    src.steps.forEach((s, i) => {
      const v = (s?.text || '').trim();
      if (v) {
        mapIdx.steps[i] = texts.length;
        texts.push(v);
      } else {
        mapIdx.steps[i] = null;
      }
    });

    src.ingredients.forEach((ing, i) => {
      const v = (ing?.name || '').trim();
      if (v) {
        mapIdx.ings[i] = texts.length;
        texts.push(v);
      } else {
        mapIdx.ings[i] = null;
      }
    });

    // Call DeepL (unless skipTranslate=true)
    let translated = [];
    if (!skipTranslate && texts.length) {
      if (!DEEPL_API_KEY) {
        return res.status(500).json({ error: 'missing_deepl_api_key' });
      }
      const params = new URLSearchParams();
      params.set('auth_key', DEEPL_API_KEY);
      params.set('target_lang', String(targetLang).toUpperCase());
      texts.forEach((t) => params.append('text', t));

      const resp = await fetch('https://api-free.deepl.com/v2/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });
      const j = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        return res.status(502).json({ error: 'deepl_failed', details: j });
      }
      translated = (j?.translations || []).map((x) => x.text);
    }

    const pick = (i) => (i == null ? null : translated[i]);

    // Rebuild translated payload
    const tr = {
      title: mapIdx.title != null ? (skipTranslate ? src.title : pick(mapIdx.title)) : null,
      description:
        mapIdx.description != null ? (skipTranslate ? src.description : pick(mapIdx.description)) : null,
      steps: src.steps.map((s, i) => ({
        ...s,
        text:
          mapIdx.steps[i] == null
            ? (s?.text || '')
            : (skipTranslate ? (s?.text || '') : (pick(mapIdx.steps[i]) || '')),
      })),
      ingredients: src.ingredients.map((ing, i) => ({
        ...ing,
        name:
          mapIdx.ings[i] == null
            ? (ing?.name || '')
            : (skipTranslate ? (ing?.name || '') : (pick(mapIdx.ings[i]) || '')),
      })),
    };

    // Upsert translations row
    const { data: up, error: upErr } = await admin
      .from('recipe_translations')
      .upsert(
        {
          recipe_id: recipeId,
          lang: targetLang,
          title: tr.title ?? null,
          description: tr.description ?? null,
          steps: tr.steps,           // jsonb
          ingredients: tr.ingredients, // jsonb
        },
        { onConflict: 'recipe_id,lang' } // requires PK or UNIQUE(recipe_id,lang)
      )
      .select('recipe_id, lang')
      .maybeSingle();

    if (upErr) {
      return res.status(500).json({ error: 'upsert_failed', details: upErr.message });
    }

    return res.status(200).json({
      ok: true,
      up,
      counts: { texts: texts.length },
      translation: tr,
      force,
      skipTranslate,
    });
  } catch (e) {
    return res.status(500).json({ error: 'unexpected', details: String(e?.message || e) });
  }
}
