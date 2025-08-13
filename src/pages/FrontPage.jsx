import { useEffect, useState } from 'react';
import supabase from '@/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Adjust or extend this list if you add more admins
const ADMIN_EMAILS = ['ville.j.lehtola@gmail.com'];

export default function FrontPage() {
  const { t } = useTranslation();
  const [latestAdminRecipes, setLatestAdminRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      setLoading(true);

      // 1) Find admin user ids by email (matches your existing admin logic)
      const { data: admins, error: adminErr } = await supabase
        .from('users')
        .select('id,email')
        .in('email', ADMIN_EMAILS);

      if (adminErr) {
        console.warn('Admin lookup failed', adminErr);
        setLatestAdminRecipes([]);
        setLoading(false);
        return;
      }

      const adminIds = (admins || []).map(a => a.id).filter(Boolean);
      if (adminIds.length === 0) {
        // No known admins found → nothing to show
        setLatestAdminRecipes([]);
        setLoading(false);
        return;
      }

      // 2) Fetch only recipes authored by admins
      const { data: rows, error: recErr } = await supabase
        .from('recipes')
        .select('id,title,description,cover_image,images,author_id,created_at')
        .in('author_id', adminIds)
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

  // Same hero picker approach as BrowsePage
  const heroFor = (r) => {
    if (r?.cover_image) return r.cover_image;
    if (Array.isArray(r?.images) && r.images.length) {
      const first = r.images[0];
      return typeof first === 'string' ? first : first?.url;
    }
    return null;
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
        {t('latest_admin_recipes')}
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        {/* short subtitle; keep simple to avoid new keys */}
        {t('recipe_library')}
      </p>

      {loading ? (
        <div className="text-gray-600 dark:text-gray-300">{/* simple skeleton could go here */}Loading…</div>
      ) : latestAdminRecipes.length === 0 ? (
        <div className="text-gray-600 dark:text-gray-300">{t('no_recipes_found')}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {latestAdminRecipes.map((recipe) => {
            const hero = heroFor(recipe);
            return (
              <div
                key={recipe.id}
                className="rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow cursor-pointer"
                onClick={() => navigate(`/recipe/${recipe.id}`)}
              >
                <div className="w-full aspect-[16/9] bg-gray-100 dark:bg-slate-900">
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
                <div className="p-3">
                  <div className="font-semibold text-gray-900 dark:text-white line-clamp-1">
                    {recipe.title}
                  </div>
                  {recipe.description ? (
                    <div className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                      {recipe.description}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
