// src/pages/FrontPage.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import supabase from '@/supabaseClient';
import { useTranslation } from 'react-i18next';
import SEO from '@/components/SEO';
import SmartImage from '@/components/SmartImage';
import EmptyState from '@/components/states/EmptyState';
import ErrorState from '@/components/states/ErrorState';
import { Heart } from 'lucide-react';

/* ---------------- Card ---------------- */
function Card({ r }) {
  const hero =
    r?.cover_image ||
    (Array.isArray(r?.images) && (typeof r.images[0] === 'string' ? r.images[0] : r.images[0]?.url)) ||
    null;

  return (
    <Link
      to={`/recipe/${r.id}`}
      className="rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow transition"
      aria-label={r.title || 'Recipe'}
    >
      <div className="w-full aspect-[16/9] bg-gray-100 dark:bg-slate-900">
        {hero ? (
          <SmartImage
            src={hero}
            alt={r.title || 'Recipe'}
            className="w-full h-full object-cover"
            sizes="(min-width:1280px) 22vw, (min-width:1024px) 28vw, (min-width:640px) 45vw, 100vw"
          />
        ) : null}
      </div>
      <div className="p-3">
        <div className="font-semibold text-gray-900 dark:text-white line-clamp-1">
          {r.title || 'Recipe'}
        </div>
        {r.description ? (
          <div className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
            {r.description}
          </div>
        ) : null}

        {Number.isFinite(r.likes_count) && (
          <div className="mt-2 inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200">
            <Heart className="w-3.5 h-3.5 fill-current text-rose-600" />
            <span>{r.likes_count}</span>
          </div>
        )}
      </div>
    </Link>
  );
}

/* ---------------- Helpers ---------------- */
const SELECT_FIELDS = 'id,title,description,cover_image,images,created_at,author_id,created_by,user_id';

/** Fetch recipes and merge like counts */
async function fetchWithLikes(baseQuery) {
  const { data: recipes, error } = await baseQuery;
  if (error) throw error;
  if (!recipes?.length) return [];

  const ids = recipes.map((r) => r.id);
  const { data: likesData, error: likesError } = await supabase
    .from('recipe_likes')
    .select('recipe_id')
    .in('recipe_id', ids);

  if (likesError) {
    console.error('Likes fetch error', likesError);
    return recipes.map((r) => ({ ...r, likes_count: 0 }));
  }

  const counts = {};
  likesData?.forEach((row) => {
    counts[row.recipe_id] = (counts[row.recipe_id] || 0) + 1;
  });

  return recipes.map((r) => ({
    ...r,
    likes_count: counts[r.id] || 0,
  }));
}

/** Latest from admins: find admin user IDs first, then OR across author columns */
async function fetchLatestFromAdmins(limit = 4) {
  // 1) fetch admin ids
  const { data: admins, error: adminsErr } = await supabase
    .from('users')
    .select('id')
    .eq('is_admin', true)
    .limit(200);

  if (adminsErr) {
    console.error('Admin user fetch failed', adminsErr);
    return [];
  }
  const adminIds = (admins || []).map((u) => u.id);
  if (adminIds.length === 0) return [];

  // 2) recipes where any author column is in adminIds
  const idList = `(${adminIds.join(',')})`;
  const orFilter = [
    `author_id.in.${idList}`,
    `created_by.in.${idList}`,
    `user_id.in.${idList}`,
  ].join(',');

  const base = supabase
    .from('recipes')
    .select(SELECT_FIELDS)
    .or(orFilter)
    .order('created_at', { ascending: false })
    .limit(limit);

  try {
    const rows = await fetchWithLikes(base);
    return rows;
  } catch (e) {
    console.error('Admin recipes fetch failed', e);
    return [];
  }
}

/** Most liked recipes (client-side sort by counted likes) */
async function fetchMostLiked(limit = 4) {
  try {
    const base = supabase
      .from('recipes')
      .select(SELECT_FIELDS)
      .order('created_at', { ascending: false })
      .limit(limit * 3); // grab extra, then sort by likes

    const rows = await fetchWithLikes(base);
    return rows.sort((a, b) => b.likes_count - a.likes_count).slice(0, limit);
  } catch (e) {
    console.error('Most liked fetch failed', e);
    return [];
  }
}

/* ---------------- Page ---------------- */
export default function FrontPage() {
  const { t } = useTranslation();
  const [adminRows, setAdminRows] = useState([]);
  const [likedRows, setLikedRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr('');
      try {
        const [admins, liked] = await Promise.all([
          fetchLatestFromAdmins(4),
          fetchMostLiked(4),
        ]);
        if (!alive) return;
        setAdminRows(admins);
        setLikedRows(liked);
      } catch (e) {
        if (!alive) return;
        setErr(e?.message || 'Failed to load recipes');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <SEO
        title="Everything Dough • Home"
        description="Fresh recipes from the team and the community."
        canonical="https://www.breadcalculator.online/"
      />

      {/* Latest from the team */}
      <div className="mt-4 mb-2 flex items-center justify-between">
        <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wide">
          {t('latest_from_team', 'Latest from the team')}
        </h2>
        <Link to="/browse" className="text-xs text-blue-600 hover:underline">
          {t('browse_all', 'Browse all')}
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={`s-a-${i}`}
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
      ) : err ? (
        <ErrorState title={t('fetch_error', 'Could not load recipes')} detail={err} />
      ) : adminRows.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t('no_recent_admin_recipes', 'No recent admin recipes.')}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {adminRows.map((r) => (
            <Card key={`a-${r.id}`} r={r} />
          ))}
        </div>
      )}

      {/* Most liked */}
      <div className="mt-8 mb-2 flex items-center justify-between">
        <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wide">
          {t('most_liked', 'Most liked')}
        </h2>
        <Link to="/browse" className="text-xs text-blue-600 hover:underline">
          {t('browse_all', 'Browse all')}
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={`s-m-${i}`}
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
      ) : likedRows.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t('no_most_liked_yet', 'No most liked recipes yet.')}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {likedRows.map((r) => (
            <Card key={`m-${r.id}`} r={r} />
          ))}
        </div>
      )}
    </div>
  );
}
