import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import supabase from '@/supabaseClient';

export default function BrowsePage() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      // Try to fetch with optional relation; if it errors, fall back
      let list = [];
      try {
        const { data, error } = await supabase
          .from('recipes')
          .select(`
            id,
            title,
            description,
            hero_image_url,
            created_at,
            recipe_images ( url )
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        list = data || [];
      } catch (e) {
        console.warn('Browse: relation fetch failed, falling back.', e?.message);
        const { data } = await supabase
          .from('recipes')
          .select('id,title,description,cover_image,images,created_at')
          .order('created_at', { ascending: false });
        list = data || [];
      }
      setRecipes(list);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Reseptikirjasto</h1>

      {loading ? (
        <p className="text-gray-600 dark:text-gray-300">Ladataan reseptejä...</p>
      ) : recipes.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-300">Ei reseptejä löytynyt.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((r) => {
            const thumb = r.recipe_images?.[0]?.url || r.hero_image_url || '';
            return (
              <Link
                to={`/recipe/${r.id}`}
                key={r.id}
                className="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition"
              >
                {thumb ? (
                  <img
                    src={thumb}
                    alt={r.title}
                    className="w-full h-40 object-cover group-hover:opacity-95 transition"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-40 bg-gray-100 dark:bg-gray-700" />
                )}
                <div className="p-4">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-white line-clamp-1">
                    {r.title}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {r.description || '—'}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
