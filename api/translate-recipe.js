// /api/translate-recipe.js
import { createClient } from '@supabase/supabase-js'

// --- Required env (Vercel Project -> Settings -> Environment Variables) ---
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//
// DeepL (primary):
//   DEEPL_API_KEY
//   (optional) DEEPL_API_ENDPOINT = https://api-free.deepl.com/v2/translate  (or https://api.deepl.com/v2/translate)
//
// Azure (fallback):
//   AZURE_TRANSLATOR_KEY
//   AZURE_TRANSLATOR_REGION
//   (optional) AZURE_TRANSLATOR_ENDPOINT = https://api.cognitive.microsofttranslator.com

const SUPABASE_URL = process.env.SUPABASE_URL || ''
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const DEEPL_KEY = process.env.DEEPL_API_KEY || ''
const DEEPL_ENDPOINT = process.env.DEEPL_API_ENDPOINT || 'https://api-free.deepl.com/v2/translate'

const AZURE_KEY = process.env.AZURE_TRANSLATOR_KEY || ''
const AZURE_REGION = process.env.AZURE_TRANSLATOR_REGION || ''
const AZURE_ENDPOINT = process.env.AZURE_TRANSLATOR_ENDPOINT || 'https://api.cognitive.microsofttranslator.com'

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'content-type,authorization')
}

function normalizeUUID(s) {
  return String(s || '').trim().replace(/^["'<\s]+|[">'\s]+$/g, '')
}
function isUUID(s) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s)
}

function hashContent(rcp) {
  const src = JSON.stringify({
    title: rcp.title ?? '',
    description: rcp.description ?? '',
    ingredients: rcp.ingredients ?? [],
    steps: rcp.steps ?? [],
  })
  let h = 5381
  for (let i = 0; i < src.length; i++) h = (h * 33) ^ src.charCodeAt(i)
  return (h >>> 0).toString(16)
}

