import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import supabase from '../supabaseClient';
import RecipeCard from './RecipeCard';

export default function Frontpage() {
  const [latestRecipes, setLatestRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { t } = useTranslation();

  const fetchLatest = async () => {
    setLoading(true);
    setError('');

    const { data, error: fetchError } = await supabase
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(6);

    if (fetchError) {
      console.error('Failed to fetch latest recipes', fetchError);
      setError(t('Could not load recipes right now.'));
      setLatestRecipes([]);
      setLoading(false);
      return;
    }

    setLatestRecipes(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchLatest();
  }, []);

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('Latest Recipes')}</h1>
        <button
          onClick={fetchLatest}
          className="text-sm px-3 py-1.5 rounded bg-gray-200 dark:bg-gray-700"
        >
          {t('Retry')}
        </button>
      </div>

      {loading && <p className="text-gray-500">{t('Loading...')}</p>}

      {error && (
        <div className="p-3 rounded border border-red-300 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      {!loading && !error && latestRecipes.length === 0 && (
        <p className="text-gray-500">{t('No recipes found')}</p>
      )}

      {!loading && !error && latestRecipes.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {latestRecipes.map((recipe) => (
            <Link key={recipe.id} to={`/recipe/${recipe.id}`}>
              <RecipeCard
                title={recipe.title}
                subtitle={recipe.description}
                image={recipe.image_url}
                recipeId={recipe.id}
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
