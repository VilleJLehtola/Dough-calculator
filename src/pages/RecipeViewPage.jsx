// /src/pages/RecipeViewPage.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import supabase from '@/supabaseClient';
import { Clock, Users, ChefHat, Pencil, Scale } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LikeFavoriteBar from '@/components/LikeFavoriteBar';
import CommentsSection from '@/components/CommentsSection';

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
    setDragging((d) => d); // trigger style recompute
  };
  const onTouchEnd = () => {
    if (!dragging) return;
    const dist = dx.current;
    const w = widthRef.current;
    const threshold = w * 0.2; // 20% swipe to switch
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

  const offsetPct =
    dragging && widthRef.current ? (dx.current / widthRef.current) * 100 : 0;

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
        className="z-10 absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full w-9 h-9 flex items-center justify-center"
        onClick={() => go(-1)}
      >
        ‹
      </button>
      <button
        aria-label="Next image"
        className="z-10 absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full w-9 h-9 flex items-center justify-center"
        onClick={() => go(1)}
      >
        ›
      </button>

      {/* Dots */}
      <div className="absolute bottom-2 w-full flex items-center justify-center gap-2">
        {urls.map((_, i) => (
          <button
            key={i}
            aria-label={t ? t('go_to_slide', { index: i + 1 }) : `Go to slide ${i + 1}`}
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

  // Translation payload (if any)
  const [tData, setT] = useState(null);

  // UI language (sidebar stores in localStorage)
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

  // Current user (for Edit and Comments)
  const [userId, setUserId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    let alive = true;
    supabase.auth.getUser().then(async ({ data }) => {
      const uid = data?.user?.id ?? null;
      if (!alive) return;
      setUserId(uid);

      if (uid) {
        try {
          const { data: row } = await supabase
            .from('users')
            .select('id,is_admin')
            .eq('id', uid)
            .maybeSingle();
          if (row?.is_admin) setIsAdmin(true);
        } catch {}
      }
    });
    return () => { alive = false; };
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

  // Translation: prefer cached row; if missing, show base recipe as-is
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
  const ingredientsRaw = useMemo(() => {
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

  const canEdit = !!userId && (userId === (recipe?.author_id ?? recipe?.created_by ?? recipe?.user_id) || isAdmin);

  /* ----------------------------- Scaler logic ----------------------------- */
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const [showScale, setShowScale] = useState(false);
  useEffect(() => {
    if (showScale && isMobile) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [showScale, isMobile]);

  const baseFlour = useMemo(() => {
    return ingredientsRaw.reduce((sum, ing) => {
      const amt = Number(ing.amount);
      const isFlour = Boolean(ing.isFlour) || /(jauho|flour)/i.test(ing.name || '');
      return sum + (isFlour && Number.isFinite(amt) ? amt : 0);
    }, 0);
  }, [ingredientsRaw]);

  const [scale, setScale] = useState(1);
  const percent = Math.round(scale * 100);
  const targetFlour = baseFlour ? Math.round(baseFlour * scale) : null;

  const scaledIngredients = useMemo(() => {
    if (!ingredientsRaw?.length) return [];
    return ingredientsRaw.map((ing) => {
      const amt = Number(ing.amount);
      if (!Number.isFinite(amt)) return { ...ing };
      return { ...ing, amount: Math.round(amt * scale * 10) / 10 };
    });
  }, [ingredientsRaw, scale]);

  const setByPercent = (p) => {
    const val = Number(p);
    if (!Number.isFinite(val) || val <= 0) return;
    setScale(val / 100);
  };
  const setByTargetFlour = (v) => {
    const val = Number(v);
    if (!Number.isFinite(val) || val <= 0 || !baseFlour) return;
    setScale(val / baseFlour);
  };

  // ✅ Build a minimal user object for CommentsSection inside the component
  const user = userId ? { id: userId } : null;

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
      <div className="flex items-start justify-between gap-4 flex-wrap">
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

        {/* Meta pills + Like/Favorite + Edit */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
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

          <LikeFavoriteBar recipeId={id} userId={userId} t={t} />

          {canEdit && (
            <Link
              to={`/recipe/${id}/edit`}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm bg-blue-600 text-white hover:bg-blue-700"
            >
              <Pencil className="w-4 h-4" />
              {t('edit', 'Edit')}
            </Link>
          )}
        </div>
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
                  <div className="font-medium">{author?.username || author?.email}</div>
                  {description ? (
                    <div className="opacity-90 line-clamp-2 max-w-[50ch]">{description}</div>
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
          <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('ingredients')}</h2>
            <button
              onClick={() => setShowScale(true)}
              className="inline-flex items-center gap-1 text-sm px-2.5 py-1.5 rounded-md border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700"
            >
              <Scale className="w-4 h-4" />
              {t('scale_recipe','Scale')}
            </button>
          </div>

          {/* Scaler UI - desktop/tablet inline */}
          {showScale && !isMobile && (
            <div className="px-4 pt-4 pb-2 border-b border-gray-200 dark:border-slate-700 text-sm space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="opacity-80">
                  {t('total_flour','Total flour')}: <strong>{baseFlour || 0} g</strong>
                </span>
                <span className="opacity-80">
                  {t('target_flour','Target flour')}: <strong>{targetFlour ?? '—'} g</strong>
                </span>
                <span className="opacity-80">
                  {t('scale','Scale')}: <strong>{percent}%</strong>
                </span>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs opacity-80">{t('target_flour_input','Target flour (g)')}</label>
                  <input
                    type="number"
                    min="1"
                    disabled={!baseFlour}
                    value={targetFlour ?? ''}
                    onChange={(e) => setByTargetFlour(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 disabled:opacity-60"
                    placeholder={baseFlour ? String(baseFlour) : t('no_flour_marked','No flour marked')}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs opacity-80">{t('percent','Percent')}</label>
                  <input
                    type="number" min="5" step="5" value={percent}
                    onChange={(e) => setByPercent(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2"
                    placeholder="100"
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
                  {t('reset','Reset')}
                </button>
              </div>

              {!baseFlour && (
                <p className="text-xs opacity-75">
                  {t('percent_only_note','Note: No flour is marked in this recipe. Scaling uses percent only.')}
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

        {/* Comments */}
        {recipe?.id ? <CommentsSection recipeId={recipe.id} user={user} /> : null}
      </div>

      {/* Back link */}
      <div className="mt-6">
        <Link to="/browse" className="inline-block text-sm text-blue-600 dark:text-blue-400 hover:underline">
          ← {t('back_to_recipes')}
        </Link>
      </div>

      {/* Mobile scale bottom sheet */}
      {showScale && isMobile && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setShowScale(false)}
            aria-label="Close scale sheet"
          />
          <div className="fixed z-50 bottom-0 inset-x-0 rounded-t-2xl bg-white dark:bg-slate-900 shadow-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-medium flex items-center gap-2">
                <Scale className="w-4 h-4" /> {t('scale_recipe','Scale recipe')}
              </div>
              <button
                onClick={() => setShowScale(false)}
                className="px-3 py-1 rounded-md border border-gray-300 dark:border-slate-600 text-xs"
              >
                {t('done','Done')}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="opacity-80">
                {t('total_flour','Total flour')}: <strong>{baseFlour || 0} g</strong>
              </span>
              <span className="opacity-80">
                {t('target_flour','Target flour')}: <strong>{targetFlour ?? '—'} g</strong>
              </span>
              <span className="opacity-80">
                {t('scale','Scale')}: <strong>{percent}%</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-1">
                <label className="block text-xs opacity-80">{t('target_flour_input','Target flour (g)')}</label>
                <input
                  type="number"
                  min="1"
                  disabled={!baseFlour}
                  value={targetFlour ?? ''}
                  onChange={(e) => setByTargetFlour(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 disabled:opacity-60"
                  placeholder={baseFlour ? String(baseFlour) : t('no_flour_marked','No flour marked')}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs opacity-80">{t('percent','Percent')}</label>
                <input
                  type="number" min="5" step="5" value={percent}
                  onChange={(e) => setByPercent(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2"
                  placeholder="100"
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
                {t('reset','Reset')}
              </button>
            </div>

            {!baseFlour && (
              <p className="text-xs opacity-75">
                {t('percent_only_note','Note: No flour is marked in this recipe. Scaling uses percent only.')}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
