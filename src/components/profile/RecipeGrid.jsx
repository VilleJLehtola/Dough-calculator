import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import supabase from '@/supabaseClient';

export default function RecipeGrid({ userId }) {
  const [recipes, setRecipes] = useState(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('recipes')
        .select('id, title, description, cover_image_url, created_at, tags')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (!error) setRecipes(data || []);
    })();
  }, [userId]);

  if (!recipes) return null;
  if (recipes.length === 0) {
    return <p className="text-gray-500 dark:text-gray-400">No recipes yet.</p>;
  }

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {recipes.map(r => (
        <Link
          key={r.id}
          to={`/recipe/${r.id}`}
          className="rounded-xl overflow-hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:shadow"
        >
          {r.cover_image_url && (
            <img src={r.cover_image_url} alt={r.title} className="h-40 w-full object-cover" />
          )}
          <div className="p-3">
            <h3 className="font-semibold text-gray-900 dark:text-white">{r.title}</h3>
            {r.description && (
              <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{r.description}</p>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
