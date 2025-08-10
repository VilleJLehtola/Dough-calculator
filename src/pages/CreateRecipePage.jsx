// src/pages/CreateRecipePage.jsx
import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/supabaseClient'
import ImagesUploader from '@/components/ImagesUploader'

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
  const [hero, setHero] = useState('')
  const [servings, setServings] = useState('')
  const [totalTime, setTotalTime] = useState('')
  const [difficulty, setDifficulty] = useState('')

  // json fields
  const [ingredients, setIngredients] = useState([newIngredient()])
  const [steps, setSteps] = useState([newStep(1)])

  // uploads
  const [recipeId, setRecipeId] = useState(null)
  const [uploadedUrls, setUploadedUrls] = useState([])
  const [userId, setUserId] = useState(null)

  // fetch user once (lightweight; safe to call here)
  React.useEffect(() => {
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

  // ingredient ops
  const updateIngredient = (i, k, v) =>
    setIngredients(prev => prev.map((row, idx) => (idx === i ? { ...row, [k]: v } : row)))
  const addIngredient = () => setIngredients(prev => [...prev, newIngredient()])
  const removeIngredient = (i) => setIngredients(prev => prev.filter((_, idx) => idx !== i))

  // step ops
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

  // save recipe
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

      const payload = {
        title: title.trim(),
        description: description || null,
        hero_image_url: hero || null,
        servings: servings ? Number(servings) : null,
        total_time: totalTime ? Number(totalTime) : null,
        difficulty: difficulty || null,
        ingredients: ing,
        steps: stp,
        user_id: userId || null,
      }

      const { data, error: err } = await supabase
        .from('recipes')
        .insert(payload)
        .select('id')
        .single()

      if (err) throw err
      setRecipeId(data.id)
    } catch (e) {
      console.error(e)
      setError(e.message || 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  // when child uploader finishes
  const handleImagesUploaded = async (urls) => {
    if (!urls?.length) return
    setUploadedUrls(prev => [...prev, ...urls])
    if (!hero && urls[0]) {
      await supabase.from('recipes').update({ hero_image_url: urls[0] }).eq('id', recipeId)
      setHero(urls[0])
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
      <section className="grid gap-4 sm:grid-cols-2">
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
          <label className="text-sm text-gray-600 dark:text-gray-300">Hero image URL (optional)</label>
          <input
            value={hero}
            onChange={(e) => setHero(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 p-2"
            placeholder="https://example.com/hero.jpg"
          />
        </div>
      </section>

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
          <input
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 p-2"
            placeholder="easy / medium / hard"
          />
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
              Auto‑mark flour
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

      {/* Images (uses your ImagesUploader) */}
      <section className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Images</h2>
        </div>

        {!recipeId ? (
          <p className="text-sm opacity-70">Save the recipe to enable uploads.</p>
        ) : (
          <>
            <ImagesUploader
              recipeId={recipeId}
              userId={userId}
              onUploaded={handleImagesUploaded}
            />
            {uploadedUrls.length > 0 && (
              <div className="text-sm opacity-80 mt-2">
                Uploaded: {uploadedUrls.length} image(s)
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}
