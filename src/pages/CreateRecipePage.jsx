// src/pages/CreateRecipePage.jsx
import React, { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import supabase from '@/supabaseClient'
import ImagesUploader from '@/components/ImagesUploader'

const BUCKET = 'recipe-images'

function newIngredient() {
  return { name: '', amount: '', isFlour: false } // bakers_pct is computed
}
function newStep(i = 1) {
  return { position: i, text: '', time: '' } // time optional ('' -> null on save)
}

export default function CreateRecipePage() {
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
  const [recipeId, setRecipeId] = useState(null)
  const [uploaded, setUploaded] = useState([]) // [{ url, path }]
  const [hero, setHero] = useState(null)
  const [userPickedHero, setUserPickedHero] = useState(false)

  // auth + draft id
  const [userId, setUserId] = useState(null)
  const [draftId] = useState(() =>
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`
  )

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data?.user?.id ?? null))
  }, [])

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

  // handle images uploaded (works pre & post save)
  const handleImagesUploaded = async (files) => {
    if (!files?.length) return
    setUploaded(prev => {
      const next = [...prev, ...files]
      // set default hero only if user hasn't picked one yet
      if (!userPickedHero && !hero && next[0]) setHero(next[0].url)
      return next
    })
    if (recipeId && !hero) {
      await supabase.from('recipes').update({ cover_image: files[0].url }).eq('id', recipeId)
      setHero(files[0].url)
    }
  }

  // ---------- drag & drop ----------
  const [dragIndex, setDragIndex] = useState(null)

  const onDragStart = (idx) => () => setDragIndex(idx)
  const onDragOver = (e) => e.preventDefault()
  const onDrop = (idx) => async (e) => {
    e.preventDefault()
    if (dragIndex === null || dragIndex === idx) return
    setUploaded(prev => {
      const next = [...prev]
      const [moved] = next.splice(dragIndex, 1)
      next.splice(idx, 0, moved)
      return next
    })
    setDragIndex(null)

    // If user hasn't explicitly chosen hero, keep hero = first image
    if (!userPickedHero && uploaded[0]) {
      const newFirst = uploaded[idx === 0 ? dragIndex : 0]?.url // quick recalculation after reorder
      if (newFirst) setHero(newFirst)
    }

    // Persist order if already saved
    if (recipeId) {
      const urls = getImageUrlsAfterReorder(dragIndex, idx, uploaded)
      await supabase.from('recipes').update({
        images: urls,
        cover_image: userPickedHero ? hero : urls[0] || null,
      }).eq('id', recipeId)
      if (!userPickedHero) setHero(urls[0] || null)
    }
  }

  const getImageUrlsAfterReorder = (from, to, list) => {
    const copy = [...list]
    const [m] = copy.splice(from, 1)
    copy.splice(to, 0, m)
    return copy.map(f => f.url)
  }

  // ---------- delete image ----------
  const deleteImage = async (idx) => {
    const target = uploaded[idx]
    if (!target) return

    // 1) delete from storage (if we have a path)
    if (target.path) {
      await supabase.storage.from(BUCKET).remove([target.path])
    }

    // 2) update local list
    const next = uploaded.filter((_, i) => i !== idx)
    setUploaded(next)

    // 3) adjust hero if needed
    let nextHero = hero
    if (hero === target.url) {
      nextHero = userPickedHero ? (next[0]?.url || null) : (next[0]?.url || null)
      setHero(nextHero)
      setUserPickedHero(false) // since we changed it implicitly
    }

    // 4) persist to DB if saved
    if (recipeId) {
      await supabase.from('recipes').update({
        images: next.map(f => f.url),
        cover_image: nextHero || null,
      }).eq('id', recipeId)
    }
  }

  // ---------- save recipe ----------
  const handleSave = async () => {
    setError('')
    if (!title.trim()) {
      setError('Title is required.')
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

      // 1) Create
      const basePayload = {
        title: title.trim(),
        description: description || null,
        author_id: userId || null,
        prep_time_minutes: totalTime ? Number(totalTime) : null,
        servings: servings ? Number(servings) : null,
        difficulty: difficulty || null,
        ingredients: ing,
        steps: stp,
        images: [],
        cover_image: null,
      }

      const { data: inserted, error: insertErr } = await supabase
        .from('recipes')
        .insert(basePayload)
        .select('id')
        .single()
      if (insertErr) throw insertErr

      const newId = inserted.id
      const newUploads = []
      const finalUrls = []

      // 2) Move drafts -> recipes/{id}/ and collect final URLs + paths
      for (const f of uploaded) {
        if (!f?.path) continue
        if (f.path.startsWith('drafts/')) {
          const filename = f.path.split('/').pop()
          const destPath = `recipes/${newId}/${filename}`
          const { error: moveErr } = await supabase.storage.from(BUCKET).move(f.path, destPath)
          if (moveErr) throw moveErr
          const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(destPath)
          newUploads.push({ url: pub.publicUrl, path: destPath })
          finalUrls.push(pub.publicUrl)
        } else {
          newUploads.push({ url: f.url, path: f.path })
          finalUrls.push(f.url)
        }
      }

      // 3) Cover image: user choice, else first
      const chosen = userPickedHero && hero ? hero : (finalUrls[0] || null)

      // 4) Update recipe with images + cover
      const { error: updErr } = await supabase
        .from('recipes')
        .update({ images: finalUrls, cover_image: chosen })
        .eq('id', newId)
      if (updErr) throw updErr

      // 5) sync local
      setRecipeId(newId)
      setUploaded(newUploads)
      if (!userPickedHero) setHero(finalUrls[0] || null)

      nav(`/recipe/${newId}`)
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
        <div className="flex gap-2">
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
            {saving ? 'Saving…' : recipeId ? 'Saved' : 'Save recipe'}
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
          <h2 className="font-semibold">Ingredients</h2>
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
          <h2 className="font-semibold">Instructions</h2>
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

        <ImagesUploader
          recipeId={recipeId}   // null before save → draft mode
          userId={userId}
          draftId={draftId}
          onUploaded={handleImagesUploaded}
        />

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
                    <span className="text-sm truncate">{new URL(f.url).pathname.split('/').pop()}</span>
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
