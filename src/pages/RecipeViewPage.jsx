import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import supabase from '@/supabaseClient';

export default function RecipeViewPage() {
  const { id } = useParams();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecipe = async () => {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error loading recipe:', error.message);
      } else {
        setRecipe(data);
      }
      setLoading(false);
    };

    fetchRecipe();
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (!recipe) return <div>Recipe not found.</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white dark:bg-slate-800 rounded shadow">
      <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
        {recipe.title}
      </h1>
      <p className="text-gray-700 dark:text-gray-300 mb-4">{recipe.description}</p>

      <div className="space-y-2">
        <p><strong>Hydration:</strong> {recipe.hydration}%</p>
        <p><strong>Flour:</strong> {recipe.flour}g</p>
        <p><strong>Water:</strong> {recipe.water}g</p>
        <p><strong>Salt:</strong> {recipe.salt}g</p>
        {recipe.seeds && <p><strong>Seeds:</strong> {recipe.seeds}g</p>}
        {/* Add more fields as needed */}
      </div>

      {recipe.instructions && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">Instructions</h2>
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {recipe.instructions}
          </p>
        </div>
      )}
    </div>
  );
}
