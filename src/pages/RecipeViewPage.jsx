// /src/pages/RecipeViewPage.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import supabase from '@/supabaseClient';
import { Clock, Users, ChefHat, Pencil, Scale } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const BUCKET = 'recipe-images';

/* ---------------------- Smooth, touch-enabled carousel ---------------------- */
function HeroCarousel({ items = [], title = '', overlay = null, t }) {
  const urls = (items || [])
    .map((im) => (typeof im === 'string' ? im : im?.url))
    .filter(Boolean);

  const [idx, setIdx] = useState(0);
  const containerRef = useRef(null);

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
    setDragging((d) => d); // no-op to force style recompute
  };
  const onTouchEnd = () => {
    if (!dragging) return;
    const dist = dx.current;
    const w = widthRef.current;
    const threshold = w * 0.2; // 20% swipe
    if (Math.abs(dist) > threshold) go(dist > 0 ? -1 : 1);
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
        style={{ transform: `translateX(calc(${-idx * 100}% + ${offsetPct}%))`, willChange: 'transform' }}
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

function numOrNull(v) {
  const n = Number(String(v ?? '').replace(',', '.').replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : null;
}

function isFlourIng(ing) {
  if (ing?.isFlour === true) return true;
  const name = String(ing?.name || '');
  // Heuristics: Finnish + English common flour words
  return /jauho|flour|semolina|spelt|speltti|durum|vehnä|rye|ruis/i.test(name);
}

/* ---------------------------------- Page ----------------------------------- */
export default function RecipeViewPage() {
  const { t } = useTranslation();
  const { id } = useParams();

  const [recipe, setRecipe] = useState(null);
  const [author, setAuthor] = useState(null);
  const [images, setImages] = useState([]);

  const [tData, setT] = useState(null);
  const [authUserId, setAuthUserId] = useState(null);

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

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setAuthUserId(data?.user?.id ?? null));
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
          let authRow = null;
          const { data: byAuthId } = await supabase
            .from('users')
            .select('id, email, username, avatar_url')
            .eq('auth_user_id', authorId)
            .maybeSingle();
          authRow = byAuthId ?? null;

          if (!authRow) {
            const { data: byId } = await supabase
              .from('users')
              .select('id, email, username, avatar_url')
              .eq('id', authorId)
              .maybeSingle();
            authRow = byId ?? null;
          }
          setAuthor(authRow);
        } catch (e) {
          console.warn('author fetch skipped', e?.message || e);
          setAuthor(null);
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

  const canEdit = useMemo(() => {
    if (!authUserId || !recipe) return false;
    const owner = recipe.author_id ?? recipe.created_by ?? recipe.user_id ?? null;
    return Boolean(owner && authUserId === owner);
  }, [authUserId, recipe]);

  // Translation fetch (cached)
  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!id || !recipe) return;

      const sourceLang = recipe?.source_lang || 'fi';
      const effectiveLang = uiLang === 'auto' ? sourceLang : uiLang;
      const useBase = !effectiveLang || effectiveLang === sourceLang;

      if (useBase) {
        if (!cancelled) setT(null);
        return;
      }

      try {
        const { data: trRow } = await supabase
          .from('recipe_translations')
          .select('title,description,ingredients,steps')
          .eq('recipe_id', id)
          .eq('lang', effectiveLang)
          .maybeSingle();

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
        console.warn('translation fetch error', e);
        if (!cancelled) setT(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, recipe, uiLang]);

  // Renderables
  const title = tData?.title ?? recipe?.title ?? recipe?.name ?? '';
  const description = tData?.description ?? recipe?.description ?? '';
  const ingredientsBase = useMemo(() => {
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

  /* ---------------------- Scaling logic (baker’s %) ---------------------- */
  const baseFlour = useMemo(() => {
    return ingredientsBase.reduce((sum, ing) => {
      const amt = numOrNull(ing?.amount);
      if (!Number.isFinite(amt)) return sum;
      return sum + (isFlourIng(ing) ? amt : 0);
    }, 0);
  }, [ingredientsBase]);

  // single source of truth: scale factor (1.0 = 100%)
  const [scale, setScale] = useState(1);
  const [showScale, setShowScale] = useState(false);

  // derived helpers
  const percent = Math.round(scale * 100);
  const targetFlour = baseFlour ? Math.round(baseFlour * scale) : null;

  const setByPercent = (p) => setScale(Math.max(0.05, Number(p || 0) / 100));
  const setByTargetFlour = (tg) => {
    if (!baseFlour) return; // if no flour marked, disable
    const s = Number(tg || 0) / baseFlour;
    setScale(s > 0 ? s : 0);
  };

  const scaledIngredients = useMemo(() => {
    if (!ingredientsBase?.length) return [];
    return ingredientsBase.map((ing) => {
      const amt = numOrNull(ing?.amount);
      if (!Number.isFinite(amt)) return ing;
      const scaled = Math.round(amt * scale);
      return { ...ing, amount: scaled };
    });
  }, [ingredientsBase, scale]);

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6">
      {/* Breadcrumbs */}
      <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">
        <Link to="/browse" className="hover:underline">
          {t('recipe_library')}
        </Link>
        <span className="px-2">/</span>
        <span className="text-gray-900 dark:text-gray-100">{title || t('open_recipe')}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-gray-100 truncate">
            {title || t('open_recipe')}
          </h1>

          {(author?.username || author?.email || description) && (
            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
              {author?.username || author?.email ? (
                <div className="flex items-center gap-2">
                  <ChefHat className="w-4 h-4" />
                  <span className="truncate">{author?.username || author?.email}</span>
                </div>
              ) : null}
              {description ? <div className="line-clamp-2">{description}</div> : null}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
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

          {canEdit && id && (
            <Link
              to={`/recipe/${id}/edit`}
              className="ml-2 inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700"
              title={t('edit_recipe', 'Edit recipe')}
            >
              <Pencil className="w-4 h-4" />
              {t('edit_recipe', 'Edit')}
            </Link>
          )}
        </div>
      </div>

      {/* Hero */}
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

      {/* Two columns */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ingredients + scaler */}
        <section className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('ingredients')}</h2>

            <button
              className="inline-flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-md border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700"
              onClick={() => setShowScale((s) => !s)}
              title={t('scale_recipe', 'Scale recipe')}
            >
              <Scale className="w-4 h-4" />
              {t('scale_recipe', 'Scale')}
            </button>
          </div>

          {/* Scaler UI */}
          {showScale && (
            <div className="px-4 pt-4 pb-2 border-b border-gray-200 dark:border-slate-700 text-sm space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="opacity-80">
                  {t('total_flour', 'Total flour')}: <strong>{baseFlour || 0} g</strong>
                </span>

                <span className="opacity-80">
                  {t('target_flour', 'Target flour')}: <strong>{targetFlour ?? '—'} g</strong>
                </span>

                <span className="opacity-80">
                  {t('scale', 'Scale')}: <strong>{percent}%</strong>
                </span>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs opacity-80">
                    {t('target_flour_input', 'Target flour (g)')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    disabled={!baseFlour}
                    value={targetFlour ?? ''}
                    onChange={(e) => setByTargetFlour(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 disabled:opacity-60"
                    placeholder={baseFlour ? String(baseFlour) : t('no_flour_marked', 'No flour marked')}
                    title={
                      baseFlour
                        ? t('tip_target_flour', 'Set desired total flour in grams')
                        : t('tip_target_flour_disabled', 'Mark at least one ingredient as flour to use this')
                    }
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs opacity-80">{t('percent', 'Percent')}</label>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    value={percent}
                    onChange={(e) => setByPercent(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2"
                    placeholder="100"
                    title={t('tip_percent', 'Scale all ingredient amounts by percent')}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {[50, 75, 100, 150, 200, 300, 400].map((p) => (
                  <button
                    key={p}
                    onClick={() => setByPercent(p)}
                    className={`px-2.5 py-1 rounded-md text-xs border ${
                      percent === p
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    {p}%
                  </button>
                ))}
                <button
                  onClick={() => setScale(1)}
                  className="ml-1 px-2.5 py-1 rounded-md text-xs border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700"
                >
                  {t('reset', 'Reset')}
                </button>
              </div>

              {!baseFlour && (
                <p className="text-xs opacity-75">
                  {t(
                    'percent_only_note',
                    'Note: No flour is marked in this recipe. Scaling uses percent only.'
                  )}
                </p>
              )}
            </div>
          )}

          {/* Ingredients list (scaled) */}
          <div className="p-4 overflow-x-auto">
            {scaledIngredients?.length ? (
              <ul className="space-y-2">
                {scaledIngredients.map((ing, i) => (
                  <li key={i} className="flex items-center justify-between">
                    <span className="text-gray-800 dark:text-gray-100">{ing.name ?? ''}</span>
                    {numOrNull(ing.amount) != null ? (
                      <span className="text-gray-600 dark:text-gray-300">
                        {ing.amount} {ing.unit ?? ''}
                      </span>
                    ) : (
                      <span className="text-gray-600 dark:text-gray-300">{ing.unit ?? ''}</span>
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
            {steps?.length ? (
              <ol className="list-decimal pl-5 space-y-2">
                {steps.map((s, i) => (
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
