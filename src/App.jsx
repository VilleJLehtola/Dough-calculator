import React, { useState } from "react";
import "./styles.css";

export default function App() {
  const [inputGrams, setInputGrams] = useState("");
  const [inputType, setInputType] = useState("jauho");
  const [hydration, setHydration] = useState(75);
  const [saltPct, setSaltPct] = useState(2);
  const [mode, setMode] = useState("leipa");
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
    <div className="container">
      <div className="card">
        <h1 className="text-xl font-bold text-center mb-4">🥖 Taikinakalkulaattori</h1>

        <div className="space-y-4">
          <label>
            Tyyppi:
            <select value={mode} onChange={e => setMode(e.target.value)}>
              <option value="leipa">Leipä</option>
              <option value="pizza">Pizza</option>
            </select>
          </label>

          <input
            type="number"
            value={inputGrams}
            onChange={e => setInputGrams(e.target.value)}
            placeholder="Syötä määrä grammoina"
          />

          <select value={inputType} onChange={e => setInputType(e.target.value)}>
            <option value="jauho">Tämä on jauhojen määrä</option>
            <option value="vesi">Tämä on veden määrä</option>
          </select>

          <div className="grid grid-cols-2 gap-4">
            <label>
              Hydraatio (%)
              <input
                type="number"
                value={hydration}
                onChange={e => setHydration(e.target.value)}
              />
            </label>
            <label>
              Suola (%)
              <input
                type="number"
                value={saltPct}
                onChange={e => setSaltPct(e.target.value)}
              />
            </label>
          </div>

          <button className="btn-primary" onClick={() => setShowRecipe(!showRecipe)}>
            {showRecipe ? "Piilota resepti" : "Näytä resepti"}
          </button>
          <button className="btn-secondary" onClick={resetAll}>
            Tyhjennä kaikki
          </button>
        </div>
      </div>

      <div className="card result">
        <h2 className="text-lg font-semibold mb-2">🍞 Ainesosien määrät:</h2>
        <ul>
          <li><strong>Vesi:</strong> {result.vesi.toFixed(1)} g</li>
          <li><strong>Suola:</strong> {result.suola.toFixed(1)} g</li>
          <li><strong>Juuri:</strong> {result.juuri.toFixed(1)} g</li>
          <li><strong>Yhteensä:</strong> {result.yhteensa.toFixed(1)} g</li>
        </ul>
        <h3 className="mt-3">Jauhotyypit:</h3>
        <ul>
          {Object.entries(result.jauhotyypit).map(([type, val]) => (
            <li key={type}>
              {type}: {val.toFixed(1)} g
            </li>
          ))}
        </ul>
      </div>

      {showRecipe && (
        <div className="card checklist">
          <h2 className="text-lg font-semibold mb-2">📋 Resepti</h2>
          <ul>
            {reseptiSteps.map(step => (
              <li key={step.id}>
                {step.id === 3 ? (
                  <>
                    <span>{step.text}</span>
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
                  </>
                ) : (
                  <span>{step.text}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
