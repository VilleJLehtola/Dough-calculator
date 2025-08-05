// src/components/EditRecipePage.jsx
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

  if (loading) return <p className="text-center">Ladataan...</p>;
  if (notFound) return <p className="text-center text-red-500">Reseptiä ei löytynyt.</p>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Muokkaa reseptiä: {recipe.title}</h2>
      <AdminRecipeEditor user={user} existingRecipe={recipe} />
    </div>
  );
}
