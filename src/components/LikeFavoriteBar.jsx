// /src/components/LikeFavoriteBar.jsx
import React, { useEffect, useState } from 'react';
import supabase from '@/supabaseClient';
import { Heart, HeartOff, Bookmark, BookmarkCheck } from 'lucide-react';

export default function LikeFavoriteBar({
  recipeId,
  userId,
  onLoginClick,              // optional; default navigates to /login
  className = '',
  t = (k, d) => d || k,      // optional i18n passthrough
}) {
  const [likeCount, setLikeCount] = useState(0);
  const [favCount, setFavCount]   = useState(0);
  const [liked, setLiked]         = useState(false);
  const [faved, setFaved]         = useState(false);
  const [loading, setLoading]     = useState(true);

  const goLogin = () => (onLoginClick ? onLoginClick() : (window.location.href = '/login'));

  // Load counts + my state
  useEffect(() => {
    let alive = true;
    if (!recipeId) return;

    (async () => {
      setLoading(true);

      // counts
      const { count: lc } = await supabase
        .from('recipe_likes')
        .select('*', { count: 'exact', head: true })
        .eq('recipe_id', recipeId);

      const { count: fc } = await supabase
        .from('favorites')
        .select('*', { count: 'exact', head: true })
        .eq('recipe_id', recipeId);

      if (!alive) return;
      setLikeCount(lc ?? 0);
      setFavCount(fc ?? 0);

      // my state (if logged in)
      if (userId) {
        const { data: lr } = await supabase
          .from('recipe_likes')
          .select('id')
          .eq('recipe_id', recipeId)
          .eq('user_id', userId)
          .maybeSingle();

        const { data: fr } = await supabase
          .from('favorites')
          .select('id')
          .eq('recipe_id', recipeId)
          .eq('user_id', userId)
          .maybeSingle();

        if (!alive) return;
        setLiked(Boolean(lr?.id));
        setFaved(Boolean(fr?.id));
      } else {
        setLiked(false);
        setFaved(false);
      }

      setLoading(false);
    })();

    return () => { alive = false; };
  }, [recipeId, userId]);

  const toggleLike = async () => {
    if (!userId) return goLogin();
    if (liked) {
      // delete my like
      setLiked(false);
      setLikeCount((c) => Math.max(0, c - 1));
      await supabase.from('recipe_likes')
        .delete()
        .eq('recipe_id', recipeId)
        .eq('user_id', userId);
    } else {
      // insert like
      setLiked(true);
      setLikeCount((c) => c + 1);
      const { error } = await supabase
        .from('recipe_likes')
        .insert({ recipe_id: recipeId, user_id: userId });
      // handle unique conflict (23505)
      if (error && error.code !== '23505') {
        // revert optimistic if real error
        setLiked(false);
        setLikeCount((c) => Math.max(0, c - 1));
        console.warn('like insert failed', error);
      }
    }
  };

  const toggleFav = async () => {
    if (!userId) return goLogin();
    if (faved) {
      setFaved(false);
      setFavCount((c) => Math.max(0, c - 1));
      await supabase.from('favorites')
        .delete()
        .eq('recipe_id', recipeId)
        .eq('user_id', userId);
    } else {
      setFaved(true);
      setFavCount((c) => c + 1);
      const { error } = await supabase
        .from('favorites')
        .insert({ recipe_id: recipeId, user_id: userId });
      if (error && error.code !== '23505') {
        setFaved(false);
        setFavCount((c) => Math.max(0, c - 1));
        console.warn('favorite insert failed', error);
      }
    }
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {/* Like */}
      <button
        onClick={toggleLike}
        disabled={loading}
        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-sm border
          ${liked
            ? 'bg-rose-600 text-white border-rose-600'
            : 'border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-800 dark:text-gray-200'
          }`}
        title={liked ? t('unlike','Unlike') : t('like','Like')}
      >
        {liked ? <Heart className="w-4 h-4 fill-current" /> : <Heart className="w-4 h-4" />}
        <span>{likeCount}</span>
      </button>

      {/* Favorite */}
      <button
        onClick={toggleFav}
        disabled={loading}
        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-sm border
          ${faved
            ? 'bg-amber-500 text-white border-amber-500'
            : 'border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-800 dark:text-gray-200'
          }`}
        title={faved ? t('remove_favorite','Remove favorite') : t('add_favorite','Add to favorites')}
      >
        {faved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
        <span>{favCount}</span>
      </button>
    </div>
  );
}
