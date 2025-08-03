// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { supabase } from '@/supabaseClient';

import Header from '@/components/Header';
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

function AppContent() {
  const [user, setUser] = useState(null);
  const [activeView, setActiveView] = useState('calculator');
  const [inputGrams, setInputGrams] = useState('');
  const [inputType, setInputType] = useState('jauho');
  const [hydration, setHydration] = useState(75);
  const [saltPct, setSaltPct] = useState(2);
  const [mode, setMode] = useState('leipa');
  const [showRecipe, setShowRecipe] = useState(false);
  const [foldsDone, setFoldsDone] = useState(0);
  const [useOil, setUseOil] = useState(false);
  const [coldFermentation, setColdFermentation] = useState(false);
  const [useRye, setUseRye] = useState(false);
  const [useSeeds, setUseSeeds] = useState(false);
  const [favName, setFavName] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const root = document.documentElement;
    if (stored === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  }, []);

  useEffect(() => {
    async function loadSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        await supabase.from('users').upsert([{ id: session.user.id, email: session.user.email }]);
      } else {
        setUser(null);
      }
    }

    loadSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
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
    setActiveView('calculator');
    window.location.reload();
  };

  const resetAll = () => {
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

    const jauhotyypit = mode === 'pizza'
      ? { '00-jauho': jauho * (1000 / 1070), puolikarkea: jauho * (70 / 1070) }
      : useRye
        ? { ruis: jauho * 0.2, puolikarkea: jauho * 0.8 }
        : { puolikarkea: jauho * (500 / 620), täysjyvä: jauho * (120 / 620) };

    return { jauho, vesi, suola, juuri, öljy: oljy, yhteensa, jauhotyypit, siemenet: seeds };
  };

  const result = calculate();

  const saveFavorite = async () => {
    if (!favName || !user?.id) return;

    const username = user.email.split('@')[0];
    const sanitizedFavName = favName.toLowerCase().replace(/\s+/g, '-');

    const { error } = await supabase.from('favorites').insert([{
      user_id: user.id,
      name: favName,
      input_grams: inputGrams,
      input_type: inputType,
      hydration,
      salt_pct: saltPct,
      mode,
      use_oil: useOil,
      cold_fermentation: coldFermentation,
      use_rye: useRye,
      use_seeds: useSeeds,
      is_public: true,
      share_path: `${username}/${sanitizedFavName}`
    }]);

    if (!error) {
      const link = `https://www.breadcalculator.online/${username}/${sanitizedFavName}`;
      setMessage(`Suosikki tallennettu! Jaa linkki: ${link}`);
      setFavName('');
    } else {
      setMessage('Tallennus epäonnistui.');
    }
  };

  const handleLoadFavorite = (fav) => {
    setInputGrams(fav.input_grams);
    setInputType(fav.input_type);
    setHydration(fav.hydration);
    setSaltPct(fav.salt_pct);
    setMode(fav.mode);
    setUseOil(fav.use_oil);
    setColdFermentation(fav.cold_fermentation);
    setUseRye(fav.use_rye);
    setUseSeeds(fav.use_seeds);
    setActiveView('calculator');
  };

  return (
    <Routes>
      <Route
        path="/"
        element={
          <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-blue-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col items-center py-10 px-4 text-gray-900 dark:text-gray-100">
            <div className="bg-white dark:bg-gray-800 shadow-xl rounded-xl max-w-xl w-full p-6 space-y-6 border border-blue-200 dark:border-gray-700 flex flex-col">
              <Header user={user} activeView={activeView} setActiveView={setActiveView} logout={logout} />

              {!user && activeView === 'auth' && <AuthForm setUser={setUser} setActiveView={setActiveView} />}
              {!user && activeView === 'forgot-password' && <ForgotPasswordForm setActiveView={setActiveView} />}
              {!user && activeView === 'reset-password' && <ResetPassword setActiveView={setActiveView} />}

              {user && activeView === 'favorites' && (
                <FavoritesList user={user} onLoadFavorite={handleLoadFavorite} />
              )}

              {user && activeView === 'recipes' && (
                <RecipesPage user={user} onLoadFavorite={handleLoadFavorite} />
              )}

              {user?.email === 'ville.j.lehtola@gmail.com' && activeView === 'admin' && (
                <AdminRecipeEditor user={user} />
              )}

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
                    resetAll={resetAll}
                  />

                  {user && (
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Suosikin nimi"
                        value={favName}
                        onChange={(e) => setFavName(e.target.value)}
                        className="w-full border rounded px-3 py-2 text-sm"
                      />
                      <button
                        onClick={saveFavorite}
                        className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
                      >
                        Tallenna suosikiksi
                      </button>
                      {message && <p className="text-sm text-blue-700 dark:text-blue-300 break-all">{message}</p>}
                    </div>
                  )}

                  {result && <ResultDisplay result={result} />}

                  {showRecipe && result && (
                    <RecipeView
                      doughType={mode}
                      useSeeds={useSeeds}
                      coldFermentation={coldFermentation}
                      foldsDone={foldsDone}
                      setFoldsDone={setFoldsDone}
                      useOil={useOil}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        }
      />
      <Route path="/recipe/:id" element={<RecipeViewPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
