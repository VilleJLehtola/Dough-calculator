// /src/pages/YourRecipesPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Plus } from 'lucide-react';
import supabase from '@/supabaseClient';

const PAGE_SIZE = 24;

function RecipeCard({ r }) {
  const cover =
    r.cover_image ||
    (Array.isArray(r.images) && r.images.length ? r.images[0] : null);

  return (
    <Link
      to={`/recipe/${r.id}`}
      className="group rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-md transition"
    >
      <div className="aspect-video bg-gray-100 dark:bg-slate-700 overflow-hidden">
        {cover ? (
          <img
            src={cover}
            alt={r.title || 'Recipe'}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
            (no image)
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="line-clamp-1 font-medium text-gray-900 dark:text-white">
          {r.title || '—'}
        </div>
        {r.description ? (
          <div className="line-clamp-1 text-sm text-gray-600 dark:text-gray-300">
            {r.description}
          </div>
        ) : null}
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 animate-pulse">
      <div className="aspect-video bg-gray-200/70 dark:bg-slate-700" />
      <div className="p-3 space-y-2">
        <div className="h-4 w-3/4 bg-gray-200 dark:bg-slate-600 rounded" />
        <div className="h-3 w-1/2 bg-gray-200 dark:bg-slate-600 rounded" />
      </div>
    </div>
  );
}

export default function YourRecipesPage() {
  const { t } = useTranslation();

  const [user, setUser] = useState(null);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [recipes, setRecipes] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState('');

  // load current user
  useEffect(() => {
    let alive = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!alive) return;
      setUser(data?.user || null);
    });
    return () => {
      alive = false;
    };
  }, []);

  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const filters = useMemo(() => ({ q: q.trim() }), [q]);

  const fetchPage = async (reset = false) => {
    if (!user?.id) return;

    setLoading(true);
    setError('');

    try {
      // Base query: only my recipes
      let query = supabase
        .from('recipes')
        .select('id,title,description,images,cover_image,author_id,created_at', { count: 'exact' })
        .eq('author_id', user.id)
        .order('created_at', { ascending: false })
        .range(from, to);

      // Search: try FTS if available, otherwise ILIKE fallback
      if (filters.q) {
        const term = filters.q;
        // Try server-side text search (if you created search_vec)
        try {
          // NOTE: textSearch throws if column missing; we just catch and fallback
          query = query.textSearch('search_vec', term);
        } catch {
          query = query.or(
            [
              `title.ilike.%${term}%`,
              `description.ilike.%${term}%`,
            ].join(',')
          );
        }
      }

      const { data, error: err, count } = await query;
      if (err) throw err;

      setRecipes((prev) => (reset ? data || [] : [...prev, ...(data || [])]));
      const total = typeof count === 'number' ? count : (data?.length || 0);
      setHasMore(from + (data?.length || 0) < total);
    } catch (e) {
      console.error(e);
      setError(e.message || 'Fetch failed');
    } finally {
      setLoading(false);
    }
  };

  // initial + whenever user/page/search changes
  useEffect(() => {
    if (!user?.id) return;
    fetchPage(page === 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, page, filters.q]);

  const onSubmit = (e) => {
    e.preventDefault();
    // reset pagination on new search
    setRecipes([]);
    setPage(0);
    fetchPage(true);
  };

  if (user === null) {
    // Not loaded yet
    return (
      <div className="max-w-5xl mx-auto p-4 sm:p-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-center">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
          {t('login', 'Login')} {t('to_continue', 'to continue')}
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          {t('your_recipes_requires_login', 'Viewing your recipes requires a login.')}
        </p>
        <div className="mt-4">
          <Link
            to="/login"
            className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            {t('login', 'Login')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('your_recipes', 'Your recipes')}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {t('your_recipes_subtitle', 'Only recipes you have created')}
          </p>
        </div>

        <Link
          to="/create"
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          {t('create_recipe', 'Create recipe')}
        </Link>
      </div>

      {/* Search bar */}
      <form onSubmit={onSubmit} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('search_recipes', 'Search your recipes…')}
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
        />
      </form>

      {/* Content */}
      {error && (
        <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
      )}

      {loading && page === 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : recipes.length === 0 ? (
        <div className="rounded-xl border border-gray-200 dark:border-slate-700 p-6 text-center bg-white dark:bg-slate-800">
          <div className="text-lg font-medium text-gray-900 dark:text-white mb-1">
            {t('no_recipes_found', 'No recipes found.')}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {filters.q
              ? t('try_clearing_search', 'Try clearing your search, or create a new recipe.')
              : t('you_have_no_recipes', "You haven't created any recipes yet.")}
          </div>
          <div className="mt-4">
            <Link
              to="/create"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              {t('create_recipe', 'Create recipe')}
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {recipes.map((r) => (
              <RecipeCard key={r.id} r={r} />
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center">
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={loading}
                className="mt-4 px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-800 dark:text-gray-200 disabled:opacity-60"
              >
                {loading ? t('loading', 'Loading…') : t('load_more', 'Load more')}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
