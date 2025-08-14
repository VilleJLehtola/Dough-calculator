// /src/pages/FrontPage.jsx
import { useEffect, useState } from 'react';
import supabase from '@/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Heart } from 'lucide-react';

// Extend this list if you add more admins
const ADMIN_EMAILS = ['ville.j.lehtola@gmail.com'];

export default function FrontPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Admin (latest) section
  const [latestAdminRecipes, setLatestAdminRecipes] = useState([]);
  const [loadingAdmin, setLoadingAdmin] = useState(true);

  // Most liked section
  const [topLiked, setTopLiked] = useState([]);
  const [loadingLiked, setLoadingLiked] = useState(true);
  const [likedErr, setLikedErr] = useState('');

  useEffect(() => {
    (async () => {
      setLoadingAdmin(true);
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
      setLoadingAdmin(false);
    })();
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoadingLiked(true);
      setLikedErr('');
      try {
        // Aggregate likes via related select
        const { data, error } = await supabase
          .from('recipes')
          .select('id,title,description,cover_image,images,created_at,recipe_likes(count)')
          .order('count', { foreignTable: 'recipe_likes', ascending: false })
          .limit(12);

        if (!alive) return;
        if (error) throw error;

        const mapped = (data || []).map((row) => ({
          ...row,
          _likes:
            Array.isArray(row.recipe_likes) && row.recipe_likes[0]?.count != null
              ? row.recipe_likes[0].count
              : 0,
        }));
        setTopLiked(mapped);
      } catch (e) {
        console.warn('Most liked fetch failed', e);
        if (alive) setLikedErr(e.message || 'Failed to load most liked');
      } finally {
        if (alive) setLoadingLiked(false);
      }
    })();
    return () => {
      alive = false;
    };
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

        {loadingAdmin ? (
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

      {/* ===== Most liked / community ===== */}
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
        </div>

        {likedErr && (
          <div className="mt-3 text-sm text-red-600 dark:text-red-400">
            {t('failed_to_load', 'Failed to load')}: {likedErr}
          </div>
        )}

        {loadingLiked ? (
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-8">
            {[...Array(8)].map((_, i) => (
              <div
                key={`skeleton-${i}`}
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
        ) : topLiked.length ? (
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-8">
            {topLiked.map((r) => {
              const hero = heroFor(r);
              const likes = r._likes ?? 0;
              return (
                <div
                  key={r.id}
                  className="rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-lg cursor-pointer transition"
                  onClick={() => navigate(`/recipe/${r.id}`)}
                >
                  <div className="relative w-full aspect-[3/2] bg-gray-100 dark:bg-slate-900">
                    {hero ? (
                      <img
                        src={hero}
                        alt={r.title || 'Recipe'}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : null}
                    <span className="absolute top-2 right-2 inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-200">
                      <Heart className="w-3.5 h-3.5" />
                      {likes}
                    </span>
                  </div>
                  <div className="p-5">
                    <div className="text-[15px] font-semibold text-gray-900 dark:text-white line-clamp-2">
                      {r.title || t('open_recipe', 'Open recipe')}
                    </div>
                    {r.description ? (
                      <div className="mt-1 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                        {r.description}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
            {t('no_likes_yet', 'No likes yet. Be the first to like a recipe!')}
          </p>
        )}
      </section>
    </div>
  );
}
