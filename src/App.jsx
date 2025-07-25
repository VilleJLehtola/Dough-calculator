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
    if (isNaN(grams) || grams <= 0) {
      return {
        jauho: 0,
        vesi: 0,
        suola: 0,
        juuri: 0,
        oljy: 0,
        yhteensa: 0,
        jauhotyypit: {},
        seeds: 0,
      };
    }

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

            <ResultDisplay result={result} />

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
