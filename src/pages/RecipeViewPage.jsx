// /src/pages/RecipeViewPage.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import supabase from '@/supabaseClient';
import { Clock, Users, ChefHat } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/* ---------------------- Small, dependency-free carousel ---------------------- */
function HeroCarousel({ items = [], title = '', overlay = null }) {
  const urls = (items || [])
    .map((im) => (typeof im === 'string' ? im : im?.url))
    .filter(Boolean);

  const [idx, setIdx] = useState(0);
  const touchStartX = useRef(null);
  const touchDeltaX = useRef(0);

  useEffect(() => {
    if (idx >= urls.length) setIdx(0);
  }, [urls.length, idx]);

  if (!urls.length) return null;

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
    const dx = touchDeltaX.current;
    touchStartX.current = null;
    touchDeltaX.current = 0;
    if (Math.abs(dx) > 40) go(dx > 0 ? -1 : 1);
  };

  return (
    <div
      className="mt-4 relative rounded-xl overflow-hidden"
      tabIndex={0}
      onKeyDown={onKey}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      aria-roledescription="carousel"
      aria-label="Recipe images"
    >
      <div className="w-full aspect-[21/9] bg-gray-100 dark:bg-gray-800 relative">
        {urls.map((src, i) => (
          <img
            key={src + i}
            src={src}
            alt={title}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
              i === idx ? 'opacity-100' : 'opacity-0'
            }`}
            aria-hidden={i !== idx}
          />
        ))}
        {overlay}
        {urls.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/45 text-white px-2 py-2 hover:bg-black/60 focus:outline-none"
              aria-label="Previous image"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/45 text-white px-2 py-2 hover:bg-black/60 focus:outline-none"
              aria-label="Next image"
            >
              ›
            </button>
          </>
        )}
        {urls.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
            {urls.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`h-2 w-2 rounded-full transition ${
                  i === idx ? 'bg-white' : 'bg-white/50 hover:bg-white/80'
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
/* ---------------------------------------------------------------------------- */

export default function RecipeViewPage() {
  const { tState } = useTranslation();
  const { id } = useParams();
  const [recipe, setRecipe] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [steps, setSteps] = useState([]);
  const [images, setImages] = useState([]); // [{url}] or strings
  const [author, setAuthor] = useState(null);
  const [loading, setLoading] = useState(true);

  // Logged-in user (for "Edit" button)
  const [uid, setUid] = useState(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUid(data?.user?.id ?? null);
    });
  }, []);

  // UI language from sidebar (localStorage + custom event)
  const [uiLang, setUiLang] = useState(localStorage.getItem('lang') || 'auto');
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

  // Normalizers
  const normalizeIngredients = (ingRaw) => {
    if (!ingRaw) return [];
    if (Array.isArray(ingRaw) && ingRaw.every((x) => typeof x === 'object')) return ingRaw;
    if (Array.isArray(ingRaw)) {
      return ingRaw.map((line) => ({
        name: String(line ?? '').trim(),
        amount: '',
        bakers_pct: '',
      }));
    }
    if (typeof ingRaw === 'string') {
      return ingRaw
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [name, amount, bakers] = line.split(';').map((s) => s?.trim());
          return { name: name || '', amount: amount || '', bakers_pct: bakers || '' };
        });
    }
    return [];
  };

  const normalizeSteps = (raw) => {
    if (!raw) return [];
    if (Array.isArray(raw) && raw.every((x) => typeof x === 'object')) {
      return raw.map((s, i) => ({
        position: s.position ?? i + 1,
        text: s.text ?? s.content ?? s.description ?? String(s ?? ''),
        time: s.time ?? s.minutes ?? null,
      }));
    }
    if (Array.isArray(raw)) return raw.map((tState, i) => ({ position: i + 1, text: String(tState ?? '') }));
    if (typeof raw === 'string') {
      return raw
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((text, idx) => ({ position: idx + 1, text }));
    }
    return [];
  };

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);

      const { data: rcp, error: rErr } = await supabase
        .from('recipes')
        .select(
          'id,title,description,author_id,prep_time_minutes,servings,difficulty,cover_image,images,ingredients,steps,created_at'
        )
        .eq('id', id)
        .single();

      if (rErr) {
        console.error('Recipe fetch error:', rErr.message);
        if (isMounted) setLoading(false);
        return;
      }

      // Legacy tables (ignored if missing)
      let ing = [];
      {
        const { data, error } = await supabase
          .from('recipe_ingredients')
          .select('name, amount, bakers_pct, position')
          .eq('recipe_id', id)
          .order('position', { ascending: true });
        if (!error && data?.length) ing = data;
      }

      let st = [];
      {
        const { data, error } = await supabase
          .from('recipe_steps')
          .select('text, position, time')
          .eq('recipe_id', id)
          .order('position', { ascending: true });
        if (!error && data?.length) st = data;
      }

      let img = [];
      {
        const { data, error } = await supabase
          .from('recipe_images')
          .select('url, position')
          .eq('recipe_id', id)
          .order('position', { ascending: true });
        if (!error && data?.length) img = data;
      }

      // Fallbacks to inline fields (new schema first)
      if (!ing?.length) ing = normalizeIngredients(rcp.ingredients);
      if (!st?.length) st = normalizeSteps(rcp.steps || rcp.instructions);

      let imgs = [];
      if (Array.isArray(rcp.images) && rcp.images.length) {
        imgs = rcp.images.map((u) => (typeof u === 'string' ? { url: u } : u));
      } else if (img?.length) {
        imgs = img;
      } else if (rcp.cover_image) {
        imgs = [{ url: rcp.cover_image }];
      }

      // Author (optional)
      let profile = null;
      try {
        const userId = rcp.author_id || rcp.user_id || rcp.created_by;
        if (userId) {
          const { data: u } = await supabase
            .from('users')
            .select('id, email, username, avatar_url')
            .eq('id', userId)
            .single();
          profile = u || null;
        }
      } catch (_) {}

      if (isMounted) {
        setRecipe(rcp);
        setIngredients(ing || []);
        setSteps(st || []);
        setImages(imgs || []);
        setAuthor(profile);
        setLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [id]);

  // Translation: prefer cached row; if missing, call serverless to create it
  const [tState, setT] = useState(null);

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
          .eq('lang', uiLang)
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
          body: JSON.stringify({ recipeId: id, targetLang: uiLang }),
        });

        const data = await resp.json().catch(() => ({}));
        if (cancelled) return;

        if (resp.ok) {
          setT({
            title: data.title ?? undefined,
            description: data.description ?? undefined,
            ingredients: Array.isArray(data.ingredients) ? data.ingredients : undefined,
            steps: Array.isArray(data.steps) ? data.steps : undefined,
          });
        } else {
          console.warn('translate-recipe failed', data);
          setT(null);
        }
      } catch (e) {
        console.warn('translation flow error', e);
        if (!cancelled) setT(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, uiLang]);

  const title = tState?.title ?? recipe?.title ?? 'Resepti';
  const description = tState?.description ?? recipe?.description ?? '';
  const servings = recipe?.servings ?? null;
  const totalTime =
    recipe?.prep_time_minutes ??
    recipe?.total_time ??
    recipe?.bake_time ??
    recipe?.time_total ??
    null;
  const difficulty = recipe?.difficulty ?? null;

  const hasAnyStats = !!(servings || totalTime || difficulty);

  const statChips = useMemo(
    () =>
      [
        servings != null ? { icon: Users, label: `${servings} annosta` } : null,
        totalTime != null ? { icon: Clock, label: `${totalTime} min` } : null,
        difficulty ? { icon: ChefHat, label: difficulty } : null,
      ].filter(Boolean),
    [servings, totalTime, difficulty]
  );

  const ingredientsToRender = tState?.ingredients ?? ingredients;
  const stepsToRender = tState?.steps ?? steps;

  const sortedSteps = useMemo(
    () =>
      (stepsToRender || [])
        .slice()
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
    [stepsToRender]
  );

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-48 rounded-xl bg-gray-200 dark:bg-gray-800" />
          <div className="h-6 w-1/3 bg-gray-200 dark:bg-gray-800 rounded" />
          <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-800 rounded" />
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <p className="text-gray-700 dark:text-gray-300">Recipe not found.</p>
        <Link to="/browse" className="text-blue-600 dark:text-blue-400 underline">
          ← Back to recipes
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      {/* Title + Edit */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">{title}</h1>

          {/* Shows when a translation is applied */}
          {uiLang !== 'auto' && tState && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200"
              title={`Viewing ${uiLang.toUpperCase()} translation`}
            >
              {uiLang.toUpperCase()}
            </span>
          )}
        </div>

        {uid && recipe?.author_id === uid && (
          <Link
            to={`/recipe/${recipe.id}/edit`}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700"
          >
            Edit
          </Link>
        )}
      </div>

      {/* HERO CAROUSEL with overlay */}
      <HeroCarousel
        title={title}
        items={images}
        overlay={
          (author?.username || author?.email || description) && (
            <div className="absolute right-4 bottom-4 bg-black/50 text-white rounded-lg px-3 py-2 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                {author?.avatar_url ? (
                  <img
                    src={author.avatar_url}
                    alt={author.username || author.email}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center text-xs">
                    {((author?.username || author?.email || 'U') ?? 'U').slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="text-sm leading-tight">
                  <div className="font-semibold">
                    {author?.username || author?.email || `Unknown author`}
                  </div>
                  {description ? <div className="opacity-90 line-clamp-1">{description}</div> : null}
                </div>
              </div>
            </div>
          )
        }
      />

      {/* Stat chips */}
      {hasAnyStats && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {statChips.map(({ icon: Icon, label }, i) => (
            <div
              key={i}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm text-sm text-gray-700 dark:text-gray-200"
            >
              <Icon className="w-4 h-4" />
              {label}
            </div>
          ))}
        </div>
      )}

      {/* Grid: Ingredients / Instructions */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ingredients */}
        <section className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">$${t('ingredients')}</h2>
          </div>
          <div className="p-4 overflow-x-auto">
            {ingredientsToRender?.length ? (
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 dark:text-gray-400">
                    <th className="py-2 pr-4 font-medium">Name</th>
                    <th className="py-2 pr-4 font-medium text-right">Amount</th>
                    <th className="py-2 font-medium text-right">Baker&apos;s %</th>
                  </tr>
                </thead>
                <tbody>
                  {ingredientsToRender.map((row, idx) => (
                    <tr
                      key={idx}
                      className={idx % 2 ? `bg-gray-50 dark:bg-slate-900/40` : 'bg-transparent'}
                    >
                      <td className="py-2 pr-4 text-gray-800 dark:text-gray-200">{row.name ?? ''}</td>
                      <td className="py-2 pr-4 text-gray-800 dark:text-gray-200 text-right">
                        {row.amount ?? ''}
                      </td>
                      <td className="py-2 text-gray-800 dark:text-gray-200 text-right">
                        {row.bakers_pct ?? ``}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-600 dark:text-gray-300">No ingredients listed.</p>
            )}
          </div>
        </section>

        {/* Instructions */}
        <section className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">$${t('instructions')}</h2>
          </div>
          <div className="p-4">
            {sortedSteps.length ? (
              <ol className="space-y-2 list-decimal pl-5 marker:text-gray-500 dark:marker:text-gray-400">
                {sortedSteps.map((s, i) => (
                  <li key={i} className="text-gray-800 dark:text-gray-200">
                    <div className="flex items-start gap-2">
                      <span className="flex-1">{s.text || s}</span>
                      {s.time != null && s.time !== `` && (
                        <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-slate-700">
                          +{s.time} min
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-gray-600 dark:text-gray-300">No instructions provided.</p>
            )}
          </div>
        </section>
      </div>

      {/* Back link */}
      <div className="mt-6">
        <Link to="/browse" className="inline-block text-sm text-blue-600 dark:text-blue-400 hover:underline">
          ← Back to recipes
        </Link>
      </div>
    </div>
  );
}
