import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";

/**
 * CalculatorPage.jsx
 * Complete page that replaces the old CalculatorForm.
 * - Flour/Water input toggle
 * - Pizza/Bread mode toggle
 * - Bread: Rye %, Seeds (5/10/15/20%), Extra ingredients (free text)
 * - Pizza: Oil (fixed 7%), Garlic (flag for recipe text)
 * - Hydration % and Salt % controls
 * - Computed ingredient list + quick recipe that adapts to toggles
 * Styling: Tailwind (matches app's card style), subtle motion
 */

// ---------- Helpers ----------
const clamp = (n, min, max) => Math.min(Math.max(n, min), max);
const round1 = (n) => Math.round(n * 10) / 10; // 0.1g precision

function gPct(base, pct) {
  return base * (pct / 100);
}

// ---------- Page ----------
export default function CalculatorPage() {
  // Core inputs
  const [inputMode, setInputMode] = useState("flour"); // 'flour' | 'water' (interpreted as TOTAL FLOUR)
  const [amount, setAmount] = useState(500); // flour total (g) or water total (ml), depending on inputMode
  const [mode, setMode] = useState("bread"); // 'bread' | 'pizza'

  // Baker's % (overall, INCLUDING starter)
  const [hydration, setHydration] = useState(70); // % overall hydration
  const [saltPct, setSaltPct] = useState(2); // % of total flour
  const [starterPct, setStarterPct] = useState(20); // % of total flour, assumed 100% hydration starter

  // Bread toggles
  const [useRye, setUseRye] = useState(false);
  const [ryePct, setRyePct] = useState(20); // % of total flour
  const [useSeeds, setUseSeeds] = useState(false);
  const [seedsPct, setSeedsPct] = useState(15); // 5/10/15/20
  const [extraIngredients, setExtraIngredients] = useState("");

  // Pizza toggles
  const [useOil, setUseOil] = useState(false); // 7% of flour when true
  const OIL_PCT = 7;
  const [useGarlic, setUseGarlic] = useState(false);

  const [coldFerment, setColdFerment] = useState(false);

  // Quick presets
  const applyPreset = (key) => {
    if (key === "quick-bread") {
      setMode("bread");
      setHydration(70);
      setSaltPct(2);
      setStarterPct(20);
      setUseRye(false);
      setUseSeeds(false);
      setColdFerment(false);
    } else if (key === "rustic-bread") {
      setMode("bread");
      setHydration(75);
      setSaltPct(2.2);
      setStarterPct(20);
      setUseRye(true); setRyePct(20);
      setUseSeeds(true); setSeedsPct(15);
      setColdFerment(true);
    } else if (key === "neapolitan") {
      setMode("pizza");
      setHydration(63);
      setSaltPct(2.8);
      setStarterPct(20);
      setUseOil(false);
      setColdFerment(true);
    } else if (key === "pan-pizza") {
      setMode("pizza");
      setHydration(70);
      setSaltPct(2.2);
      setStarterPct(20);
      setUseOil(true);
      setColdFerment(false);
    }
  };

  // Derived calculations (overall numbers include starter flour & water)
  const result = useMemo(() => {
    const h = clamp(hydration, 55, 100) / 100; // overall hydration target
    const sp = clamp(starterPct, 0, 100) / 100; // starter % of total flour (by weight)

    let flourTotal = 0; // total flour in dough (incl. starter flour)
    let waterTotal = 0; // total water in dough (incl. starter water)

    if (inputMode === "flour") {
      flourTotal = Number(amount) || 0; // interpret as TOTAL flour
      waterTotal = flourTotal * h;      // interpret hydration overall
    } else {
      waterTotal = Number(amount) || 0; // interpret as TOTAL water
      flourTotal = h > 0 ? waterTotal / h : 0;
    }

    // Starter assumed 100% hydration
    const starterWeight = flourTotal * sp; // total starter weight
    const starterFlour = starterWeight / 2;
    const starterWater = starterWeight / 2;

    // Base (to add) flour/water besides starter
    const baseFlour = Math.max(flourTotal - starterFlour, 0);
    const baseWater = Math.max(waterTotal - starterWater, 0);

    // Salt & oil based on total flour
    const salt = gPct(flourTotal, saltPct || 0);
    const oil = mode === "pizza" && useOil ? gPct(flourTotal, OIL_PCT) : 0;

    // Flour kinds
    const rye = mode === "bread" && useRye ? gPct(flourTotal, clamp(ryePct || 0, 0, 100)) : 0;
    const whiteFlour = Math.max(flourTotal - rye, 0); // bread: AP base; pizza: Tipo 00

    // Seeds
    const seeds = mode === "bread" && useSeeds ? gPct(flourTotal, [5,10,15,20].includes(seedsPct) ? seedsPct : 15) : 0;

    const totals = {
      flourTotal: round1(flourTotal),
      waterTotal: round1(waterTotal),
      baseFlour: round1(baseFlour),
      baseWater: round1(baseWater),
      salt: round1(salt),
      oil: round1(oil),
      rye: round1(rye),
      whiteFlour: round1(whiteFlour),
      seeds: round1(seeds),
      starterWeight: round1(starterWeight),
      starterFlour: round1(starterFlour),
      starterWater: round1(starterWater),
    };

    const totalWeight = round1(
      totals.baseFlour + totals.baseWater + totals.starterWeight + totals.salt + totals.oil + totals.seeds
    );

    const folds = [30, 30, 45, 60];

    return { ...totals, totalWeight, folds };
  }, [amount, inputMode, hydration, saltPct, starterPct, mode, useOil, useRye, ryePct, useSeeds, seedsPct]);

  const isBread = mode === "bread";
  const isPizza = mode === "pizza";

  // UI helpers
  const Input = ({ label, suffix, value, onChange, min, max, step = 1, disabled }) => (
    <label className="flex flex-col gap-1 w-full">
      <span className="text-sm text-gray-300">{label}</span>
      <div className={`flex items-center rounded-xl border border-gray-700 bg-gray-800/60 focus-within:ring-2 focus-within:ring-blue-500 ${disabled ? "opacity-50" : ""}`}>
        <input
          type="number"
          className="w-full bg-transparent px-3 py-2 outline-none text-white"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
        />
        {suffix && <span className="px-3 text-gray-400 text-sm">{suffix}</span>}
      </div>
    </label>
  );

  const Toggle = ({ active, onClick, children }) => (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-xl border text-sm transition ${
        active
          ? "bg-blue-600 border-blue-500 text-white shadow"
          : "bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700"
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header + optional hero slot */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">Taikinalaskin</h1>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid gap-6 md:grid-cols-2"
      >
        {/* Left: Controls */}
        <section className="rounded-2xl border border-gray-700 bg-gray-900/60 p-4 md:p-6">
          <div className="mb-3 flex flex-wrap gap-2">
            <Toggle active={inputMode === "flour"} onClick={() => setInputMode("flour")}>JAUHO (g)</Toggle>
            <Toggle active={inputMode === "water"} onClick={() => setInputMode("water")}>VESI (ml)</Toggle>
            <div className="ml-auto flex gap-2">
              <Toggle active={false} onClick={() => applyPreset(isBread ? "quick-bread" : "neapolitan")}>Pikaresepti</Toggle>
              <Toggle active={false} onClick={() => applyPreset(isBread ? "rustic-bread" : "pan-pizza")}>Resepti 2</Toggle>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4">
            {inputMode === "flour" ? (
              <Input label="Jauho yhteensä" suffix="g" value={amount} onChange={setAmount} min={1} step={1} />
            ) : (
              <Input label="Vesi yhteensä" suffix="ml" value={amount} onChange={setAmount} min={1} step={1} />
            )}

            <div className="grid grid-cols-3 gap-4">
              <Input label="Hydraatio (kokonais)" suffix="%" value={hydration} onChange={(v) => setHydration(clamp(v, 55, 100))} min={55} max={100} />
              <Input label="Suola" suffix="%" value={saltPct} onChange={setSaltPct} min={0} max={5} step={0.1} />
              <Input label="Juuri" suffix="% (100% hydr.)" value={starterPct} onChange={setStarterPct} min={0} max={50} step={1} />
            </div>
          </div>

          {/* Mode toggle */}
          <div className="mb-4 flex gap-2">
            <Toggle active={isBread} onClick={() => setMode("bread")}>🥖 Leipä</Toggle>
            <Toggle active={isPizza} onClick={() => setMode("pizza")}>🍕 Pizza</Toggle>
          </div>

          {/* Conditional toggles */}
          {isBread && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-300">Leipä: valinnat</h3>
              <div className="flex flex-wrap items-center gap-2">
                <Toggle active={useRye} onClick={() => setUseRye((v) => !v)}>Ruis</Toggle>
                <Toggle active={useSeeds} onClick={() => setUseSeeds((v) => !v)}>Siemenet</Toggle>
                <Toggle active={!!extraIngredients} onClick={() => setExtraIngredients((t) => (t ? "" : ""))}>Lisäainekset</Toggle>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input label="Ruis" suffix="% jauhomäärästä" value={ryePct} onChange={setRyePct} min={0} max={100} disabled={!useRye} />
                <label className="flex flex-col gap-1">
                  <span className="text-sm text-gray-300">Siemenet</span>
                  <select className="rounded-xl border border-gray-700 bg-gray-800/60 px-3 py-2 text-white disabled:opacity-50" value={seedsPct} onChange={(e) => setSeedsPct(Number(e.target.value))} disabled={!useSeeds}>
                    {[5, 10, 15, 20].map((p) => (
                      <option key={p} value={p}>{p}% jauhomäärästä</option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="flex flex-col gap-1">
                <span className="text-sm text-gray-300">Lisäainekset (vapaa teksti)</span>
                <textarea className="min-h-[88px] rounded-xl border border-gray-700 bg-gray-800/60 px-3 py-2 text-white placeholder-gray-500" placeholder="Esim. pähkinät, hunaja..." value={extraIngredients} onChange={(e) => setExtraIngredients(e.target.value)} />
              </label>
            </div>
          )}

          {isPizza && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-300">Pizza: valinnat</h3>
              <div className="flex flex-wrap items-center gap-2">
                <Toggle active={useOil} onClick={() => setUseOil((v) => !v)}>Öljy (7%)</Toggle>
                <Toggle active={useGarlic} onClick={() => setUseGarlic((v) => !v)}>Valkosipuli</Toggle>
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center gap-2">
            <Toggle active={coldFerment} onClick={() => setColdFerment((v) => !v)}>Kylmäkohotus</Toggle>
          </div>
        </section>

        {/* Right: Results */}
        <section className="rounded-2xl border border-gray-700 bg-gray-900/60 p-4 md:p-6">
          <h2 className="mb-4 text-lg font-medium text-white">Ainesosat</h2>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="text-gray-300">Jauhot yhteensä</div>
            <div className="text-white font-medium text-right">{result.flourTotal} g</div>

            <div className="text-gray-300">{isPizza ? "Tipo 00 -jauho" : "Vehnäjauho (yleis)"}</div>
            <div className="text-white text-right">{result.whiteFlour} g</div>

            {isBread && useRye && (
              <>
                <div className="text-gray-300">Ruisjauho</div>
                <div className="text-white text-right">{result.rye} g</div>
              </>
            )}

            <div className="text-gray-300">Vesi lisättävä</div>
            <div className="text-white text-right">{result.baseWater} g</div>

            <div className="text-gray-300">Juuri (100% hydr.)</div>
            <div className="text-white text-right">{result.starterWeight} g</div>

            <div className="text-gray-300">Suola</div>
            <div className="text-white text-right">{result.salt} g</div>

            {isPizza && useOil && (
              <>
                <div className="text-gray-300">Öljy (7%)</div>
                <div className="text-white text-right">{result.oil} g</div>
              </>
            )}

            {isBread && useSeeds && (
              <>
                <div className="text-gray-300">Siemenet</div>
                <div className="text-white text-right">{result.seeds} g</div>
              </>
            )}
          </div>

          <div className="mt-4 border-t border-gray-700 pt-3 flex justify-between text-sm">
            <span className="text-gray-300">Kokonaispaino</span>
            <span className="text-white font-semibold">{result.totalWeight} g</span>
          </div>

          {/* Quick recipe */}
          <h3 className="mt-6 mb-2 text-lg font-medium text-white">Pikaohje</h3>
          <ol className="list-decimal pl-5 space-y-2 text-gray-200 text-sm">
            <li>Sekoita {isPizza ? "Tipo 00" : "vehnäjauho"} ({result.whiteFlour} g{isBread && useRye ? ` + ruis ${result.rye} g` : ""}) ja vesi ({result.baseWater} g). Lisää koko juuri ({result.starterWeight} g). Anna autolyysi 20–30 min.</li>
            <li>Lisää suola ({result.salt} g){isPizza && useOil ? ` ja öljy (${result.oil} g)` : ""}{isBread && useSeeds ? ` sekä siemenet (${result.seeds} g)` : ""}. Sekoita tasaiseksi.</li>
            <li>Venytä ja taita {result.folds.length} kertaa: {result.folds.join(" / ")} min välein.</li>
            {coldFerment ? (
              <li>Kylmäkohotus: jääkaappiin viimeisen taiton jälkeen 12–48 h. Sen jälkeen temperoi 1–2 h.</li>
            ) : (
              <li>Kohota huoneenlämmössä 2–4 h, kunnes taikina on selvästi noussut, sitten muotoile.</li>
            )}
            {isPizza ? (
              <li>Jaa taikina palloiksi, levähdys 30–60 min. {useGarlic ? "Vinkki: lisää valkosipulia kastikkeeseen tai öljyyn." : ""}</li>
            ) : (
              <li>Muotoile limpuiksi/vuokaan ja paista 230–250°C. Höyry alkuun parantaa kuorta.</li>
            )}
          </ol>

          {extraIngredients?.trim() && isBread && (
            <div className="mt-4 text-sm text-gray-300">
              <div className="font-medium text-white mb-1">Lisäainekset (ei lasketa painoon):</div>
              <pre className="whitespace-pre-wrap text-gray-300 bg-gray-800/60 rounded-lg p-2">{extraIngredients}</pre>
            </div>
          )}
        </section>
      </motion.div>
    </div>
  );
}
