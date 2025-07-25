// src/App.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Header from './components/Header';
import AuthForm from './components/AuthForm';
import CalculatorForm from './components/CalculatorForm';
import ResultDisplay from './components/ResultDisplay';
import RecipeView from './components/RecipeView';
import FavoritesList from './components/FavoritesList';

export default function App() {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
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
  const [activeView, setActiveView] = useState('calculator');
  const [favoriteName, setFavoriteName] = useState('');
  const [showFavoriteForm, setShowFavoriteForm] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
    };

    fetchSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

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

    let jauhotyypit = {};
    if (mode === 'pizza') {
      jauhotyypit = {
        '00-jauho': jauho * (1000 / 1070),
        puolikarkea: jauho * (70 / 1070),
      };
    } else {
      jauhotyypit = useRye
        ? {
            ruis: jauho * 0.2,
            puolikarkea: jauho * 0.8,
          }
        : {
            puolikarkea: jauho * (500 / 620),
            täysjyvä: jauho * (120 / 620),
          };
    }

    return {
      jauho,
      vesi,
      suola,
      juuri,
      oljy,
      yhteensa,
      jauhotyypit,
      seeds,
    };
  };

  const result = calculate();

  const saveFavorite = async () => {
    if (!favoriteName || !user) return;
    const { error } = await supabase.from('favorites').insert({
      user_id: user.id,
      name: favoriteName,
      input_grams: inputGrams,
      input_type: inputType,
      hydration,
      salt_pct: saltPct,
      mode,
      use_oil: useOil,
      cold_fermentation: coldFermentation,
      use_rye: useRye,
      use_seeds: useSeeds,
    });

    if (!error) {
      setFavoriteName('');
      setShowFavoriteForm(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-blue-200 flex items-start justify-center py-10 px-4">
      <div className="bg-white shadow-2xl rounded-xl max-w-xl w-full p-6 space-y-6 border border-blue-200 transition-all duration-300 ease-in-out">
        <Header user={user} setUser={setUser} activeView={activeView} setActiveView={setActiveView} />

        {!user && <AuthForm />}
        {user && activeView === 'favorites' && <FavoritesList user={user} setActiveView={setActiveView} />}
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
              <>
                <button
                  className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition"
                  onClick={() => setShowFavoriteForm(!showFavoriteForm)}
                >
                  {showFavoriteForm ? 'Peruuta' : 'Tallenna suosikiksi'}
                </button>
                {showFavoriteForm && (
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="text"
                      placeholder="Anna nimi suosikille"
                      className="border border-gray-300 rounded px-2 py-1"
                      value={favoriteName}
                      onChange={(e) => setFavoriteName(e.target.value)}
                    />
                    <button
                      className="bg-blue-600 text-white py-1 px-3 rounded hover:bg-blue-700 transition"
                      onClick={saveFavorite}
                    >
                      Tallenna
                    </button>
                  </div>
                )}
              </>
            )}

            {result && <ResultDisplay result={result} />}

            {showRecipe && (
              <RecipeView
                mode={mode}
                useSeeds={useSeeds}
                coldFermentation={coldFermentation}
                foldsDone={foldsDone}
                setFoldsDone={setFoldsDone}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
