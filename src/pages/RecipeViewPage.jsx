// /src/pages/RecipeViewPage.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import supabase from '@/supabaseClient';
import { Clock, Users, ChefHat } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/* ---------------------- Small, dependency-free carousel ---------------------- */
function HeroCarousel({ items = [], title = '', overlay = null, t }) {
  const urls = (items || [])
    .map((im) => (typeof im === 'string' ? im : im?.url))
    .filter(Boolean);

  const [idx, setIdx] = useState(0);
  const touchStartX = useRef(null);
  const touchDeltaX = useRef(0);

  const go = (n) => setIdx((prev) => (prev + n + urls.length) % urls.length);
  const onKey = (e) => {
    if (e.key === 'ArrowLeft') go(-1);
    if (e.key === 'ArrowRight') go(1);
  };

  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  };
  const onTouchMove = (e) => {
    if (touchStartX.current == null) return;
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  };
  const onTouchEnd = () => {
    if (Math.abs(touchDeltaX.current) > 30) {
      go(touchDeltaX.current > 0 ? -1 : 1);
    }
    touchStartX.current = null;
    touchDeltaX.current = 0;
  };

  useEffect(() => {
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!urls?.length) {
    return (
      <div className="relative w-full aspect-video bg-gray-200 dark:bg-gray-800 rounded-xl overflow-hidden flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">{title || ''}</div>
        {overlay}
      </div>
    );
  }

  return (
    <div
      className="relative w-full aspect-video rounded-xl overflow-hidden"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <img
        src={urls[idx]}
        alt={title || `Slide ${idx + 1}`}
        className="w-full h-full object-cover"
      />

      {/* Overlay (author, description, etc) */}
      {overlay}

      {/* Prev/Next */}
      <button
        aria-label="Previous image"
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full w-9 h-9 flex items-center justify-center"
        onClick={() => go(-1)}
      >
        ‹
      </button>
      <button
        aria-label="Next image"
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full w-9 h-9 flex items-center justify-center"
        onClick={() => go(1)}
      >
        ›
      </button>

      {/* Dots */}
      <div className="absolute bottom-2 w-full flex items-center justify-center gap-2">
        {urls.map((_, i) => (
          <button
            key={i}
            aria-label={t('go_to_slide', { index: i + 1 })}
            className={`w-2.5 h-2.5 rounded-full ${i === idx ? 'bg-white' : 'bg-white/50 hover:bg-white/80'}`}
            onClick={() => setIdx(i)}
          />
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------- Page ----------------------------------- */
export default function RecipeViewPage() {
  const { t } = useTranslation();
  const { id } = useParams();

  // Recipe + author + images
  const [recipe, setRecipe] = useState(null);
  const [author, setAuthor] = useState(null);
  const [images, setImages] = useState([]); // [{url}] or strings

  // Translation payload (if any)
  const [tData, setT] = useState(null);

  // Auth (optional for likes)
  const [uid, setUid] = useState(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUid(data?.user?.id ?? null);
    });
  }, []);

  // UI language from sidebar (localStorage + custom event)
  const [uiLang, setUiLang] = useState(localStorage.getItem('lang') || 'auto');
  const targetLang = useMemo(() => (uiLang === 'auto' ? 'fi' : uiLang), [uiLang]);
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'lang') setUiLang(localStorage.getItem('lang') || 'auto');
    };
    const onLangChange = (e) => setUiLang(e.detail || localStorage.getItem('lang') || 'auto');

    window.addEventListener('storage', onStorage);
    window.addEventListener('langchange', onLangChange);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('langchange', onLangChange);
    };
  }, []);

  /* ----------------------------- Normalizers ----------------------------- */
  // These are your original normalizers — unchanged.
  const normalizeIngredients = (ingRaw) => {
    try {
      if (!ingRaw) return [];
      // Allow array, JSON, or plain text
      if (Array.isArray(ingRaw)) return ingRaw;
      if (typeof ingRaw === 'object') return Object.values(ingRaw);
      const text = String(ingRaw ?? '');
      return text
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .map((line) => ({ name: line }));
    } catch {
      return [];
    }
  };

  const normalizeSteps = (stepsRaw) => {
    try {
      if (!stepsRaw) return [];
      if (Array.isArray(stepsRaw)) return stepsRaw;
      if (typeof stepsRaw === 'object') return Object.values(stepsRaw);
      const text = String(stepsRaw ?? '');
      return text
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .map((line, i) => ({ i: i + 1, text: line }));
    } catch {
      return [];
    }
  };

  const [ingredients, setIngredients] = useState([]);
  const [steps, setSteps] = useState([]);

  // Load recipe + author + images
  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!id) return;

      const { data: recRow, error: recErr } = await supabase
        .from('recipes')
        .select(
          `
          id, user_id, title, description, ingredients, steps, tags, total_time, active_time, servings, mode, difficulty,
          created_at, updated_at
        `
        )
        .eq('id', id)
        .maybeSingle();

      if (cancelled) return;

      if (recErr) {
        console.warn('recipe select error', recErr);
      }

      setRecipe(recRow ?? null);
      setIngredients(normalizeIngredients(recRow?.ingredients));
      setSteps(normalizeSteps(recRow?.steps));

      // author
      if (recRow?.user_id) {
        const { data: authRow, error: authErr } = await supabase
          .from('users')
          .select('id, email, username, avatar_url')
          .eq('id', recRow.user_id)
          .maybeSingle();
        if (!cancelled) {
          if (authErr) console.warn('author select error', authErr);
          setAuthor(authRow ?? null);
        }
      }

      // images
      const { data: imageRows, error: imgErr } = await supabase
        .from('recipe_images')
        .select('id, url, created_at')
        .eq('recipe_id', id)
        .order('created_at', { ascending: true });

      if (!cancelled) {
        if (imgErr) console.warn('images select error', imgErr);
        setImages(imageRows ?? []);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  // Translation: prefer cached row; if missing, call serverless to create it
  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!id) return;

      // Auto = show base recipe as-is
      if (uiLang === 'auto') {
        setT(null);
        return;
      }

      try {
        // 1) Try cached translation
        const { data: trRow, error: trErr } = await supabase
          .from('recipe_translations')
          .select('title,description,ingredients,steps')
          .eq('recipe_id', id)
          .eq('lang', targetLang)
          .maybeSingle();

        if (cancelled) return;

        if (trErr) {
          console.warn('translation select error', trErr);
        }

        if (trRow) {
          setT({
            title: trRow.title ?? undefined,
            description: trRow.description ?? undefined,
            ingredients: Array.isArray(trRow.ingredients) ? trRow.ingredients : undefined,
            steps: Array.isArray(trRow.steps) ? trRow.steps : undefined,
          });
          return;
        }

        // 2) No cache → serverless (translate + upsert)
        const resp = await fetch('/api/translate-recipe', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ recipeId: id, targetLang }),
        });

        const json = await resp.json().catch(() => ({}));
        if (cancelled) return;

        if (!resp.ok) {
          console.warn('translate api failed', resp.status, json);
          setT(null);
          return;
        }

        const tr = json?.translation ?? null;
        setT(tr ? {
          title: tr.title ?? undefined,
          description: tr.description ?? undefined,
          ingredients: Array.isArray(tr.ingredients) ? tr.ingredients : undefined,
          steps: Array.isArray(tr.steps) ? tr.steps : undefined,
        } : null);
      } catch (e) {
        if (!cancelled) {
          console.warn('translate api error', e);
          setT(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, uiLang, targetLang]);

  // Merge translated view over base
  const title = tData?.title ?? recipe?.title ?? '';
  const description = tData?.description ?? recipe?.description ?? '';
  const ingredientsToRender = tData?.ingredients ?? ingredients;
  const stepsToRender = tData?.steps ?? steps;

  // tags + times
  const tags = useMemo(
    () => String(recipe?.tags ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    [recipe]
  );

  const totalTime = useMemo(() => {
    const raw = recipe?.total_time ? String(recipe.total_time) : '';
    const n = Number(String(raw).replace(/[^\d.,]/g, '').replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  }, [recipe]);

  const difficulty = recipe?.difficulty || null;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6">
      {/* Breadcrumbs */}
      <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">
        <Link to="/browse" className="hover:underline">
          {t('recipe_library')}
        </Link>
        <span className="px-2">/</span>
        <span className="text-gray-900 dark:text-gray-100">
          {title || t('open_recipe')}
        </span>
      </div>

      {/* Header: title + meta */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-gray-100">
            {title || t('open_recipe')}
          </h1>

          {(author?.username || author?.email || description) && (
            <div className="mt-2 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
              {author?.username || author?.email ? (
                <div className="flex items-center gap-2">
                  <ChefHat className="w-4 h-4" />
                  <span>{author?.username || author?.email}</span>
                </div>
              ) : null}

              {description ? (
                <div className="line-clamp-2">{description}</div>
              ) : null}
            </div>
          )}
        </div>

        {/* Meta pills */}
        {(totalTime != null || difficulty || recipe?.servings) && (
          <div className="flex items-center gap-2">
            {totalTime != null ? (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                <Clock className="w-3.5 h-3.5" />
                {`${totalTime} ${t('minutes_short')}`}
              </span>
            ) : null}
            {difficulty ? (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                <ChefHat className="w-3.5 h-3.5" />
                {difficulty}
              </span>
            ) : null}
            {recipe?.servings ? (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                <Users className="w-3.5 h-3.5" />
                {recipe.servings}
              </span>
            ) : null}
          </div>
        )}
      </div>

      {/* HERO CAROUSEL with overlay */}
      <HeroCarousel
        title={title}
        items={images}
        t={t}
        overlay={
          (author?.username || author?.email || description) && (
            <div className="absolute right-4 bottom-4 bg-black/50 text-white rounded-lg px-3 py-2 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                {author?.avatar_url ? (
                  <img
                    src={author.avatar_url}
                    alt={author?.username || author?.email}
                    className="w-9 h-9 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                    <ChefHat className="w-5 h-5" />
                  </div>
                )}

                <div className="text-sm">
                  <div className="font-medium">
                    {author?.username || author?.email}
                  </div>
                  {description ? (
                    <div className="opacity-90 line-clamp-2 max-w-[50ch]">
                      {description}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          )
        }
      />

      {/* Tags */}
      {tags?.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center gap-2">
          {tags.map((tag, i) => (
            <span
              key={`${tag}-${i}`}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
            >
              # {tag}
            </span>
          ))}
        </div>
      )}

      {/* Two-column layout: ingredients + steps */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ingredients */}
        <section className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('ingredients')}</h2>
          </div>
          <div className="p-4 overflow-x-auto">
            {ingredientsToRender?.length ? (
              <ul className="space-y-2">
                {ingredientsToRender.map((ing, i) => (
                  <li key={i} className="flex items-center justify-between">
                    <span className="text-gray-800 dark:text-gray-100">{ing.name ?? ''}</span>
                    {ing.amount != null && (
                      <span className="text-gray-600 dark:text-gray-300">
                        {ing.amount}{' '}{ing.unit ?? ''}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {t('no_ingredients_listed')}
              </div>
            )}
          </div>
        </section>

        {/* Instructions */}
        <section className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('instructions')}</h2>
          </div>
          <div className="p-4">
            {stepsToRender?.length ? (
              <ol className="list-decimal pl-5 space-y-2">
                {stepsToRender.map((s, i) => (
                  <li key={i} className="text-gray-800 dark:text-gray-100">
                    {s.text ?? String(s ?? '')}
                    {s.time != null && (
                      <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-700">
                        +{s.time} {t('minutes_short')}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {t('no_instructions_provided')}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Back link */}
      <div className="mt-6">
        <Link to="/browse" className="inline-block text-sm text-blue-600 dark:text-blue-400 hover:underline">
          ← {t('back_to_recipes')}
        </Link>
      </div>
    </div>
  );
}
