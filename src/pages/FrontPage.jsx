// src/pages/FrontPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import supabase from '@/supabaseClient';
import SEO from '@/components/SEO';
import SmartImage from '@/components/SmartImage';
import ErrorState from '@/components/states/ErrorState';

function cardImage(r) {
  if (r?.cover_image) return r.cover_image;
  if (Array.isArray(r?.images) && r.images.length) {
    const first = r.images[0];
    return typeof first === 'string' ? first : first?.url;
  }
  return null;
}

export default function FrontPage() {
  const { t } = useTranslation();

  const [adminRecipes, setAdminRecipes] = useState([]);
  const [mostLiked, setMostLiked] = useState([]);

  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [loadingLiked, setLoadingLiked] = useState(true);
  const [errAdmins, setErrAdmins] = useState('');
  const [errLiked, setErrLiked] = useState('');

  // ================ LATEST FROM THE TEAM =================
  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoadingAdmins(true);
      setErrAdmins('');
      try {
        // Try to get admin IDs. Some RLS setups return an empty list without error.
        const { data: admins, error: adminsErr } = await supabase
          .from('users')
          .select('id')
          .eq('is_admin', true);

        if (adminsErr) throw adminsErr;

        const adminIds = (admins || []).map(a => a.id);

        if (adminIds.length) {
          const { data: recs, error: recErr } = await supabase
            .from('recipes')
            .select('id,title,description,cover_image,images,created_at,tags')
            .in('author_id', adminIds)
            .order('created_at', { ascending: false })
            .limit(8);
          if (recErr) throw recErr;
          if (!cancel) setAdminRecipes(recs || []);
        } else {
          // Fallback: latest recipes overall so the section isn’t empty
          console.warn('[front] Admin list empty (RLS or none). Falling back to latest recipes.');
          const { data: recs, error: recErr } = await supabase
            .from('recipes')
            .select('id,title,description,cover_image,images,created_at,tags')
            .order('created_at', { ascending: false })
            .limit(8);
          if (recErr) throw recErr;
          if (!cancel) setAdminRecipes(recs || []);
        }
      } catch (e) {
        if (!cancel) setErrAdmins(e?.message || 'Failed to load admin recipes');
      } finally {
        if (!cancel) setLoadingAdmins(false);
      }
    })();
    return () => { cancel = true; };
  }, []);

  // ================ MOST LIKED =================
  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoadingLiked(true);
      setErrLiked('');
      try {
        const { data: likesRows, error: likesErr } = await supabase
          .from('recipe_likes')
          .select('recipe_id')     // if RLS blocks, we’ll fallback below
          .limit(10000);

        if (likesErr) throw likesErr;

        let list = [];
        const counts = new Map();
        (likesRows || []).forEach(row => {
          const id = row.recipe_id;
          if (!id) return;
          counts.set(id, (counts.get(id) || 0) + 1);
        });

        const top = [...counts.entries()].sort((a,b) => b[1]-a[1]).slice(0, 8);
        if (top.length) {
          const ids = top.map(([id]) => id);
          const countById = Object.fromEntries(top);
          const { data: recs, error: recErr } = await supabase
            .from('recipes')
            .select('id,title,description,cover_image,images,created_at,tags')
            .in('id', ids);
          if (recErr) throw recErr;
          list = (recs || [])
            .map(r => ({ ...r, likeCount: countById[r.id] || 0 }))
            .sort((a,b) => (countById[b.id]||0) - (countById[a.id]||0));
        }

        // Fallback if no likes / blocked
        if (!list.length) {
          console.warn('[front] Likes empty (no data or RLS). Falling back to recent recipes as “Most liked”.');
          const { data: recs, error: recErr } = await supabase
            .from('recipes')
            .select('id,title,description,cover_image,images,created_at,tags')
            .order('created_at', { ascending: false })
            .limit(8);
          if (recErr) throw recErr;
          list = (recs || []).map(r => ({ ...r, likeCount: 0 }));
        }

        if (!cancel) setMostLiked(list);
      } catch (e) {
        if (!cancel) setErrLiked(e?.message || 'Failed to load most liked');
      } finally {
        if (!cancel) setLoadingLiked(false);
      }
    })();
    return () => { cancel = true; };
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <SEO
        title="Everything Dough — Home"
        description="Latest admin recipes and the most liked bakes from the community."
        canonical="https://www.breadcalculator.online/"
      />

      {/* LATEST FROM THE TEAM */}
      <section className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-semibold tracking-wide text-gray-600 dark:text-gray-300 uppercase">
            {t('latest_from_the_team', 'Latest from the team')}
          </h2>
          <Link to="/browse" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
            {t('browse_all', 'Browse all')}
          </Link>
        </div>

        {loadingAdmins ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={`la${i}`} className="rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700">
                <div className="aspect-[16/9] bg-gray-100 dark:bg-slate-800 animate-pulse" />
                <div className="h-14 bg-gray-50 dark:bg-slate-800 animate-pulse" />
              </div>
            ))}
          </div>
        ) : errAdmins ? (
          <ErrorState title={t('fetch_error','Could not load recipes')} detail={errAdmins} />
        ) : adminRecipes.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('no_recent_admin_recipes', 'No recent admin recipes.')}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {adminRecipes.map((r) => (
              <Link
                to={`/recipe/${r.id}`}
                key={r.id}
                className="rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow transition"
              >
                <div className="w-full aspect-[16/9] bg-gray-100 dark:bg-slate-900">
                  {cardImage(r) ? (
                    <SmartImage
                      src={cardImage(r)}
                      alt={r.title || 'Recipe'}
                      className="w-full h-full object-cover"
                      sizes="(min-width:1280px) 22vw, (min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw"
                    />
                  ) : null}
                </div>
                <div className="p-3">
                  <div className="font-semibold text-gray-900 dark:text-white line-clamp-1">{r.title}</div>
                  {r.description && (
                    <div className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{r.description}</div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* MOST LIKED */}
      <section className="mt-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-semibold tracking-wide text-gray-600 dark:text-gray-300 uppercase">
            {t('most_liked', 'Most liked')}
          </h2>
          <Link to="/browse" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
            {t('browse_all', 'Browse all')}
          </Link>
        </div>

        {loadingLiked ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={`ml${i}`} className="rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700">
                <div className="aspect-[16/9] bg-gray-100 dark:bg-slate-800 animate-pulse" />
                <div className="h-14 bg-gray-50 dark:bg-slate-800 animate-pulse" />
              </div>
            ))}
          </div>
        ) : errLiked ? (
          <ErrorState title={t('fetch_error','Could not load recipes')} detail={errLiked} />
        ) : mostLiked.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('no_most_liked_yet', 'No most liked recipes yet.')}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {mostLiked.map((r) => (
              <Link
                to={`/recipe/${r.id}`}
                key={`liked-${r.id}`}
                className="rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow transition"
              >
                <div className="w-full aspect-[16/9] bg-gray-100 dark:bg-slate-900">
                  {cardImage(r) ? (
                    <SmartImage
                      src={cardImage(r)}
                      alt={r.title || 'Recipe'}
                      className="w-full h-full object-cover"
                      sizes="(min-width:1280px) 22vw, (min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw"
                    />
                  ) : null}
                </div>
                <div className="p-3">
                  <div className="font-semibold text-gray-900 dark:text-white line-clamp-1">{r.title}</div>
                  <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">❤️ {r.likeCount ?? 0}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
