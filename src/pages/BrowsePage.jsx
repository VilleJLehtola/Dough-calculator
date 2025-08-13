// src/pages/BrowsePage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import supabase from '@/supabaseClient';
import { useTranslation } from 'react-i18next';

export default function BrowsePage() {
  const { t } = useTranslation();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  // build query; when q is short, fetch latest; when long enough, server-filter
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);

      try {
        let query = supabase
          .from('recipes')
          .select('id,title,description,cover_image,images,created_at')
          .order('created_at', { ascending: false });

        if (q.trim().length >= 2) {
          const term = `%${q.trim()}%`;
          query = query.or(`title.ilike.${term},description.ilike.${term}`);
        }

        const { data, error } = await query.limit(60);
        if (cancelled) return;

        if (error) {
          console.warn('browse fetch error', error);
          setRows([]);
        } else {
          setRows(data || []);
        }
      } catch (e) {
        if (!cancelled) {
          console.warn('browse unexpected error', e);
          setRows([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [q]);

  const filtered = useMemo(() => {
    if (q.trim().length < 2) return rows;
    const needle = q.trim().toLowerCase();
    return rows.filter((r) =>
      (r.title || '').toLowerCase().includes(needle) ||
      (r.description || '').toLowerCase().includes(needle)
    );
  }, [rows, q]);

  const heroFor = (r) => {
    if (r?.cover_image) return r.cover_image;
    if (Array.isArray(r?.images) && r.images.length) {
      const first = r.images[0];
      return typeof first === 'string' ? first : first?.url;
    }
    return null;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('recipe_library', 'Recipe library')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('latest_recipes', 'Latest recipes')}
          </p>
        </div>

        {/* Search */}
        <div className="w-full max-w-md">
          <label htmlFor="recipeSearch" className="sr-only">
            {t('search_recipes', 'Search recipes')}
          </label>
          <div className="flex items-center rounded-xl border bg-white text-gray-900 border-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 focus-within:ring-2 focus-within:ring-blue-500">
            <input
              id="recipeSearch"
              type="text"
              placeholder={t('search_recipes', 'Search recipes')}
              className="w-full bg-transparent px-3 py-2.5 outline-none placeholder-gray-400 dark:placeholder-gray-500"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ('')}
                className="px-3 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                {t('clear', 'Clear')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {[...Array(8)].map((_, i) => (
            <div
              key={`s-${i}`}
              className="rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            >
              <div className="w-full aspect-[16/9] bg-gray-100 dark:bg-slate-900 animate-pulse" />
              <div className="p-3 space-y-2">
                <div className="h-5 w-2/3 bg-gray-100 dark:bg-slate-700 rounded animate-pulse" />
                <div className="h-4 w-4/5 bg-gray-100 dark:bg-slate-700 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-gray-600 dark:text-gray-300">
          {t('no_recipes_found', 'No recipes found.')}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {filtered.map((r) => {
            const hero = heroFor(r);
            return (
              <Link
                key={r.id}
                to={`/recipe/${r.id}`}
                className="rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow transition"
              >
                <div className="w-full aspect-[16/9] bg-gray-100 dark:bg-slate-900">
                  {hero ? (
                    <img
                      src={hero}
                      alt={r.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : null}
                </div>
                <div className="p-3">
                  <div className="font-semibold text-gray-900 dark:text-white line-clamp-1">
                    {r.title}
                  </div>
                  {r.description ? (
                    <div className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                      {r.description}
                    </div>
                  ) : null}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
