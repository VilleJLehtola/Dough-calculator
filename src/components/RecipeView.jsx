// RecipeViewPage.jsx
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import supabase from "../supabase";

export default function RecipeViewPage() {
  const { id } = useParams();
  const [recipe, setRecipe] = useState(null);
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  useEffect(() => {
    const fetchRecipe = async () => {
      const { data } = await supabase.from("recipes").select("*").eq("id", id).single();
      setRecipe(data);
    };

    const fetchLikes = async () => {
      const { count } = await supabase
        .from("recipe_likes")
        .select("*", { count: "exact", head: true })
        .eq("recipe_id", id);
      setLikes(count || 0);

      if (user) {
        const { data } = await supabase
          .from("recipe_likes")
          .select("*")
          .eq("recipe_id", id)
          .eq("user_id", user.id)
          .maybeSingle();
        setLiked(!!data);
      }
    };

    fetchRecipe();
    fetchLikes();
  }, [id, user]);

  const handleLike = async () => {
    if (!user || liked) return;
    await supabase.from("recipe_likes").insert({
      recipe_id: id,
      user_id: user.id,
    });
    setLiked(true);
    setLikes((prev) => prev + 1);
  };

  if (!recipe) return <div>Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">{recipe.title}</h1>
      <img src={recipe.image_url} className="w-full rounded" />
      <p className="text-gray-600 dark:text-gray-300">{recipe.description}</p>

      {user && (
        <button
          className={`px-4 py-2 rounded ${liked ? "bg-gray-400" : "bg-red-500 text-white"}`}
          onClick={handleLike}
          disabled={liked}
        >
          {liked ? "Liked ❤️" : "Like ❤️"}
        </button>
      )}
      <div className="text-sm text-gray-500">Total likes: {likes}</div>
    </div>
  );
}
