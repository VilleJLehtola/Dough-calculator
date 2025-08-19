// src/pages/FrontPage.jsx
import React, { useEffect, useState } from 'react';
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

function Section({ title, children }) {
  const { t } = useTranslation();
  return (
    <section className="mt-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xs font-semibold tracking-wide text-gray-600 dark:text-gray-300 uppercase">
          {title}
        </h2>
        <Link
          to="/browse"
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
        >
          {t('browse_all', 'Browse all')}
        </Link>
      </div>
      {children}
    </section>
  );
}

function Cards({ rows, showLikes }) {
  if (!rows?.length) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {rows.map((r) => (
        <Link
          key={r.id}
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
            <div className="font-semibold text-gray-900 dark:text-white line-clamp-1">
              {r.title}
            </div>
            {showLikes ? (
              <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                ❤️ {r.likeCount ?? 0}
              </div>
            ) : null}
          </div>
        </Link>
      ))}
    </div>
  );
}

export default function FrontPage() {
  const { t } = useTranslation();

  const [latest, setLatest] = useState([]);
  const [mostLiked, setMostLiked] = useState([]);

  const [loadingLatest, setLoadingLatest] = useState(true);
  const [loadingLiked, setLoadingLiked] = useState(true);

  // --- Latest recipes (safe: from browse_recipes_v) ---
  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoadingLatest(true);
      try {
        const { data, error } = await supabase
          .from('browse_recipes_v')
          .select('id,title,description,cover_image,images,created_at')
          .order('created_at', { ascending: false })
          .limit(8);
        if (error) throw error;
        if (!cancel) setLatest(data || []);
      } catch (e) {
        console.warn('[front] latest fallback', e?.message || e);
        if (!cancel) setLatest([]);
      } finally {
        if (!cancel) setLoadingLatest(false);
      }
    })();
    return () => { cancel = true; };
  }, []);

  // --- Most liked (via SQL view) ---
  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoadingLiked(true);
      try {
        const { data, error } = await supabase
          .from('most_liked_recipes_v')
          .select('id,title,description,cover_image,images,created_at,like_count')
          .order('like_count', { ascending: false })
          .limit(8);

        if (error) throw error;

        const rows = (data || []).map(r => ({ ...r, likeCount: r.like_count }));
        if (!cancel) {
          setMostLiked(rows.length ? rows : latest.map(r => ({ ...r, likeCount: 0 })));
        }
      } catch (e) {
        console.warn('[front] liked fallback', e?.message || e);
        if (!cancel) setMostLiked(latest.map(r => ({ ...r, likeCount: 0 })));
      } finally {
        if (!cancel) setLoadingLiked(false);
      }
    })();
    return () => { cancel = true; };
  }, [latest]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <SEO
        title="Everything Dough — Home"
        description="Latest recipes and most liked by the community."
        canonical="https://www.breadcalculator.online/"
      />

      {/* HERO / Intro */}
      <div className="mt-6 rounded-2xl bg-gradient-to-br from-amber-300/20 to-rose-300/20 dark:from-amber-400/10 dark:to-rose-400/10 p-6 ring-1 ring-black/5 dark:ring-white/10">
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white">
          {t('brand', 'Everything Dough')}
        </h1>
        <p className="mt-1 text-sm md:text-base text-gray-700 dark:text-gray-300">
          {t('tagline', 'Smarter sourdough, faster. Explore community recipes or build your own with the calculator.')}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            to="/calculator"
            className="inline-flex items-center px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 text-sm"
          >
            {t('open_calculator', 'Open calculator')}
          </Link>
          <Link
            to="/browse"
            className="inline-flex items-center px-3 py-1.5 rounded-md border border-blue-600 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-sm"
          >
            {t('browse_recipes', 'Browse recipes')}
          </Link>
        </div>
      </div>

      {/* Latest */}
      <Section title={t('latest_from_the_team', 'Latest from the team')}>
        {loadingLatest ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={`s1-${i}`} className="rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700">
                <div className="aspect-[16/9] bg-gray-100 dark:bg-slate-800 animate-pulse" />
                <div className="h-14 bg-gray-50 dark:bg-slate-800 animate-pulse" />
              </div>
            ))}
          </div>
        ) : latest.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('no_recent_admin_recipes', 'No recent admin recipes.')}
          </p>
        ) : (
          <Cards rows={latest} />
        )}
      </Section>

      {/* Most liked */}
      <Section title={t('most_liked', 'Most liked')}>
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
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('no_most_liked_yet', 'No most liked recipes yet.')}
          </p>
        ) : (
          <Cards rows={mostLiked} showLikes />
        )}
      </Section>
    </div>
  );
}