// -------- DeepL --------
async function deeplTranslateArray(texts, target, source) {
  const params = new URLSearchParams()
  texts.forEach(t => params.append('text', t))
  params.append('target_lang', String(target).toUpperCase())
  if (source && source !== 'auto') params.append('source_lang', String(source).toUpperCase())

  const r = await fetch(DEEPL_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `DeepL-Auth-Key ${DEEPL_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })
  const body = await r.text()
  if (!r.ok) {
    const e = new Error(`deepl ${r.status}`)
    e.body = body
    throw e
  }
  const json = JSON.parse(body)
  return (json.translations || []).map(t => t.text || '')
}

// -------- Azure --------
async function azureTranslateArray(texts, target, source) {
  const qs = new URLSearchParams({ 'api-version': '3.0', to: target })
  if (source && source !== 'auto') qs.append('from', source)

  const r = await fetch(`${AZURE_ENDPOINT}/translate?${qs.toString()}`, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': AZURE_KEY,
      'Ocp-Apim-Subscription-Region': AZURE_REGION,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(texts.map(t => ({ Text: t }))),
  })
  const body = await r.text()
  if (!r.ok) {
    const e = new Error(`azure ${r.status}`)
    e.body = body
    throw e
  }
  const json = JSON.parse(body)
  return json.map(x => x?.translations?.[0]?.text || '')
}

// unified translate with fallback
async function translateArray(texts, target, source) {
  if (DEEPL_KEY) {
    try {
      return await deeplTranslateArray(texts, target, source)
    } catch (e) {
      if (!(AZURE_KEY && AZURE_REGION)) throw e // no fallback configured
      // fall through to Azure
    }
  }
  if (AZURE_KEY && AZURE_REGION) {
    return await azureTranslateArray(texts, target, source)
  }
  throw new Error('no_translator_configured')
}

export default async function handler(req, res) {
  cors(res)
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' })
  }
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'supabase_env_missing' })
  }

  const isGet = req.method === 'GET'
  const recipeIdRaw = isGet ? (req.query.recipeId || '') : (req.body?.recipeId || '')
  const targetLang = isGet ? (req.query.targetLang || '') : (req.body?.targetLang || '')
  const sourceLang = isGet ? (req.query.source || 'auto') : (req.body?.source || 'auto')
  const force = isGet ? (req.query.force === 'true') : !!req.body?.force
  const debug = isGet ? (req.query.debug === 'true') : !!req.body?.debug

  const recipeId = normalizeUUID(recipeIdRaw)
  if (!isUUID(recipeId) || !targetLang) {
    return res.status(400).json({
      error: 'bad_request',
      needed: ['recipeId(uuid)', 'targetLang'],
      received: { recipeId: recipeIdRaw, targetLang }
    })
  }

  if (!DEEPL_KEY && !(AZURE_KEY && AZURE_REGION)) {
    return res.status(503).json({ error: 'translator_not_configured' })
  }

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

  try {
    // 1) Load base recipe
    const { data: rcp, error: rErr } = await sb
      .from('recipes')
      .select('id,title,description,ingredients,steps')
      .eq('id', recipeId)
      .single()

    if (rErr || !rcp) {
      return res.status(404).json({ error: 'recipe_not_found', recipeId, ...(debug ? { supabaseError: rErr?.message ?? null } : {}) })
    }

    // 2) content_hash support
    let hasContentHash = true
    try {
      const probe = await sb.from('recipe_translations')
        .select('content_hash')
        .eq('recipe_id', recipeId)
        .eq('lang', targetLang)
        .limit(1)
      if (probe.error && /column.*content_hash/i.test(probe.error.message)) hasContentHash = false
    } catch { hasContentHash = false }
    const contentHash = hashContent(rcp)

    if (hasContentHash && !force) {
      const { data: cached } = await sb
        .from('recipe_translations')
        .select('title,description,ingredients,instructions,content_hash')
        .eq('recipe_id', recipeId)
        .eq('lang', targetLang)
        .maybeSingle()
      if (cached && cached.content_hash === contentHash) {
        return res.status(200).json({
          cached: true,
          title: cached.title,
          description: cached.description,
          ingredients: cached.ingredients,
          steps: cached.instructions,
        })
      }
    }

    // 3) Gather arrays
    const ingRows  = Array.isArray(rcp.ingredients) ? rcp.ingredients : []
    const stepRows = Array.isArray(rcp.steps) ? rcp.steps : []
    const ingNames  = ingRows.map(i => (typeof i === 'object' ? (i.name ?? '') : String(i ?? '')))
    const stepTexts = stepRows.map(s => (typeof s === 'object' ? (s.text ?? '') : String(s ?? '')))

    // 4) Translate via DeepL (fallback Azure)
    const [titleTrArr, descTrArr, ingTrArr, stepsTrArr] = await Promise.all([
      translateArray([rcp.title ?? ''], targetLang, sourceLang),
      translateArray([rcp.description ?? ''], targetLang, sourceLang),
      translateArray(ingNames, targetLang, sourceLang),
      translateArray(stepTexts, targetLang, sourceLang),
    ])

    const titleTr = titleTrArr[0] ?? rcp.title ?? ''
    const descTr  = descTrArr[0] ?? rcp.description ?? ''

    const ingredientsTr = ingRows.map((row, i) => {
      const name = ingTrArr[i] ?? (typeof row === 'object' ? (row.name ?? '') : String(row ?? ''))
      return typeof row === 'object'
        ? { ...row, name }
        : { name, amount: '', bakers_pct: '' }
    })

    const instructionsTr = stepRows.map((row, i) => {
      const text = stepsTrArr[i] ?? (typeof row === 'object' ? (row.text ?? '') : String(row ?? ''))
      return typeof row === 'object'
        ? { ...row, text }
        : { position: i + 1, text }
    })

    // 5) Upsert into recipe_translations (instructions, not steps)
    const payload = {
      recipe_id: rcp.id,
      lang: targetLang,
      title: titleTr,
      description: descTr,
      ingredients: ingredientsTr,
      instructions: instructionsTr,
      ...(hasContentHash ? { content_hash: contentHash } : {}),
    }

    const { error: upErr } = await sb
      .from('recipe_translations')
      .upsert(payload, { onConflict: 'recipe_id,lang' })

    if (upErr) {
      return res.status(400).json({ error: 'upsert_failed', detail: upErr.message, payloadKeys: Object.keys(payload) })
    }

    return res.status(200).json({
      cached: false,
      title: titleTr,
      description: descTr,
      ingredients: ingredientsTr,
      steps: instructionsTr,
    })
  } catch (e) {
    return res.status(500).json({ error: 'internal_error', message: e?.message || String(e) })
  }
}
