import React, { useState } from "react";

export default function Taikinakalkulaattori() {
  const [inputGrams, setInputGrams] = useState("");
  const [inputType, setInputType] = useState("jauho");
  const [hydration, setHydration] = useState(75);
  const [saltPct, setSaltPct] = useState(2);
  const [oilPct, setOilPct] = useState(3);
  const [mode, setMode] = useState("leipa");
  const [coldFermentation, setColdFermentation] = useState(false);
  const [includeRye, setIncludeRye] = useState(false);
  const [includeSeeds, setIncludeSeeds] = useState(false);
  const [showRecipe, setShowRecipe] = useState(false);
  const [foldsDone, setFoldsDone] = useState(0);

  const calculate = () => {
    const grams = parseFloat(inputGrams);
    if (isNaN(grams) || grams <= 0) return {};

    const h = Math.max(0.55, hydration / 100);
    const s = saltPct / 100;
    const o = oilPct / 100;

    let flour, water, salt, starter, oil = 0;

    if (inputType === "jauho") {
      flour = grams;
      water = h * flour;
    } else {
      water = grams;
      flour = water / h;
    }

    salt = flour * s;
    starter = flour * 0.2;
    if (mode === "pizza") oil = flour * o;

    const ingredients = {
      water: water.toFixed(1),
      salt: salt.toFixed(1),
      starter: starter.toFixed(1),
      oil: oil.toFixed(1),
      total: (flour + water + salt + starter + oil).toFixed(1),
      flourTypes: {},
    };

    if (mode === "pizza") {
      ingredients.flourTypes = {
        "00-jauho": (flour * (1000 / 1070)).toFixed(1),
        "puolikarkea": (flour * (70 / 1070)).toFixed(1),
      };
    } else {
      const rye = includeRye ? flour * 0.2 : 0;
      const white = flour - rye;
      ingredients.flourTypes = {
        "puolikarkea": (white * (500 / 620)).toFixed(1),
        "täysjyvä": (white * (120 / 620)).toFixed(1),
      };
      if (includeRye) ingredients.flourTypes["ruisjauho"] = rye.toFixed(1);
      if (includeSeeds) ingredients.seeds = (flour * 0.15).toFixed(1);
    }

    return ingredients;
  };

  const ingredients = calculate();

  const steps = [
    "Sekoita jauhot ja vesi, anna levätä 30 min.",
    "Lisää juuri ja sekoita taikinaksi.",
    "Taita taikinaa (30min, 30min, 45min, 60min).",
    includeSeeds ? "Lisää siemenet ennen viimeistä taittoa." : null,
    coldFermentation
      ? "Muotoile, laita kylmään yön yli, paista 230°C."
      : "Muotoile, kohota ja paista 230°C.",
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-yellow-100 p-4 flex justify-center">
      <div className="bg-white max-w-xl w-full rounded-xl shadow-lg p-6 space-y-5 border border-yellow-200">
        <h1 className="text-2xl font-bold text-yellow-700 text-center">🥖 Taikinakalkulaattori</h1>

        <div className="space-y-3">
          <label className="block">
            <span className="text-sm">Tyyppi</span>
            <select value={mode} onChange={e => setMode(e.target.value)} className="w-full p-2 border rounded">
              <option value="leipa">Leipä</option>
              <option value="pizza">Pizza</option>
            </select>
          </label>

          <input
            type="number"
            value={inputGrams}
            onChange={e => setInputGrams(e.target.value)}
            placeholder="Syötä määrä grammoina"
            className="w-full p-3 border rounded"
          />

          <select
            value={inputType}
            onChange={e => setInputType(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="jauho">Tämä on jauhojen määrä</option>
            <option value="vesi">Tämä on veden määrä</option>
          </select>

          <div className="grid grid-cols-2 gap-3">
            <label>
              <span className="text-sm">Hydraatio (%)</span>
              <input
                type="number"
                min="55"
                value={hydration}
                onChange={e => setHydration(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </label>

            <label>
              <span className="text-sm">Suola (%)</span>
              <input
                type="number"
                value={saltPct}
                onChange={e => setSaltPct(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </label>
          </div>

          {mode === "pizza" && (
            <label>
              <span className="text-sm">Öljy (%)</span>
              <input
                type="number"
                value={oilPct}
                onChange={e => setOilPct(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </label>
          )}

          {mode === "leipa" && (
            <>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={includeRye} onChange={() => setIncludeRye(!includeRye)} />
                Lisää ruisjauhoa (20 %)
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={includeSeeds} onChange={() => setIncludeSeeds(!includeSeeds)} />
                Lisää siemeniä (15 %)
              </label>
            </>
          )}

          <label className="flex items-center gap-2">
            <input type="checkbox" checked={coldFermentation} onChange={() => setColdFermentation(!coldFermentation)} />
            Kylmäkohotus
          </label>

          <button
            onClick={() => setShowRecipe(!showRecipe)}
            className="w-full bg-yellow-500 text-white py-2 rounded hover:bg-yellow-600"
          >
            {showRecipe ? "Piilota resepti" : "Näytä resepti"}
          </button>
        </div>

        <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
          <h2 className="font-bold text-yellow-700 mb-2">Ainesosat</h2>
          <ul className="space-y-1 text-sm">
            <li>Vesi: {ingredients.water} g</li>
            <li>Suola: {ingredients.salt} g</li>
            <li>Juuri: {ingredients.starter} g</li>
            {mode === "pizza" && <li>Öljy: {ingredients.oil} g</li>}
            {ingredients.seeds && <li>Siemenet: {ingredients.seeds} g</li>}
            <li>Yhteensä: {ingredients.total} g</li>
          </ul>
          <h3 className="mt-3 font-medium">Jauhotyypit:</h3>
          <ul className="text-sm">
            {Object.entries(ingredients.flourTypes || {}).map(([type, amount]) => (
              <li key={type}>{type}: {amount} g</li>
            ))}
          </ul>
        </div>

        {showRecipe && (
          <div className="p-4 bg-white border border-yellow-300 rounded space-y-3">
            <h2 className="text-lg font-semibold text-yellow-700">📋 Resepti</h2>
            {steps.map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                {i === 2 ? (
                  <>
                    <span>{step}</span>
                    {[1, 2, 3, 4].map(n => (
                      <input
                        key={n}
                        type="checkbox"
                        checked={foldsDone >= n}
                        onChange={() =>
                          setFoldsDone(prev => (prev === n ? n - 1 : Math.max(n, prev)))
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
