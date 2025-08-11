import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";

/**
 * CalculatorPage.jsx — rebuilt full page
 * - Base-only hydration (EXCLUDES starter)
 * - Starter defaults to 20% of total flour (100% hydration)
 * - Pizza/Bread modes with flour type labels (Tipo 00 vs. AP + optional Rye)
 * - Bread: Rye %, Seeds (5/10/15/20), Extra ingredients (notes)
 * - Pizza: Oil toggle (7%), Garlic (note)
 * - Five presets: Neapolitan, New York, Ciabatta, Focaccia, Sourdough Loaf
 * - Hero image at top (Supabase URL)
 */

// ---------- Config ----------
const HERO_URL = "https://btozmkrowcrjzvxxhlbn.supabase.co/storage/v1/object/public/recipe-images/hero.jpg";
const OIL_PCT = 7; // pizza oil when enabled

// Presets use BASE hydration (excludes starter flour/water)
const PRESETS = [
  {
    key: "neapolitan",
    label: "Neapolitan",
    cfg: {
      mode: "pizza",
      hydrationBasePct: 60,
      saltPct: 2.8,
      starterPct: 20,
      useOil: false,
      coldFerment: true,
      useRye: false,
      useSeeds: false,
    },
  },
  {
    key: "new-york",
    label: "New York",
    cfg: {
      mode: "pizza",
      hydrationBasePct: 63,
      saltPct: 2.5,
      starterPct: 20,
      useOil: true,
      coldFerment: true,
      useRye: false,
      useSeeds: false,
    },
  },
  {
    key: "ciabatta",
    label: "Ciabatta",
    cfg: {
      mode: "bread",
      hydrationBasePct: 78,
      saltPct: 2.0,
      starterPct: 20,
      useOil: false,
      coldFerment: false,
      useRye: false,
      useSeeds: false,
    },
  },
  {
    key: "focaccia",
    label: "Focaccia",
    cfg: {
      mode: "bread",
      hydrationBasePct: 75,
      saltPct: 2.5,
      starterPct: 20,
      useOil: true, // oil shown only for pizza in ingredients; here it's just a note in recipe
      coldFerment: false,
      useRye: false,
      useSeeds: false,
    },
  },
  {
    key: "sourdough-loaf",
    label: "Sourdough Loaf",
    cfg: {
      mode: "bread",
      hydrationBasePct: 70,
      saltPct: 2.0,
      starterPct: 20,
      useOil: false,
      coldFerment: true,
      useRye: false,
      useSeeds: false,
    },
  },
];

// ---------- Utils ----------
const clamp = (n, min, max) => Math.min(Math.max(n, min), max);
const round1 = (n) => Math.round(n * 10) / 10;
const gPct = (base, pct) => base * (pct / 100);

