//SharedFavoritePage.jsx

import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/supabaseClient';

import CalculatorForm from './CalculatorForm';
import ResultDisplay from './ResultDisplay';
import RecipeView from './RecipeView';

export default function SharedFavoritePage() {
  const { userId, favoriteName } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [favorite, setFavorite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [foldsDone, setFoldsDone] = useState(0);
  const [user, setUser] = useState(null);

  const [hydration, setHydration] = useState(75);
  const [saltPct, setSaltPct] = useState(2);
  const flourAmount = parseFloat(searchParams.get('flour')) || 500;

  useEffect(() => {
    const fetchFavorite = async () => {
      const { data: fav, error } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', userId)
        .eq('name', favoriteName)
        .single();

      if (error || !fav) {
        console.error('Favorite not found:', error);
        setLoading(false);
        return;
      }

      if (fav.recipe_id) {
        navigate(`/recipe/${fav.recipe_id}`, { replace: true });
        return;
      }

      setFavorite(fav);
      setHydration(fav.hydration || 75);
      setSaltPct(fav.salt_pct || 2);
      setLoading(false);
    };

    const getCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) setUser(session.user);
    };

    fetchFavorite();
    getCurrentUser();
  }, [userId, favoriteName, navigate]);

  if (loading) return <p className="text-center text-white">Ladataan jaettua suosikkia...</p>;
  if (!favorite) return <p className="text-center text-red-500">Suosikkia ei löytynyt.</p>;

  const h = hydration / 100;
  const s = saltPct / 100;
  const jauho = flourAmount;
  const vesi = h * jauho;
  const suola = jauho * s;
  const juuri = jauho * 0.2;
  const öljy = favorite.use_oil ? jauho * 0.03 : 0;
  const siemenet = favorite.use_seeds ? jauho * 0.15 : 0;
  const yhteensa = jauho + vesi + suola + juuri + öljy + siemenet;

  const jauhotyypit = favorite.mode === 'pizza'
    ? { '00-jauho': jauho * (1000 / 1070), puolikarkea: jauho * (70 / 1070) }
    : favorite.use_rye
      ? { ruis: jauho * 0.2, puolikarkea: jauho * 0.8 }
      : { puolikarkea: jauho * (500 / 620), täysjyvä: jauho * (120 / 620) };

  const result = { jauho, vesi, suola, juuri, öljy, yhteensa, jauhotyypit, siemenet };

  const saveToMyFavorites = async () => {
    if (!user) return alert("Kirjaudu sisään tallentaaksesi suosikin.");

    const newName = prompt("Anna suosikille nimi:");
    if (!newName) return;

    const { error } = await supabase.from('favorites').insert([{
      user_id: user.id,
      name: newName,
      hydration,
      salt_pct: saltPct,
      mode: favorite.mode,
      use_oil: favorite.use_oil,
      use_rye: favorite.use_rye,
      use_seeds: favorite.use_seeds,
      cold_fermentation: favorite.cold_fermentation,
    }]);

    if (error) {
      console.error('Tallennus epäonnistui:', error);
      alert("Suosikin tallennus epäonnistui.");
    } else {
      alert("Suosikki tallennettu!");
    }
  };

  return (
    <>
      <h2 className="text-xl font-semibold text-center text-white">
        Jaettu suosikki: {favorite.name}
      </h2>

      <CalculatorForm
        inputGrams={String(flourAmount)}
        setInputGrams={() => {}}
        inputType="jauho"
        setInputType={() => {}}
        hydration={hydration}
        setHydration={setHydration}
        saltPct={saltPct}
        setSaltPct={setSaltPct}
        mode={favorite.mode}
        setMode={() => {}}
        useOil={favorite.use_oil}
        setUseOil={() => {}}
        coldFermentation={favorite.cold_fermentation}
        setColdFermentation={() => {}}
        useRye={favorite.use_rye}
        setUseRye={() => {}}
        useSeeds={favorite.use_seeds}
        setUseSeeds={() => {}}
        showRecipe={true}
        setShowRecipe={() => {}}
        resetAll={() => {}}
        readOnly
      />

      <ResultDisplay result={result} />

      <RecipeView
        doughType={favorite.mode}
        useSeeds={favorite.use_seeds}
        coldFermentation={favorite.cold_fermentation}
        foldsDone={foldsDone}
        setFoldsDone={setFoldsDone}
        useOil={favorite.use_oil}
      />

      {user && (
        <div className="mt-4 text-center">
          <button
            onClick={saveToMyFavorites}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded shadow transition"
          >
            Tallenna omaan suosikkeihin
          </button>
        </div>
      )}
    </>
  );
}
