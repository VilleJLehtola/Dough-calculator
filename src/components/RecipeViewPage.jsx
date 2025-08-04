import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/supabaseClient';
import { FaPizzaSlice, FaBreadSlice } from 'react-icons/fa';

export default function RecipeDetails() {
  const { id } = useParams();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecipe = async () => {
      const { data, error } = await supabase.from('recipes').select('*').eq('id', id).single();
      if (!error) setRecipe(data);
      setLoading(false);
    };
    fetchRecipe();
  }, [id]);

  const renderInstructions = (text, folds = []) => {
    const lines = text.split('\n').filter(Boolean);
    let foldIndex = 0;

    return lines.map((line, idx) => {
      if (/\[FOLD \d+\]/i.test(line)) {
        const timing = folds[foldIndex++] || null;
        return (
          <p key={idx} className="font-semibold text-blue-500 dark:text-blue-300">
            Taitto {foldIndex} {timing ? `(${timing} min)` : ''}
          </p>
        );
      }
      return <p key={idx}>• {line}</p>;
    });
  };

  if (loading) return <p className="text-center">Ladataan...</p>;
  if (!recipe) return <p className="text-center">Reseptiä ei löytynyt.</p>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-blue-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-10 px-4 text-gray-900 dark:text-gray-100">
      <div className="bg-white dark:bg-gray-800 shadow-xl rounded-xl max-w-2xl w-full mx-auto p-6 space-y-6 border border-blue-200 dark:border-gray-700">
        <Link to="/" className="text-blue-500 hover:underline">← Takaisin</Link>

        {/* Recipe Image */}
        {recipe.image_url && (
          <img
            src={recipe.image_url}
            alt={recipe.title}
            className="w-full max-h-96 object-cover rounded-xl shadow-md"
          />
        )}

        <div className="flex items-center gap-3 mt-4">
          {recipe.mode === 'pizza' ? (
            <FaPizzaSlice className="text-yellow-500 text-2xl" />
          ) : (
            <FaBreadSlice className="text-orange-600 text-2xl" />
          )}
          <h1 className="text-3xl font-bold">{recipe.title}</h1>
        </div>

        {recipe.description && (
          <p className="italic text-gray-600 dark:text-gray-400 mt-2 mb-4">{recipe.description}</p>
        )}

        {recipe.tags && recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {recipe.tags.map(tag => (
              <span
                key={tag}
                className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-white px-2 py-0.5 rounded text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded mb-4">
          <h2 className="font-semibold mb-2">Ohjeet</h2>
          <div className="space-y-1">
            {renderInstructions(recipe.instructions, recipe.fold_timings)}
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded space-y-1 text-sm text-white">
          <h2 className="font-semibold mb-2 text-base">Ainekset</h2>
          <ul className="space-y-1">
            {recipe.flour_amount !== null && <li>Jauho: {recipe.flour_amount} g</li>}
            {recipe.water_amount !== null && <li>Vesi: {recipe.water_amount} g</li>}
            {recipe.salt_amount !== null && <li>Suola: {recipe.salt_amount} g</li>}
            {recipe.oil_amount !== null && <li>Öljy: {recipe.oil_amount} g</li>}
            {recipe.juuri_amount !== null && <li>Juuri: {recipe.juuri_amount} g</li>}
            {recipe.seeds_amount !== null && <li>Siemenet: {recipe.seeds_amount} g</li>}
            {recipe.total_time && <li>Kokonaika: {recipe.total_time}</li>}
            {recipe.active_time && <li>Työaika: {recipe.active_time}</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
