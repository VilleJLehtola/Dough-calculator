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
    const threshold = w * 0.2; // 20% swipe
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

      {overlay}

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

function normalizeSteps(base) {
  if (Array.isArray(base)) {
    return base.map((s, i) => ({
      position: s?.position ?? i + 1,
      text: typeof s?.text === 'string' ? s.text : String(s ?? ''),
      time: s?.time ?? null,
    }));
  }
  // allow legacy newline string
  return String(base || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((text, i) => ({ position: i + 1, text, time: null }));
}

function mergeSteps(base, tr) {
  const b = normalizeSteps(base);
  const t = Array.isArray(tr) ? normalizeSteps(tr) : [];
  if (!t.length) return b;
  const len = Math.max(b.length, t.length);
  const out = [];
  for (let i = 0; i < len; i++) {
    const bi = b[i];
    const ti = t[i];
    if (ti && ti.text) out.push({ ...bi, ...ti, text: ti.text ?? bi?.text });
    else if (bi) out.push(bi);
  }
  return out;
}

/* ---------------------------------- Page ----------------------------------- */
export default function RecipeViewPage() {
  const { t } = useTranslation();
  const { id } = useParams();

  const [recipe, setRecipe] = useState(null);
  const [author, setAuthor] = useState(null);
  const [images, setImages] = useState([]);
  const [tData, setT] = useState(null);

  // UI language from localStorage + custom event
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
    let cancelled = false;

    (async () => {
      if (!id) return;
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

      const authorId = recRow?.author_id ?? recRow?.created_by ?? recRow?.user_id ?? null;
      if (authorId) {
        try {
          const { data: authRow, error: authErr } = await supabase
            .from('users')
            .select('id, email, username, avatar_url')
            .eq('id', authorId)
            .maybeSingle();
          if (!authErr) setAuthor(authRow ?? null);
        } catch (e) {
          console.warn('author fetch skipped', e?.message || e);
        }
      } else {
        setAuthor(null);
      }

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

  // Translation: prefer cached row; refresh if stale; else generate; then MERGE
  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!id) return;

      if (uiLang === 'auto') {
        setT(null);
        return;
      }

      try {
        const { data: trRow } = await supabase
          .from('recipe_translations')
          .select('title,description,ingredients,steps,updated_at')
          .eq('recipe_id', id)
          .eq('lang', targetLang)
          .maybeSingle();

        const recUpdated = recipe?.updated_at ? new Date(recipe.updated_at).getTime() : 0;
        const trUpdated = trRow?.updated_at ? new Date(trRow.updated_at).getTime() : 0;

        if (!trRow || trUpdated < recUpdated) {
          // stale or missing => (re)generate
          const resp = await fetch('/api/translate-recipe', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ recipeId: id, targetLang, force: true }),
          });
          const json = await resp.json().catch(() => ({}));
          if (cancelled) return;

          if (resp.ok && json?.translation) {
            setT({
              title: json.translation.title ?? undefined,
              description: json.translation.description ?? undefined,
              ingredients: Array.isArray(json.translation.ingredients) ? json.translation.ingredients : undefined,
              steps: Array.isArray(json.translation.steps) ? json.translation.steps : undefined,
            });
          } else {
            // fall back to base if translation failed
            setT(null);
          }
        } else {
          setT({
            title: trRow.title ?? undefined,
            description: trRow.description ?? undefined,
            ingredients: Array.isArray(trRow.ingredients) ? trRow.ingredients : undefined,
            steps: Array.isArray(trRow.steps) ? trRow.steps : undefined,
          });
        }
      } catch (e) {
        console.warn('translate api error', e);
        setT(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, uiLang, targetLang, recipe?.updated_at]);

  // ----- Derive renderables (with safe merge) -----
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

  const renderSteps = useMemo(() => {
    return mergeSteps(recipe?.steps ?? [], tData?.steps ?? []);
  }, [recipe?.steps, tData?.steps]);

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

              {description ? <div className="line-clamp-2">{description}</div> : null}
            </div>
          )}
        </div>

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

      {/* HERO CAROUSEL */}
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

      {/* Two-column layout */}
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
              <div className="text-sm text-gray-500 dark:text-gray-400">{t('no_ingredients_listed','No ingredients listed.')}</div>
            )}
          </div>
        </section>

        {/* Instructions (merged) */}
        <section className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('instructions')}</h2>
          </div>
          <div className="p-4">
            {renderSteps.length ? (
              <ol className="list-decimal pl-5 space-y-2">
                {renderSteps.map((s, i) => (
                  <li key={i} className="text-gray-800 dark:text-gray-100">
                    {s.text}
                    {s.time != null && (
                      <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-700">
                        +{s.time} {t('minutes_short')}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400">{t('no_instructions_provided','No instructions provided.')}</div>
            )}
          </div>
        </section>
      </div>

      {/* Back link */}
      <div className="mt-6 flex items-center gap-3">
        <Link to="/browse" className="inline-block text-sm text-blue-600 dark:text-blue-400 hover:underline">
          ← {t('back_to_recipes')}
        </Link>

        {/* Optional Edit button (uncomment if you want it here too) */}
        {/* <Link to={`/recipe/${id}/edit`} className="inline-block text-sm text-blue-600 dark:text-blue-400 hover:underline">
          {t('edit_recipe','Edit recipe')}
        </Link> */}
      </div>
    </div>
  );
}
