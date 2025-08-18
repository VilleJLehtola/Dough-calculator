// src/pages/FrontPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import supabase from '@/supabaseClient';
import { useTranslation } from 'react-i18next';
import SEO from '@/components/SEO';
import SmartImage from '@/components/SmartImage';
import EmptyState from '@/components/states/EmptyState';
import ErrorState from '@/components/states/ErrorState';

function Card({ r }) {
  const hero =
    r?.cover_image ||
    (Array.isArray(r?.images) && (typeof r.images[0] === 'string' ? r.images[0] : r.images[0]?.url)) ||
    null;

  return (
    <Link
      to={`/recipe/${r.id}`}
      className="rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow transition"
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
      </div>
    </Link>
  );
}

export default function FrontPage() {
  const { t } = useTranslation();

  const [adminRows, setAdminRows] = useState([]);
  const [likedRows, setLikedRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  // ---- helpers ----
  async function fetchLatestPublic(limit = 8) {
    const { data, error } = await supabase
      .from('recipes')
      .select('id,title,description,cover_image,images,created_at,is_public')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  }

  async function fetchLatestFromAdmins(limit = 8) {
    // inner join to users with is_admin = true
    const { data, error } = await supabase
      .from('recipes')
      .select('id,title,description,cover_image,images,created_at,is_public,users!inner(id,is_admin)')
      .eq('is_public', true)
      .eq('users.is_admin', true)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data || []).map((r) => ({ ...r }));
  }

  async function fetchMostLiked(limit = 8) {
    // Try to use likes_count if available
    let { data, error } = await supabase
      .from('recipes')
      .select('id,title,description,cover_image,images,created_at,is_public,likes_count')
      .eq('is_public', true)
      .order('likes_count', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      // fallback to browse view or latest public
      try {
        const fallback = await fetchLatestPublic(limit);
        return fallback;
      } catch {
        throw error;
      }
    }

    // If likes_count column doesn’t exist or all zeros → fallback to latest public
    const allZero = !data || data.every((r) => !r?.likes_count);
    if (!data || data.length === 0 || allZero) {
      const fallback = await fetchLatestPublic(limit);
      return fallback;
    }
    return data;
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr('');
      try {
        // Run in parallel
        const [a, m] = await Promise.allSettled([
          fetchLatestFromAdmins(8),
          fetchMostLiked(8),
        ]);

        if (!alive) return;

        // Admin list (fallback if empty)
        if (a.status === 'fulfilled' && a.value?.length) {
          setAdminRows(a.value);
        } else {
          const fallback = await fetchLatestPublic(8);
          setAdminRows(fallback);
        }

        // Most liked (already self-falls back)
        if (m.status === 'fulfilled') {
          setLikedRows(m.value || []);
        } else {
          const fallback = await fetchLatestPublic(8);
          setLikedRows(fallback);
        }
      } catch (e) {
        if (!alive) return;
        setErr(e?.message || 'Failed to load');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const isEmptyAdmins = adminRows.length === 0;
  const isEmptyLiked = likedRows.length === 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <SEO
        title="Everything Dough • Home"
        description="Fresh bread & pizza recipes from the team and the community."
        canonical="https://www.breadcalculator.online/"
      />

      {/* Removed the old hero entirely */}

      {/* Admin section */}
      <div className="mt-4 mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-400 dark:text-gray-300 uppercase tracking-wide">
          {t('latest_from_team', 'Latest from the team')}
        </h2>
        <Link to="/browse" className="text-xs text-blue-500 hover:underline">
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
      ) : isEmptyAdmins ? (
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
        <h2 className="text-sm font-semibold text-gray-400 dark:text-gray-300 uppercase tracking-wide">
          {t('most_liked', 'Most liked')}
        </h2>
        <Link to="/browse" className="text-xs text-blue-500 hover:underline">
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
      ) : isEmptyLiked ? (
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
