import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import RecipeEditor from './RecipeEditor';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export default function RecipesPage({ user, isAdmin }) {
  const [recipes, setRecipes] = useState([]);
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState('all');
  const [images, setImages] = useState({});
  const { t } = useTranslation();

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) {
      setRecipes(data);
      const imageMap = {};

      for (const recipe of data) {
        const { data: imageData } = await supabase
          .from('recipe_images')
          .select('url')
          .eq('recipe_id', recipe.id)
          .order('created_at', { ascending: true })
          .limit(1);

        if (imageData && imageData.length > 0) {
          imageMap[recipe.id] = imageData[0].url;
        }
      }

      setImages(imageMap);
    }
  };

  const saveRecipeAsFavorite = async (recipe) => {
    if (!user) {
      alert(t('You must be logged in to save favorites'));
      return;
    }

    const { error } = await supabase.from('favorites').insert([
      {
        user_id: user.id,
        name: recipe.title,
        recipe_id: recipe.id,
      },
    ]);

    if (!error) {
      alert(t('Saved to favorites!'));
    }
  };

  const filtered = recipes.filter((r) => {
    const matchSearch =
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      (r.tags || []).some((tag) => tag.toLowerCase().includes(search.toLowerCase()));
    const matchMode = filterMode === 'all' || r.mode === filterMode;
    return matchSearch && matchMode;
  });

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h2 className="text-3xl font-bold mb-6 text-center">{t('Recipe Library') || 'Reseptikirjasto'}</h2>

      {isAdmin && <RecipeEditor user={user} onRecipeCreated={fetchRecipes} />}

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t('Search recipes or tags...') || 'Etsi reseptejä tai tageja...'}
        className="w-full px-3 py-2 mb-4 border rounded text-gray-900 dark:text-white dark:bg-gray-800"
      />

      <div className="flex justify-center gap-2 mb-6">
        {['all', 'leipa', 'pizza'].map((mode) => (
          <button
            key={mode}
            onClick={() => setFilterMode(mode)}
            className={`px-3 py-1 rounded ${
              filterMode === mode ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 dark:text-white'
            }`}
          >
            {mode === 'all' ? t('All') || 'Kaikki' : mode === 'leipa' ? t('Bread') : t('Pizza')}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400">{t('No recipes found') || 'Ei reseptejä'}</p>
      ) : (
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((recipe) => (
            <li
              key={recipe.id}
              className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl overflow-hidden shadow hover:shadow-lg transition-shadow"
            >
              {images[recipe.id] && (
                <img
                  src={images[recipe.id]}
                  alt={recipe.title}
                  className="w-full h-48 object-cover"
                />
              )}

              <div className="p-4 space-y-2">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{recipe.title}</h3>
                {recipe.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">{recipe.description}</p>
                )}

                <div className="flex flex-wrap gap-2">
                  {(recipe.tags || []).map((tag) => (
                    <span
                      key={tag}
                      className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-white px-2 py-0.5 rounded text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex gap-2 mt-3">
                  <Link
                    to={`/recipe/${recipe.id}`}
                    className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm"
                  >
                    {t('Open Recipe')}
                  </Link>

                  <button
                    onClick={() => saveRecipeAsFavorite(recipe)}
                    className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm"
                  >
                    {t('Save as favorite')}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
