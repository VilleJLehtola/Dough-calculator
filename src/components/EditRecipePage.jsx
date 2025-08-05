import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/supabaseClient';
import AdminRecipeEditor from './AdminRecipeEditor';

export default function EditRecipePage({ user }) {
  const { id } = useParams();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchRecipe = async () => {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        console.error('Failed to fetch recipe:', error);
        setNotFound(true);
      } else {
        setRecipe(data);
      }

      setLoading(false);
    };

    fetchRecipe();
  }, [id]);

  if (loading) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-300 py-10">
        Ladataan reseptiä...
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="text-center text-red-600 dark:text-red-400 py-10">
        Reseptiä ei löytynyt.
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4 dark:text-white">
        Muokkaa reseptiä: {recipe.title}
      </h2>
      <AdminRecipeEditor user={user} existingRecipe={recipe} />
    </div>
  );
}
