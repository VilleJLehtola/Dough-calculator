// src/App.jsx
import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { supabase } from '@/supabaseClient';

import Layout from '@/components/Layout';
import AuthForm from '@/components/AuthForm';
import ForgotPasswordForm from '@/components/ForgotPasswordForm';
import ResetPassword from '@/components/ResetPassword';
import CalculatorForm from '@/components/CalculatorForm';
import ResultDisplay from '@/components/ResultDisplay';
import RecipeView from '@/components/RecipeView';
import FavoritesList from '@/components/FavoritesList';
import RecipesPage from '@/components/RecipesPage';
import AdminRecipeEditor from '@/components/AdminRecipeEditor';
import RecipeViewPage from '@/components/RecipeViewPage';
import SharedFavoritePage from '@/components/SharedFavoritePage';
import AdminDashboard from '@/components/AdminDashboard';
import EditRecipePage from '@/components/EditRecipePage';

function AppContent() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeView, setActiveView] = useState('calculator');

  const [inputGrams, setInputGrams] = useState('');
  const [inputType, setInputType] = useState('jauho');
  const [hydration, setHydration] = useState(75);
  const [saltPct, setSaltPct] = useState(2);
  const [mode, setMode] = useState('leipa');
  const [useOil, setUseOil] = useState(false);
  const [coldFermentation, setColdFermentation] = useState(false);
  const [useRye, setUseRye] = useState(false);
  const [useSeeds, setUseSeeds] = useState(false);
  const [showRecipe, setShowRecipe] = useState(false);
  const [foldsDone, setFoldsDone] = useState(0);
  const [favName, setFavName] = useState('');
  const [message, setMessage] = useState('');

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  useEffect(() => {
    async function loadSession() {
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
    }

    loadSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => {
            setIsAdmin(data?.role === 'admin');
          });
      } else {
        setUser(null);
        setIsAdmin(false);
        setActiveView('calculator');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    sessionStorage.clear();
    indexedDB.deleteDatabase('supabase-auth-cache');
    setUser(null);
    setIsAdmin(false);
    setActiveView('calculator');
    navigate('/');
  };

  const calculate = () => {
    const grams = parseFloat(inputGrams);
    if (isNaN(grams) || grams <= 0) return null;

    const h = hydration / 100;
    const s = saltPct / 100;
    let jauho, vesi;

    if (inputType === 'jauho') {
      jauho = grams;
      vesi = h * jauho;
    } else {
      vesi = grams;
      jauho = vesi / h;
    }

    const suola = jauho * s;
    const juuri = jauho * 0.2;
    const oljy = mode === 'pizza' && useOil ? jauho * 0.03 : 0;
    const seeds = useSeeds ? jauho * 0.15 : 0;
    const yhteensa = jauho + vesi + suola + juuri + oljy + seeds;

    const jauhotyypit =
      mode === 'pizza'
        ? { '00-jauho': jauho * (1000 / 1070), puolikarkea: jauho * (70 / 1070) }
        : useRye
        ? { ruis: jauho * 0.2, puolikarkea: jauho * 0.8 }
        : { puolikarkea: jauho * (500 / 620), täysjyvä: jauho * (120 / 620) };

    return { jauho, vesi, suola, juuri, öljy: oljy, yhteensa, jauhotyypit, siemenet: seeds };
  };

  const result = calculate();

  return (
    <div className="transition-colors duration-500 min-h-screen bg-gradient-to-br from-blue-100 via-white to-blue-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-gray-900 dark:text-gray-100">
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route
            path="/"
            element={
              <Layout user={user} activeView={activeView} setActiveView={setActiveView} logout={logout}>
                {activeView === 'auth' && <AuthForm setUser={setUser} setActiveView={setActiveView} />}
                {activeView === 'forgot-password' && <ForgotPasswordForm setActiveView={setActiveView} />}
                {activeView === 'reset-password' && <ResetPassword setActiveView={setActiveView} />}
                {activeView === 'calculator' && (
                  <>
                    <CalculatorForm
                      inputGrams={inputGrams}
                      setInputGrams={setInputGrams}
                      inputType={inputType}
                      setInputType={setInputType}
                      hydration={hydration}
                      setHydration={setHydration}
                      saltPct={saltPct}
                      setSaltPct={setSaltPct}
                      mode={mode}
                      setMode={setMode}
                      useOil={useOil}
                      setUseOil={setUseOil}
                      coldFermentation={coldFermentation}
                      setColdFermentation={setColdFermentation}
                      useRye={useRye}
                      setUseRye={setUseRye}
                      useSeeds={useSeeds}
                      setUseSeeds={setUseSeeds}
                      showRecipe={showRecipe}
                      setShowRecipe={setShowRecipe}
                      resetAll={() => {
                        setInputGrams('');
                        setInputType('jauho');
                        setHydration(75);
                        setSaltPct(2);
                        setMode('leipa');
                        setUseOil(false);
                        setColdFermentation(false);
                        setUseRye(false);
                        setUseSeeds(false);
                        setShowRecipe(false);
                        setFoldsDone(0);
                        setFavName('');
                        setMessage('');
                      }}
                    />
                    {showRecipe && result && <ResultDisplay result={result} />}

                  </>
                )}
                {activeView === 'favorites' && (
                  <FavoritesList user={user} onLoadFavorite={() => setActiveView('calculator')} />
                )}
                {activeView === 'recipes' && (
                  <RecipesPage user={user} isAdmin={isAdmin} />
                )}
                {isAdmin && activeView === 'admin' && (
                  <AdminRecipeEditor user={user} />
                )}
              </Layout>
            }
          />
          <Route
            path="/recipe/:id"
            element={
              <Layout user={user} activeView="recipe" setActiveView={setActiveView} logout={logout}>
                <RecipeViewPage user={user} />
              </Layout>
            }
          />
          <Route
            path="/admin-dashboard"
            element={
              <Layout user={user} activeView="admin-dashboard" setActiveView={setActiveView} logout={logout}>
                <AdminDashboard user={user} />
              </Layout>
            }
          />
          <Route
            path="/edit-recipe/:id"
            element={
              <Layout user={user} activeView="edit-recipe" setActiveView={setActiveView} logout={logout}>
                <EditRecipePage user={user} />
              </Layout>
            }
          />
          <Route
            path="/:userId/:favoriteName"
            element={
              <Layout user={user} activeView="shared" setActiveView={setActiveView} logout={logout}>
                <SharedFavoritePage />
              </Layout>
            }
          />
        </Routes>
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
