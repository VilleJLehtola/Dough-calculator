import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import supabase from '@/supabaseClient';

export default function BrowsePage() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecipes = async () => {
      const { data, error } = await supabase
        .from('recipes')
        .select(`
          id,
          title,
          description,
          recipe_images (
            url
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching recipes:', error.message);
      } else {
        setRecipes(data);
      }

      setLoading(false);
    };

    fetchRecipes();
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
          {recipes.map((recipe) => (
            <Link
              to={`/recipe/${recipe.id}`}
              key={recipe.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition"
            >
              {recipe.recipe_images?.[0]?.url && (
                <img
                  src={recipe.recipe_images[0].url}
                  alt={recipe.title}
                  className="w-full h-40 object-cover"
                />
              )}
              <div className="p-4">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">{recipe.title}</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{recipe.description}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
