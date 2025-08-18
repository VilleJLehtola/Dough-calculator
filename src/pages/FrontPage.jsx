// src/pages/FrontPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import supabase from '@/supabaseClient';
import SEO from '@/components/SEO';
import SmartImage from '@/components/SmartImage';

const RAW = import.meta.env?.VITE_ADMIN_EMAILS;
const ADMIN_EMAILS = (RAW ? RAW.split(',') : ['ville.j.lehtola@gmail.com'])
  .map((s) => s.trim())
  .filter(Boolean);

function heroFor(r) {
  if (r?.cover_image) return r.cover_image;
  if (Array.isArray(r?.images) && r.images.length) {
    const first = r.images[0];
    return typeof first === 'string' ? first : first?.url;
  }
  return null;
}

export default function FrontPage() {
  const { t } = useTranslation();

  const [latestAdmin, setLatestAdmin] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loadingTop, setLoadingTop] = useState(true);
  const [loadingBottom, setLoadingBottom] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingTop(true);
      try {
        let q = supabase
          .from('browse_recipes_v')
          .select('id,title,description,cover_image,images,created_at,username,email,tags')
          .order('created_at', { ascending: false })
          .limit(12);

        if (ADMIN_EMAILS.length) q = q.in('email', ADMIN_EMAILS);

        const { data, error } = await q;
        if (!cancelled) setLatestAdmin(error ? [] : data || []);
      } finally {
        if (!cancelled) setLoadingTop(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingBottom(true);
      try {
        const { data, error } = await supabase
          .from('recipes')
          .select('id,title,description,cover_image,images,created_at,recipe_likes(count)')
          .order('count', { foreignTable: 'recipe_likes', ascending: false })
          .limit(12);

        if (!cancelled) setTrending(error ? [] : data || []);
      } finally {
        if (!cancelled) setLoadingBottom(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const Grid = (items, loading, type) => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={`${type}-s-${i}`} className="rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <div className="w-full aspect-[16/9] bg-gray-100 dark:bg-slate-900 animate-pulse" />
              <div className="p-3 space-y-2">
                <div className="h-5 w-2/3 bg-gray-100 dark:bg-slate-700 rounded animate-pulse" />
                <div className="h-4 w-4/5 bg-gray-100 dark:bg-slate-700 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      );
    }
    if (!items?.length) {
      return <div className="text-gray-600 dark:text-gray-300">{t('no_recipes_found','No recipes found.')}</div>;
    }
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {items.map((r) => {
          const hero = heroFor(r);
          const count = Array.isArray(r?.recipe_likes) && r.recipe_likes[0]?.count != null ? r.recipe_likes[0].count : null;
          return (
            <Link
              key={r.id}
              to={`/recipe/${r.id}`}
              className="rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow transition"
            >
              <div className="w-full aspect-[16/9] bg-gray-100 dark:bg-slate-900">
                {hero ? (
                  <SmartImage
                    src={hero}
                    alt={r.title || 'Recipe'}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                    sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  />
                ) : null}
              </div>
              <div className="p-3">
                <div className="font-semibold text-gray-900 dark:text-white line-clamp-1">{r.title}</div>
                {r.description && <div className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{r.description}</div>}
                {count !== null && <div className="mt-2 text-xs text-gray-600 dark:text-gray-300">❤️ {count}</div>}
                {Array.isArray(r.tags) && r.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {r.tags.slice(0, 6).map((tag) => (
                      <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <SEO
        title="Everything Dough — Taikinalaskin"
        description="Sourdough, bread and pizza recipes from the community. Explore latest recipes from the team and see what’s most liked."
        canonical="https://www.breadcalculator.online/"
      />

      {/* Latest from admins */}
      <div className="mb-8">
        <div className="flex items-end justify-between mb-2">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('latest_from_team','Latest from the team')}</h2>
          <Link to="/browse" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">{t('browse_all','Browse all')}</Link>
        </div>
        {Grid(latestAdmin, loadingTop, 'top')}
      </div>

      {/* Most liked */}
      <div className="mb-8">
        <div className="flex items-end justify-between mb-2">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('most_liked','Most liked')}</h2>
          <Link to="/browse" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">{t('browse_all','Browse all')}</Link>
        </div>
        {Grid(trending, loadingBottom, 'bottom')}
      </div>
    </div>
  );
}
