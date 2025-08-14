import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import supabase from '@/supabaseClient';

export default function FavoritesGrid({ userId, isOwner }) {
  const [favorites, setFavorites] = useState(null);

  useEffect(() => {
    (async () => {
      // Assumes favorites table has recipe_id → recipes(id)
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          id,
          created_at,
          recipes:recipe_id ( id, title, description, cover_image_url )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error) setFavorites((data || []).filter(f => f.recipes));
    })();
  }, [userId]);

  if (!favorites) return null;
  if (favorites.length === 0) {
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
          to={`/recipe/${f.recipes.id}`}
          className="rounded-xl overflow-hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:shadow"
        >
          {f.recipes.cover_image_url && (
            <img src={f.recipes.cover_image_url} alt={f.recipes.title} className="h-40 w-full object-cover" />
          )}
          <div className="p-3">
            <h3 className="font-semibold text-gray-900 dark:text-white">{f.recipes.title}</h3>
            {f.recipes.description && (
              <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                {f.recipes.description}
              </p>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
