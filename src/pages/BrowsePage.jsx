// src/pages/BrowsePage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import supabase from '@/supabaseClient';
import { useTranslation } from 'react-i18next';
import SearchBar from '@/components/SearchBar';
import FiltersSheet from '@/components/FiltersSheet';
import SEO from '@/components/SEO';
import SmartImage from '@/components/SmartImage';
import useDebouncedValue from '@/hooks/useDebouncedValue';
import EmptyState from '@/components/states/EmptyState';
import ErrorState from '@/components/states/ErrorState';

const USE_FTS =
  (import.meta.env?.VITE_USE_FTS === 'true') ||
  (import.meta.env?.VITE_USE_FTS === '1');

export default function BrowsePage() {
  const { t } = useTranslation();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const qDebounced = useDebouncedValue(q, 300);

  // Filters
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    sort: 'newest',     // 'newest' | 'oldest'
    hasImage: false,    // client-side filter
    tags: [],           // array of strings
  });

  const reload = () => {
    // just bump a state that effect depends on (we’ll reuse qDebounced / filters)
    setQ((s) => s); // noop trigger; effect depends on qDebounced, not q
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');

      try {
        // Base query — view exposes username/email/tags_text/tags
        let query = supabase
          .from('browse_recipes_v')
          .select('id,title,description,cover_image,images,created_at,username,email,tags,tags_text');

        // Sort
        query = query.order('created_at', { ascending: filters.sort === 'oldest' });

        // Search (debounced)
        const needle = qDebounced.trim();
        if (needle.length >= 2) {
          if (USE_FTS) {
            query = query.textSearch('search_vec', needle, { type: 'plain', config: 'simple' });
          } else {
            const term = `%${needle}%`;
            query = query.or([
              `title.ilike.${term}`,
              `description.ilike.${term}`,
              `username.ilike.${term}`,
              `email.ilike.${term}`,
              `tags_text.ilike.${term}`
            ].join(','));
          }
        }

        // Server-side tag filter (works if tags is text[] or jsonb[])
        if (filters.tags?.length) {
          query = query.contains('tags', filters.tags);
        }

        const { data, error } = await query.limit(60);
        if (cancelled) return;

        if (error) {
          setRows([]);
          setError(error.message || 'Error fetching recipes');
        } else {
          setRows(data || []);
        }
      } catch (e) {
        if (!cancelled) {
          setRows([]);
          setError(e?.message || 'Unexpected error');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [qDebounced, filters]);

  const heroFor = (r) => {
    if (r?.cover_image) return r.cover_image;
    if (Array.isArray(r?.images) && r.images.length) {
      const first = r.images[0];
      return typeof first === 'string' ? first : first?.url;
    }
    return null;
  };

  // Unique tags available in current result set (for the sheet)
  const availableTags = useMemo(() => {
    const s = new Set();
    rows.forEach((r) => Array.isArray(r.tags) && r.tags.forEach((t) => s.add(t)));
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  // Client-side image filter
  const filtered = useMemo(() => {
    let list = rows;
    if (filters.hasImage) list = list.filter((r) => !!heroFor(r));
    return list;
  }, [rows, filters]);

  const handleSubmit = () => {
    // No-op; effect already runs on qDebounced/filters change
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* ✅ SEO */}
      <SEO
        title="Browse Recipes • Taikinalaskin"
        description="Explore community bread and pizza recipes; filter by style, hydration and tags."
        canonical="https://www.breadcalculator.online/browse"
      />

      {/* Header */}
      <div className="flex items-end justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('recipe_library', 'Recipe library')}
          </h1>
        </div>

        {/* Search */}
        <div className="w-full max-w-xl">
          <SearchBar
            value={q}
            onChange={setQ}
            onSubmit={handleSubmit}
            onClear={() => setQ('')}
            onOpenFilters={() => setFiltersOpen(true)}
            filtersOpen={filtersOpen}
            filtersControlsId="filters-sheet"
            placeholder={t('search_recipes', 'Search recipes')}
          />
        </div>
      </div>

      <p className="text-gray-600 dark:text-gray-400 mb-4">
        {t('latest_recipes', 'Latest recipes')}
      </p>

      {/* Grid / states */}
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
      ) : error ? (
        <ErrorState
          title={t('fetch_error', 'Could not load recipes')}
          detail={error}
          action={
            <button
              onClick={reload}
              className="px-3 py-1.5 rounded-md text-sm bg-blue-600 text-white hover:bg-blue-500"
            >
              {t('retry', 'Retry')}
            </button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState title={t('no_recipes_found', 'No recipes found.')}>
          {t('try_adjusting_filters', 'Try adjusting filters or clearing the search.')}
        </EmptyState>
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
                    <SmartImage
                      src={hero}
                      alt={r.title || 'Recipe'}
                      className="w-full h-full object-cover"
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

                  {/* Tags */}
                  {Array.isArray(r.tags) && r.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {r.tags.slice(0, 6).map((tag) => (
                        <button
                          key={tag}
                          className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700"
                          onClick={(e) => {
                            e.preventDefault();
                            setQ(tag);
                          }}
                          title={`#${tag}`}
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Filters sheet */}
      <FiltersSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        onApply={(f) => {
          setFilters(f);
          setFiltersOpen(false);
        }}
        initial={filters}
        availableTags={availableTags}
      />
    </div>
  );
}
