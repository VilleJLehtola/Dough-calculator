import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import AdminRecipeEditor from './AdminRecipeEditor';
import { supabase } from '../supabaseClient';

export default function EditRecipePage({ user }) {
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
        console.error('Reseptiä ei löytynyt:', error);
        setRecipe(null);
      } else {
        setRecipe(data);
      }
      setLoading(false);
    };

    fetchRecipe();
  }, [id]);

  if (loading) return <p className="text-center mt-8">Ladataan...</p>;
  if (!recipe) return (
    <div className="text-red-500 text-center mt-10 bg-gray-800 p-4 rounded-lg">
      Reseptiä ei löytynyt.
    </div>
  );

  return (
    <AdminRecipeEditor user={user} existingRecipe={recipe} />
  );
}
