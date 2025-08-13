// Serverless: Vercel /api
// Env needed on Vercel: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DEEPL_API_KEY
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL;

const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DEEPL_API_KEY = process.env.DEEPL_API_KEY;

// Use SERVICE ROLE to bypass RLS when writing translations
const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { recipeId, targetLang, force = false } = req.body || {};
    if (!recipeId || !targetLang) {
      return res.status(400).json({ error: 'recipeId and targetLang are required' });
    }

    // 1) Load base recipe
    const { data: recipe, error: recErr } = await admin
      .from('recipes')
      .select('id,title,description,ingredients,steps')
      .eq('id', recipeId)
      .single();

    if (recErr || !recipe) {
      return res.status(404).json({ error: 'Recipe not found', details: recErr?.message });
    }

    // 2) If not forcing and we already have a translation, you could early-exit.
    // We now rely on the client to call with force only when translatable changed,
    // so we skip the hash logic here.

    // 3) Collect strings to translate in ONE DeepL call
    const src = {
      title: recipe.title ?? '',
      description: recipe.description ?? '',
      steps: Array.isArray(recipe.steps) ? recipe.steps : [],
      ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
    };

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

    let translated = [];
    if (texts.length && DEEPL_API_KEY) {
      const params = new URLSearchParams();
      params.set('auth_key', DEEPL_API_KEY);
      params.set('target_lang', String(targetLang).toUpperCase());
      texts.forEach((t) => params.append('text', t));

      // Use api-free for DeepL Free; change to https://api.deepl.com/v2/translate for Pro
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

    // 4) Rebuild translated payload
    const tr = {
      title: mapIdx.title != null ? pick(mapIdx.title) : null,
      description: mapIdx.description != null ? pick(mapIdx.description) : null,
      steps: src.steps.map((s, i) => ({
        ...s,
        text: mapIdx.steps[i] == null ? (s?.text || '') : pick(mapIdx.steps[i]) || '',
      })),
      ingredients: src.ingredients.map((ing, i) => ({
        ...ing,
        name: mapIdx.ings[i] == null ? (ing?.name || '') : pick(mapIdx.ings[i]) || '',
      })),
    };

    // 5) Upsert translation row
    const { data: up, error: upErr } = await admin
      .from('recipe_translations')
      .upsert(
        {
          recipe_id: recipeId,
          lang: targetLang,
          title: tr.title ?? null,
          description: tr.description ?? null,
          steps: tr.steps,           // JSONB
          ingredients: tr.ingredients, // JSONB
        },
        { onConflict: 'recipe_id,lang' }
      )
      .select('recipe_id, lang')
      .maybeSingle();

    if (upErr) {
      return res.status(500).json({ error: 'upsert_failed', details: upErr.message });
    }

    return res.status(200).json({ ok: true, translation: tr, up });
  } catch (e) {
    return res.status(500).json({ error: 'unexpected', details: String(e?.message || e) });
  }
}
