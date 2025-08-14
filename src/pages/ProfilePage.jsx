// src/pages/ProfilePage.jsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import supabase from '@/supabaseClient';
import FavoritesGrid from '@/components/profile/FavoritesGrid';
import RecipeGrid from '@/components/profile/RecipeGrid';
import { Button } from '@/components/ui/button';

export default function ProfilePage({ session, onLogout }) {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ recipes: 0, favorites: 0 });
  const [activeTab, setActiveTab] = useState('recipes');
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);

      // 1) Fetch user profile
      const { data: userRow, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

      if (error || !userRow) {
        console.error(error);
        setProfile(null);
        setLoading(false);
        return;
      }

      setProfile(userRow);
      setIsOwner(session?.user?.id === userRow.id);

      // 2) Count recipes (try multiple author cols)
      const recipeCount = async (uid) => {
        for (const col of ['user_id', 'author_id', 'created_by']) {
          const { count, error } = await supabase
            .from('recipes')
            .select('id', { count: 'exact', head: true })
            .eq(col, uid);
          if (!error && typeof count === 'number') return count;
        }
        return 0;
      };

      // 3) Count favorites
      const favCount = async (uid) => {
        const { count, error } = await supabase
          .from('favorites')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', uid);
        return !error && typeof count === 'number' ? count : 0;
      };

      const [rc, fc] = await Promise.all([recipeCount(userRow.id), favCount(userRow.id)]);
      setStats({ recipes: rc, favorites: fc });
      setLoading(false);
    })();
  }, [username, session?.user?.id]);

  if (loading) {
    return <div className="p-6 text-gray-500 dark:text-gray-400">Loading profile…</div>;
  }

  if (!profile) {
    return <div className="p-6 text-red-500">Profile not found.</div>;
  }

  return (
    <div className="p-6">
      {/* Profile header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold">
            {profile.username?.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{profile.username}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Joined {new Date(profile.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-gray-700 dark:text-gray-300">{stats.recipes} Recipes</div>
          <div className="text-gray-700 dark:text-gray-300">{stats.favorites} Favorites</div>
          {isOwner && (
            <Button asChild>
              <a href="/create-recipe">Create</a>
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 border-b border-gray-200 dark:border-gray-700 flex gap-6">
        <button
          onClick={() => setActiveTab('recipes')}
          className={`pb-2 ${
            activeTab === 'recipes'
              ? 'border-b-2 border-blue-500 text-blue-500'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          Recipes
        </button>
        <button
          onClick={() => setActiveTab('favorites')}
          className={`pb-2 ${
            activeTab === 'favorites'
              ? 'border-b-2 border-blue-500 text-blue-500'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          Favorites
        </button>
        {isOwner && (
          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-2 ${
              activeTab === 'settings'
                ? 'border-b-2 border-blue-500 text-blue-500'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            Settings
          </button>
        )}
      </div>

      {/* Tab content */}
      <div className="mt-6">
        {activeTab === 'recipes' && <RecipeGrid userId={profile.id} />}
        {activeTab === 'favorites' && (
          <FavoritesGrid userId={profile.id} isOwner={isOwner} />
        )}
        {activeTab === 'settings' && isOwner && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Profile settings</h2>
            <Button
              variant="destructive"
              className="mt-4"
              onClick={onLogout}
            >
              Logout
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
