import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import RecipeCard from './RecipeCard';

export default function RecipeGrid({ userId }) {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecipes() {
      setLoading(true);
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('author_id', userId) // ✅ ensure correct filtering
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching recipes:', error);
      } else {
        setRecipes(data || []);
      }
      setLoading(false);
    }

    if (userId) {
      fetchRecipes();
    }
  }, [userId]);

  if (loading) return <p>Loading recipes...</p>;
  if (!recipes.length) return <p>No recipes yet.</p>;

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {recipes.map((recipe) => (
        <RecipeCard key={recipe.id} recipe={recipe} />
      ))}
    </div>
  );
}
