// /src/pages/RecipeViewPage.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import supabase from '@/supabaseClient';
import { Clock, Users, ChefHat } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const BUCKET = 'recipe-images';

/* ---------------------- Smooth, touch-enabled carousel ---------------------- */
function HeroCarousel({ items = [], title = '', overlay = null, t }) {
  const urls = (items || [])
    .map((im) => (typeof im === 'string' ? im : im?.url))
    .filter(Boolean);

  const [idx, setIdx] = useState(0);
  const containerRef = useRef(null);

  // drag state
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const dx = useRef(0);
  const widthRef = useRef(1);

  const go = (n) => {
    if (!urls.length) return;
    setIdx((prev) => (prev + n + urls.length) % urls.length);
  };

  const onKey = (e) => {
    if (e.key === 'ArrowLeft') go(-1);
    if (e.key === 'ArrowRight') go(1);
  };

  // touch handlers
  const onTouchStart = (e) => {
    if (!urls.length) return;
    const w = containerRef.current?.clientWidth || window.innerWidth || 1;
    widthRef.current = w;
    startX.current = e.touches[0].clientX;
    dx.current = 0;
    setDragging(true);
  };
  const onTouchMove = (e) => {
    if (!dragging) return;
    dx.current = e.touches[0].clientX - startX.current;
    setDragging((d) => d); // force style recompute
  };
  const onTouchEnd = () => {
    if (!dragging) return;
    const dist = dx.current;
    const w = widthRef.current;
    const threshold = w * 0.2;
    if (Math.abs(dist) > threshold) {
      go(dist > 0 ? -1 : 1);
    }
    setDragging(false);
    dx.current = 0;
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

  const offsetPct = dragging && widthRef.current ? (dx.current / widthRef.current) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video rounded-xl overflow-hidden"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Sliding track */}
      <div
        className={[
          'w-full h-full flex',
          dragging ? 'transition-none' : 'transition-transform duration-500 ease-out',
        ].join(' ')}
        style={{
          transform: `translateX(calc(${-idx * 100}% + ${offsetPct}%))`,
          willChange: 'transform',
        }}
      >
        {urls.map((u, i) => (
          <img
            key={`${u}-${i}`}
            src={u}
            alt={title || `Slide ${i + 1}`}
            className="w-full h-full object-cover flex-shrink-0"
            loading="lazy"
            decoding="async"
            draggable="false"
          />
        ))}
      </div>

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

/* ------------------------------- helpers -------------------------------- */
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

/* ---------------------------------- Page ----------------------------------- */
export default function RecipeViewPage() {
  const { t } = useTranslation();
  const { id } = useParams();

  // Recipe + author + images
  const [recipe, setRecipe] = useState(null);
  const [author, setAuthor] = useState(null);
  const [images, setImages] = useState([]); // strings or {url}

  // Signed-in user (for edit permission)
  const [sessionUserId, setSessionUserId] = useState(null);

  // Translation payload (if any)
  const [tData, setT] = useState(null);

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

  // Load session user
  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (mounted) setSessionUserId(data?.user?.id ?? null);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Load recipe + author + images
  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!id) return;

      // Use * to tolerate schema changes
      const { data: recRow, error: recErr } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', id)
        .single();

      if (cancelled) return;

      if (recErr) {
        console.warn('recipe select error', recErr);
        setRecipe(null);
        return;
      }

      setRecipe(recRow ?? null);

      // author
      const authorId = recRow?.author_id ?? recRow?.created_by ?? recRow?.user_id ?? null;
      if (authorId) {
        try {
          // Select only EXISTING columns on your users table
          const { data: authRow, error: authErr } = await supabase
            .from('users')
            .select('id,email,username,role,created_at')
            .eq('id', authorId)
            .maybeSingle();
          if (!authErr) setAuthor(authRow ?? null);
        } catch (e) {
          console.warn('author fetch skipped', e?.message || e);
        }
      } else {
        setAuthor(null);
      }

      // images: prefer explicit array; fallback to cover_image; else list folder
      if (Array.isArray(recRow?.images) && recRow.images.length) {
        setImages(recRow.images);
      } else if (recRow?.cover_image) {
        setImages([recRow.cover_image]);
      } else {
        const list = await listFolderUrls(`recipes/${id}`);
        if (!cancelled) setImages(list.map((x) => x.url));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  // Translation: prefer cached row; if missing, just show base (no API call here)
  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!id) return;

      if (uiLang === 'auto') {
        setT(null);
        return;
      }

      try {
        const { data: trRow, error: trErr } = await supabase
          .from('recipe_translations')
          .select('title,description,ingredients,steps')
          .eq('recipe_id', id)
          .eq('lang', targetLang)
          .maybeSingle();

        if (trErr) {
          console.warn('translation select error', trErr);
        }

        if (cancelled) return;

        if (trRow) {
          setT({
            title: trRow.title ?? undefined,
            description: trRow.description ?? undefined,
            ingredients: Array.isArray(trRow.ingredients) ? trRow.ingredients : undefined,
            steps: Array.isArray(trRow.steps) ? trRow.steps : undefined,
          });
        } else {
          setT(null);
        }
      } catch (e) {
        console.warn('translate select error', e);
        setT(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, uiLang, targetLang]);

  // Derive renderables
  const title = tData?.title ?? recipe?.title ?? recipe?.name ?? '';
  const description = tData?.description ?? recipe?.description ?? '';

  const ingredients = useMemo(() => {
    const base = tData?.ingredients ?? recipe?.ingredients ?? [];
    if (Array.isArray(base)) return base;
    return String(base || '')
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((name) => ({ name }));
  }, [tData, recipe]);

  const steps = useMemo(() => {
    const base = tData?.steps ?? recipe?.steps ?? [];
    if (Array.isArray(base)) return base;
    return String(base || '')
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((text, i) => ({ position: i + 1, text }));
  }, [tData, recipe]);

  const tags = useMemo(
    () =>
      String(recipe?.tags ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    [recipe]
  );

  const totalTime = useMemo(() => {
    const raw = recipe?.prep_time_minutes ?? recipe?.total_time ?? recipe?.time ?? null;
    if (raw == null) return null;
    const n = Number(String(raw).replace(/[^\d.,]/g, '').replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  }, [recipe]);

  const canEdit = useMemo(() => {
    if (!sessionUserId || !recipe?.author_id) return false;
    return sessionUserId === recipe.author_id;
  }, [sessionUserId, recipe]);

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6">
      {/* Breadcrumbs & Edit */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          <Link to="/browse" className="hover:underline">
            {t('recipe_library')}
          </Link>
          <span className="px-2">/</span>
          <span className="text-gray-900 dark:text-gray-100">
            {title || t('open_recipe')}
          </span>
        </div>

        {canEdit && (
          <Link
            to={`/recipe/${id}/edit`}
            className="inline-flex items-center px-3 py-1.5 rounded-md text-sm bg-blue-600 text-white hover:bg-blue-700"
          >
            {t('edit', 'Edit')}
          </Link>
        )}
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

              {description ? <div className="line-clamp-2">{description}</div> : null}
            </div>
          )}
        </div>

        {/* Meta pills */}
        {(totalTime != null || recipe?.servings) && (
          <div className="flex items-center gap-2">
            {totalTime != null ? (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                <Clock className="w-3.5 h-3.5" />
                {`${totalTime} ${t('minutes_short')}`}
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
                {/* No avatar_url column -> fallback bubble */}
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                  <ChefHat className="w-5 h-5" />
                </div>

                <div className="text-sm">
                  <div className="font-medium">{author?.username || author?.email}</div>
                  {description ? <div className="opacity-90 line-clamp-2 max-w-[50ch]">{description}</div> : null}
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
            {(tData?.ingredients ?? recipe?.ingredients)?.length ? (
              <ul className="space-y-2">
                {(tData?.ingredients ?? recipe?.ingredients)?.map?.((ing, i) => (
                  <li key={i} className="flex items-center justify-between">
                    <span className="text-gray-800 dark:text-gray-100">{ing.name ?? ''}</span>
                    {ing.amount != null && (
                      <span className="text-gray-600 dark:text-gray-300">
                        {ing.amount} {ing.unit ?? ''}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400">{t('no_ingredients_listed')}</div>
            )}
          </div>
        </section>

        {/* Instructions */}
        <section className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('instructions')}</h2>
          </div>
          <div className="p-4">
            {(tData?.steps ?? recipe?.steps)?.length ? (
              <ol className="list-decimal pl-5 space-y-2">
                {(tData?.steps ?? recipe?.steps)?.map?.((s, i) => (
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
              <div className="text-sm text-gray-500 dark:text-gray-400">{t('no_instructions_provided')}</div>
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
