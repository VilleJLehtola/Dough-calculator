import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/supabaseClient';

export default function RecipeViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchRecipe();
  }, [id]);

  const fetchRecipe = async () => {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('id', id)
      .single();

    if (!error) setRecipe(data);
    setLoading(false);
  };

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
            • <strong>Taitto {foldIndex}</strong>{timing ? ` (${timing} min)` : ''}
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

  if (loading) return <p className="text-center mt-10">Ladataan...</p>;
  if (!recipe) return <p className="text-center mt-10">Reseptiä ei löytynyt</p>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <button
        onClick={() => navigate(-1)}
        className="text-sm text-blue-600 hover:underline mb-4"
      >
        ← Takaisin
      </button>

      <h1 className="text-3xl font-bold mb-2 dark:text-white">{recipe.title}</h1>

      {recipe.description && (
        <p className="mb-4 text-gray-700 dark:text-gray-300 italic">
          {recipe.description}
        </p>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        {(recipe.tags || []).map((tag) => (
          <span
            key={tag}
            className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs dark:bg-blue-900 dark:text-white"
          >
            {tag}
          </span>
        ))}
      </div>

      <h2 className="text-lg font-semibold mb-2 dark:text-white">Ainekset</h2>
      <ul className="list-disc list-inside text-sm text-gray-800 dark:text-gray-200 space-y-1 mb-4">
        {recipe.flour_amount && <li>Jauho: {recipe.flour_amount} g</li>}
        {recipe.water_amount && <li>Vesi: {recipe.water_amount} g</li>}
        {recipe.salt_amount && <li>Suola: {recipe.salt_amount} g</li>}
        {recipe.oil_amount && <li>Öljy: {recipe.oil_amount} g</li>}
        {recipe.juuri_amount && <li>Juuri: {recipe.juuri_amount} g</li>}
        {recipe.seeds_amount && <li>Siemenet: {recipe.seeds_amount} g</li>}
      </ul>

      <h2 className="text-lg font-semibold mb-2 dark:text-white">Ohjeet</h2>
      <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-md text-sm text-gray-800 dark:text-gray-200 space-y-1">
        {formatInstructions(recipe.instructions, recipe.fold_timings)}
      </div>
    </div>
  );
}
