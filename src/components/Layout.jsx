// src/components/Layout.jsx
import Header from '@/components/Header';
import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/supabaseClient';

export default function Layout({ children, user, activeView, setActiveView, logout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const loadSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: userData } = await supabase.from('users').select('role').eq('id', session.user.id).single();
        setIsAdmin(userData?.role === 'admin');
      }
    };
    loadSession();
  }, []);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-100 via-white to-blue-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-gray-900 dark:text-gray-100">
      <div className="w-full max-w-screen-xl mx-auto px-4">
        <Header
          user={user}
          activeView={activeView}
          setActiveView={setActiveView}
          logout={logout}
        />
      </div>
      <main className="flex-grow w-full max-w-screen-xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
