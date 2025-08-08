// Frontpage.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import supabase from "../supabase";
import RecipeCard from "./RecipeCard";

export default function Frontpage() {
  const [latestRecipes, setLatestRecipes] = useState([]);

  useEffect(() => {
    const fetchLatest = async () => {
      const { data } = await supabase
        .from("recipes")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(6);
      setLatestRecipes(data || []);
    };

    fetchLatest();
  }, []);

  return (
    <div className="space-y-10">
      <h1 className="text-3xl font-bold">Latest Recipes</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {latestRecipes.map((recipe) => (
          <Link key={recipe.id} to={`/recipe/${recipe.id}`}>
            <RecipeCard
              title={recipe.title}
              subtitle={recipe.description}
              image={recipe.image_url}
              recipeId={recipe.id}
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
