import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import RecipeCard from './RecipeCard';

export default function FavoritesGrid({ userId }) {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFavorites() {
      setLoading(true);

      // Step 1: Get favorite entries
      const { data: favData, error: favError } = await supabase
        .from('favorites')
        .select('recipe_id')
        .eq('user_id', userId);

      if (favError) {
        console.error('Error fetching favorites:', favError);
        setLoading(false);
        return;
      }

      if (!favData.length) {
        setFavorites([]);
        setLoading(false);
        return;
      }

      const recipeIds = favData.map((f) => f.recipe_id);

      // Step 2: Get recipe details in a single query
      const { data: recipeData, error: recipeError } = await supabase
        .from('recipes')
        .select('*')
        .in('id', recipeIds);

      if (recipeError) {
        console.error('Error fetching favorite recipes:', recipeError);
      } else {
        // Keep order same as favorites
        const sortedRecipes = recipeIds
          .map((id) => recipeData.find((r) => r.id === id))
          .filter(Boolean);

        setFavorites(sortedRecipes);
      }

      setLoading(false);
    }

    if (userId) {
      fetchFavorites();
    }
  }, [userId]);

  if (loading) return <p>Loading favorites...</p>;
  if (!favorites.length) return <p>No favorites yet.</p>;

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {favorites.map((recipe) => (
        <RecipeCard key={recipe.id} recipe={recipe} />
      ))}
    </div>
  );
}
