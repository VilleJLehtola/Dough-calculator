import React, { useState } from "react";
import "./index.css"; // Use your main CSS file

export default function App() {
  const [inputGrams, setInputGrams] = useState("");
  const [inputType, setInputType] = useState("jauho");
  const [hydration, setHydration] = useState(70);
  const [saltPct, setSaltPct] = useState(2);
  const [mode, setMode] = useState("leipa");
  const [showRecipe, setShowRecipe] = useState(false);
  const [coldFermentation, setColdFermentation] = useState(false);
  const [useRye, setUseRye] = useState(false);
  const [addSeeds, setAddSeeds] = useState(false);
  const [addOil, setAddOil] = useState(false);
  const [foldsDone, setFoldsDone] = useState(0);

  const resetAll = () => {
    setInputGrams("");
    setInputType("jauho");
    setHydration(70);
    setSaltPct(2);
    setMode("leipa");
    setShowRecipe(false);
    setColdFermentation(false);
    setUseRye(false);
    setAddSeeds(false);
    setAddOil(false);
    setFoldsDone(0);
  };

  const calculate = () => {
    const grams = parseFloat(inputGrams);
    if (isNaN(grams) || grams <= 0) return null;

    const h = hydration / 100;
    const s = saltPct / 100;
    let jauho, vesi, suola, juuri, oljy = 0, seeds = 0;

    if (inputType === "jauho") {
      jauho = grams;
      vesi = h * jauho;
    } else {
      vesi = grams;
      jauho = vesi / h;
    }

    suola = jauho * s;
    juuri = jauho * 0.2;
    if (addOil && mode === "pizza") oljy = jauho * 0.03;
    if (addSeeds && mode === "leipa") seeds = jauho * 0.15;
    const yhteensa = jauho + vesi + suola + juuri + oljy + seeds;

    const jauhotyypit =
      mode === "pizza"
        ? {
            "00-jauho": jauho * (1000 / 1070),
            puolikarkea: jauho * (70 / 1070),
          }
        : useRye
        ? {
            ruis: jauho * 0.2,
            puolikarkea: jauho * 0.65,
            täysjyvä: jauho * 0.15,
          }
        : {
            puolikarkea: jauho * (500 / 620),
            täysjyvä: jauho * (120 / 620),
          };

    return { jauho, vesi, suola, juuri, oljy, seeds, yhteensa, jauhotyypit };
  };

  const result = calculate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-blue-200 p-4 transition-all">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md border border-blue-200 space-y-6 transition-all duration-500">
        <h1 className="text-2xl font-bold text-center text-blue-700">🥖 Taikinalaskin</h1>

        <div className="flex justify-center gap-4">
          <button
            onClick={() => setMode("leipa")}
            className={`px-4 py-2 rounded-full ${
              mode === "leipa" ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-800"
            }`}
          >
            Leipä
          </button>
          <button
            onClick={() => setMode("pizza")}
            className={`px-4 py-2 rounded-full ${
              mode === "pizza" ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-800"
            }`}
          >
            Pizza
          </button>
        </div>

        <div className="flex justify-center gap-4">
          <button
            onClick={() => setInputType("jauho")}
            className={`px-4 py-1 rounded-full ${
              inputType === "jauho" ? "bg-blue-500 text-white" : "bg-blue-100 text-blue-800"
            }`}
          >
            Jauho
          </button>
          <button
            onClick={() => setInputType("vesi")}
            className={`px-4 py-1 rounded-full ${
              inputType === "vesi" ? "bg-blue-500 text-white" : "bg-blue-100 text-blue-800"
            }`}
          >
            Vesi
          </button>
        </div>

        <input
          type="number"
          value={inputGrams}
          onChange={e => setInputGrams(e.target.value)}
          placeholder="Määrä grammoina"
          className="w-full p-3 border border-blue-300 rounded-lg"
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Hydraatio (%)</label>
            <input
              type="number"
              value={hydration}
              min={55}
              onChange={e => setHydration(e.target.value)}
              className="w-full p-2 mt-1 border border-blue-300 rounded-lg"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Suola (%)</label>
            <input
              type="number"
              value={saltPct}
              onChange={e => setSaltPct(e.target.value)}
              className="w-full p-2 mt-1 border border-blue-300 rounded-lg"
            />
          </div>
        </div>

        {mode === "pizza" && (
          <div className="flex gap-2 items-center">
            <input type="checkbox" checked={addOil} onChange={e => setAddOil(e.target.checked)} />
            <label>Lisää öljyä (3%)</label>
          </div>
        )}

        {mode === "leipa" && (
          <>
            <div className="flex gap-2 items-center">
              <input type="checkbox" checked={useRye} onChange={e => setUseRye(e.target.checked)} />
              <label>Käytä ruisjauhoja (20%)</label>
            </div>
            <div className="flex gap-2 items-center">
              <input type="checkbox" checked={addSeeds} onChange={e => setAddSeeds(e.target.checked)} />
              <label>Lisää siemeniä (15%)</label>
            </div>
          </>
        )}

        <div className="flex gap-2 items-center">
          <input type="checkbox" checked={coldFermentation} onChange={e => setColdFermentation(e.target.checked)} />
          <label>Kylmäkohotus</label>
        </div>

        <button
          onClick={() => setShowRecipe(!showRecipe)}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
        >
          {showRecipe ? "Piilota resepti" : "Näytä resepti"}
        </button>

        {result && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 transition-all">
            <h2 className="text-lg font-semibold text-blue-700 mb-2">🧂 Ainesosat:</h2>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>Jauhot: {result.jauho.toFixed(1)} g</li>
              <li>Vesi: {result.vesi.toFixed(1)} g</li>
              <li>Suola: {result.suola.toFixed(1)} g</li>
              <li>Juuri: {result.juuri.toFixed(1)} g</li>
              {result.oljey > 0 && <li>Öljy: {result.oljey.toFixed(1)} g</li>}
              {result.seeds > 0 && <li>Siemenet: {result.seeds.toFixed(1)} g</li>}
              <li><strong>Yhteensä:</strong> {result.yhteensa.toFixed(1)} g</li>
            </ul>

            <h3 className="mt-3 font-medium">Jauhotyypit:</h3>
            <ul className="text-sm">
              {Object.entries(result.jauhotyypit).map(([type, val]) => (
                <li key={type}>
                  {type}: {val.toFixed(1)} g
                </li>
              ))}
            </ul>
          </div>
        )}

        {showRecipe && (
          <div className="bg-white border border-blue-200 p-4 rounded-lg space-y-3 transition-all">
            <h2 className="text-lg font-semibold text-blue-700">📋 Resepti</h2>
            <p>Sekoita jauhot ja vesi, anna levätä 30 min.</p>
            <p>Lisää juuri ja suola, sekoita huolellisesti.</p>
            {[30, 30, 45, 60].map((min, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={foldsDone >= idx + 1}
                  onChange={() =>
                    setFoldsDone(prev => (prev === idx + 1 ? idx : Math.max(idx + 1, prev)))
                  }
                />
                <span>{idx + 1}. taitto {min} min kohdalla</span>
              </div>
            ))}
            {addSeeds && <p>Lisää siemenet ennen viimeistä taittoa.</p>}
            <p>Muotoile ja kohota {coldFermentation ? "jääkaapissa yön yli" : "huoneenlämmössä"}.</p>
            <p>Paista 230°C noin 35 minuuttia.</p>
          </div>
        )}

        <button
          onClick={resetAll}
          className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
        >
          Tyhjennä kaikki
        </button>
      </div>
    </div>
  );
}
