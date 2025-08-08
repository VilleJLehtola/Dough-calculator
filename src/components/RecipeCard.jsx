// RecipeCard.jsx
import { useEffect, useState } from "react";
import supabase from "../supabaseClient";


export default function RecipeCard({ title, subtitle, image, recipeId }) {
  const [likes, setLikes] = useState(0);

  useEffect(() => {
    const fetchLikes = async () => {
      const { count } = await supabase
        .from("recipe_likes")
        .select("*", { count: "exact", head: true })
        .eq("recipe_id", recipeId);
      setLikes(count || 0);
    };

    fetchLikes();
  }, [recipeId]);

  return (
    <div className="rounded overflow-hidden shadow bg-white dark:bg-gray-800">
      <div className="h-40 w-full bg-gray-200 dark:bg-gray-700">
        <img src={image} alt={title} className="h-full w-full object-cover" />
      </div>
      <div className="p-3 space-y-1">
        <div className="font-semibold truncate">{title}</div>
        <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
          {subtitle}
        </div>
        <div className="text-xs text-gray-400">❤️ {likes} likes</div>
      </div>
    </div>
  );
}
