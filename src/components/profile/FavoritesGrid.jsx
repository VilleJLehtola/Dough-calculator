// src/components/profile/FavoritesGrid.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import supabase from '@/supabaseClient';

export default function FavoritesGrid({ userId, isOwner }) {
  const [favorites, setFavorites] = useState(null);  // [{id, created_at, recipe}]
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);

      // 1) fetch favorites (recipe_id list)
      const { data: favRows, error: favErr } = await supabase
        .from('favorites')
        .select('id, created_at, recipe_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (favErr) {
        console.error(favErr);
        setFavorites([]);
        setLoading(false);
        return;
      }

      const recipeIds = (favRows || [])
        .map(f => f.recipe_id)
        .filter(Boolean);

      if (recipeIds.length === 0) {
        setFavorites([]);
        setLoading(false);
        return;
      }

      // 2) fetch recipes by id IN (...)
      const { data: recs, error: recErr } = await supabase
        .from('recipes')
        .select('id, title, description, cover_image_url')
        .in('id', recipeIds);

      if (recErr) {
        console.error(recErr);
        setFavorites([]);
        setLoading(false);
        return;
      }

      // map favorites → attach recipe object
      const recMap = new Map(recs.map(r => [r.id, r]));
      const joined = (favRows || [])
        .map(f => ({ ...f, recipe: recMap.get(f.recipe_id) }))
        .filter(f => f.recipe); // drop missing

      setFavorites(joined);
      setLoading(false);
    })();
  }, [userId]);

  if (loading) return <p className="text-gray-500 dark:text-gray-400">Loading…</p>;
  if (!favorites || favorites.length === 0) {
    return (
      <p className="text-gray-500 dark:text-gray-400">
        {isOwner ? 'You have no favorites yet.' : 'No favorites to show.'}
      </p>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {favorites.map(f => (
        <Link
          key={f.id}
          to={`/recipe/${f.recipe.id}`}
          className="rounded-xl overflow-hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:shadow"
        >
          {f.recipe.cover_image_url && (
            <img src={f.recipe.cover_image_url} alt={f.recipe.title} className="h-40 w-full object-cover" />
          )}
          <div className="p-3">
            <h3 className="font-semibold text-gray-900 dark:text-white">{f.recipe.title}</h3>
            {f.recipe.description && (
              <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                {f.recipe.description}
              </p>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
