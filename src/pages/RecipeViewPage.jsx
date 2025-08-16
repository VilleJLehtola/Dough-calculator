// /src/pages/RecipeViewPage.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import supabase from '@/supabaseClient';
import { Clock, Users, ChefHat, Pencil, Scale } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LikeFavoriteBar from '@/components/LikeFavoriteBar';
import ShareButton from '@/components/ShareButton';
import CommentsSection from '@/components/CommentsSection';
import { track } from '@/analytics';

const BUCKET = 'recipe-images';

/* ---------------------- Smooth, touch-enabled carousel ---------------------- */
function HeroCarousel({ items = [], title = '', overlay = null, t }) {
  const urls = (items || [])
    .map((im) => (typeof im === 'string' ? im : im?.url))
    .filter(Boolean);

  const containerRef = useRef(null);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let startX = 0;
    let current = 0;

    const onStart = (e) => {
      startX = (e.touches?.[0]?.clientX ?? e.clientX) || 0;
      current = startX;
    };
    const onMove = (e) => {
      current = (e.touches?.[0]?.clientX ?? e.clientX) || current;
    };
    const onEnd = () => {
      const dx = current - startX;
      if (dx > 50) setIdx((i) => Math.max(0, i - 1));
      if (dx < -50) setIdx((i) => Math.min(urls.length - 1, i + 1));
    };

    el.addEventListener('mousedown', onStart);
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseup', onEnd);
    el.addEventListener('mouseleave', onEnd);

    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: true });
    el.addEventListener('touchend', onEnd);

    return () => {
      el.removeEventListener('mousedown', onStart);
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseup', onEnd);
      el.removeEventListener('mouseleave', onEnd);

      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onEnd);
    };
  }, [urls.length]);

  if (!urls.length) return null;

  return (
    <div className="relative rounded-2xl overflow-hidden" ref={containerRef}>
      <div className="relative w-full h-64 md:h-80">
        {urls.map((src, i) => (
          <img
            key={src}
            src={src}
            alt={title || t('recipe_image', 'Recipe image')}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${i === idx ? 'opacity-100' : 'opacity-0'}`}
            loading="lazy"
            decoding="async"
          />
        ))}
        {overlay}
      </div>
      <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-1">
        {urls.map((_, i) => (
          <button
            key={i}
            className={`w-2 h-2 rounded-full ${i === idx ? 'bg-white' : 'bg-white/50'}`}
            onClick={() => setIdx(i)}
            aria-label={`Go to image ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------ Supabase utils ------------------------------ */
async function getPublicUrl(path) {
  if (!path) return null;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data?.publicUrl ?? null;
}

async function fetchRecipe(id) {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

async function fetchAuthor(userId) {
  if (!userId) return null;
  const { data, error } = await supabase
    .from('users')
    .select('username, full_name, avatar_url')
    .eq('id', userId)
    .single();
  if (error) return null;
  return data;
}

async function fetchImages(id) {
  const { data, error } = await supabase
    .from('recipe_images')
    .select('url, path')
    .eq('recipe_id', id)
    .order('created_at', { ascending: true });
  if (error) return [];
  const mapped = (data || []).map(({ url, path }) => ({ url, path }));
  const withUrls = await Promise.all(
    mapped.map(async (im) => {
      if (im.url) return im;
      const publicUrl = await getPublicUrl(im.path);
      return { ...im, url: publicUrl, path };
    })
  );
  return withUrls.filter((x) => !!x.url);
}

/* ---------------------------------- Page ----------------------------------- */
export default function RecipeViewPage() {
  const { t } = useTranslation();
  const { id } = useParams();

  // Recipe + author + images
  const [recipe, setRecipe] = useState(null);
  const [author, setAuthor] = useState(null);
  const [images, setImages] = useState([]); // strings or { url }

  // ---- Analytics: Recipe Viewed ----
  useEffect(() => {
    if (!recipe?.id) return;
    track('Recipe Viewed', {
      recipe_id: recipe.id,
      recipe_slug: recipe.slug || '',
      lang: localStorage.getItem('lang') || 'auto',
    });
  }, [recipe?.id, recipe?.slug]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const r = await fetchRecipe(id);
        if (cancelled) return;

        setRecipe(r);
        const [a, imgs] = await Promise.all([
          fetchAuthor(r.user_id || r.author_id),
          fetchImages(id),
        ]);
        if (cancelled) return;

        setAuthor(a);
        setImages(imgs);
      } catch (e) {
        if (!cancelled) setErr(e.message || 'Error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const title = recipe?.title || recipe?.name || t('recipe','Recipe');
  const description =
    (recipe?.description && String(recipe.description).slice(0, 180)) ||
    t('recipe_description_fallback','Recipe details and instructions');

  const userId = recipe?.user_id || recipe?.author_id || null;
  const canEdit = !!userId && (userId === (recipe?.author_id ?? recipe?.created_by ?? recipe?.user_id) || false);

  /* ------------------------------- Ingredients ------------------------------ */
  const ingredients = useMemo(() => {
    const base = recipe?.ingredients_json || recipe?.ingredients || [];
    return Array.isArray(base) ? base : [];
  }, [recipe]);

  const steps = useMemo(() => {
    const base = recipe?.instructions_json || recipe?.instructions || [];
    return Array.isArray(base) ? base : [];
  }, [recipe]);

  /* ---------------------------------- Render -------------------------------- */
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <div className="animate-pulse h-6 w-40 bg-gray-300 dark:bg-gray-700 rounded mb-3" />
        <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
      </div>
    );
  }

  if (err || !recipe) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <p className="text-red-600 dark:text-red-400">{t('recipe_not_found','Recipe not found')}</p>
      </div>
    );
  }

  const overlay = (
    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-black/0" />
  );

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <div className="mb-4 flex flex-col gap-3">
        <h1 className="text-2xl md:text-3xl font-semibold">{title}</h1>

        <HeroCarousel items={images} title={title} overlay={overlay} t={t} />

        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
          {recipe?.total_time && (
            <span className="inline-flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {recipe.total_time}
            </span>
          )}
          {recipe?.active_time && (
            <span className="inline-flex items-center gap-1">
              <ChefHat className="w-4 h-4" />
              {recipe.active_time}
            </span>
          )}
          {recipe?.servings != null && (
            <span className="inline-flex items-center gap-1">
              <Users className="w-4 h-4" />
              {recipe.servings}
            </span>
          )}
          {recipe?.hydration && (
            <span className="inline-flex items-center gap-1">
              <Scale className="w-4 h-4" />
              {recipe.hydration}%
            </span>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          {description && (
            <p className="text-gray-800 dark:text-gray-200 mb-4">{description}</p>
          )}

          <h2 className="font-semibold mb-2">{t('ingredients','Ingredients')}</h2>
          <ul className="list-disc pl-5 space-y-1 mb-6">
            {ingredients.map((row, i) => (
              <li key={i}>{row?.text || row}</li>
            ))}
          </ul>

          <h2 className="font-semibold mb-2">{t('instructions','Instructions')}</h2>
          <ol className="list-decimal pl-5 space-y-2">
            {steps.map((s, i) => (
              <li key={i}>{s?.text || s}</li>
            ))}
          </ol>
        </div>

        <aside className="space-y-4">
          <LikeFavoriteBar recipeId={id} userId={userId} t={t} />

          {/* Share button with analytics */}
          <div
            onClick={() =>
              track('Share Clicked', { method: 'unknown', url: window.location.href })
            }
            role="presentation"
          >
            <ShareButton
              title={title}
              text={description}
              onShare={(method) =>
                track('Share Clicked', { method, url: window.location.href })
              }
            />
          </div>

          {canEdit && (
            <Link
              to={`/recipe/${id}/edit`}
              className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <Pencil className="w-4 h-4" />
              {t('edit_recipe','Edit recipe')}
            </Link>
          )}
        </aside>
      </div>

      <div className="mt-10">
        <CommentsSection recipeId={id} />
      </div>
    </div>
  );
}
