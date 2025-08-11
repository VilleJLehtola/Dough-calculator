// api/translate-recipe.ts
import type { VercelRequest, VercelResponse } from 'vercel'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' })
  }

  const LT_URL = process.env.LT_URL
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

  if (!LT_URL) return res.status(503).json({ error: 'translator_not_configured' })
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return res.status(500).json({ error: 'supabase_env_missing' })

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {}
    const { recipeId, targetLang, force = false, debug = false } = body
    if (!recipeId || !targetLang) return res.status(400).json({ error: 'missing_params' })

    // fetch recipe
    const r = await fetch(`${SUPABASE_URL}/rest/v1/recipes?id=eq.${recipeId}&select=id,title,description,ingredients,steps`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
    })
    const arr = await r.json()
    const recipe = arr?.[0]
    if (!recipe) return res.status(404).json({ error: 'recipe_not_found' })

    // content hash for caching
    const content = JSON.stringify({
      t: recipe.title || '', d: recipe.description || '',
      i: recipe.ingredients || [], s: recipe.steps || []
    })
    const content_hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(content)).then(b =>
      Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2,'0')).join('')
    )

    // read cache
    if (!force) {
      const rc = await fetch(`${SUPABASE_URL}/rest/v1/recipe_translations?recipe_id=eq.${recipeId}&lang=eq.${targetLang}&select=*`, {
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
      })
      const cached = await rc.json()
      const hit = cached?.[0]
      if (hit && hit.content_hash === content_hash) {
        return res.status(200).json({
          cached: true,
          title: hit.title, description: hit.description,
          ingredients: hit.ingredients, steps: hit.steps
        })
      }
    }

    // translate helpers
    async function ltTranslate(text: string, source = 'auto', target = targetLang) {
      if (!text) return text
      const rr = await fetch(`${LT_URL}/translate`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ q: text, source, target, format: 'text' })
      })
      const jj = await rr.json()
      return jj?.translatedText ?? text
    }

    const out = {
      title: await ltTranslate(String(recipe.title || '')),
      description: await ltTranslate(String(recipe.description || '')),
      ingredients: Array.isArray(recipe.ingredients)
        ? await Promise.all(
            recipe.ingredients.map(async (x:any) => ({
              ...x, name: await ltTranslate(String(x?.name ?? ''))
            }))
          )
        : recipe.ingredients,
      steps: Array.isArray(recipe.steps)
        ? await Promise.all(
            recipe.steps.map(async (s:any) => ({
              ...s, text: await ltTranslate(String(s?.text ?? s ?? ''))
            }))
          )
        : recipe.steps
    }

    // write cache
    await fetch(`${SUPABASE_URL}/rest/v1/recipe_translations`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'content-type': 'application/json', Prefer: 'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        recipe_id: recipeId, lang: targetLang, content_hash,
        title: out.title, description: out.description,
        ingredients: out.ingredients, steps: out.steps
      })
    })

    return res.status(200).json({ cached: false, ...out })
  } catch (e:any) {
    return res.status(500).json({ error: 'internal_error', message: e?.message })
  }
}
