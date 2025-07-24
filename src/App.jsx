import React, { useState } from "react";
import "./index.css";

export default function App() {
  const [inputGrams, setInputGrams] = useState("");
  const [inputType, setInputType] = useState("jauho");
  const [hydration, setHydration] = useState(75);
  const [saltPct, setSaltPct] = useState(2);
  const [mode, setMode] = useState("leipa");
  const [showRecipe, setShowRecipe] = useState(false);
  const [foldsDone, setFoldsDone] = useState(0);
  const [useRye, setUseRye] = useState(false);
  const [useSeeds, setUseSeeds] = useState(false);
  const [coldFerment, setColdFerment] = useState(false);
  const [oilPct, setOilPct] = useState(3);
  const [showLogin, setShowLogin] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });

  const resetAll = () => {
    setInputGrams("");
    setInputType("jauho");
    setHydration(75);
    setSaltPct(2);
    setMode("leipa");
    setShowRecipe(false);
    setFoldsDone(0);
    setUseRye(false);
    setUseSeeds(false);
    setColdFerment(false);
    setOilPct(3);
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
    const oil = oilPct / 100;

    let jauho, vesi;

    if (inputType === "jauho") {
      jauho = grams;
      vesi = h * jauho;
    } else {
      vesi = grams;
      jauho = vesi / h;
    }

    const suola = jauho * s;
    const juuri = jauho * 0.2;
    const oljy = mode === "pizza" ? jauho * oil : 0;
    const seeds = useSeeds ? jauho * 0.15 : 0;

    const yhteensa = jauho + vesi + suola + juuri + oljy + seeds;

    let jauhotyypit = {};
    if (mode === "pizza") {
      jauhotyypit = {
        "00-jauho": jauho * (1000 / 1070),
        puolikarkea: jauho * (70 / 1070),
      };
    } else if (useRye) {
      jauhotyypit = {
        puolikarkea: jauho * 0.8,
        ruis: jauho * 0.2,
      };
    } else {
      jauhotyypit = {
        puolikarkea: jauho * (500 / 620),
        täysjyvä: jauho * (120 / 620),
      };
    }

    return { jauho, vesi, suola, juuri, oljy, yhteensa, jauhotyypit, seeds };
  };

  const result = calculate();

  const foldTimes = [30, 30, 45, 60];
  const reseptiSteps = [
    {
      id: 1,
      text: "Sekoita jauhot ja vesi, anna levätä 30 minuuttia.",
    },
    {
      id: 2,
      text: "Lisää juuri ja suola, sekoita tasaiseksi taikinaksi.",
    },
    {
      id: 3,
      text: `Taita taikinaa ${foldTimes.length} kertaa: ${foldTimes.join("min, ")}min välein.`,
    },
    useSeeds && {
      id: 4,
      text: "Lisää siemenet ennen viimeistä taittoa.",
    },
    coldFerment && {
      id: 5,
      text: "Kohota taikinaa jääkaapissa yön yli.",
    },
    {
      id: 6,
      text: "Muotoile ja paista uunissa 230 °C.",
    },
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-blue-200 flex items-start justify-center p-4">
      <div className="absolute top-4 right-6">
        <button
          onClick={() => setShowLogin(prev => !prev)}
          className="text-blue-800 hover:underline"
        >
          {showLogin ? "Sulje" : "Kirjaudu"}
        </button>
        {showLogin && (
          <div className="bg-white p-4 rounded shadow-md mt-2 w-64 border border-blue-200">
            <input
              type="email"
              placeholder="Sähköposti"
              className="w-full p-2 mb-2 border rounded"
              value={loginForm.email}
              onChange={e =>
                setLoginForm({ ...loginForm, email: e.target.value })
              }
            />
            <input
              type="password"
              placeholder="Salasana"
              className="w-full p-2 mb-2 border rounded"
              value={loginForm.password}
              onChange={e =>
                setLoginForm({ ...loginForm, password: e.target.value })
              }
            />
            <button className="bg-blue-600 text-white py-2 px-4 rounded w-full">
              Kirjaudu
            </button>
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-xl max-w-xl w-full space-y-6 border border-blue-200 transition-all duration-500">
        <h1 className="text-2xl font-bold text-center text-blue-800">
          🥖 Taikinalaskin
        </h1>

        {/* Mode and Input */}
        <div className="flex justify-center gap-4">
          <button
            className={`px-4 py-2 rounded-full border ${
              mode === "leipa" ? "bg-blue-500 text-white" : "bg-gray-100"
            }`}
            onClick={() => setMode("leipa")}
          >
            Leipä
          </button>
          <button
            className={`px-4 py-2 rounded-full border ${
              mode === "pizza" ? "bg-blue-500 text-white" : "bg-gray-100"
            }`}
            onClick={() => setMode("pizza")}
          >
            Pizza
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <input
            type="number"
            min={0}
            value={inputGrams}
            onChange={e => setInputGrams(e.target.value)}
            placeholder="Määrä (g)"
            className="w-full p-2 border rounded col-span-2"
          />
          <button
            onClick={() => setInputType("jauho")}
            className={`p-2 rounded ${
              inputType === "jauho" ? "bg-blue-500 text-white" : "bg-gray-100"
            }`}
          >
            Jauho
          </button>
          <button
            onClick={() => setInputType("vesi")}
            className={`p-2 rounded ${
              inputType === "vesi" ? "bg-blue-500 text-white" : "bg-gray-100"
            }`}
          >
            Vesi
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label>Hydraatio (%)</label>
            <input
              type="number"
              min={55}
              value={hydration}
              onChange={e => setHydration(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label>Suola (%)</label>
            <input
              type="number"
              value={saltPct}
              onChange={e => setSaltPct(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>

        {mode === "pizza" && (
          <div>
            <label>Öljy (%)</label>
            <input
              type="number"
              value={oilPct}
              onChange={e => setOilPct(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
        )}

        {mode === "leipa" && (
          <>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={useRye}
                onChange={e => setUseRye(e.target.checked)}
              />
              Käytä ruisjauhoja (20 %)
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={useSeeds}
                onChange={e => setUseSeeds(e.target.checked)}
              />
              Lisää siemeniä (15 %)
            </label>
          </>
        )}

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={coldFerment}
            onChange={e => setColdFerment(e.target.checked)}
          />
          Kylmäkohotus (yön yli)
        </label>

        <button
          onClick={() => setShowRecipe(prev => !prev)}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
        >
          {showRecipe ? "Piilota resepti" : "Näytä resepti"}
        </button>

        {/* Results */}
        <div className="bg-blue-50 p-4 rounded border border-blue-200">
          <h2 className="font-bold mb-2">Ainesosat</h2>
          <ul className="space-y-1 text-gray-800">
            <li>Vesi: {result.vesi.toFixed(1)} g</li>
            <li>Suola: {result.suola.toFixed(1)} g</li>
            <li>Juuri: {result.juuri.toFixed(1)} g</li>
            {mode === "pizza" && <li>Öljy: {result.oljyu?.toFixed(1)} g</li>}
            {useSeeds && <li>Siemenet: {result.seeds.toFixed(1)} g</li>}
            <li>Yhteensä: {result.yhteensa.toFixed(1)} g</li>
          </ul>
          <h3 className="mt-2 font-semibold">Jauhot:</h3>
          <ul>
            {Object.entries(result.jauhotyypit).map(([key, val]) => (
              <li key={key}>
                {key}: {val.toFixed(1)} g
              </li>
            ))}
          </ul>
        </div>

        {/* Recipe */}
        {showRecipe && (
          <div className="bg-white p-4 border border-blue-300 rounded-lg space-y-3 animate-fade-in">
            <h2 className="font-bold text-blue-700">📋 Resepti</h2>
            {reseptiSteps.map((step, idx) => (
              <div key={idx} className="flex gap-2 items-start">
                <span>{idx + 1}.</span>
                <span>{step.text}</span>
                {step.id === 3 && (
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map(n => (
                      <input
                        key={n}
                        type="checkbox"
                        checked={foldsDone >= n}
                        onChange={() =>
                          setFoldsDone(prev =>
                            prev === n ? n - 1 : Math.max(n, prev)
                          )
                        }
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
