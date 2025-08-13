// src/pages/FrontPage.jsx
import { useEffect, useState } from 'react';
import supabase from '@/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Extend this list if you add more admins
const ADMIN_EMAILS = ['ville.j.lehtola@gmail.com'];

export default function FrontPage() {
  const { t } = useTranslation();
  const [latestAdminRecipes, setLatestAdminRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      setLoading(true);

      // Query the browse view and filter by admin emails (author email in the view)
      const { data: rows, error: recErr } = await supabase
        .from('browse_recipes_v')
        .select('id,title,description,cover_image,images,created_at,username,email,tags')
        .in('email', ADMIN_EMAILS)
        .order('created_at', { ascending: false })
        .limit(12);

      if (recErr) {
        console.warn('Admin recipes fetch failed', recErr);
        setLatestAdminRecipes([]);
      } else {
        setLatestAdminRecipes(rows || []);
      }
      setLoading(false);
    })();
  }, []);

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
      {/* ===== Top: Latest admin recipes ===== */}
      <section className="mt-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {t('latest_admin_recipes', 'Latest admin recipes')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {t('recipe_library', 'Recipe library')}
        </p>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                <div className="w-full aspect-[3/2] bg-gray-100 dark:bg-slate-900 animate-pulse" />
                <div className="p-5 space-y-3">
                  <div className="h-6 w-2/3 bg-gray-100 dark:bg-slate-700 rounded animate-pulse" />
                  <div className="h-4 w-4/5 bg-gray-100 dark:bg-slate-700 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : latestAdminRecipes.length === 0 ? (
          <div className="text-gray-600 dark:text-gray-300">
            {t('no_recipes_found', 'No recipes found.')}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
            {latestAdminRecipes.map((recipe) => {
              const hero = heroFor(recipe);
              return (
                <div
                  key={recipe.id}
                  className="rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-lg cursor-pointer transition"
                  onClick={() => navigate(`/recipe/${recipe.id}`)}
                >
                  <div className="w-full aspect-[3/2] bg-gray-100 dark:bg-slate-900">
                    {hero ? (
                      <img
                        src={hero}
                        alt={recipe.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : null}
                  </div>
                  <div className="p-5">
                    <div className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-1">
                      {recipe.title}
                    </div>
                    {recipe.description ? (
                      <div className="mt-1 text-[15px] text-gray-600 dark:text-gray-300 line-clamp-2">
                        {recipe.description}
                      </div>
                    ) : null}

                    {/* Optional: show a few tags */}
                    {Array.isArray(recipe.tags) && recipe.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {recipe.tags.slice(0, 4).map((tag) => (
                          <span
                            key={tag}
                            className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ===== Placeholder: Most liked / social feed (coming soon) ===== */}
      <section className="mt-14">
        <div className="flex items-baseline justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('most_liked_recipes', 'Most liked recipes')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {t('most_liked_subtitle', 'Most liked community recipes')}
            </p>
          </div>
          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-700">
            {t('coming_soon', 'Coming soon')}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-8">
          {[...Array(5)].map((_, i) => (
            <div
              key={`ph-${i}`}
              className="rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            >
              <div className="aspect-[3/2] bg-gray-100 dark:bg-slate-900 animate-pulse" />
              <div className="p-5">
                <div className="h-5 w-3/4 bg-gray-100 dark:bg-slate-700 rounded animate-pulse mb-2" />
                <div className="h-4 w-1/2 bg-gray-100 dark:bg-slate-700 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
