import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import supabase from '@/supabaseClient';
import { Clock } from 'lucide-react';

export default function FavoritesGrid({ userId, isOwner }) {
  const [items, setItems] = useState(null);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data, error } = await supabase
        .from('favorites')
        .select('id, created_at, recipe_id, recipes ( id, title, cover_image, prep_time_minutes, servings )')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error) setItems(data || []);
      else {
        console.error('FavoritesGrid fetch error:', error);
        setItems([]);
      }
    })();
  }, [userId]);

  if (!items) return <p className="text-gray-500 dark:text-gray-400">Loading…</p>;
  if (items.length === 0) {
    return (
      <p className="text-gray-500 dark:text-gray-400">
        {isOwner ? 'You have no favorites yet.' : 'No favorites to show.'}
      </p>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((row) => {
        const r = row.recipes || {};
        return (
          <div key={row.id} className="rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-800">
            <Link to={`/recipe/${r.id}`}>
              <img
                src={r.cover_image || ''}
                alt={r.title || ''}
                className="h-36 w-full object-cover"
                loading="lazy"
              />
            </Link>
            <div className="p-3 space-y-2">
              <Link to={`/recipe/${r.id}`} className="font-medium line-clamp-2 hover:underline">
                {r.title || 'Open recipe'}
              </Link>
              <div className="flex items-center gap-2 text-xs opacity-80">
                {r.prep_time_minutes != null && (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {r.prep_time_minutes} min
                  </span>
                )}
                {r.servings != null && (
                  <span>• {r.servings}</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
