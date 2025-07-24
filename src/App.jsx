import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import "./index.css";

const supabase = createClient(
  "https://<your-supabase-url>.supabase.co",
  "<your-anon-key>"
);

export default function App() {
  const [inputGrams, setInputGrams] = useState("");
  const [inputType, setInputType] = useState("jauho");
  const [hydration, setHydration] = useState(75);
  const [saltPct, setSaltPct] = useState(2);
  const [mode, setMode] = useState("leipa");
  const [useRye, setUseRye] = useState(false);
  const [useSeeds, setUseSeeds] = useState(false);
  const [coldFerment, setColdFerment] = useState(false);
  const [useOil, setUseOil] = useState(false);
  const [showRecipe, setShowRecipe] = useState(false);
  const [foldsDone, setFoldsDone] = useState(0);
  const [expanded, setExpanded] = useState(false);

  const [authView, setAuthView] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setUser(data.user);
    });
  }, []);

  const handleAuth = async () => {
    setAuthError("");
    if (authView === "login") {
      const { error, data } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setAuthError(error.message);
      else setUser(data.user);
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setAuthError(error.message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const resetAll = () => {
    setInputGrams("");
    setInputType("jauho");
    setHydration(75);
    setSaltPct(2);
    setMode("leipa");
    setUseRye(false);
    setUseSeeds(false);
    setColdFerment(false);
    setUseOil(false);
    setShowRecipe(false);
    setFoldsDone(0);
  };

  const calculate = () => {
    const grams = parseFloat(inputGrams);
    if (isNaN(grams) || grams <= 0) return {};

    const h = hydration / 100;
    const s = saltPct / 100;
    const oil = useOil && mode === "pizza" ? 0.03 : 0;

    let jauho = inputType === "jauho" ? grams : grams / h;
    let vesi = h * jauho;
    let suola = jauho * s;
    let juuri = jauho * 0.2;
    let oljy = jauho * oil;
    let siemenet = useSeeds ? jauho * 0.15 : 0;

    let yhteensa = jauho + vesi + suola + juuri + oljy + siemenet;

    let jauhotyypit;
    if (mode === "pizza") {
      jauhotyypit = {
        "00-jauho": jauho * (1000 / 1070),
        puolikarkea: jauho * (70 / 1070),
      };
    } else if (useRye) {
      jauhotyypit = {
        puolikarkea: jauho * 0.8,
        ruisjauho: jauho * 0.2,
      };
    } else {
      jauhotyypit = {
        puolikarkea: jauho * (500 / 620),
        täysjyvä: jauho * (120 / 620),
      };
    }

    return { jauho, vesi, suola, juuri, oljy, yhteensa, jauhotyypit, siemenet };
  };

  const result = calculate();

  const reseptiSteps = [
    "Sekoita jauhot ja vesi, anna levätä 30 minuuttia.",
    "Lisää juuri ja sekoita tasaiseksi taikinaksi.",
    "Taita taikinaa 4 kertaa 30/30/45/60 min välein.",
    ...(useSeeds ? ["Lisää siemenet ennen viimeistä taittoa."] : []),
    coldFerment
      ? "Muotoile ja nosta kylmäkohotukseen jääkaappiin yön yli."
      : "Muotoile, kohota huoneenlämmössä ja paista uunissa 230 °C.",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-blue-200 flex flex-col items-center p-6">
      <div className="w-full max-w-3xl bg-white shadow-xl rounded-2xl p-6 transition-all duration-300 border border-blue-200">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-blue-700">🥖 Taikinalaskin</h1>
          {user ? (
            <button onClick={handleLogout} className="text-sm text-red-500">
              Kirjaudu ulos
            </button>
          ) : (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-sm text-blue-600 underline"
            >
              {expanded ? "Sulje" : "Kirjaudu"}
            </button>
          )}
        </div>

        {expanded && !user && (
          <div className="bg-blue-50 p-4 rounded mb-4">
            <h2 className="text-lg font-semibold mb-2">
              {authView === "login" ? "Kirjaudu sisään" : "Rekisteröidy"}
            </h2>
            <input
              type="email"
              placeholder="Sähköposti"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border mb-2 rounded"
            />
            <input
              type="password"
              placeholder="Salasana"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border mb-2 rounded"
            />
            {authError && <p className="text-red-500 text-sm">{authError}</p>}
            <button
              onClick={handleAuth}
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            >
              {authView === "login" ? "Kirjaudu" : "Rekisteröidy"}
            </button>
            <button
              onClick={() => setAuthView(authView === "login" ? "register" : "login")}
              className="w-full mt-2 text-sm text-blue-500"
            >
              {authView === "login" ? "Luo uusi tili" : "Takaisin kirjautumiseen"}
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-4">
          <button
            onClick={() => setMode("leipa")}
            className={`p-2 rounded ${
              mode === "leipa" ? "bg-blue-600 text-white" : "bg-blue-100"
            }`}
          >
            Leipä
          </button>
          <button
            onClick={() => setMode("pizza")}
            className={`p-2 rounded ${
              mode === "pizza" ? "bg-blue-600 text-white" : "bg-blue-100"
            }`}
          >
            Pizza
          </button>
        </div>

        <input
          type="number"
          placeholder="Syötä määrä grammoina"
          value={inputGrams}
          onChange={(e) => setInputGrams(e.target.value)}
          className="w-full p-3 border mb-2 rounded"
        />

        <div className="grid grid-cols-2 gap-4 mb-4">
          <button
            onClick={() => setInputType("jauho")}
            className={`p-2 rounded ${
              inputType === "jauho" ? "bg-blue-600 text-white" : "bg-blue-100"
            }`}
          >
            Määrä on jauhoja
          </button>
          <button
            onClick={() => setInputType("vesi")}
            className={`p-2 rounded ${
              inputType === "vesi" ? "bg-blue-600 text-white" : "bg-blue-100"
            }`}
          >
            Määrä on vettä
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <label className="text-sm">
            Hydraatio (%)
            <input
              type="number"
              min={55}
              value={hydration}
              onChange={(e) => setHydration(e.target.value)}
              className="w-full mt-1 p-2 border rounded"
            />
          </label>
          <label className="text-sm">
            Suola (%)
            <input
              type="number"
              value={saltPct}
              onChange={(e) => setSaltPct(e.target.value)}
              className="w-full mt-1 p-2 border rounded"
            />
          </label>
        </div>

        <div className="space-y-2 mb-4">
          {mode === "pizza" && (
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={useOil} onChange={() => setUseOil(!useOil)} />
              Lisää öljyä taikinaan
            </label>
          )}
          {mode === "leipa" && (
            <>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={useRye} onChange={() => setUseRye(!useRye)} />
                Käytä ruisjauhoja
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={useSeeds} onChange={() => setUseSeeds(!useSeeds)} />
                Lisää siemeniä (15%)
              </label>
            </>
          )}
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={coldFerment}
              onChange={() => setColdFerment(!coldFerment)}
            />
            Kylmäkohotus
          </label>
        </div>

        <button
          onClick={() => setShowRecipe(!showRecipe)}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          {showRecipe ? "Piilota resepti" : "Näytä resepti"}
        </button>

        {result?.yhteensa > 0 && (
          <div className="mt-4 p-4 bg-blue-50 border rounded">
            <h2 className="font-bold mb-2">Ainesosat</h2>
            <ul className="text-sm space-y-1">
              <li>Vesi: {result.vesi.toFixed(1)} g</li>
              <li>Suola: {result.suola.toFixed(1)} g</li>
              <li>Juuri: {result.juuri.toFixed(1)} g</li>
              {useOil && <li>Öljy: {result.olj?.toFixed(1)} g</li>}
              {useSeeds && <li>Siemenet: {result.siemenet.toFixed(1)} g</li>}
              <li>Yhteensä: {result.yhteensa.toFixed(1)} g</li>
            </ul>
            <h3 className="font-semibold mt-2">Jauhot:</h3>
            <ul>
              {Object.entries(result.jauhotyypit).map(([type, val]) => (
                <li key={type}>
                  {type}: {val.toFixed(1)} g
                </li>
              ))}
            </ul>
          </div>
        )}

        {showRecipe && (
          <div className="mt-4 p-4 bg-white border rounded space-y-3 animate-fade-in">
            <h2 className="font-bold text-blue-700">📋 Resepti</h2>
            {reseptiSteps.map((step, i) => (
              <div key={i} className="text-sm flex items-center gap-2">
                {i === 2 ? (
                  <>
                    <span>{step}</span>
                    {[1, 2, 3, 4].map((n) => (
                      <input
                        key={n}
                        type="checkbox"
                        checked={foldsDone >= n}
                        onChange={() =>
                          setFoldsDone((prev) => (prev === n ? n - 1 : Math.max(n, prev)))
                        }
                      />
                    ))}
                  </>
                ) : (
                  <span>{step}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
