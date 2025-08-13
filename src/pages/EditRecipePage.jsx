// /src/pages/EditRecipePage.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import supabase from '@/supabaseClient';
import ImagesUploader from '@/components/ImagesUploader';
import TagsInput from '@/components/common/TagsInput';
import { useTranslation } from 'react-i18next';

const BUCKET = 'recipe-images';
const TARGET_LANGS = ['en', 'sv']; // extend if needed

function newIngredient() {
  return { name: '', amount: '', isFlour: false }; // bakers_pct is computed
}
function newStep(i = 1) {
  return { position: i, text: '', time: '' };
}

// derive storage path from a public URL
function urlToPath(url) {
  try {
    const u = new URL(url);
    const ix = u.pathname.indexOf(`/object/public/${BUCKET}/`);
    if (ix === -1) return null;
    return u.pathname.slice(ix + `/object/public/${BUCKET}/`.length);
  } catch {
    return null;
  }
}

// list folder -> [{url, path}]
async function listFolderUrls(folder) {
  const { data: files, error } = await supabase.storage.from(BUCKET).list(folder, { limit: 200 });
  if (error || !files?.length) return [];
  return files
    .filter((f) => !f.name.startsWith('.'))
    .map((f) => {
      const path = `${folder}/${f.name}`;
      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
      return { url: pub.publicUrl, path };
    });
}

// shallow helpers to snapshot the *translatable* fields only
function buildTextSnapshot({ title, description, ingredients, steps }) {
  return {
    title: (title || '').trim(),
    description: (description || '').trim(),
    ingNames: (ingredients || []).map((i) => (i?.name || '').trim()),
    stepTexts: (steps || []).map((s) => (s?.text || '').trim()),
  };
}
function sameSnapshot(a, b) {
  if (!a || !b) return false;
  if (a.title !== b.title) return false;
  if (a.description !== b.description) return false;
  if (a.ingNames.length !== b.ingNames.length) return false;
  if (a.stepTexts.length !== b.stepTexts.length) return false;
  for (let i = 0; i < a.ingNames.length; i++) if (a.ingNames[i] !== b.ingNames[i]) return false;
  for (let i = 0; i < a.stepTexts.length; i++) if (a.stepTexts[i] !== b.stepTexts[i]) return false;
  return true;
}

