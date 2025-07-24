import React, { useState } from "react";

export default function App() {
  const [inputGrams, setInputGrams] = useState("");
  const [inputType, setInputType] = useState("jauho");
  const [hydration, setHydration] = useState(75);
  const [saltPct, setSaltPct] = useState(2);
  const [mode, setMode] = useState("leipa");
  const [showRecipe, setShowRecipe] = useState(false);
  const [foldsDone, setFoldsDone] = useState(0);

  const calculate = () => {
    const grams = parseFloat(inputGrams);
    if (isNaN(grams) || grams <= 0) return {};

    const h = hydration / 100;
    const s = saltPct / 100;

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
    { id: 1, text: "Sekoita jauhot ja vesi, anna levätä 30 min." },
    { id: 2, text: "Lisää juuri ja suola, sekoita tasaiseksi taikinaksi." },
    {
      id: 3,
      text: "Taita taikinaa 4 kertaa 30 min välein.",
      isFoldStep: true,
    },
    { id: 4, text: "Muotoile, kohota yön yli ja paista 230 °C." },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-md space-y-6">
        <h1 className="text-2xl font-bold text-center">Dough Calculator</h1>

        {/* Mode Toggle */}
        <div className="flex justify-center gap-4">
          <button
            className={`px-4 py-1 rounded-full ${
              mode === "pizza"
                ? "bg-gray-300 text-black"
                : "bg-white border border-gray-300"
            }`}
            onClick={() => setMode("pizza")}
          >
            Pizza
          </button>
          <button
            className={`px-4 py-1 rounded-full ${
              mode === "leipa"
                ? "bg-green-500 text-white"
                : "bg-white border border-gray-300"
            }`}
            onClick={() => setMode("leipa")}
          >
            Bread
          </button>
        </div>

        {/* Input fields */}
        <input
          type="number"
          value={inputGrams}
          onChange={(e) => setInputGrams(e.target.value)}
          placeholder={`Syötä määrä (${inputType === "jauho" ? "jauho" : "vesi"})`}
          className="w-full p-3 border border-gray-300 rounded-md"
        />

        <select
          value={inputType}
          onChange={(e) => setInputType(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-md"
        >
          <option value="jauho">Tämä on jauhojen määrä</option>
          <option value="vesi">Tämä on veden määrä</option>
        </select>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm">Hydraatio (%)</label>
            <input
              type="number"
              value={hydration}
              onChange={(e) => setHydration(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="text-sm">Suola (%)</label>
            <input
              type="number"
              value={saltPct}
              onChange={(e) => setSaltPct(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>

        {/* Results */}
        {result.jauho && (
          <div className="bg-gray-50 p-4 rounded-md text-sm space-y-1 border">
            <div><strong>Vesi:</strong> {result.vesi.toFixed(1)} g</div>
            <div><strong>Suola:</strong> {result.suola.toFixed(1)} g</div>
            <div><strong>Juuri:</strong> {result.juuri.toFixed(1)} g</div>
            <div><strong>Yhteensä:</strong> {result.yhteensa.toFixed(1)} g</div>
            <div className="mt-2 font-medium">Jauhotyypit:</div>
            <ul className="list-disc list-inside">
              {Object.entries(result.jauhotyypit).map(([type, val]) => (
                <li key={type}>
                  {type}: {val.toFixed(1)} g
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-col gap-2">
          <button
            className="bg-yellow-500 text-white py-2 rounded-md hover:bg-yellow-600 transition"
            onClick={() => setShowRecipe(!showRecipe)}
          >
            {showRecipe ? "Piilota resepti" : "Näytä resepti"}
          </button>
          <button
            className="bg-gray-200 text-gray-700 py-2 rounded-md hover:bg-gray-300"
            onClick={() => {
              setInputGrams("");
              setInputType("jauho");
              setHydration(75);
              setSaltPct(2);
              setMode("leipa");
              setShowRecipe(false);
              setFoldsDone(0);
            }}
          >
            Tyhjennä kaikki
          </button>
        </div>

        {/* Recipe checklist */}
        {showRecipe && (
          <div className="bg-gray-50 border p-4 rounded-lg space-y-2">
            <h2 className="text-lg font-semibold">📋 Resepti</h2>
            {reseptiSteps.map((step) => (
              <div key={step.id} className="flex items-start gap-2">
                <span>{step.text}</span>
                {step.isFoldStep && (
                  <div className="flex gap-1 ml-auto">
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
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
