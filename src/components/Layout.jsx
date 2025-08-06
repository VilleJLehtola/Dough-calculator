// src/components/Layout.jsx
import Header from '@/components/Header';
import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/supabaseClient';

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const loadSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const { data: userData } = await supabase.from('users').select('role').eq('id', session.user.id).single();
        setIsAdmin(userData?.role === 'admin');
      }
    };
    loadSession();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    sessionStorage.clear();
    indexedDB.deleteDatabase('supabase-auth-cache');
    setUser(null);
    setIsAdmin(false);
    navigate('/');
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-100 via-white to-blue-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-gray-900 dark:text-gray-100">
      <Header user={user} setActiveView={() => {}} activeView={location.pathname} logout={logout} />
      <main className="pt-4">{children}</main>
    </div>
  );
}