export default function EditRecipePage() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const { id } = useParams();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState(null);

  // basics
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [totalTime, setTotalTime] = useState('');
  const [servings, setServings] = useState('');
  const [difficulty, setDifficulty] = useState('');

  // json
  const [ingredients, setIngredients] = useState([newIngredient()]);
  const [steps, setSteps] = useState([newStep(1)]);

  // images
  const [uploaded, setUploaded] = useState([]); // [{url, path}]
  const [hero, setHero] = useState(null);
  const [userPickedHero, setUserPickedHero] = useState(false);

  // tags
  const [tags, setTags] = useState([]); // [{id, name}]

  // flags
  const [isLoaded, setIsLoaded] = useState(false);
  const [translating, setTranslating] = useState(false);

  // original text snapshot (to detect changes)
  const originalSnapshotRef = useRef(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data?.user?.id ?? null));
  }, []);

  // load recipe + tags
  useEffect(() => {
    let alive = true;
    (async () => {
      setError('');
      const { data: r, error: err } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', id)
        .single();

      if (err) {
        setError(err.message);
        return;
      }
      if (!alive) return;

      // basics
      setTitle(r.title || '');
      setDescription(r.description || '');
      setTotalTime(r.prep_time_minutes ?? '');
      setServings(r.servings ?? '');
      setDifficulty(r.difficulty || '');

      // json
      setIngredients(Array.isArray(r.ingredients) && r.ingredients.length ? r.ingredients : [newIngredient()]);
      setSteps(Array.isArray(r.steps) && r.steps.length ? r.steps : [newStep(1)]);

      // snapshot original translatable parts
      originalSnapshotRef.current = buildTextSnapshot({
        title: r.title || '',
        description: r.description || '',
        ingredients: Array.isArray(r.ingredients) ? r.ingredients : [],
        steps: Array.isArray(r.steps) ? r.steps : [],
      });

      // images
      let imgs = [];
      if (Array.isArray(r.images) && r.images.length) {
        imgs = r.images.map((u) => ({ url: u, path: urlToPath(u) }));
      } else {
        imgs = await listFolderUrls(`recipes/${id}`);
      }
      setUploaded(imgs);
      setHero(r.cover_image || imgs[0]?.url || null);

      // tags (recipe_tags -> tags)
      try {
        const { data: rt, error: rtErr } = await supabase
          .from('recipe_tags')
          .select('tag_id, tags ( id, name )')
          .eq('recipe_id', id);
        if (!rtErr && Array.isArray(rt)) {
          const uniq = [];
          const seen = new Set();
          for (const row of rt) {
            const tid = row.tags?.id ?? row.tag_id;
            const nm = row.tags?.name ?? '';
            if (tid && nm && !seen.has(tid)) {
              seen.add(tid);
              uniq.push({ id: tid, name: nm });
            }
          }
          setTags(uniq);
        }
      } catch (e) {
        console.warn('load tags error', e);
      }

      setIsLoaded(true);
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  // ---------- Baker’s % ----------
  const totalFlour = useMemo(
    () =>
      ingredients.reduce((sum, ing) => {
        const amt = Number(ing.amount);
        return sum + (ing.isFlour && !Number.isNaN(amt) ? amt : 0);
      }, 0),
    [ingredients]
  );

  const withBakersPct = useMemo(
    () =>
      ingredients.map((ing) => {
        const amt = Number(ing.amount);
        if (Number.isNaN(amt) || !totalFlour) return { ...ing, bakers_pct: null };
        const rounded = Math.round((amt / totalFlour) * 100 * 10) / 10;
        return { ...ing, bakers_pct: rounded };
      }),
    [ingredients, totalFlour]
  );

  // ingredient ops
  const updateIngredient = (i, k, v) =>
    setIngredients((prev) => prev.map((row, idx) => (idx === i ? { ...row, [k]: v } : row)));
  const addIngredient = () => setIngredients((prev) => [...prev, newIngredient()]);
  const removeIngredient = (i) => setIngredients((prev) => prev.filter((_, idx) => idx !== i));

  // steps ops
  const updateStepText = (i, v) => setSteps((prev) => prev.map((s, idx) => (idx === i ? { ...s, text: v } : s)));
  const updateStepTime = (i, v) => setSteps((prev) => prev.map((s, idx) => (idx === i ? { ...s, time: v } : s)));
  const addStep = () => setSteps((prev) => [...prev, newStep(prev.length + 1)]);
  const removeStep = (i) =>
    setSteps((prev) => prev.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, position: idx + 1 })));

  // flour helper
  const autoMarkFlour = () => {
    const re = /(jauho|flour)/i;
    setIngredients((prev) =>
      prev.map((ing) => ({
        ...ing,
        isFlour: re.test(ing.name || '') ? true : ing.isFlour,
      }))
    );
  };

  // uploads
  const handleImagesUploaded = async (files) => {
    if (!files?.length) return;
    const next = [...uploaded, ...files];
    setUploaded(next);
    if (!userPickedHero && !hero && next[0]) setHero(next[0].url);

    // persist immediately
    const urls = next.map((f) => f.url);
    const chosen = userPickedHero ? hero : urls[0] || null;
    await supabase.from('recipes').update({ images: urls, cover_image: chosen }).eq('id', id);
    if (!userPickedHero) setHero(chosen);
  };

  // dnd
  const [dragIndex, setDragIndex] = useState(null);
  const onDragStart = (idx) => () => setDragIndex(idx);
  const onDragOver = (e) => e.preventDefault();
  const onDrop = (idx) => async (e) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === idx) return;
    const next = [...uploaded];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(idx, 0, moved);
    setUploaded(next);

    const urls = next.map((f) => f.url);
    await supabase
      .from('recipes')
      .update({
        images: urls,
        cover_image: userPickedHero ? hero : urls[0] || null,
      })
      .eq('id', id);
    if (!userPickedHero) setHero(urls[0] || null);
    setDragIndex(null);
  };

  // delete image
  const deleteImage = async (idx) => {
    const target = uploaded[idx];
    if (!target) return;
    if (target.path) {
      await supabase.storage.from(BUCKET).remove([target.path]);
    }
    const next = uploaded.filter((_, i) => i !== idx);
    setUploaded(next);

    let nextHero = hero;
    if (hero === target.url) {
      nextHero = next[0]?.url || null;
      setHero(nextHero);
      setUserPickedHero(false);
    }
    await supabase
      .from('recipes')
      .update({
        images: next.map((f) => f.url),
        cover_image: nextHero || null,
      })
      .eq('id', id);
  };

  // --- translation trigger (only when translatable fields changed) ---
  async function triggerTranslations(recipeId) {
    setTranslating(true);
    try {
      await Promise.all(
        TARGET_LANGS.map((tgt) =>
          fetch('/api/translate-recipe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              recipeId,
              targetLang: tgt,
              skipTranslate: false, // actually call DeepL
            }),
          }).then(async (r) => {
            const j = await r.json().catch(() => ({}));
            if (!r.ok) console.warn('translate-recipe failed', tgt, j);
            else console.log('translate-recipe ok', tgt, j?.up);
          })
        )
      );
    } finally {
      setTranslating(false);
    }
  }

  // save (UPDATE) + conditional translations
  const handleSave = async () => {
    setError('');
    if (!title.trim()) {
      setError(t('title_required', 'Title is required.'));
      return;
    }

    setSaving(true);
    try {
      const ing = withBakersPct
        .filter((i) => i.name.trim() && i.amount !== '')
        .map((i) => ({
          name: i.name.trim(),
          amount: Number(i.amount),
          isFlour: Boolean(i.isFlour),
          bakers_pct: i.bakers_pct === null ? null : Number(i.bakers_pct),
        }));

      const stp = steps
        .filter((s) => s.text.trim())
        .map((s, idx) => ({
          position: idx + 1,
          text: s.text.trim(),
          time: s.time === '' ? null : Number(s.time),
        }));

      // hydrate from storage if needed
      let effective = uploaded;
      if (effective.length === 0) {
        effective = await listFolderUrls(`recipes/${id}`);
        if (effective.length) setUploaded(effective);
      }
      const urls = effective.map((f) => f.url);
      const chosen = userPickedHero ? hero || urls[0] || null : urls[0] || null;

      const updatedRecipe = {
        title: title.trim(),
        description: description || null,
        author_id: userId || null, // stays the same normally
        prep_time_minutes: totalTime ? Number(totalTime) : null,
        servings: servings ? Number(servings) : null,
        difficulty: difficulty || null,
        ingredients: ing,
        steps: stp,
        images: urls,
        cover_image: chosen,
      };

      const { error: updErr } = await supabase.from('recipes').update(updatedRecipe).eq('id', id);
      if (updErr) throw updErr;

      // compare snapshots → only translate when the translatable parts changed
      const currentSnapshot = buildTextSnapshot({
        title: updatedRecipe.title,
        description: updatedRecipe.description,
        ingredients: ing,
        steps: stp,
      });
      const originalSnapshot = originalSnapshotRef.current;

      if (!sameSnapshot(originalSnapshot, currentSnapshot)) {
        await triggerTranslations(id);
        // refresh the baseline so repeated saves don’t re-trigger
        originalSnapshotRef.current = currentSnapshot;
      }

      nav(`/recipe/${id}`);
    } catch (e) {
      console.error(e);
      setError(e.message || t('update_failed', 'Update failed.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('edit_recipe', 'Edit recipe')}</h1>
        <div className="flex gap-2 items-center">
          {translating && (
            <span
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200"
              title={t('generating_translations', 'Generating translations in background')}
            >
              <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
              {t('translating', 'Translating…')}
            </span>
          )}
          <Link to={`/recipe/${id}`} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200">
            {t('cancel', 'Cancel')}
          </Link>
          <button onClick={handleSave} disabled={saving || !isLoaded} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">
            {saving ? t('saving', 'Saving…') : t('save_changes', 'Save changes')}
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
          <label className="text-sm text-gray-600 dark:text-gray-300">{t('title', 'Title')}</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 p-2"
            placeholder="Pataleipä"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-gray-600 dark:text-gray-300">{t('short_description', 'Short description')}</label>
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
          <label className="text-sm text-gray-600 dark:text-gray-300">{t('servings', 'Servings')}</label>
          <input
            type="number"
            value={servings}
            onChange={(e) => setServings(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 p-2"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-gray-600 dark:text-gray-300">{t('total_time_min', 'Total time (min)')}</label>
          <input
            type="number"
            value={totalTime}
            onChange={(e) => setTotalTime(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 p-2"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-gray-600 dark:text-gray-300">{t('difficulty', 'Difficulty')}</label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 p-2"
          >
            <option value="">{t('select_dash', '– select –')}</option>
            <option value="easy">{t('easy', 'easy')}</option>
            <option value="medium">{t('medium', 'medium')}</option>
            <option value="hard">{t('hard', 'hard')}</option>
          </select>
        </div>
      </section>

      {/* Ingredients */}
      <section className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">{t('ingredients', 'Ingredients')}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={autoMarkFlour}
              className="px-3 py-1 rounded-lg border border-gray-300 dark:border-slate-600 text-sm hover:bg-gray-50 dark:hover:bg-slate-700"
              title={t('auto_mark_flour_tip', 'Mark rows as flour if name contains “jauho” or “flour”')}
            >
              {t('auto_mark_flour', 'Auto-mark flour')}
            </button>
            <button onClick={addIngredient} className="px-3 py-1 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700">
              + {t('add_ingredient', 'Add ingredient')}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <span className="opacity-70">
            {t('total_flour', 'Total flour')}: <span className="font-medium">{totalFlour || 0}</span> g
          </span>
          {totalFlour === 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
              ⚠️ {t('set_at_least_one_flour', 'Set at least one flour amount')}
            </span>
          )}
        </div>

        <div className="space-y-2">
          {withBakersPct.map((ing, idx) => (
            <div key={idx} className="grid gap-2 sm:grid-cols-12 items-center">
              <input
                className="sm:col-span-4 rounded-lg border p-2 bg-white dark:bg-gray-700"
                placeholder={t('name', 'Name')}
                value={ing.name}
                onChange={(e) => updateIngredient(idx, 'name', e.target.value)}
              />
              <input
                type="number"
                className="sm:col-span-2 rounded-lg border p-2 bg-white dark:bg-gray-700"
                placeholder={t('amount_g', 'Amount (g)')}
                value={ingredients[idx].amount}
                onChange={(e) => updateIngredient(idx, 'amount', e.target.value)}
              />
              <label className="sm:col-span-2 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={ingredients[idx].isFlour || false}
                  onChange={(e) => updateIngredient(idx, 'isFlour', e.target.checked)}
                />
                {t('flour', 'Flour')}
              </label>
              <input
                disabled
                value={ing.bakers_pct === null ? '' : `${ing.bakers_pct}%`}
                className="sm:col-span-3 rounded-lg border p-2 bg-gray-50 dark:bg-slate-700/60"
                placeholder={t('bakers_pct_auto', "Baker's % (auto)")}
              />
              <button
                onClick={() => removeIngredient(idx)}
                className="sm:col-span-1 px-3 rounded-lg border border-red-300 text-red-600 hover:bg-red-50"
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
          <h2 className="font-semibold">{t('instructions', 'Instructions')}</h2>
        </div>

        <div className="space-y-2">
          {steps.map((s, idx) => (
            <div key={idx} className="grid gap-2 sm:grid-cols-12 items-start">
              <span className="sm:col-span-1 w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-slate-700">
                {idx + 1}
              </span>
              <textarea
                rows={2}
                className="sm:col-span-8 rounded-lg border p-2 bg-white dark:bg-gray-700"
                placeholder={t('write_step', 'Write the step…')}
                value={s.text}
                onChange={(e) => updateStepText(idx, e.target.value)}
              />
              <input
                type="number"
                className="sm:col-span-2 rounded-lg border p-2 bg-white dark:bg-gray-700"
                placeholder={t('time_min', 'Time (min)')}
                value={s.time}
                onChange={(e) => updateStepTime(idx, e.target.value)}
                title={t('time_from_start_tip', 'Optional minutes from start; leave empty for null')}
              />
              <div className="sm:col-span-1 flex items-center">
                <button
                  onClick={() => removeStep(idx)}
                  className="px-3 rounded-lg border border-red-300 text-red-600 hover:bg-red-50"
                >
                  –
                </button>
              </div>
              {idx === steps.length - 1 && (
                <div className="sm:col-span-12">
                  <button
                    onClick={addStep}
                    className="px-3 py-1 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700"
                    type="button"
                  >
                    + {t('add_step', 'Add step')}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Tags */}
      <section className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
        <h2 className="font-semibold">{t('tags', 'Tags')}</h2>
        <TagsInput recipeId={id} value={tags} onChange={setTags} />
      </section>

      {/* Images */}
      <section className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">{t('images', 'Images')}</h2>
        </div>

        <ImagesUploader recipeId={id} userId={userId} draftId={id} onUploaded={handleImagesUploaded} />

        {uploaded.length > 0 && (
          <>
            <div className="space-y-2">
              <h3 className="font-semibold">{t('hero_image', 'Hero image')}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {uploaded.map((f) => (
                  <label key={f.url} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="hero"
                      checked={hero === f.url}
                      onChange={async () => {
                        setHero(f.url);
                        setUserPickedHero(true);
                        await supabase.from('recipes').update({ cover_image: f.url }).eq('id', id);
                      }}
                    />
                    <span className="text-sm truncate">
                      {(() => {
                        try {
                          return new URL(f.url).pathname.split('/').pop();
                        } catch {
                          return 'image';
                        }
                      })()}
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
                  title={t('drag_to_reorder', 'Drag to reorder')}
                >
                  <img src={f.url} alt="" className="h-28 w-full object-cover" />
                  <div className="absolute top-1 left-1 px-1.5 py-0.5 text-xs rounded bg-black/60 text-white">
                    {idx + 1}
                    {hero === f.url ? ` • ${t('hero', 'hero')}` : ''}
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteImage(idx)}
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition px-2 py-1 text-xs rounded bg-red-600 text-white"
                    title={t('delete_image', 'Delete image')}
                  >
                    {t('delete', 'Delete')}
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs opacity-70">
              {t(
                'drag_tip',
                'Tip: drag thumbnails to reorder. First image is used as hero unless you pick one above.'
              )}
            </p>
          </>
        )}
      </section>
    </div>
  );
}
