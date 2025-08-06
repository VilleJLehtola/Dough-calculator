import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export default function RecipesPage({ user }) {
  const [recipes, setRecipes] = useState([]);
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState('all');
  const [tagFilter, setTagFilter] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    const { data, error } = await supabase
      .from('recipes')
      .select('id, title, description, tags, mode, created_at')
      .order('created_at', { ascending: false });

    if (!error) setRecipes(data);
  };

  const filtered = recipes.filter((r) => {
    const matchSearch =
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      (r.tags || []).some((tag) => tag.toLowerCase().includes(search.toLowerCase()));
    const matchMode = filterMode === 'all' || r.mode === filterMode;
    const matchTag = !tagFilter || (r.tags || []).includes(tagFilter);
    return matchSearch && matchMode && matchTag;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h2 className="text-3xl font-bold mb-6 text-center">{t('Recipe Library')}</h2>

      <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('Search recipes or tags...')}
          className="w-full md:w-1/2 px-4 py-2 border rounded dark:bg-gray-700 dark:text-white"
        />
        <div className="flex gap-2">
          {['all', 'leipa', 'pizza'].map((mode) => (
            <button
              key={mode}
              onClick={() => {
                setFilterMode(mode);
                setTagFilter(null);
              }}
              className={`px-4 py-2 rounded text-sm font-medium ${
                filterMode === mode ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-600 dark:text-white'
              }`}
            >
              {mode === 'all' ? t('All') : mode === 'leipa' ? t('Bread') : t('Pizza')}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-gray-500">{t('No recipes found')}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((recipe) => (
            <div
              key={recipe.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow hover:shadow-lg transition"
            >
              <Link to={`/recipe/${recipe.id}`}>
                <img
                  src={`https://via.placeholder.com/600x400.png?text=${encodeURIComponent(recipe.title)}`}
                  alt={recipe.title}
                  className="w-full h-48 object-cover rounded-t-xl"
                />
              </Link>

              <div className="p-4">
                <h3 className="text-xl font-semibold mb-1 dark:text-white">{recipe.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{recipe.description}</p>

                <div className="flex flex-wrap gap-2 my-3">
                  {(recipe.tags || []).map((tag) => (
                    <button
                      key={tag}
                      onClick={() => {
                        setTagFilter(tag);
                        setFilterMode('all');
                      }}
                      className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-white text-xs px-2 py-0.5 rounded hover:bg-blue-200 dark:hover:bg-blue-700"
                    >
                      {tag}
                    </button>
                  ))}
                </div>

                <div className="mt-4 flex justify-between items-center">
                  <Link
                    to={`/recipe/${recipe.id}`}
                    className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {t('Open Recipe')}
                  </Link>
                  {user && (
                    <button
                      onClick={async () => {
                        const { error } = await supabase.from('favorites').insert([
                          {
                            user_id: user.id,
                            name: recipe.title,
                            recipe_id: recipe.id
                          }
                        ]);
                      }}
                      className="text-xs text-green-600 hover:text-green-800 dark:text-green-400"
                    >
                      {t('Save as favorite')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
