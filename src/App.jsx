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
  const [favName, setFavName] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Expose supabase to window for manual testing in DevTools
    window.supabase = supabase;

    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const loggedInUser = session?.user ?? null;
      setUser(loggedInUser);

      if (loggedInUser) {
        await supabase.from('users').upsert([
          { id: loggedInUser.id, email: loggedInUser.email }
        ]);
      }
    };
    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const loggedInUser = session?.user ?? null;
      setUser(loggedInUser);

      if (loggedInUser) {
        await supabase.from('users').upsert([
          { id: loggedInUser.id, email: loggedInUser.email }
        ]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    console.log('👤 User state updated:', user);
  }, [user]);

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout failed:', error.message);
    } else {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Session after logout:', session); // should be null
      setUser(null);
      setActiveView('calculator');
    }
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

    let jauhotyypit = {};
    if (mode === 'pizza') {
      jauhotyypit = {
        '00-jauho': jauho * (1000 / 1070),
        puolikarkea: jauho * (70 / 1070),
      };
    } else {
      jauhotyypit = useRye
        ? { ruis: jauho * 0.2, puolikarkea: jauho * 0.8 }
        : { puolikarkea: jauho * (500 / 620), täysjyvä: jauho * (120 / 620) };
    }

    return { jauho, vesi, suola, juuri, oljy, yhteensa, jauhotyypit, seeds };
  };

  const result = calculate();

  const saveFavorite = async () => {
    if (!favName || !user) {
      console.warn('Missing favo
