// src/pages/FrontPage.jsx
import { useEffect, useState } from 'react';
import supabase from '@/supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function FrontPage() {
  const [recipes, setRecipes] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecipes = async () => {
      const { data, error } = await supabase
        .from('recipes')
        .select('id, title, description')
        .order('created_at', { ascending: false })
        .limit(6);

      if (!error) setRecipes(data);
    };
    fetchRecipes();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Uusimmat reseptit</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {recipes.map((recipe) => (
          <div
            key={recipe.id}
            className="p-4 border rounded-lg shadow hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
            onClick={() => navigate(`/recipe/${recipe.id}`)}
          >
            <h2 className="text-lg font-semibold">{recipe.title}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">{recipe.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
