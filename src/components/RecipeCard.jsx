import { useEffect, useState } from 'react';
import supabase from '../supabaseClient';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1608198093002-ad4e005484ec?auto=format&fit=crop&w=800&q=80';

export default function RecipeCard({ title, subtitle, image, recipeId }) {
  const [likes, setLikes] = useState(0);
  const [imgSrc, setImgSrc] = useState(image || FALLBACK_IMAGE);

  useEffect(() => {
    setImgSrc(image || FALLBACK_IMAGE);
  }, [image]);

  useEffect(() => {
    const fetchLikes = async () => {
      const { count, error } = await supabase
        .from('recipe_likes')
        .select('*', { count: 'exact', head: true })
        .eq('recipe_id', recipeId);

      if (error) {
        console.error('Could not fetch likes count', error);
        setLikes(0);
        return;
      }

      setLikes(count || 0);
    };

    fetchLikes();
  }, [recipeId]);

  return (
    <div className="rounded overflow-hidden shadow bg-white dark:bg-gray-800">
      <div className="h-40 w-full bg-gray-200 dark:bg-gray-700">
        <img
          src={imgSrc}
          alt={title}
          className="h-full w-full object-cover"
          onError={() => setImgSrc(FALLBACK_IMAGE)}
          loading="lazy"
        />
      </div>
      <div className="p-3 space-y-1">
        <div className="font-semibold truncate">{title}</div>
        <div className="text-sm text-gray-500 dark:text-gray-400 truncate">{subtitle}</div>
        <div className="text-xs text-gray-400">❤️ {likes} likes</div>
      </div>
    </div>
  );
}
