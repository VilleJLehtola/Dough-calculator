import React, { useEffect, useState } from "react";
import "./index.css";
import { createClient } from "@supabase/supabase-js";
import { GiHamburgerMenu } from "react-icons/gi";

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_KEY);

export default function App() {
  const [inputGrams, setInputGrams] = useState("");
  const [inputType, setInputType] = useState("flour");
  const [hydration, setHydration] = useState(70);
  const [saltPct, setSaltPct] = useState(2);
  const [mode, setMode] = useState("bread");
  const [useOil, setUseOil] = useState(false);
  const [coldFermentation, setColdFermentation] = useState(false);
  const [useRye, setUseRye] = useState(false);
  const [useSeeds, setUseSeeds] = useState(false);
  const [showRecipe, setShowRecipe] = useState(false);
  const [foldsDone, setFoldsDone] = useState(0);
  const [user, setUser] = useState(null);
  const [view, setView] = useState("calculator"); // 'calculator' or 'favorites'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMode, setAuthMode] = useState("login");
  const [favorites, setFavorites] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleFold = (n) => {
    setFoldsDone(prev => (prev === n ? n - 1 : Math.max(n, prev)));
  };

  const resetAll = () => {
    setInputGrams("");
    setInputType("flour");
    setHydration(70);
    setSaltPct(2);
    setMode("bread");
    setUseOil(false);
    setColdFermentation(false);
    setUseRye(false);
    setUseSeeds(false);
    setShowRecipe(false);
    setFoldsDone(0);
  };

  const handleAuth = async () => {
    const fn = authMode === "login" ? supabase.auth.signInWithPassword : supabase.auth.signUp;
    const { data, error } = await fn({ email, password });
    if (!error) setUser(data.user ?? data.session?.user ?? null);
    else alert(error.message);
  };

  const fetchUser = async () => {
    const { data } = await supabase.auth.getUser();
    setUser(data.user ?? null);
  };

  const saveFavorite = async () => {
    if (!user) return alert("Kirjaudu sisään tallentaaksesi suosikin");
    const settings = {
      user_id: user.id,
      inputGrams,
      inputType,
      hydration,
      saltPct,
      mode,
      useOil,
      coldFermentation,
      useRye,
      useSeeds,
      created_at: new Date().toISOString(),
    };
    await supabase.from("favorites").insert(settings);
    alert("Suosikki tallennettu!");
  };

  const fetchFavorites = async () => {
    if (!user) return;
    const { data } = await supabase.from("favorites").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setFavorites(data ?? []);
  };

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (user) fetchFavorites();
  }, [user]);

  const calculate = () => {
    const grams = parseFloat(inputGrams);
    if (isNaN(grams) || grams <= 0) return {};

    const h = hydration / 100;
    const s = saltPct / 100;

    let flour, water;
    if (inputType === "flour") {
      flour = grams;
      water = flour * h;
    } else {
      water = grams;
      flour = water / h;
    }

    const salt = flour * s;
    const starter = flour * 0.2;
    const oil = useOil ? flour * 0.03 : 0;
    const seeds = useSeeds ? flour * 0.15 : 0;

    const flourTypes = mode === "pizza"
      ? { "00-jauho": flour * (1000 / 1070), puolikarkea: flour * (70 / 1070) }
      : useRye
      ? { puolikarkea: flour * 0.8, ruisjauho: flour * 0.2 }
      : { puolikarkea: flour * (500 / 620), täysjyvä: flour * (120 / 620) };

    const total = flour + water + salt + starter + oil + seeds;

    return { flour, water, salt, starter, oil, seeds, flourTypes, total };
  };

  const result = calculate();

  const foldTimes = ["30 min", "30 min", "45 min", "60 min"];
  const steps = [
    "Sekoita jauhot ja vesi, anna levätä 30 min.",
    "Lisää juuri ja suola, sekoita.",
    "Taittele taikinaa:",
    ...(foldTimes.map((time, i) => `Taitto ${i + 1} – ${time} välein`)),
    useSeeds ? "Lisää siemenet ennen viimeistä taittoa." : null,
    "Muotoile ja kohota.",
    coldFermentation ? "Kohota kylmässä yön yli." : "Anna kohota huoneenlämmössä.",
    "Paista uunissa 230°C."
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 p-4 transition-all duration-500 ease-in-out">
      <div className="max-w-xl mx-auto bg-white p-6 rounded-2xl shadow-md relative border border-blue-100">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold text-blue-700">🥖 Taikinalaskin</h1>
          <div className="flex gap-2 items-center">
            {user ? (
              <span className="text-sm text-gray-500">Hei, {user.email}</span>
            ) : (
              <button onClick={() => setMenuOpen(!menuOpen)}>
                <GiHamburgerMenu className="text-xl text-blue-700" />
              </button>
            )}
          </div>
        </div>

        {menuOpen && (
          <div className="mb-4 space-x-2">
            <button
              onClick={() => setView("calculator")}
              className={`px-4 py-1 rounded ${view === "calculator" ? "bg-blue-200" : "bg-gray-100"}`}
            >
              Laskuri
            </button>
            <button
              onClick={() => setView("favorites")}
              className={`px-4 py-1 rounded ${view === "favorites" ? "bg-blue-200" : "bg-gray-100"}`}
            >
              Suosikit
            </button>
            {!user && (
              <button
                onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}
                className="text-sm text-blue-600 underline ml-2"
              >
                {authMode === "login" ? "Rekisteröidy" : "Kirjaudu"}
              </button>
            )}
          </div>
        )}

        {!user && (
          <div className="bg-blue-50 p-3 rounded mb-4 space-y-2">
            <input className="w-full p-2 border rounded" type="email" placeholder="Sähköposti" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input className="w-full p-2 border rounded" type="password" placeholder="Salasana" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button onClick={handleAuth} className="w-full bg-blue-600 text-white py-2 rounded">
              {authMode === "login" ? "Kirjaudu" : "Rekisteröidy"}
            </button>
          </div>
        )}

        {view === "favorites" && user && (
          <div className="space-y-2">
            <h2 className="text-blue-700 font-bold">Tallennetut suosikit</h2>
            {favorites.map((fav, i) => (
              <div key={i} className="text-sm bg-blue-50 p-2 rounded border">
                {fav.mode} – {fav.inputGrams}g ({fav.inputType}), hydr: {fav.hydration}%, salt: {fav.saltPct}%
              </div>
            ))}
          </div>
        )}

        {view === "calculator" && (
          <>
            <div className="space-y-3">
              <div className="flex gap-2">
                <button onClick={() => setMode("bread")} className={`flex-1 py-2 rounded ${mode === "bread" ? "bg-blue-300" : "bg-gray-100"}`}>Leipä</button>
                <button onClick={() => setMode("pizza")} className={`flex-1 py-2 rounded ${mode === "pizza" ? "bg-blue-300" : "bg-gray-100"}`}>Pizza</button>
              </div>

              <input type="number" value={inputGrams} onChange={(e) => setInputGrams(e.target.value)} placeholder="Gramma määrä" className="w-full p-3 border rounded" />

              <div className="flex gap-2">
                <button onClick={() => setInputType("flour")} className={`flex-1 py-2 rounded ${inputType === "flour" ? "bg-blue-200" : "bg-gray-100"}`}>Jauho</button>
                <button onClick={() => setInputType("water")} className={`flex-1 py-2 rounded ${inputType === "water" ? "bg-blue-200" : "bg-gray-100"}`}>Vesi</button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label>Hydraatio (%)</label>
                  <input type="number" min="55" value={hydration} onChange={(e) => setHydration(e.target.value)} className="w-full p-2 border rounded" />
                </div>
                <div>
                  <label>Suola (%)</label>
                  <input type="number" value={saltPct} onChange={(e) => setSaltPct(e.target.value)} className="w-full p-2 border rounded" />
                </div>
              </div>

              {mode === "pizza" && (
                <label className="block">
                  <input type="checkbox" checked={useOil} onChange={() => setUseOil(!useOil)} className="mr-2" />
                  Lisää öljyä (3%)
                </label>
              )}

              {mode === "bread" && (
                <>
                  <label className="block">
                    <input type="checkbox" checked={useRye} onChange={() => setUseRye(!useRye)} className="mr-2" />
                    Käytä ruisjauhoja (20%)
                  </label>
                  <label className="block">
                    <input type="checkbox" checked={useSeeds} onChange={() => setUseSeeds(!useSeeds)} className="mr-2" />
                    Lisää siemeniä (15%)
                  </label>
                </>
              )}

              <label className="block">
                <input type="checkbox" checked={coldFermentation} onChange={() => setColdFermentation(!coldFermentation)} className="mr-2" />
                Kylmäkohotus
              </label>

              <button onClick={() => setShowRecipe(!showRecipe)} className="w-full bg-blue-600 text-white py-2 rounded">{showRecipe ? "Piilota" : "Näytä resepti"}</button>
              {user && <button onClick={saveFavorite} className="w-full bg-blue-100 text-blue-700 py-2 rounded">Tallenna suosikiksi</button>}
            </div>

            <div className="mt-4 p-4 bg-blue-50 rounded border">
              <h2 className="font-bold text-blue-700">Ainesosat</h2>
              <ul className="text-sm mt-2">
                <li>Vesi: {result.water?.toFixed(1)} g</li>
                <li>Suola: {result.salt?.toFixed(1)} g</li>
                <li>Juuri: {result.starter?.toFixed(1)} g</li>
                {result.oil > 0 && <li>Öljy: {result.oil.toFixed(1)} g</li>}
                {result.seeds > 0 && <li>Siemenet: {result.seeds.toFixed(1)} g</li>}
                <li>Yhteensä: {result.total?.toFixed(1)} g</li>
              </ul>
              <h3 className="mt-3 font-semibold">Jauhot:</h3>
              <ul className="text-sm">
                {Object.entries(result.flourTypes ?? {}).map(([key, val]) => (
                  <li key={key}>{key}: {val.toFixed(1)} g</li>
                ))}
              </ul>
            </div>

            {showRecipe && (
              <div className="mt-4 p-4 bg-white border rounded space-y-2">
                <h2 className="text-blue-700 font-bold text-lg">📋 Resepti</h2>
                {steps.map((step, i) => (
                  <div key={i} className="flex gap-2 items-center text-sm">
                    {step.includes("Taitto") && <input type="checkbox" checked={foldsDone >= i - 2} onChange={() => toggleFold(i - 2)} />}
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