export default function CalculatorPage() {
  // Core inputs
  const [inputMode, setInputMode] = useState("flour"); // 'flour' => amount = TOTAL flour; 'water' => amount = TOTAL water
  const [amount, setAmount] = useState(500);
  const [mode, setMode] = useState("bread"); // 'bread' | 'pizza'

  // Baker's % (BASE ONLY for hydration)
  const [hydrationBasePct, setHydrationBasePct] = useState(70);
  const [saltPct, setSaltPct] = useState(2);
  const [starterPct, setStarterPct] = useState(20); // % of TOTAL flour, starter assumed 100% hydration

  // Bread toggles
  const [useRye, setUseRye] = useState(false);
  const [ryePct, setRyePct] = useState(20); // % of TOTAL flour
  const [useSeeds, setUseSeeds] = useState(false);
  const [seedsPct, setSeedsPct] = useState(15); // 5/10/15/20
  const [extraIngredients, setExtraIngredients] = useState("");

  // Pizza toggles
  const [useOil, setUseOil] = useState(false); // 7% of total flour when true
  const [useGarlic, setUseGarlic] = useState(false);

  const [coldFerment, setColdFerment] = useState(false);

  // Apply preset
  const applyPreset = (cfg) => {
    setMode(cfg.mode);
    setHydrationBasePct(cfg.hydrationBasePct);
    setSaltPct(cfg.saltPct);
    setStarterPct(cfg.starterPct);
    setUseOil(!!cfg.useOil);
    setColdFerment(!!cfg.coldFerment);
    setUseRye(!!cfg.useRye);
    setUseSeeds(!!cfg.useSeeds);
  };

  // Derived calculations — BASE hydration (excludes starter)
  const result = useMemo(() => {
    const h = clamp(hydrationBasePct, 40, 110) / 100; // base water / base flour
    const sp = clamp(starterPct, 0, 100) / 100; // starter weight as % of TOTAL flour

    let F_total = 0; // TOTAL flour (includes starter flour)
    let W_total = 0; // TOTAL water (includes starter water)

    if (inputMode === "flour") {
      F_total = Number(amount) || 0;
      const starterFlour = (sp * F_total) / 2;
      const baseFlour = Math.max(F_total - starterFlour, 0);
      const baseWater = baseFlour * h;
      const starterWater = (sp * F_total) / 2;
      W_total = baseWater + starterWater;
    } else {
      // input is TOTAL water -> solve for TOTAL flour
      const W = Number(amount) || 0;
      const denom = h * (1 - sp / 2) + sp / 2; // W = F * [ h*(1-sp/2) + sp/2 ]
      F_total = denom > 0 ? W / denom : 0;
      const starterFlour = (sp * F_total) / 2;
      const baseFlour = Math.max(F_total - starterFlour, 0);
      const baseWater = baseFlour * h;
      const starterWater = (sp * F_total) / 2;
      W_total = baseWater + starterWater;
    }

    // Recompute shared pieces from F_total & W_total
    const starterWeight = sp * F_total; // 100% hydration starter
    const starterFlour = starterWeight / 2;
    const starterWater = starterWeight / 2;

    const baseFlour = Math.max(F_total - starterFlour, 0);
    const baseWater = Math.max(W_total - starterWater, 0);

    const salt = gPct(F_total, saltPct || 0);
    const oil = mode === "pizza" && useOil ? gPct(F_total, OIL_PCT) : 0;

    // Flour kinds
    const rye = mode === "bread" && useRye ? gPct(F_total, clamp(ryePct || 0, 0, 100)) : 0;
    const whiteFlour = Math.max(F_total - rye, 0); // AP for bread, Tipo 00 for pizza

    // Seeds
    const seeds = mode === "bread" && useSeeds ? gPct(F_total, [5, 10, 15, 20].includes(seedsPct) ? seedsPct : 15) : 0;

    const totals = {
      flourTotal: round1(F_total),
      waterTotal: round1(W_total),
      baseFlour: round1(baseFlour),
      baseWater: round1(baseWater),
      starterWeight: round1(starterWeight),
      starterFlour: round1(starterFlour),
      starterWater: round1(starterWater),
      salt: round1(salt),
      oil: round1(oil),
      rye: round1(rye),
      whiteFlour: round1(whiteFlour),
      seeds: round1(seeds),
    };

    const totalWeight = round1(
      totals.baseFlour + totals.baseWater + totals.starterWeight + totals.salt + totals.oil + totals.seeds
    );

    const folds = [30, 30, 45, 60];

    return { ...totals, totalWeight, folds };
  }, [amount, inputMode, hydrationBasePct, saltPct, starterPct, mode, useOil, useRye, ryePct, useSeeds, seedsPct]);

  const isBread = mode === "bread";
  const isPizza = mode === "pizza";

  // Small UI helpers
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
      {/* Hero */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
        <div className="overflow-hidden rounded-2xl border border-gray-700 bg-gray-900/50">
          <img src={HERO_URL} alt="Taikinalaskin" className="h-44 w-full object-cover md:h-56" />
        </div>
      </motion.div>

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">Taikinalaskin</h1>
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid gap-6 md:grid-cols-2">
        {/* Left: Controls */}
        <section className="rounded-2xl border border-gray-700 bg-gray-900/60 p-4 md:p-6">
          {/* Presets */}
          <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-5">
            {PRESETS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => applyPreset(p.cfg)}
                className="rounded-xl border border-gray-700 bg-gray-800/60 px-3 py-1.5 text-sm text-gray-200 hover:bg-gray-700"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Input mode */}
          <div className="mb-4 flex flex-wrap gap-2">
            <Toggle active={inputMode === "flour"} onClick={() => setInputMode("flour")}>JAUHO (g)</Toggle>
            <Toggle active={inputMode === "water"} onClick={() => setInputMode("water")}>VESI (ml)</Toggle>
            <div className="ml-auto flex gap-2">
              <Toggle active={mode === "bread"} onClick={() => setMode("bread")}>🥖 Leipä</Toggle>
              <Toggle active={mode === "pizza"} onClick={() => setMode("pizza")}>🍕 Pizza</Toggle>
            </div>
          </div>

          {/* Primary inputs */}
          <div className="mb-6 grid grid-cols-1 gap-4">
            {inputMode === "flour" ? (
              <Input label="Jauho yhteensä" suffix="g" value={amount} onChange={setAmount} min={1} step={1} />
            ) : (
              <Input label="Vesi yhteensä" suffix="ml" value={amount} onChange={setAmount} min={1} step={1} />
            )}

            <div className="grid grid-cols-3 gap-4">
              <Input label="Hydraatio (perustaikina)" suffix="%" value={hydrationBasePct} onChange={(v) => setHydrationBasePct(clamp(v, 40, 110))} min={40} max={110} />
              <Input label="Suola" suffix="%" value={saltPct} onChange={setSaltPct} min={0} max={5} step={0.1} />
              <Input label="Juuri" suffix="% (100% hydr.)" value={starterPct} onChange={setStarterPct} min={0} max={50} step={1} />
            </div>
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

            <div className="text-gray-300">Vesi (lisättävä)</div>
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
              <li>Kohota huoneenlämmössä 2–4 h, kunnes taikina on noussut, sitten muotoile.</li>
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
