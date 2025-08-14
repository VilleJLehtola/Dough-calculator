import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import supabase from '@/supabaseClient';

function Card({ r }) {
  const cover =
    r.cover_image ||
    (Array.isArray(r.images) && r.images.length ? r.images[0] : null);

  return (
    <Link
      to={`/recipe/${r.id}`}
      className="group rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-md transition"
    >
      <div className="aspect-video bg-gray-100 dark:bg-slate-700 overflow-hidden">
        {cover ? (
          <img
            src={cover}
            alt={r.title || 'Recipe'}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
            (no image)
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="line-clamp-1 font-medium text-gray-900 dark:text-white">
          {r.title || '—'}
        </div>
        {r.description ? (
          <div className="line-clamp-1 text-sm text-gray-600 dark:text-gray-300">
            {r.description}
          </div>
        ) : null}
      </div>
    </Link>
  );
}

export default function RecipeGrid({ userId }) {
  const [recipes, setRecipes] = useState(null);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data, error } = await supabase
        .from('recipes')
        .select('id,title,description,images,cover_image,author_id,created_at')
        .eq('author_id', userId)
        .order('created_at', { ascending: false });

      if (!error) setRecipes(data || []);
      else {
        console.error('RecipeGrid fetch error:', error);
        setRecipes([]);
      }
    })();
  }, [userId]);

  if (!recipes) return <p className="text-gray-500 dark:text-gray-400">Loading…</p>;
  if (recipes.length === 0) return <p className="text-gray-500 dark:text-gray-400">No recipes yet.</p>;

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
      {recipes.map((r) => <Card key={r.id} r={r} />)}
    </div>
  );
}
