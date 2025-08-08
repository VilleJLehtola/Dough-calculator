// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import FrontPage from './pages/FrontPage';
import CalculatorPage from './pages/CalculatorPage';
import FavoritesPage from './pages/FavoritesPage';
import LoginPage from './pages/LoginPage';
import BrowsePage from './pages/BrowsePage';
import RecipeViewPage from './pages/RecipeViewPage'; // ✅ new
import { useEffect, useState } from 'react';
import supabase from './supabaseClient';

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <Router>
      <Layout user={user}>
        <Routes>
          <Route path="/" element={<FrontPage />} />
          <Route path="/browse" element={<BrowsePage />} />
          <Route path="/calculator" element={<CalculatorPage />} />
          <Route path="/favorites" element={<FavoritesPage user={user} />} />
          <Route path="/login" element={<LoginPage setUser={setUser} />} />
          <Route path="/resepti/:id" element={<RecipeViewPage />} /> {/* ✅ dynamic recipe page */}
        </Routes>
      </Layout>
    </Router>
  );
}
