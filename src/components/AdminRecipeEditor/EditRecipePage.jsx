import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import AdminRecipeEditor from './AdminRecipeEditor';

export default function EditRecipePage({ user }) {
  const { id } = useParams();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRecipe = async () => {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error loading recipe:', error);
      } else {
        setRecipe(data);
      }
      setLoading(false);
    };

    loadRecipe();
  }, [id]);

  if (!user || user.email !== 'ville.j.lehtola@gmail.com') return <p className="text-center mt-10">Ei oikeuksia</p>;
  if (loading) return <p className="text-center mt-10">Ladataan...</p>;
  if (!recipe) return <p className="text-center mt-10">Reseptiä ei löytynyt</p>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-blue-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-10 px-4 text-gray-900 dark:text-gray-100">
      <div className="bg-white dark:bg-gray-800 shadow-xl rounded-xl max-w-2xl w-full mx-auto p-6 space-y-6 border border-blue-200 dark:border-gray-700">
        <h1 className="text-2xl font-semibold mb-4">Muokkaa reseptiä</h1>
        <AdminRecipeEditor user={user} existingRecipe={recipe} />
      </div>
    </div>
  );
}
