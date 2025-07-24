import React, { useState } from 'react';
import './App.css';

export default function App() {
  const [inputGrams, setInputGrams] = useState('');
  const [inputType, setInputType] = useState('jauho');
  const [hydration, setHydration] = useState(70);
  const [saltPct, setSaltPct] = useState(2);
  const [mode, setMode] = useState('leipa');
  const [showRecipe, setShowRecipe] = useState(false);
  const [foldsDone, setFoldsDone] = useState(0);

  const [useOil, setUseOil] = useState(false);
  const [coldFerment, setColdFerment] = useState(false);
  const [useRye, setUseRye] = useState(false);
  const [useSeeds, setUseSeeds] = useState(false);

  const resetAll = () => {
    setInputGrams('');
    setInputType('jauho');
    setHydration(70);
    setSaltPct(2);
    setMode('leipa');
    setShowRecipe(false);
    setFoldsDone(0);
    setUseOil(false);
    setColdFerment(false);
    setUseRye(false);
    setUseSeeds(false);
  };

  const calculate = () => {
    const grams = parseFloat(inputGrams);
    if (isNaN(grams) || grams <= 0) return {};

    const h = hydration / 100;
    const s = saltPct / 100;

    let jauho, vesi, suola, juuri, öljy = 0, siemenet = 0;

    if (inputType === 'jauho') {
      jauho = grams;
      vesi = h * jauho;
    } else {
      vesi = grams;
      jauho = vesi / h;
    }

    suola = jauho * s;
    juuri = jauho * 0.2;

    if (mode === 'pizza' && useOil) {
      öljy = jauho * 0.03;
    }

    if (useSeeds && mode === 'leipa') {
      siemenet = jauho * 0.15;
    }

    const jauhotyypit = mode === 'pizza'
      ? {
          '00-jauho': jauho * (1000 / 1070),
          'puolikarkea': jauho * (70 / 1070),
        }
      : useRye
      ? {
          'puolikarkea': jauho * 0.8,
          'ruisjauho': jauho * 0.2,
        }
      : {
          'puolikarkea': jauho * (500 / 620),
          'täysjyvä': jauho * (120 / 620),
        };

    const yhteensa = jauho + vesi + suola + juuri + öljy + siemenet;

    return { jauho, vesi, suola, juuri, öljy, siemenet, yhteensa, jauhotyypit };
  };

  const result = calculate();

  const foldSchedule = ['30min', '30min', '45min', '60min'];

  return (
    <div className="app">
      <div className="calculator">
        <h1>🥖 Taikinakalkulaattori</h1>

        <div className="controls">
          <div className="row">
            <label>Tyyppi:</label>
            <select value={mode} onChange={e => setMode(e.target.value)}>
              <option value="leipa">Leipä</option>
              <option value="pizza">Pizza</option>
            </select>
          </div>

          <input
            type="number"
            min="0"
            value={inputGrams}
            onChange={e => setInputGrams(e.target.value)}
            placeholder="Syötä määrä grammoina"
          />

          <select
            value={inputType}
            onChange={e => setInputType(e.target.value)}
          >
            <option value="jauho">Tämä on jauhojen määrä</option>
            <option value="vesi">Tämä on veden määrä</option>
          </select>

          <div className="row">
            <label>Hydraatio (%)</label>
            <input
              type="number"
              min={55}
              value={hydration}
              onChange={e => setHydration(Math.max(55, parseFloat(e.target.value)))}
            />
          </div>

          <div className="row">
            <label>Suola (%)</label>
            <input
              type="number"
              value={saltPct}
              onChange={e => setSaltPct(parseFloat(e.target.value))}
            />
          </div>

          {mode === 'pizza' && (
            <div className="row">
              <label>Lisätäänkö öljyä? (3%)</label>
              <input type="checkbox" checked={useOil} onChange={e => setUseOil(e.target.checked)} />
            </div>
          )}

          {mode === 'leipa' && (
            <>
              <div className="row">
                <label>Käytetäänkö ruisjauhoa? (20%)</label>
                <input type="checkbox" checked={useRye} onChange={e => setUseRye(e.target.checked)} />
              </div>
              <div className="row">
                <label>Lisätäänkö siemeniä? (15%)</label>
                <input type="checkbox" checked={useSeeds} onChange={e => setUseSeeds(e.target.checked)} />
              </div>
            </>
          )}

          <div className="row">
            <label>Kylmäfermentointi?</label>
            <input type="checkbox" checked={coldFerment} onChange={e => setColdFerment(e.target.checked)} />
          </div>

          <button onClick={() => setShowRecipe(!showRecipe)}>
            {showRecipe ? 'Piilota resepti' : 'Näytä resepti'}
          </button>

          <button onClick={resetAll} className="secondary">Tyhjennä</button>
        </div>

        {result && result.jauho && (
          <div className="results">
            <h2>🍞 Ainesosien määrät:</h2>
            <ul>
              <li><strong>Vesi:</strong> {result.vesi.toFixed(1)} g</li>
              <li><strong>Suola:</strong> {result.suola.toFixed(1)} g</li>
              <li><strong>Juuri:</strong> {result.juuri.toFixed(1)} g</li>
              {mode === 'pizza' && useOil && <li><strong>Öljy:</strong> {result.öljy.toFixed(1)} g</li>}
              {mode === 'leipa' && useSeeds && <li><strong>Siemenet:</strong> {result.siemenet.toFixed(1)} g</li>}
              <li><strong>Yhteensä:</strong> {result.yhteensa.toFixed(1)} g</li>
            </ul>

            <h3>Jauhotyypit:</h3>
            <ul>
              {Object.entries(result.jauhotyypit).map(([key, val]) => (
                <li key={key}>{key}: {val.toFixed(1)} g</li>
              ))}
            </ul>
          </div>
        )}

        <div className={`recipe ${showRecipe ? 'open' : ''}`}>
          {showRecipe && (
            <>
              <h2>📋 Resepti</h2>
              <p>1. Sekoita jauhot ja vesi, anna levätä 30 min.</p>
              <p>2. Lisää juuri ja sekoita tasaiseksi.</p>
              <p>3. Tee taittelut:</p>
              <div className="folds">
                {foldSchedule.map((label, idx) => (
                  <label key={idx}>
                    <input
                      type="checkbox"
                      checked={foldsDone > idx}
                      onChange={() => setFoldsDone(prev => (prev > idx ? idx : idx + 1))}
                    />
                    {label}
                  </label>
                ))}
              </div>
              {useSeeds && <p>4. Lisää siemenet ennen viimeistä taittelua.</p>}
              <p>{coldFerment
                ? '5. Nosta jääkaappiin yön yli ja paista 230 °C.'
                : '5. Kohota ja paista 230 °C.'}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
