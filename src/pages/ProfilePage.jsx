import { useParams, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import supabase from '@/supabaseClient';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileTabs from '@/components/profile/ProfileTabs';
import RecipeGrid from '@/components/profile/RecipeGrid';
import FavoritesGrid from '@/components/profile/FavoritesGrid';
import ProfileSettings from '@/components/profile/ProfileSettings';

export default function ProfilePage() {
  const { username } = useParams();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'recipes';

  const [profile, setProfile] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [stats, setStats] = useState({ recipes: 0, favorites: 0 });

  useEffect(() => {
    (async () => {
      // 1) load public profile
      const { data: userRow, error } = await supabase
        .from('users')
        .select('id, username, email, created_at, bio, avatar_url')
        .ilike('username', username)
        .single();

      if (error || !userRow) return;

      setProfile(userRow);

      // 2) owner?
      const { data: { user: sessionUser } } = await supabase.auth.getUser();
      setIsOwner(!!sessionUser && sessionUser.id === userRow.id);

      // 3) stats (counts)
      const [{ count: recipesCount }, { count: favCount }] = await Promise.all([
        supabase.from('recipes').select('id', { count: 'exact', head: true }).eq('user_id', userRow.id),
        supabase.from('favorites').select('id', { count: 'exact', head: true }).eq('user_id', userRow.id),
      ]);

      setStats({ recipes: recipesCount || 0, favorites: favCount || 0 });
    })();
  }, [username]);

  if (!profile) return null;

  const setTab = (t) => {
    params.set('tab', t);
    setParams(params, { replace: true });
  };

  return (
    <div className="mx-auto max-w-6xl p-4 space-y-6">
      <ProfileHeader profile={profile} isOwner={isOwner} stats={stats} />
      <ProfileTabs tab={tab} onChange={setTab} isOwner={isOwner} />
      {tab === 'recipes' && <RecipeGrid userId={profile.id} />}
      {tab === 'favorites' && <FavoritesGrid userId={profile.id} isOwner={isOwner} />}
      {tab === 'settings' && isOwner && <ProfileSettings profile={profile} />}
    </div>
  );
}
