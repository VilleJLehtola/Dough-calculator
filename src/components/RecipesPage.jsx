// RecipesPage.jsx
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import RecipeEditor from './RecipeEditor';

export default function RecipesPage({ user, onLoadFavorite }) {
  const [recipes, setRecipes] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) setRecipes(data);
  };

  const filtered = recipes.filter((r) =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    (r.tags || []).some((tag) => tag.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4 text-center">Reseptikirjasto</h2>

      {/* Admin-only editor */}
      <RecipeEditor user={user} onRecipeCreated={fetchRecipes} />

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Etsi reseptejä tai tageja..."
        className="w-full px-3 py-2 mb-4 border rounded"
      />

      {filtered.length === 0 ? (
        <p className="text-center text-gray-500">Ei reseptejä</p>
      ) : (
        <ul className="space-y-4">
          {filtered.map((recipe) => (
            <li key={recipe.id} className="bg-white border rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold mb-1">{recipe.title}</h3>
              <p className="text-sm text-gray-600 mb-2">{recipe.description}</p>
              <div className="flex flex-wrap gap-2 mb-2">
                {(recipe.tags || []).map((tag) => (
                  <span
                    key={tag}
                    className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => onLoadFavorite(recipe)}
                  className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                >
                  Lataa laskimeen
                </button>
                <details className="w-full mt-2">
                  <summary className="cursor-pointer text-sm text-blue-700 hover:underline">
                    Näytä ohjeet
                  </summary>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                    {recipe.instructions}
                  </p>
                </details>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
