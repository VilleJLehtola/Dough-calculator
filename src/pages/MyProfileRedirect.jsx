import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '@/supabaseClient';

export default function MyProfileRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/'); // or open your auth modal if you want
        return;
      }
      const { data, error } = await supabase
        .from('users')
        .select('username')
        .eq('id', user.id)
        .single();

      if (error || !data?.username) {
        navigate('/'); // fallback
      } else {
        navigate(`/u/${data.username}`);
      }
    })();
  }, [navigate]);

  return null;
}
