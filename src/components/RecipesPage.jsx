import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import RecipeEditor from './RecipeEditor';
import { useTranslation } from 'react-i18next';

export default function RecipesPage({ user }) {
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
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) setRecipes(data);
  };

  const saveRecipeAsFavorite = async (recipe) => {
    if (!user) return;

    const { error } = await supabase.from('favorites').insert([
      {
        user_id: user.id,
        name: recipe.title,
        input_grams: recipe.flour_amount || '',
        input_type: 'jauho',
        hydration: recipe.hydration,
        salt_pct: recipe.salt_pct,
        mode: recipe.mode,
        use_oil: recipe.use_oil,
        cold_fermentation: recipe.cold_fermentation,
        use_rye: recipe.use_rye,
        use_seeds: recipe.use_seeds,
      },
    ]);

    if (!error) {
      // optionally show a message
    }
  };

  const filtered = recipes.filter((r) => {
    const matchSearch =
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      (r.tags || []).some((tag) => tag.toLowerCase().includes(search.toLowerCase()));
    const matchMode = filterMode === 'all' || r.mode === filterMode;
    return matchSearch && matchMode;
  });

  const formatInstructions = (text, foldTimings) => {
    const lines = text.split('\n').filter(Boolean);
    let foldIndex = 0;

    return lines.map((line, idx) => {
      const isFoldMarker = /\[FOLD\s*\d+\]/i.test(line);

      if (isFoldMarker) {
        const timing = foldTimings?.[foldIndex] || null;
        foldIndex++;
        return (
          <p key={`fold-${idx}`} className="ml-2">
            • <strong>{t('Fold')} {foldIndex}</strong>{timing ? ` (${timing} min)` : ''}
          </p>
        );
      }

      return (
        <p key={`line-${idx}`} className="ml-2">
          • {line}
        </p>
      );
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4 text-center">
        {t('Recipe Library') || 'Reseptikirjasto'}
      </h2>

      <RecipeEditor user={user} onRecipeCreated={fetchRecipes} />

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t('Search recipes or tags...') || 'Etsi reseptejä tai tageja...'}
        className="w-full px-3 py-2 mb-4 border rounded"
      />

      <div className="flex justify-center gap-2 mb-4">
        {['all', 'leipa', 'pizza'].map((mode) => (
          <button
            key={mode}
            onClick={() => setFilterMode(mode)}
            className={`px-3 py-1 rounded ${
              filterMode === mode ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            {mode === 'all' ? t('All') || 'Kaikki' : mode === 'leipa' ? t('Bread') : t('Pizza')}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-gray-500">{t('No recipes found') || 'Ei reseptejä'}</p>
      ) : (
        <ul className="space-y-4">
          {filtered.map((recipe) => (
            <li
              key={recipe.id}
              className="bg-white border rounded-lg shadow p-4 dark:bg-gray-800 dark:border-gray-700"
            >
              <h3 className="text-lg font-semibold mb-1 text-gray-900 dark:text-white">
                {recipe.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                {recipe.description}
              </p>
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
                {/* HIDE "Lataa laskimeen" */}
                {/* <button
                  onClick={() => onLoadFavorite(recipe)}
                  className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                >
                  {t("Load to calculator")}
                </button> */}
                <button
                  onClick={() => saveRecipeAsFavorite(recipe)}
                  className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                >
                  {t("Save as favorite") || "Tallenna suosikiksi"}
                </button>
              </div>

              <details className="w-full mt-2">
                <summary className="cursor-pointer text-sm text-blue-700 hover:underline">
                  {t('Show instructions') || 'Näytä ohjeet'}
                </summary>
                <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md text-sm text-gray-800 dark:text-gray-100 space-y-2">
                  {formatInstructions(recipe.instructions, recipe.fold_timings)}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-3 space-y-1">
                  {recipe.flour_amount && <p>{t("Flour")}: {recipe.flour_amount} g</p>}
                  {recipe.water_amount && <p>{t("Water")}: {recipe.water_amount} g</p>}
                  {recipe.salt_amount && <p>{t("Salt")}: {recipe.salt_amount} g</p>}
                  {recipe.oil_amount && <p>{t("Oil")}: {recipe.oil_amount} g</p>}
                  {recipe.juuri_amount && <p>{t("Starter")}: {recipe.juuri_amount} g</p>}
                  {recipe.seeds_amount && <p>{t("Seeds")}: {recipe.seeds_amount} g</p>}
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
