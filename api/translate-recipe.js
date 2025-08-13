// /api/translate-recipe.js
// Uses SUPABASE_SERVICE_ROLE_KEY to bypass RLS and upsert into recipe_translations.
// Env vars required (Production + Preview):
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   DEEPL_API_KEY
//
// If you use DeepL Pro, change api-free.deepl.com -> api.deepl.com.

import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL;

const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DEEPL_API_KEY = process.env.DEEPL_API_KEY;

// Admin client (service role)
const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Build a stable content hash from source text (title/desc/steps/ingredients) + targetLang
function makeContentHash(src, targetLang) {
  const h = createHash('sha256');
  h.update(String(targetLang || ''), 'utf8');
  h.update('\n', 'utf8');
  h.update(src.title || '', 'utf8');
  h.update('\n', 'utf8');
  h.update(src.description || '', 'utf8');
  h.update('\n', 'utf8');
  (src.steps || []).forEach((s) => {
    h.update((s?.text || ''), 'utf8');
    h.update('\n', 'utf8');
  });
  (src.ingredients || []).forEach((i) => {
    h.update((i?.name || ''), 'utf8');
    h.update('\n', 'utf8');
  });
  return h.digest('hex');
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!SUPABASE_URL) return res.status(500).json({ error: 'missing_supabase_url' });
    if (!SUPABASE_SERVICE_ROLE_KEY) return res.status(500).json({ error: 'missing_service_role_key' });

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

    // Source payload to translate
    const src = {
      title: recipe.title ?? '',
      description: recipe.description ?? '',
      steps: Array.isArray(recipe.steps) ? recipe.steps : [],
      ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
    };

    // Build translation batch
    const texts = [];
    const mapIdx = { title: null, description: null, steps: [], ings: [] };

    if (src.title.trim()) { mapIdx.title = texts.length; texts.push(src.title.trim()); }
    if (src.description.trim()) { mapIdx.description = texts.length; texts.push(src.description.trim()); }

    src.steps.forEach((s, i) => {
      const v = (s?.text || '').trim();
      if (v) { mapIdx.steps[i] = texts.length; texts.push(v); } else { mapIdx.steps[i] = null; }
    });

    src.ingredients.forEach((ing, i) => {
      const v = (ing?.name || '').trim();
      if (v) { mapIdx.ings[i] = texts.length; texts.push(v); } else { mapIdx.ings[i] = null; }
    });

    // Translate via DeepL unless skipping
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

    // Assemble translated payload (or echo src when skipTranslate)
    const tr = {
      title: mapIdx.title != null ? (skipTranslate ? src.title : pick(mapIdx.title)) : null,
      description: mapIdx.description != null ? (skipTranslate ? src.description : pick(mapIdx.description)) : null,
      steps: src.steps.map((s, i) => ({
        ...s,
        text: mapIdx.steps[i] == null ? (s?.text || '') : (skipTranslate ? (s?.text || '') : (pick(mapIdx.steps[i]) || '')),
      })),
      ingredients: src.ingredients.map((ing, i) => ({
        ...ing,
        name: mapIdx.ings[i] == null ? (ing?.name || '') : (skipTranslate ? (ing?.name || '') : (pick(mapIdx.ings[i]) || '')),
      })),
    };

    // REQUIRED by your schema: content_hash (NOT NULL)
    const content_hash = makeContentHash(src, targetLang);

    // Upsert
    const { data: up, error: upErr } = await admin
      .from('recipe_translations')
      .upsert(
        {
          recipe_id: recipeId,
          lang: targetLang,
          title: tr.title ?? null,
          description: tr.description ?? null,
          steps: tr.steps,            // jsonb
          ingredients: tr.ingredients, // jsonb
          content_hash,               // <-- include the required hash
        },
        { onConflict: 'recipe_id,lang' } // requires UNIQUE(recipe_id,lang)
      )
      .select('recipe_id, lang, content_hash')
      .maybeSingle();

    if (upErr) {
      return res.status(500).json({ error: 'upsert_failed', details: upErr.message });
    }

    return res.status(200).json({
      ok: true,
      up,
      counts: { texts: texts.length },
      translation: tr,
      content_hash,
      force,
      skipTranslate,
    });
  } catch (e) {
    return res.status(500).json({ error: 'unexpected', details: String(e?.message || e) });
  }
}
