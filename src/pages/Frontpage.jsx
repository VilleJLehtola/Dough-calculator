import { useEffect, useState } from 'react';
import supabase from '@/supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function FrontPage() {
  const [latestRecipes, setLatestRecipes] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecipes = async () => {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      if (!error) setLatestRecipes(data);
    };
    fetchRecipes();
  }, []);

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Uusimmat reseptit</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">Viimeisimmät ylläpidon lisäämät reseptit</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {latestRecipes.map((recipe) => (
          <div
            key={recipe.id}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition cursor-pointer p-4"
            onClick={() => navigate(`/recipe/${recipe.id}`)}
          >
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">
              {recipe.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{recipe.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
