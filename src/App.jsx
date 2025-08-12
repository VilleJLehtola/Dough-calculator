// src/App.jsx
import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import FrontPage from './pages/FrontPage';
import CalculatorPage from './pages/CalculatorPage';
import FavoritesPage from './pages/FavoritesPage';
import LoginPage from './pages/LoginPage';
import BrowsePage from './pages/BrowsePage';
import RecipeViewPage from './pages/RecipeViewPage';
import supabase from './supabaseClient';
import CreateRecipePage from './pages/CreateRecipePage';
import EditRecipePage from '@/pages/EditRecipePage';

export default function App() {
  const { t } = useTranslation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (isMounted) setUser(user || null);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) setUser(session?.user ?? null);
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe?.();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // user state will be updated by onAuthStateChange listener
  };

  // Since App owns the Router, we can't use useNavigate here.
  // Use a simple hard navigation for the login button in header/mobile.
  const handleLoginClick = () => {
    window.location.href = '/login';
  };

  return (
    <Router>
      <Layout user={user} onLoginClick={handleLoginClick} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<FrontPage />} />
          <Route path="/browse" element={<BrowsePage />} />
          <Route path="/calculator" element={<CalculatorPage />} />
          <Route path="/favorites" element={<FavoritesPage user={user} />} />
          <Route path="/login" element={<LoginPage setUser={setUser} />} />
          <Route path="/create" element={<CreateRecipePage />} />
          <Route path="/recipe/:id/edit" element={<EditRecipePage />} />


          {/* New canonical route */}
          <Route path="/recipe/:id" element={<RecipeViewPage />} />
          {/* Legacy alias so old links keep working */}
          <Route path="/resepti/:id" element={<RecipeViewPage />} />

          {/* Fallback */}
          <Route path="*" element={<FrontPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}
