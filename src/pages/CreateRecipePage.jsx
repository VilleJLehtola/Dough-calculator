// /src/pages/CreateRecipePage.jsx
import React, { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import supabase from '@/supabaseClient'
import ImagesUploader from '@/components/ImagesUploader'
import { detectLanguage } from '@/utils/translate'
import { useTranslation } from 'react-i18next';

const BUCKET = 'recipe-images'
const TARGET_LANGS = ['en', 'sv'] // extend here

function newIngredient() {
  return { name: '', amount: '', isFlour: false } // bakers_pct is computed
}
function newStep(i = 1) {
  return { position: i, text: '', time: '' } // time optional ('' -> null on save)
}

// List files in storage and return [{url, path}]
async function listFolderUrls(folder) {
  const { data: files, error } = await supabase.storage.from(BUCKET).list(folder, { limit: 200 })
  if (error || !files?.length) return []
  return files
    .filter(f => !f.name.startsWith('.'))
    .map(f => {
      const path = `${folder}/${f.name}`
      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path)
      return { url: pub.publicUrl, path }
    })
}

export default function CreateRecipePage() {
  const { t } = useTranslation();
  const nav = useNavigate()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // basics
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [totalTime, setTotalTime] = useState('') // -> prep_time_minutes
  const [servings, setServings] = useState('')
  const [difficulty, setDifficulty] = useState('') // easy | medium | hard

  // json fields
  const [ingredients, setIngredients] = useState([newIngredient()])
  const [steps, setSteps] = useState([newStep(1)])

  // uploads / hero
  const [recipeId, setRecipeId] = useState(null)  // draft id first, same id for final recipe
  const [uploaded, setUploaded] = useState([])    // [{ url, path }]
  const [hero, setHero] = useState(null)
  const [userPickedHero, setUserPickedHero] = useState(false)

  // auth & saved flag
  const [userId, setUserId] = useState(null)
  const [isSaved, setIsSaved] = useState(false)

  // translating chip
  const [translating, setTranslating] = useState(false)

  // Ensure login & create a draft id
  useEffect(() => {
    let cancelled = false
    async function boot() {
      const { data: userRes } = await supabase.auth.getUser()
      const uid = userRes?.user?.id ?? null
      if (!cancelled) setUserId(uid)

      if (!uid || recipeId) return

      const { data, error } = await supabase
        .from('recipe_drafts')
        .insert({ author_id: uid })
        .select('id')
        .single()

      if (error) {
        console.error('Draft create failed', error)
        return
      }
      if (!cancelled && data?.id) {
        setRecipeId(data.id)
      }
    }
    boot()
    return () => { cancelled = true }
  }, [recipeId])

  // Hydrate any existing files from Storage when we get a draft/recipe id
  useEffect(() => {
    if (!userId || !recipeId) return
    let cancelled = false
    ;(async () => {
      const existing = await listFolderUrls(`recipes/${recipeId}`)
      if (!cancelled && existing.length) {
        setUploaded(existing)
        if (!hero) setHero(existing[0].url)
      }
    })()
    return () => { cancelled = true }
  }, [userId, recipeId]) // eslint-disable-line

  // ---------- Baker’s % ----------
  const totalFlour = useMemo(() => {
    return ingredients.reduce((sum, ing) => {
      const amt = Number(ing.amount)
      return sum + (ing.isFlour && !Number.isNaN(amt) ? amt : 0)
    }, 0)
  }, [ingredients])

  const withBakersPct = useMemo(() => {
    return ingredients.map((ing) => {
      const amt = Number(ing.amount)
      if (Number.isNaN(amt) || !totalFlour) return { ...ing, bakers_pct: null }
      const rounded = Math.round(((amt / totalFlour) * 100) * 10) / 10
      return { ...ing, bakers_pct: rounded }
    })
  }, [ingredients, totalFlour])

  // ---------- ingredient ops ----------
  const updateIngredient = (i, k, v) =>
    setIngredients(prev => prev.map((row, idx) => (idx === i ? { ...row, [k]: v } : row)))
  const addIngredient = () => setIngredients(prev => [...prev, newIngredient()])
  const removeIngredient = (i) => setIngredients(prev => prev.filter((_, idx) => idx !== i))

  // ---------- step ops ----------
  const updateStepText = (i, v) =>
    setSteps(prev => prev.map((s, idx) => (idx === i ? { ...s, text: v } : s)))
  const updateStepTime = (i, v) =>
    setSteps(prev => prev.map((s, idx) => (idx === i ? { ...s, time: v } : s)))
  const addStep = () => setSteps(prev => [...prev, newStep(prev.length + 1)])
  const removeStep = (i) =>
    setSteps(prev => prev.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, position: idx + 1 })))

  // helper: auto-mark flour rows by name (jauho / flour)
  const autoMarkFlour = () => {
    const re = /(jauho|flour)/i
    setIngredients(prev => prev.map(ing => ({
      ...ing,
      isFlour: re.test(ing.name || '') ? true : ing.isFlour
    })))
  }

  // handle images uploaded
  const handleImagesUploaded = async (files) => {
    if (!files?.length) return
    setUploaded(prev => {
      const next = [...prev, ...files]
      if (!userPickedHero && !hero && next[0]) setHero(next[0].url)
      return next
    })
    // if already saved, persist to DB
    if (isSaved) {
      const urls = [...uploaded, ...files].map(f => f.url)
      const chosen = userPickedHero ? hero : (urls[0] || null)
      await supabase.from('recipes').update({ images: urls, cover_image: chosen }).eq('id', recipeId)
      if (!userPickedHero) setHero(chosen)
    }
  }

  // ---------- drag & drop ----------
  const [dragIndex, setDragIndex] = useState(null)
  const onDragStart = (idx) => () => setDragIndex(idx)
  const onDragOver = (e) => e.preventDefault()
  const onDrop = (idx) => async (e) => {
    e.preventDefault()
    if (dragIndex === null || dragIndex === idx) return
    const next = [...uploaded]
    const [moved] = next.splice(dragIndex, 1)
    next.splice(idx, 0, moved)
    setUploaded(next)
    setDragIndex(null)

    if (!userPickedHero && next[0]) setHero(next[0].url)

    if (isSaved) {
      const urls = next.map(f => f.url)
      await supabase.from('recipes').update({
        images: urls,
        cover_image: userPickedHero ? hero : (urls[0] || null),
      }).eq('id', recipeId)
      if (!userPickedHero) setHero(urls[0] || null)
    }
  }

  // ---------- delete image ----------
  const deleteImage = async (idx) => {
    const target = uploaded[idx]
    if (!target) return
    if (target.path) {
      await supabase.storage.from(BUCKET).remove([target.path])
    }
    const next = uploaded.filter((_, i) => i !== idx)
    setUploaded(next)

    let nextHero = hero
    if (hero === target.url) {
      nextHero = next[0]?.url || null
      setHero(nextHero)
      setUserPickedHero(false)
    }

    if (isSaved) {
      await supabase.from('recipes').update({
        images: next.map(f => f.url),
        cover_image: nextHero || null,
      }).eq('id', recipeId)
    }
  }

  // ---------- save recipe (then translate via serverless) ----------
  const handleSave = async () => {
    setError('')
    if (!title.trim()) {
      setError('Title is required.')
      return
    }
    if (!userId) {
      setError('Please sign in before saving.')
      return
    }
    if (!recipeId) {
      setError('Draft not ready yet. Try again in a moment.')
      return
    }

    setSaving(true)
    try {
      const ing = withBakersPct
        .filter(i => i.name.trim() && i.amount !== '')
        .map(i => ({
          name: i.name.trim(),
          amount: Number(i.amount),
          isFlour: Boolean(i.isFlour),
          bakers_pct: i.bakers_pct === null ? null : Number(i.bakers_pct),
        }))

      const stp = steps
        .filter(s => s.text.trim())
        .map((s, idx) => ({
          position: idx + 1,
          text: s.text.trim(),
          time: s.time === '' ? null : Number(s.time),
        }))

      // If memory lost uploads (page refresh), hydrate from storage
      let effectiveUploaded = uploaded
      if (effectiveUploaded.length === 0 && recipeId) {
        effectiveUploaded = await listFolderUrls(`recipes/${recipeId}`)
        if (effectiveUploaded.length) setUploaded(effectiveUploaded)
      }

      const urls = effectiveUploaded.map(f => f.url)
      const chosen = userPickedHero ? (hero || urls[0] || null) : (urls[0] || null)

      const { error: insertErr } = await supabase
        .from('recipes')
        .insert({
          id: recipeId, // promote draft id
          title: title.trim(),
          description: description || null,
          author_id: userId || null,
          prep_time_minutes: totalTime ? Number(totalTime) : null,
          servings: servings ? Number(servings) : null,
          difficulty: difficulty || null,
          ingredients: ing,
          steps: stp,
          images: urls,
          cover_image: chosen,
        })
      if (insertErr) throw insertErr

      // tidy draft
      await supabase.from('recipe_drafts').delete().eq('id', recipeId)
      setIsSaved(true)

      // ---- Auto-translate via serverless (detect source, call per target) ----
      setTranslating(true)
      try {
        const sample = [
          title?.trim() || '',
          description?.trim() || '',
          ...stp.map(s => s.text || ''),
        ].filter(Boolean).join('\n')
        let src = await detectLanguage(sample)
        if (!src) src = 'fi'

        const targets = TARGET_LANGS.filter(l => l !== src)
        for (const tgt of targets) {
          const r = await fetch('/api/translate-recipe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ recipeId, targetLang: tgt, force: false, debug: true }),
          })
          if (!r.ok) {
            const j = await r.json().catch(() => ({}))
            console.warn('translate-recipe failed', tgt, j)
          }
        }
      } finally {
        setTranslating(false)
      }

      nav(`/recipe/${recipeId}`)
    } catch (e) {
      console.error(e)
      setError(e.message || 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create a recipe</h1>
        <div className="flex gap-2 items-center">
          {translating && (
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200" title="Generating translations in background">
              <span className="w-2 h-2 rounded-full bg-current animate-pulse" /> Translating…
            </span>
          )}
          <button
            onClick={() => nav(-1)}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? 'Saving…' : isSaved ? 'Saved' : 'Save recipe'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700 p-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Basics */}
      <section className="grid gap-4 sm:grid-cols-1">
        <div className="space-y-2">
          <label className="text-sm text-gray-600 dark:text-gray-300">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 p-2"
            placeholder="Pataleipä"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-gray-600 dark:text-gray-300">Short description</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 p-2"
            placeholder="Valkosipulinen pataleipä…"
          />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <label className="text-sm text-gray-600 dark:text-gray-300">Servings</label>
          <input
            type="number"
            value={servings}
            onChange={(e) => setServings(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 p-2"
            placeholder="e.g. 8"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-gray-600 dark:text-gray-300">Total time (min)</label>
          <input
            type="number"
            value={totalTime}
            onChange={(e) => setTotalTime(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 p-2"
            placeholder="e.g. 120"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-gray-600 dark:text-gray-300">Difficulty</label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 p-2"
          >
            <option value="">– select –</option>
            <option value="easy">easy</option>
            <option value="medium">medium</option>
            <option value="hard">hard</option>
          </select>
        </div>
      </section>

      {/* Ingredients */}
      <section className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">{t('ingredients')}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={autoMarkFlour}
              className="px-3 py-1 rounded-lg border border-gray-300 dark:border-slate-600 text-sm hover:bg-gray-50 dark:hover:bg-slate-700"
              title="Mark rows as flour if name contains 'jauho' or 'flour'"
              type="button"
            >
              Auto-mark flour
            </button>
            <button
              onClick={addIngredient}
              className="px-3 py-1 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700"
              type="button"
            >
              + Add ingredient
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <span className="opacity-70">
            Total flour: <span className="font-medium">{totalFlour || 0}</span> g
          </span>
          {totalFlour === 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
              ⚠️ Set at least one flour amount
            </span>
          )}
        </div>

        <div className="space-y-2">
          {withBakersPct.map((ing, idx) => (
            <div key={idx} className="grid gap-2 sm:grid-cols-12 items-center">
              <input
                className="sm:col-span-4 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 p-2"
                placeholder="Name"
                value={ing.name}
                onChange={(e) => updateIngredient(idx, 'name', e.target.value)}
              />
              <input
                type="number"
                className="sm:col-span-2 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 p-2"
                placeholder="Amount (g)"
                value={ingredients[idx].amount}
                onChange={(e) => updateIngredient(idx, 'amount', e.target.value)}
              />
              <label className="sm:col-span-2 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={ingredients[idx].isFlour || false}
                  onChange={(e) => updateIngredient(idx, 'isFlour', e.target.checked)}
                />
                Flour
              </label>
              <input
                disabled
                value={ing.bakers_pct === null ? '' : `${ing.bakers_pct}%`}
                className="sm:col-span-3 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/60 text-gray-700 dark:text-gray-200 p-2"
                placeholder="Baker's % (auto)"
                title="Auto-calculated relative to total flour"
              />
              <button
                onClick={() => removeIngredient(idx)}
                className="sm:col-span-1 px-3 rounded-lg border border-red-300 text-red-600 hover:bg-red-50"
                type="button"
              >
                –
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Steps */}
      <section className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">{t('instructions')}</h2>
          <button
            onClick={addStep}
            className="px-3 py-1 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700"
            type="button"
          >
            + Add step
          </button>
        </div>

        <div className="space-y-2">
          {steps.map((s, idx) => (
            <div key={idx} className="grid gap-2 sm:grid-cols-12 items-start">
              <span className="sm:col-span-1 w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-slate-700">
                {idx + 1}
              </span>
              <textarea
                rows={2}
                className="sm:col-span-8 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 p-2"
                placeholder="Write the step…"
                value={s.text}
                onChange={(e) => updateStepText(idx, e.target.value)}
              />
              <input
                type="number"
                className="sm:col-span-2 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 p-2"
                placeholder="Time (min)"
                value={s.time}
                onChange={(e) => updateStepTime(idx, e.target.value)}
                title="Optional minutes from start; leave empty for null"
              />
              <button
                onClick={() => removeStep(idx)}
                className="sm:col-span-1 px-3 rounded-lg border border-red-300 text-red-600 hover:bg-red-50"
                type="button"
              >
                –
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Images + hero selector + drag + delete */}
      <section className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Images</h2>
        </div>

        {!userId && <p className="text-sm opacity-80">Sign in to upload images.</p>}
        {userId && !recipeId && <p className="text-sm opacity-80">Setting up your draft…</p>}

        {userId && recipeId && (
          <ImagesUploader
            recipeId={recipeId}
            userId={userId}
            draftId={recipeId}
            onUploaded={handleImagesUploaded}
          />
        )}

        {uploaded.length > 0 && (
          <>
            <div className="space-y-2">
              <h3 className="font-semibold">Hero image</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {uploaded.map((f) => (
                  <label key={f.url} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="hero"
                      checked={hero === f.url}
                      onChange={() => { setHero(f.url); setUserPickedHero(true) }}
                    />
                    <span className="text-sm truncate">
                      {(() => { try { return new URL(f.url).pathname.split('/').pop() } catch { return 'image' } })()}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {uploaded.map((f, idx) => (
                <div
                  key={f.url}
                  className="relative group rounded-lg overflow-hidden border"
                  draggable
                  onDragStart={onDragStart(idx)}
                  onDragOver={onDragOver}
                  onDrop={onDrop(idx)}
                  title="Drag to reorder"
                >
                  <img src={f.url} alt="" className="h-28 w-full object-cover" />
                  <div className="absolute top-1 left-1 px-1.5 py-0.5 text-xs rounded bg-black/60 text-white">
                    {idx + 1}{hero === f.url ? ' • hero' : ''}
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteImage(idx)}
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition px-2 py-1 text-xs rounded bg-red-600 text-white"
                    title="Delete image"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs opacity-70">Tip: drag thumbnails to reorder. First image is used as hero unless you pick one above.</p>
          </>
        )}
      </section>
    </div>
  )
}
