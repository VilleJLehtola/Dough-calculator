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
