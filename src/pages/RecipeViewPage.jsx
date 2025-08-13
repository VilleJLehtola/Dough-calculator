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

  const go = (next) => {
    if (urls.length === 0) return;
    setIdx((p) => (p + next + urls.length) % urls.length);
  };

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

/* ---------------------------------- Utils ---------------------------------- */
const parseIngredients = (text) => {
  // supports lines: "300 g flour" or "Flour: 300 g" etc
  return String(text ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const mG = line.match(/(\d+(?:[.,]\d+)?)\s*g\b/i);
      const mMl = line.match(/(\d+(?:[.,]\d+)?)\s*ml\b/i);
      const mPct = line.match(/(\d+(?:[.,]\d+)?)\s*%\b/);
      const amount =
        mG?.[1]?.replace(',', '.') ??
        mMl?.[1]?.replace(',', '.') ??
        mPct?.[1]?.replace(',', '.');

      return {
        name: line.replace(/[:\-–]\s*\d.+$/, '').replace(/\s+\d.+$/, '').trim(),
        amount: amount ? Number(amount) : null,
        unit: mG ? 'g' : mMl ? 'ml' : mPct ? '%' : null,
      };
    });
};

const parseSteps = (text) =>
  String(text ?? '')
    .split('\n')
    .map((line) => String(line ?? '').trim())
    .filter(Boolean);

/* ---------------------------------- Page ----------------------------------- */
export default function RecipeViewPage() {
  const { t } = useTranslation();
  const { id } = useParams();

  // Recipe + author
  const [recipe, setRecipe] = useState(null);
  const [author, setAuthor] = useState(null);
  const [images, setImages] = useState([]);

  // Translation data (if any)
  const [tr, setTr] = useState(null);

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

  // Load recipe + author + images
  useEffect(() => {
    let alive = true;

    (async () => {
      // base recipe
      const { data: recRow, error: recErr } = await supabase
        .from('recipes')
        .select(
          `
          id, user_id, title, description, ingredients, steps, tags, total_time, active_time, servings, mode,
          created_at, updated_at
        `
        )
        .eq('id', id)
        .single();

      if (recErr) {
        console.warn('recipe select error', recErr);
      }
      if (!alive) return;

      setRecipe(recRow ?? null);

      // author
      if (recRow?.user_id) {
        const { data: authRow, error: authErr } = await supabase
          .from('users')
          .select('id, email, username, avatar_url')
          .eq('id', recRow.user_id)
          .single();
        if (authErr) {
          console.warn('author select error', authErr);
        }
        if (!alive) return;
        setAuthor(authRow ?? null);
      }

      // images (may be empty)
      const { data: imageRows, error: imgErr } = await supabase
        .from('recipe_images')
        .select('id, url, created_at')
        .eq('recipe_id', id)
        .order('created_at', { ascending: true });

      if (imgErr) {
        console.warn('images select error', imgErr);
      }
      if (!alive) return;
      setImages(imageRows ?? []);
    })();

    return () => {
      alive = false;
    };
  }, [id]);

  // Load translation (or clear to original if auto)
  useEffect(() => {
    let alive = true;

    (async () => {
      if (uiLang === 'auto') {
        setTr(null);
        return;
      }

      // 1) Check if we already have a stored translation
      const { data: trRow, error: trErr } = await supabase
        .from('recipe_translations')
        .select('title,description,ingredients,steps')
        .eq('recipe_id', id)
        .eq('lang', targetLang)
        .single();

      if (trErr && trErr?.code !== 'PGRST116') {
        // PGRST116 = not found (single returns no rows)
        console.warn('translation select error', trErr);
      }

      if (trRow) {
        if (!alive) return;
        setTr(trRow);
        return;
      }

      // 2) Else request a fresh translation via the API
      try {
        const res = await fetch('/api/translate-recipe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recipeId: id, targetLang }),
        });

        if (!res.ok) throw new Error(`Translate API failed: ${res.status}`);
        const json = await res.json();
        if (!alive) return;
        setTr(json?.translation ?? null);
      } catch (e) {
        console.warn('translate api error', e);
        if (!alive) return;
        setTr(null);
      }
    })();

    return () => {
      alive = false;
    };
  }, [id, uiLang]);

  // Render the chosen view (original vs translated)
  const title = tr?.title ?? recipe?.title ?? '';
  const description = tr?.description ?? recipe?.description ?? '';
  const ingredients = useMemo(() => parseIngredients(tr?.ingredients ?? recipe?.ingredients ?? ''), [tr, recipe]);
  const steps = useMemo(() => parseSteps(tr?.steps ?? recipe?.steps ?? ''), [tr, recipe]);

  // Derive some layout bits
  const tags = useMemo(
    () => String(recipe?.tags ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    [recipe]
  );

  const timeParts = useMemo(() => {
    const total = recipe?.total_time ? String(recipe.total_time) : '';
    const active = recipe?.active_time ? String(recipe.active_time) : '';
    const asNum = (s) => Number(String(s).replace(/[^\d.,]/g, '').replace(',', '.')) || null;
    return {
      total,
      active,
      totalNum: asNum(total),
      activeNum: asNum(active),
    };
  }, [recipe]);

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
        {(timeParts.totalNum || timeParts.activeNum || recipe?.servings) && (
          <div className="flex items-center gap-2">
            {timeParts.totalNum ? (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                <Clock className="w-3.5 h-3.5" />
                {timeParts.totalNum} {t('minutes_short')}
              </span>
            ) : null}
            {timeParts.activeNum ? (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                ⏱ {timeParts.activeNum} {t('minutes_short')} active
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

      {/* Translation badge */}
      <div className="mt-4">
        {uiLang !== 'auto' && tr && (
          <span
            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
            title={`Viewing ${uiLang.toUpperCase()} translation`}
          >
            🌐 {uiLang.toUpperCase()}
          </span>
        )}
      </div>

      {/* Two-column layout: ingredients + steps */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold mb-3">{t('ingredients')}</h2>
          {ingredients?.length ? (
            <ul className="space-y-2">
              {ingredients.map((ing, i) => (
                <li key={i} className="flex items-center justify-between">
                  <span className="text-gray-800 dark:text-gray-100">{ing.name}</span>
                  {ing.amount != null && (
                    <span className="text-gray-600 dark:text-gray-300">
                      {ing.amount}{' '}
                      {ing.unit || ''}
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
        </section>

        <section className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold mb-3">{t('instructions')}</h2>
          {steps?.length ? (
            <ol className="list-decimal pl-5 space-y-2">
              {steps.map((s, i) => (
                <li key={i} className="text-gray-800 dark:text-gray-100">
                  {s}
                </li>
              ))}
            </ol>
          ) : (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {t('no_instructions_provided')}
            </div>
          )}
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
