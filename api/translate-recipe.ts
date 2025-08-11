// api/translate-recipe.ts
import type { VercelRequest, VercelResponse } from '@vercel/node'
import crypto from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

/**
 * ENV (add in Vercel Project Settings -> Environment Variables):
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY  (Serverless only, NEVER expose to client)
 * - LT_ENDPOINT=https://libretranslate.com  (or your self-hosted URL)
 * - LT_API_KEY (optional for some instances)
 */

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const LT_ENDPOINT = (process.env.LT_ENDPOINT || 'https://libretranslate.com').replace(/\/$/, '')
const LT_API_KEY = process.env.LT_API_KEY || undefined

async function detectLT(q: string) {
  if (!q) return 'auto'
  const r = await fetch(`${LT_ENDPOINT}/detect`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ q })
  })
  const arr = await r.json().catch(() => [])
  return Array.isArray(arr) && arr[0]?.language ? arr[0].language : 'auto'
}

async function translateLT(q: string, source: string, target: string) {
  if (!q) return q
  const r = await fetch(`${LT_ENDPOINT}/translate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ q, source, target, format: 'text', api_key: LT_API_KEY })
  })
  const data = await r.json().catch(() => ({}))
  return data?.translatedText ?? q
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
    const { recipeId, targetLang } = req.body || {}
    if (!recipeId || !targetLang) return res.status(400).json({ error: 'Missing params' })

    // 1) Load source
    const { data: r, error } = await supabase
      .from('recipes')
      .select('id,title,description,ingredients,steps')
      .eq('id', recipeId)
      .single()
    if (error || !r) return res.status(404).json({ error: 'Recipe not found' })

    // 2) Hash of the parts we translate (title, description, ingredient names, step texts)
    const pack = JSON.stringify({
      t: r.title || '',
      d: r.description || '',
      i: (r.ingredients || []).map((x: any) => x?.name || ''),
      s: (r.steps || []).map((x: any) => x?.text || ''),
    })
    const content_hash = crypto.createHash('sha256').update(pack).digest('hex')

    // 3) Cache hit?
    const { data: cached } = await supabase
      .from('recipe_translations')
      .select('*')
      .eq('recipe_id', recipeId)
      .eq('lang', targetLang)
      .eq('content_hash', content_hash)
      .maybeSingle()
    if (cached) return res.status(200).json(cached)

    // 4) Detect + translate via LibreTranslate
    const sample = [r.title, r.description].filter(Boolean).join('\n').slice(0, 400)
    const srcLang = sample ? await detectLT(sample) : 'auto'

    const title = await translateLT(r.title || '', srcLang, targetLang)
    const description = await translateLT(r.description || '', srcLang, targetLang)

    const ingredients = await Promise.all(
      (r.ingredients || []).map(async (ing: any) => ({
        ...ing,
        name: await translateLT(ing?.name || '', srcLang, targetLang),
      }))
    )

    const steps = await Promise.all(
      (r.steps || []).map(async (st: any) => ({
        ...st,
        text: await translateLT(st?.text || '', srcLang, targetLang),
      }))
    )

    const payload = { recipe_id: recipeId, lang: targetLang, content_hash, title, description, ingredients, steps }
    await supabase.from('recipe_translations').upsert(payload)

    return res.status(200).json(payload)
  } catch (e: any) {
    console.error(e)
    return res.status(500).json({ error: 'Server error' })
  }
}
