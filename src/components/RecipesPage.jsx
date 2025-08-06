import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import RecipeEditor from './RecipeEditor';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export default function RecipesPage({ user, isAdmin }) {
  const [recipes, setRecipes] = useState([]);
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState('all');
  const { t } = useTranslation();

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    const { data, error } = await supabase
      .from('recipes')
      .select(`
        id,
        title,
        description,
        tags,
        mode,
        created_at,
        recipe_images (
          url
        )
      `)
      .order('created_at', { ascending: false });

    if (!error) {
      const withFirstImage = data.map(r => ({
        ...r,
        imageUrl: r.recipe_images?.[0]?.url || null
      }));
      setRecipes(withFirstImage);
    }
  };

  const saveRecipeAsFavorite = async (recipe) => {
    if (!user) {
      alert('Kirjaudu sisään tallentaaksesi suosikkeja.');
      return;
    }

    const { error } = await supabase.from('favorites').insert([
      {
        user_id: user.id,
        name: recipe.title,
        recipe_id: recipe.id
      }
    ]);

    if (!error) {
      alert('Tallennettu suosikiksi!');
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
    <div className="max-w-screen-xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4 text-center">
        {t('Recipe Library') || 'Reseptikirjasto'}
      </h2>

      {/* Only show editor for admin */}
      {isAdmin && <RecipeEditor user={user} onRecipeCreated={fetchRecipes} />}

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t('Search recipes or tags...') || 'Etsi reseptejä tai tageja...'}
        className="w-full px-3 py-2 mb-4 border rounded dark:bg-gray-700 dark:text-white"
      />

      <div className="flex justify-center gap-2 mb-4">
        {['all', 'leipa', 'pizza'].map((mode) => (
          <button
            key={mode}
            onClick={() => setFilterMode(mode)}
            className={`px-3 py-1 rounded ${
              filterMode === mode
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 dark:text-white'
            }`}
          >
            {mode === 'all' ? t('All') : mode === 'leipa' ? t('Bread') : t('Pizza')}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-gray-500">{t('No recipes found') || 'Ei reseptejä'}</p>
      ) : (
        <ul className="space-y-6">
          {filtered.map((recipe) => (
            <li
              key={recipe.id}
              className="bg-white border rounded-xl shadow dark:bg-gray-800 dark:border-gray-700 overflow-hidden"
            >
              {recipe.imageUrl && (
                <img
                  src={recipe.imageUrl}
                  alt={recipe.title}
                  className="w-full h-48 object-cover rounded-t-xl"
                />
              )}

              <div className="p-4">
                <h3 className="text-xl font-semibold mb-1 text-gray-900 dark:text-white">
                  {recipe.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  {recipe.description}
                </p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {(recipe.tags || []).map((tag) => (
                    <span
                      key={tag}
                      className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-white px-2 py-0.5 rounded text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between mt-2">
                  <Link
                    to={`/recipe/${recipe.id}`}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    {t('Open Recipe') || 'Avaa resepti'}
                  </Link>

                  {user && (
                    <button
                      onClick={() => saveRecipeAsFavorite(recipe)}
                      className="text-green-600 text-sm hover:underline"
                    >
                      {t('Save as favorite') || 'Tallenna suosikiksi'}
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
