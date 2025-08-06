// src/components/Layout.jsx
import Header from '@/components/Header';
import Footer from '@/components/Footer';
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
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single();
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
    <div className="w-full max-w-screen-xl mx-auto px-4">
  <Header user={user} setActiveView={() => {}} activeView={location.pathname} logout={logout} />
</div>

<main className="flex-grow w-full max-w-screen-xl mx-auto px-4 py-8">
  {children}
</main>


      <Footer />
    </div>
  );
}
