import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import supabase from '@/supabaseClient';

export default function Header({ user }) {
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!user?.id) {
        setDisplayName('');
        return;
      }
      // try to read username from your public.users table
      const { data, error } = await supabase
        .from('users')
        .select('username')
        .eq('id', user.id)
        .single();

      if (!active) return;

      if (!error && data?.username) {
        setDisplayName(data.username);
      } else {
        // fallback to auth email if username not found
        setDisplayName(user.email || '');
      }
    };

    load();
    return () => { active = false; };
  }, [user?.id, user?.email]);

  return (
    <header className="w-full flex items-center justify-between px-4 md:px-6 h-14 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      {/* Left: Logo */}
      <div className="flex items-center gap-3">
        <Link to="/" className="text-xl font-bold text-gray-900 dark:text-white">
          Everything Dough
        </Link>
      </div>

      {/* Right: username if logged in */}
      <div className="flex items-center gap-3">
        {user ? (
          <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
            {displayName}
          </span>
        ) : null}
      </div>
    </header>
  );
}
