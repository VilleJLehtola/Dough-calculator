import React, { useState, useEffect } from 'react';
import './index.css';
import { createClient } from '@supabase/supabase-js';
import { GiHamburgerMenu } from 'react-icons/gi';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function App() {
  const [inputGrams, setInputGrams] = useState('');
  const [inputType, setInputType] = useState('flour');
  const [hydration, setHydration] = useState(65);
  const [saltPct, setSaltPct] = useState(2);
  const [mode, setMode] = useState('bread');
  const [foldsDone, setFoldsDone] = useState(0);
  const [showRecipe, setShowRecipe] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);
  const [showFavorites, setShowFavorites] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [useRye, setUseRye] = useState(false);
  const [useSeeds, setUseSeeds] = useState(false);
  const [coldFermentation, setColdFermentation] = useState(false);
  const [oilPct, setOilPct] = useState(3);

  const reset = () => {
    setInputGrams('');
    setFoldsDone(0);
    setShowRecipe(false);
  };

  const fetchUser = async () => {
    const { data } = await supabase.auth.getUser();
    setUser(data?.user || null);
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) fetchUser();
  };

  const handleRegister = async () => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (!error) fetchUser();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const saveFavorite = async () => {
    if (!user) return;
    await supabase.from('favorites').insert({
      user_id: user.id,
      input_grams: inputGrams,
      hydration,
      salt: saltPct,
      type: inputType,
      mode,
      oil: oilPct,
      cold_fermentation: coldFermentation,
      rye: useRye,
      seeds: useSeeds
    });
    fetchFavorites();
  };

  const fetchFavorites = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', user.id);
    setFavorites(data || []);
  };

  useEffect(() => {
    if (user) fetchFavorites();
  }, [user]);

  const calculate = () => {
    const grams = parseFloat(inputGrams);
    if (isNaN(grams) || grams <= 0) return null;
    const h = Math.max(55, hydration) / 100;
    const s = saltPct / 100;
    const oil = mode === 'pizza' ? oilPct / 100 : 0;

    let flour, water;
    if (inputType === 'flour') {
      flour = grams;
      water = flour * h;
    } else {
      water = grams;
      flour = water / h;
    }

    const salt = flour * s;
    const starter = flour * 0.2;
    const oilAmount = flour * oil;
    const seeds = useSeeds ? flour * 0.15 : 0;
    const rye = useRye && mode === 'bread' ? flour * 0.2 : 0;

    return {
      flour,
      water,
      salt,
      starter,
      total: flour + water + salt + starter + oilAmount + seeds,
      oil: oilAmount,
      seeds,
      rye,
      types: mode === 'pizza'
        ? { '00-jauho': flour * 0.93, 'puolikarkea': flour * 0.07 }
        : useRye
        ? { 'puolikarkea': flour * 0.8, 'ruisjauho': rye }
        : { 'puolikarkea': flour * 0.8, 'täysjyvä': flour * 0.2 }
    };
  };

  const result = calculate();

  return (
    <div className="bg-gray-100 min-h-screen p-4 text-gray-800">
      <div className="max-w-md mx-auto mt-10 bg-white p-6 rounded-xl shadow-md relative overflow-hidden transition-all duration-500">
        <div className="flex justify-between mb-4 items-center">
          <h1 className="text-2xl font-bold">🥖 Taikinalaskin</h1>
          <div className="flex items-center gap-2">
            <GiHamburgerMenu
              onClick={() => setShowFavorites(!showFavorites)}
              className="text-xl cursor-pointer"
            />
            {user ? (
              <button onClick={handleLogout} className="text-sm underline">Logout</button>
            ) : (
              <button onClick={() => setShowLogin(!showLogin)} className="text-sm underline">Login</button>
            )}
          </div>
        </div>

        {showLogin && (
          <div className="space-y-2 mb-4">
            <input
              type="email"
              placeholder="Email"
              className="input"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              className="input"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <div className="flex gap-2">
              <button className="btn" onClick={handleLogin}>Login</button>
              <button className="btn" onClick={handleRegister}>Register</button>
            </div>
          </div>
        )}

        {!showFavorites && (
          <>
            <div className="flex justify-center mb-3">
              <button
                className={`px-4 py-1 rounded-full ${mode === 'pizza' ? 'bg-gray-300' : 'bg-green-500 text-white'}`}
                onClick={() => setMode('bread')}
              >
                Bread
              </button>
              <button
                className={`px-4 py-1 ml-2 rounded-full ${mode === 'pizza' ? 'bg-green-500 text-white' : 'bg-gray-300'}`}
                onClick={() => setMode('pizza')}
              >
                Pizza
              </button>
            </div>

            <div className="flex justify-center mb-3">
              <button
                className={`px-2 py-1 rounded ${inputType === 'flour' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                onClick={() => setInputType('flour')}
              >
                Flour
              </button>
              <button
                className={`px-2 py-1 ml-2 rounded ${inputType === 'water' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                onClick={() => setInputType('water')}
              >
                Water
              </button>
            </div>

            <input
              type="number"
              value={inputGrams}
              onChange={e => setInputGrams(e.target.value)}
              placeholder="Enter amount"
              className="input"
            />

            <div className="flex gap-2 my-2">
              <input
                type="number"
                min={55}
                value={hydration}
                onChange={e => setHydration(Number(e.target.value))}
                className="input"
                placeholder="Hydration %"
              />
              <input
                type="number"
                value={saltPct}
                onChange={e => setSaltPct(Number(e.target.value))}
                className="input"
                placeholder="Salt %"
              />
            </div>

            {mode === 'pizza' && (
              <input
                type="number"
                value={oilPct}
                onChange={e => setOilPct(Number(e.target.value))}
                className="input"
                placeholder="Oil %"
              />
            )}

            {mode === 'bread' && (
              <>
                <label><input type="checkbox" checked={useRye} onChange={() => setUseRye(!useRye)} /> Käytä ruisjauhoja</label><br />
                <label><input type="checkbox" checked={useSeeds} onChange={() => setUseSeeds(!useSeeds)} /> Lisää siemeniä</label><br />
              </>
            )}

            <label><input type="checkbox" checked={coldFermentation} onChange={() => setColdFermentation(!coldFermentation)} /> Kylmäfermentointi</label>

            <div className="flex gap-2 my-3">
              <button onClick={() => setShowRecipe(!showRecipe)} className="btn">
                {showRecipe ? "Hide" : "Show"} Recipe
              </button>
              {user && <button className="btn" onClick={saveFavorite}>⭐ Save Favorite</button>}
              <button onClick={reset} className="btn">Reset</button>
            </div>

            {result && (
              <div className="bg-gray-50 p-3 rounded-lg shadow-inner mt-4 space-y-1">
                <p>💧 Water: {result.water.toFixed(1)} g</p>
                <p>🧂 Salt: {result.salt.toFixed(1)} g</p>
                <p>🍞 Starter: {result.starter.toFixed(1)} g</p>
                {result.oil > 0 && <p>🫒 Oil: {result.oil.toFixed(1)} g</p>}
                {result.seeds > 0 && <p>🌻 Seeds: {result.seeds.toFixed(1)} g</p>}
                <p>Total: {result.total.toFixed(1)} g</p>
                <p className="mt-2 font-semibold">Flour types:</p>
                <ul className="pl-4">
                  {Object.entries(result.types).map(([name, val]) => (
                    <li key={name}>{name}: {val.toFixed(1)} g</li>
                  ))}
                </ul>
              </div>
            )}

            {showRecipe && (
              <div className="mt-4 transition-all duration-500 ease-in-out">
                <p>1. Mix flour and water, rest 30 min.</p>
                <p>2. Add starter and salt.</p>
                <p>3. Folds: 30min, 30min, 45min, 60min.</p>
                <div className="flex gap-1 my-2">
                  {[1, 2, 3, 4].map(n => (
                    <input
                      key={n}
                      type="checkbox"
                      checked={foldsDone >= n}
                      onChange={() => setFoldsDone(f => f === n ? n - 1 : Math.max(n, f))}
                    />
                  ))}
                </div>
                {useSeeds && <p>🌻 Add seeds before last fold.</p>}
                <p>{coldFermentation ? "Cold ferment overnight" : "Let rise and bake at 230°C"}</p>
              </div>
            )}
          </>
        )}

        {showFavorites && (
          <div className="mt-4 space-y-2">
            <h2 className="font-semibold text-lg">⭐ Favorites</h2>
            {favorites.length === 0 ? (
              <p>No saved favorites</p>
            ) : (
              favorites.map((fav, idx) => (
                <div key={idx} className="p-2 bg-gray-100 rounded-md text-sm">
                  {fav.mode} – {fav.input_grams}g {fav.type}, hyd: {fav.hydration}%
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
