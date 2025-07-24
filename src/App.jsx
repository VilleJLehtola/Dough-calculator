import React, { useState } from "react";

export default function App() {
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
    {
      id: 1,
      text: "Sekoita jauhot ja vesi, anna levätä 30 minuuttia.",
    },
    {
      id: 2,
      text: "Lisää juuri ja sekoita tasaiseksi taikinaksi.",
    },
    {
      id: 3,
      text: "Taita taikinaa 4 kertaa 30 min välein.",
    },
    {
      id: 4,
      text: "Muotoile, kohota yön yli ja paista uunissa 230 °C.",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white shadow-xl rounded-2xl p-8 max-w-md w-full space-y-6">
        <h1 className="text-2xl font-bold text-center">Dough Calculator</h1>

        <div className="flex justify-center gap-2">
          <button
            onClick={() => setMode("pizza")}
            className={`px-4 py-2 rounded-full font-medium ${
              mode === "pizza"
                ? "bg-gray-300 text-black"
                : "bg-white border border-gray-300 text-gray-500"
            }`}
          >
            Pizza
          </button>
          <button
            onClick={() => setMode("leipa")}
            className={`px-4 py-2 rounded-full font-medium ${
              mode === "leipa"
                ? "bg-green-500 text-white"
                : "bg-white border border-gray-300 text-gray-500"
            }`}
          >
            Bread
          </button>
        </div>

        <input
          type="number"
          value={inputGrams}
          onChange={(e) => setInputGrams(e.target.value)}
          placeholder="Syötä määrä grammoina"
          className="w-full p-3 border border-gray-300 rounded-lg"
        />

        <select
          value={inputType}
          onChange={(e) => setInputType(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg"
        >
          <option value="jauho">Tämä on jauhojen määrä</option>
          <option value="vesi">Tämä on veden määrä</option>
        </select>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium block">Hydration (%)</label>
            <input
              type="number"
              value={hydration}
              onChange={(e) => setHydration(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="text-sm font-medium block">Suola (%)</label>
            <input
              type="number"
              value={saltPct}
              onChange={(e) => setSaltPct(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => setShowRecipe(!showRecipe)}
            className="bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
          >
            {showRecipe ? "Piilota resepti" : "Näytä resepti"}
          </button>
          <button
            onClick={resetAll}
            className="bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
          >
            Tyhjennä kaikki
          </button>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold mb-2">🍞 Ainesosat</h2>
          <ul className="space-y-1 text-sm">
            <li><strong>Vesi:</strong> {result.vesi.toFixed(1)} g</li>
            <li><strong>Suola:</strong> {result.suola.toFixed(1)} g</li>
            <li><strong>Juuri:</strong> {result.juuri.toFixed(1)} g</li>
            <li><strong>Yhteensä:</strong> {result.yhteensa.toFixed(1)} g</li>
          </ul>
          <h3 className="mt-3 font-semibold text-sm">Jauhotyypit:</h3>
          <ul className="text-sm">
            {Object.entries(result.jauhotyypit).map(([type, val]) => (
              <li key={type}>
                {type}: {val.toFixed(1)} g
              </li>
            ))}
          </ul>
        </div>

        {showRecipe && (
          <div className="bg-white p-4 border border-gray-200 rounded-lg space-y-4">
            <h2 className="text-lg font-bold text-gray-700">📋 Resepti</h2>
            {reseptiSteps.map((step) => (
              <div key={step.id} className="flex flex-col gap-2">
                <p>{step.text}</p>
                {step.id === 3 && (
                  <div className="flex gap-2">
                    {[1, 2, 3, 4].map((n) => (
                      <label key={n} className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={foldsDone >= n}
                          onChange={() =>
                            setFoldsDone((prev) =>
                              prev === n ? n - 1 : Math.max(n, prev)
                            )
                          }
                        />
                        Taitos {n}
                      </label>
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
