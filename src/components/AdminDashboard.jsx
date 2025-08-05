import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function AdminDashboard({ user }) {
  const [recipes, setRecipes] = useState([]);
  const [imagesMap, setImagesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.email !== 'ville.j.lehtola@gmail.com') return;

    const fetchRecipes = async () => {
      setLoading(true);
      const { data: all, error } = await supabase
        .from('recipes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching recipes:', error);
        setLoading(false);
        return;
      }

      setRecipes(all);

      // fetch first image per recipe
      const ids = all.map(r => r.id);
      const { data: allImages } = await supabase
        .from('recipe_images')
        .select('*')
        .in('recipe_id', ids);

      const map = {};
      for (const img of allImages) {
        if (!map[img.recipe_id]) map[img.recipe_id] = img.url;
      }

      setImagesMap(map);
      setLoading(false);
    };

    fetchRecipes();
  }, [user]);

  if (!user || user.email !== 'ville.j.lehtola@gmail.com') {
    return <p className="text-center mt-10">Ei oikeuksia</p>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-blue-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-10 px-4">
      <div className="max-w-5xl mx-auto bg-white dark:bg-gray-800 p-6 rounded-xl shadow space-y-6 border dark:border-gray-700">
        <h1 className="text-2xl font-bold text-center">Admin: Kaikki reseptit</h1>

        {loading ? (
          <p className="text-center text-gray-500">Ladataan reseptejä...</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {recipes.map((recipe) => (
              <div
                key={recipe.id}
                className="bg-gray-100 dark:bg-gray-700 rounded-lg shadow p-4 flex flex-col"
              >
                {imagesMap[recipe.id] && (
                  <img
                    src={imagesMap[recipe.id]}
                    alt="thumb"
                    className="w-full h-48 object-cover rounded mb-3"
                  />
                )}

                <h2 className="text-lg font-semibold">{recipe.title}</h2>

                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  {new Date(recipe.created_at).toLocaleDateString()}
                </p>

                <div className="flex flex-wrap gap-2 mb-3">
                  {recipe.tags?.map(tag => (
                    <span
                      key={tag}
                      className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-white px-2 py-0.5 rounded text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex gap-2 mt-auto">
                  <button
                    onClick={() => navigate(`/edit-recipe/${recipe.id}`)}
                    className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm"
                  >
                    ✏️ Muokkaa
                  </button>

                  <button
                    onClick={() => console.log('TODO: duplicate', recipe.id)}
                    className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 text-sm"
                  >
                    📄 Duplikoi
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
