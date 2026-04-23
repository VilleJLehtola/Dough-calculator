import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Frontpage from './components/Frontpage';
import CalculatorPage from './components/CalculatorForm';
import FavoritesList from './components/FavoritesList';
import AdminRecipeEditor from './components/AdminRecipeEditor';
import RecipeViewPage from './components/RecipeViewPage';
import Layout from './components/Layout';
import RequireAuth from './components/auth/RequireAuth';
import RequireAdmin from './components/auth/RequireAdmin';
import supabase from './supabaseClient';

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const bootstrapAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };

    bootstrapAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <Router>
      <Layout user={user} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Frontpage />} />
          <Route path="/calculator" element={<CalculatorPage />} />
          <Route
            path="/favorites"
            element={
              <RequireAuth user={user}>
                <FavoritesList user={user} />
              </RequireAuth>
            }
          />
          <Route
            path="/admin"
            element={
              <RequireAdmin user={user}>
                <AdminRecipeEditor user={user} />
              </RequireAdmin>
            }
          />
          <Route path="/recipe/:id" element={<RecipeViewPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}
