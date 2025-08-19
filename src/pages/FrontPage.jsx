// src/pages/FrontPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import supabase from '@/supabaseClient';
import SEO from '@/components/SEO';
import SmartImage from '@/components/SmartImage';

function heroOf(r) {
  if (r?.cover_image) return r.cover_image;
  if (Array.isArray(r?.images) && r.images.length) {
    const first = r.images[0];
    return typeof first === 'string' ? first : first?.url;
  }
  return null;
}

function SectionShell({ title, children }) {
  return (
    <section className="mt-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xs font-semibold tracking-wide text-gray-600 dark:text-gray-300 uppercase">
          {title}
        </h2>
        <Link to="/browse" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
          Browse all
        </Link>
      </div>
      {children}
    </section>
  );
}

export default function FrontPage() {
  const { t } = useTranslation();

  const [adminRecipes, setAdminRecipes] = useState([]);
  const [mostLiked, setMostLiked] = useState([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [loadingLiked, setLoadingLiked] = useState(true);

  // ---- Latest from the team (admins) ----
  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoadingAdmins(true);
      try {
        // Get admin IDs. Some RLS configs will return [] but not error.
        const { data: admins, error: adminsErr } = await supabase
          .from('users')
          .select('id')
          .eq('is_admin', true);

        if (adminsErr) throw adminsErr;
        const adminIds = (admins || []).map(a => a.id);

        let query = supabase
          .from('recipes')
          .select('id,title,description,cover_image,images,created_at,tags')
          .order('created_at', { ascending: false })
          .limit(8);

        if (adminIds.length) {
          query = query.in('author_id', adminIds);
        }
        // If adminIds is empty, we intentionally keep the query without .in()
        // so we fall back to latest overall.

        const { data: recs, error: recErr } = await query;
        if (recErr) throw recErr;
        if (!cancel) setAdminRecipes(recs || []);
      } catch (e) {
        console.warn('[front] admin section fallback:', e?.message || e);
        // Last‑resort fallback: latest overall
        const { data: recs } = await supabase
          .from('recipes')
          .select('id,title,description,cover_image,images,created_at,tags')
          .order('created_at', { ascending: false })
          .limit(8);
        if (!cancel) setAdminRecipes(recs || []);
      } finally {
        if (!cancel) setLoadingAdmins(false);
      }
    })();
    return () => { cancel = true; };
  }, []);

  // ---- Most liked (from recipe_likes) ----
  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoadingLiked(true);
      try {
        const { data: likesRows, error: likesErr } = await supabase
          .from('recipe_likes')
          .select('recipe_id')
          .limit(20000); // generous cap; adjust if needed

        if (likesErr) throw likesErr;

        const counts = new Map();
        (likesRows || []).forEach(row => {
          const id = row.recipe_id;
          if (!id) return;
          counts.set(id, (counts.get(id) || 0) + 1);
        });

        const top = [...counts.entries()].sort((a,b) => b[1]-a[1]).slice(0, 8);
        if (!top.length) {
          // no likes yet → show latest overall
          const { data: recs } = await supabase
            .from('recipes')
            .select('id,title,description,cover_image,images,created_at,tags')
            .order('created_at', { ascending: false })
            .limit(8);
          if (!cancel) setMostLiked((recs || []).map(r => ({ ...r, likeCount: 0 })));
          return;
        }

        const ids = top.map(([id]) => id);
        const countById = Object.fromEntries(top);

        const { data: recs, error: recErr } = await supabase
          .from('recipes')
          .select('id,title,description,cover_image,images,created_at,tags')
          .in('id', ids);

        if (recErr) throw recErr;

        const sorted = (recs || [])
          .map(r => ({ ...r, likeCount: countById[r.id] || 0 }))
          .sort((a,b) => (b.likeCount||0) - (a.likeCount||0));

        if (!cancel) setMostLiked(sorted);
      } catch (e) {
        console.warn('[front] likes section fallback:', e?.message || e);
        // Last‑resort fallback: latest overall
        const { data: recs } = await supabase
          .from('recipes')
          .select('id,title,description,cover_image,images,created_at,tags')
          .order('created_at', { ascending: false })
          .limit(8);
        if (!cancel) setMostLiked((recs || []).map(r => ({ ...r, likeCount: 0 })));
      } finally {
        if (!cancel) setLoadingLiked(false);
      }
    })();
    return () => { cancel = true; };
  }, []);

  // ---- UI ----
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <SEO
        title="Everything Dough — Home"
        description="Latest from the team and most liked recipes."
        canonical="https://www.breadcalculator.online/"
      />

      {/* Latest from the team */}
      <SectionShell title={t('latest_from_the_team','Latest from the team')}>
        {loadingAdmins ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={`s1-${i}`} className="rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700">
                <div className="aspect-[16/9] bg-gray-100 dark:bg-slate-800 animate-pulse" />
                <div className="h-14 bg-gray-50 dark:bg-slate-800 animate-pulse" />
              </div>
            ))}
          </div>
        ) : adminRecipes.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('no_recent_admin_recipes','No recent admin recipes.')}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {adminRecipes.map((r) => (
              <Link
                key={`admin-${r.id}`}
                to={`/recipe/${r.id}`}
                className="rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow transition"
              >
                <div className="w-full aspect-[16/9] bg-gray-100 dark:bg-slate-900">
                  {heroOf(r) && (
                    <SmartImage
                      src={heroOf(r)}
                      alt={r.title || 'Recipe'}
                      className="w-full h-full object-cover"
                      sizes="(min-width:1280px) 22vw, (min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw"
                    />
                  )}
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
      </SectionShell>

      {/* Most liked */}
      <SectionShell title={t('most_liked','Most liked')}>
        {loadingLiked ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={`s2-${i}`} className="rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700">
                <div className="aspect-[16/9] bg-gray-100 dark:bg-slate-800 animate-pulse" />
                <div className="h-14 bg-gray-50 dark:bg-slate-800 animate-pulse" />
              </div>
            ))}
          </div>
        ) : mostLiked.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('no_most_liked_yet','No most liked recipes yet.')}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {mostLiked.map((r) => (
              <Link
                key={`liked-${r.id}`}
                to={`/recipe/${r.id}`}
                className="rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow transition"
              >
                <div className="w-full aspect-[16/9] bg-gray-100 dark:bg-slate-900">
                  {heroOf(r) && (
                    <SmartImage
                      src={heroOf(r)}
                      alt={r.title || 'Recipe'}
                      className="w-full h-full object-cover"
                      sizes="(min-width:1280px) 22vw, (min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw"
                    />
                  )}
                </div>
                <div className="p-3">
                  <div className="font-semibold text-gray-900 dark:text-white line-clamp-1">{r.title}</div>
                  <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">❤️ {r.likeCount ?? 0}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </SectionShell>
    </div>
  );
}
