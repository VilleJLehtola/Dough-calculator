// src/pages/CreateRecipePage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../supabaseClient';

function newIngredient() {
  return { name: '', amount: '', bakers_pct: '' };
}

export default function CreateRecipePage() {
  const nav = useNavigate();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // core fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [hero, setHero] = useState('');
  const [servings, setServings] = useState('');
  const [totalTime, setTotalTime] = useState('');
  const [difficulty, setDifficulty] = useState('');

  // json fields
  const [ingredients, setIngredients] = useState([newIngredient()]);
  const [steps, setSteps] = useState([{ position: 1, text: '' }]);
  const [images, setImages] = useState([]);

  // helpers
  const updateIngredient = (i, k, v) =>
    setIngredients(prev => prev.map((row, idx) => (idx === i ? { ...row, [k]: v } : row)));
  const addIngredient = () => setIngredients(prev => [...prev, newIngredient()]);
  const removeIngredient = (i) => setIngredients(prev => prev.filter((_, idx) => idx !== i));

  const updateStep = (i, v) =>
    setSteps(prev => prev.map((s, idx) => (idx === i ? { ...s, text: v, position: i + 1 } : s)));
  const addStep = () => setSteps(prev => [...prev, { position: prev.length + 1, text: '' }]);
  const removeStep = (i) =>
    setSteps(prev => prev.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, position: idx + 1 })));

  const addImage = () => setImages(prev => [...prev, { url: '' }]);
  const updateImage = (i, v) => setImages(prev => prev.map((im, idx) => (idx === i ? { url: v } : im)));
  const removeImage = (i) => setImages(prev => prev.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    setError('');
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }

    setSaving(true);

    // attach author if logged in (optional)
    const { data: userRes } = await supabase.auth.getUser();
    const user_id = userRes?.user?.id ?? null;

    const payload = {
      title: title.trim(),
      description: description || null,
      hero_image_url: hero || (images[0]?.url || null),
      servings: servings ? Number(servings) : null,
      total_time: totalTime ? Number(totalTime) : null,
      difficulty: difficulty || null,
      ingredients,
      steps,
      images,
      user_id
    };

    const { data, error: err } = await supabase
      .from('recipes')
      .insert(payload)
      .select('id')
      .single();

    setSaving(false);

    if (err) {
      console.error(err);
      setError(err.message || 'Save failed.');
      return;
    }

    nav(`/recipe/${data.id}`);
  };

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
            {saving ? 'Saving…' : 'Save recipe'}
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
            className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-2"
            placeholder="Pataleipä"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-gray-600 dark:text-gray-300">Hero image URL</label>
          <input
            value={hero}
            onChange={(e) => setHero(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-2"
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
          className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-2"
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
            className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-2"
            placeholder="e.g. 8"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-gray-600 dark:text-gray-300">Total time (min)</label>
          <input
            type="number"
            value={totalTime}
            onChange={(e) => setTotalTime(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-2"
            placeholder="e.g. 120"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-gray-600 dark:text-gray-300">Difficulty</label>
          <input
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-2"
            placeholder="easy / medium / hard"
          />
        </div>
      </section>

      {/* Ingredients */}
      <section className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Ingredients</h2>
          <button
            onClick={addIngredient}
            className="px-3 py-1 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700"
          >
            + Add ingredient
          </button>
        </div>

        <div className="space-y-2">
          {ingredients.map((ing, idx) => (
            <div key={idx} className="grid gap-2 sm:grid-cols-3">
              <input
                className="rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-2"
                placeholder="Name"
                value={ing.name}
                onChange={(e) => updateIngredient(idx, 'name', e.target.value)}
              />
              <input
                className="rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-2"
                placeholder="Amount (e.g. 650 g)"
                value={ing.amount}
                onChange={(e) => updateIngredient(idx, 'amount', e.target.value)}
              />
              <div className="flex gap-2">
                <input
                  className="flex-1 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-2"
                  placeholder="Baker's % (e.g. 65%)"
                  value={ing.bakers_pct}
                  onChange={(e) => updateIngredient(idx, 'bakers_pct', e.target.value)}
                />
                <button
                  onClick={() => removeIngredient(idx)}
                  className="px-3 rounded-lg border border-red-300 text-red-600 hover:bg-red-50"
                >
                  –
                </button>
              </div>
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
          >
            + Add step
          </button>
        </div>

        <div className="space-y-2">
          {steps.map((s, idx) => (
            <div key={idx} className="flex gap-2">
              <span className="w-8 h-10 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-slate-700">
                {idx + 1}
              </span>
              <textarea
                rows={2}
                className="flex-1 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-2"
                placeholder="Write the step…"
                value={s.text}
                onChange={(e) => updateStep(idx, e.target.value)}
              />
              <button
                onClick={() => removeStep(idx)}
                className="px-3 rounded-lg border border-red-300 text-red-600 hover:bg-red-50"
              >
                –
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Images */}
      <section className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Extra images</h2>
          <button
            onClick={addImage}
            className="px-3 py-1 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700"
          >
            + Add image
          </button>
        </div>

        <div className="space-y-2">
          {images.map((img, idx) => (
            <div key={idx} className="flex gap-2">
              <input
                className="flex-1 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-2"
                placeholder="https://…"
                value={img.url}
                onChange={(e) => updateImage(idx, e.target.value)}
              />
              <button
                onClick={() => removeImage(idx)}
                className="px-3 rounded-lg border border-red-300 text-red-600 hover:bg-red-50"
              >
                –
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
