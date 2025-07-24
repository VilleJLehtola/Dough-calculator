import React, { useState } from "react";

export default function Taikinakalkulaattori() {
  const [inputGrams, setInputGrams] = useState("");
  const [inputType, setInputType] = useState("jauho");
  const [hydration, setHydration] = useState(75);
  const [saltPct, setSaltPct] = useState(2);
  const [mode, setMode] = useState("leipa"); // 'pizza' or 'leipa'
  const [showRecipe, setShowRecipe] = useState(false);
  const [foldsDone, setFoldsDone] = useState(0);

  const resetAll = () => {
    setInputGrams("");
    setInputType("jauho");
    setHydration(75);
    setSaltPct(2);
    setMode("leipa");
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
        yhteensa: 0,
        jauhotyypit: {},
      };
    }

    const h = hydration / 100;
    const s = saltPct / 100;

    let jauho, vesi, suola, juuri;

    if (inputType === "jauho") {
      jauho = grams;
      vesi = h * jauho;
    } else {
      vesi = grams;
      jauho = vesi / h;
    }

    suola = jauho * s;
    juuri = jauho * 0.2;
    const yhteensa = jauho + vesi + suola + juuri;

    const jauhotyypit =
      mode === "pizza"
        ? {
            "00-jauho": jauho * (1000 / 1070),
            puolikarkea: jauho * (70 / 1070),
          }
        : {
            puolikarkea: jauho * (500 / 620),
            täysjyvä: jauho * (120 / 620),
          };

    return { jauho, vesi, suola, juuri, yhteensa, jauhotyypit };
  };

  const result = calculate();

  const reseptiSteps = [
    { id: 1, text: "Sekoita jauhot ja vesi, anna levätä 30 minuuttia." },
    { id: 2, text: "Lisää juuri ja sekoita tasaiseksi taikinaksi." },
    { id: 3, text: "Taita taikinaa 4 kertaa 30 min välein." },
    { id: 4, text: "Muotoile, kohota yön yli ja paista uunissa 230 °C." },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-100 via-white to-yellow-200 p-4">
      <div className="bg-white p-6 rounded-2xl shadow-xl max-w-xl w-full space-y-6 border border-yellow-200">
        <h1 className="text-2xl font-bold text-center text-yellow-800">
          🥖 Taikinakalkulaattori
        </h1>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="font-medium">Tyyppi:</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="p-2 border rounded"
            >
              <option value="leipa">Leipä</option>
              <option value="pizza">Pizza</option>
            </select>
          </div>

          <input
            type="number"
            value={inputGrams}
            onChange={(e) => setInputGrams(e.target.value)}
            placeholder="Syötä määrä grammoina"
            className="w-full p-3 border border-yellow-300 rounded-lg"
          />

          <select
            value={inputType}
            onChange={(e) => setInputType(e.target.value)}
            className="w-full p-3 border border-yellow-300 rounded-lg"
          >
            <option value="jauho">Tämä on jauhojen määrä</option>
            <option value="vesi">Tämä on veden määrä</option>
          </select>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Hydraatio (%)</label>
              <input
                type="number"
                value={hydration}
                onChange={(e) => setHydration(e.target.value)}
                className="w-full p-2 mt-1 border border-yellow-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Suolan määrä (%)</label>
              <input
                type="number"
                value={saltPct}
                onChange={(e) => setSaltPct(e.target.value)}
                className="w-full p-2 mt-1 border border-yellow-300 rounded-lg"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => setShowRecipe(!showRecipe)}
              className="w-full bg-yellow-600 text-white py-2 rounded-lg hover:bg-yellow-700 transition"
            >
              {showRecipe ? "Piilota resepti" : "Näytä resepti"}
            </button>
            <button
              onClick={resetAll}
              className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
            >
              Tyhjennä kaikki
            </button>
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <h2 className="text-lg font-semibold text-yellow-700 mb-2">
            🍞 Ainesosien määrät:
          </h2>
          <ul className="text-gray-800 space-y-1">
            <li>
              <strong>Vesi:</strong> {result.vesi.toFixed(1)} g
            </li>
            <li>
              <strong>Suola:</strong> {result.suola.toFixed(1)} g
            </li>
            <li>
              <strong>Juuri:</strong> {result.juuri.toFixed(1)} g
            </li>
            <li>
              <strong>Yhteensä:</strong> {result.yhteensa.toFixed(1)} g
            </li>
          </ul>
          <h3 className="mt-3 font-semibold">Jauhotyypit:</h3>
          <ul>
            {Object.entries(result.jauhotyypit).map(([type, val]) => (
              <li key={type}>
                {type}: {val.toFixed(1)} g
              </li>
            ))}
          </ul>
        </div>

        {showRecipe && (
          <div className="bg-white p-4 border border-yellow-300 rounded-lg space-y-4">
            <h2 className="text-lg font-bold text-yellow-700">📋 Resepti</h2>
            {reseptiSteps.map((step) => (
              <div key={step.id} className="space-y-2">
                <p className="flex items-center gap-2">
                  {step.id === 3 ? (
                    <>
                      <span>{step.text}</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((n) => (
                          <input
                            key={n}
                            type="checkbox"
                            checked={foldsDone >= n}
                            onChange={() =>
                              setFoldsDone((prev) =>
                                prev === n ? n - 1 : Math.max(n, prev)
                              )
                            }
                          />
                        ))}
                      </div>
                    </>
                  ) : (
                    <span>{step.text}</span>
                  )}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
