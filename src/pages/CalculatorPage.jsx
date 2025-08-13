import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import InputField from '../components/common/InputField';
import ToggleButton from '../components/common/ToggleButton';
import { clamp, round1, gPct, calcStarter } from '../utils/doughHelpers';

// CalculatorPage — styled like RecipeViewPage with hero, two-column layout,
// base-only hydration (excluding starter), per-preset Quick Recipe steps.
export default function CalculatorPage() {
  const { t } = useTranslation();
  // -------- State --------
  const [inputMode, setInputMode] = useState('flour'); // 'flour' (total flour) | 'water' (total water)
  const [amount, setAmount] = useState(500);
  const [mode, setMode] = useState('bread'); // 'bread' | 'pizza'
  const [hydrationBasePct, setHydrationBasePct] = useState(70); // base water / base flour * 100
  const [saltPct, setSaltPct] = useState(2);
  const [starterPct, setStarterPct] = useState(20); // % of total flour, 100% hydration starter

  // Bread toggles
  const [ryeOn, setRyeOn] = useState(false);
  const [ryePct, setRyePct] = useState(20); // % of TOTAL flour
  const [seedsOn, setSeedsOn] = useState(false);
  const [seedsPct, setSeedsPct] = useState(15); // 5/10/15/20 typical

  // Pizza / general toggles
  const [oilOn, setOilOn] = useState(false); // pizza oil 7% of flour
  const [garlicOn, setGarlicOn] = useState(false); // recipe hint only
  const [coldFerment, setColdFerment] = useState(false);

  // UI helper: track which preset last applied (for Quick Recipe text tweaks)
  const [activePreset, setActivePreset] = useState(null); // 'neapolitan' | 'new-york' | 'ciabatta' | 'focaccia' | 'sourdough' | null

  // -------- Presets --------
  const presets = [
    { key: 'neapolitan', label: 'Neapolitan', mode: 'pizza', hydration: 63, salt: 2.8, oil: false, rye: false, cold: true },
    { key: 'new-york',   label: 'New York',   mode: 'pizza', hydration: 65, salt: 2.5, oil: true,  rye: false, cold: true },
    { key: 'ciabatta',   label: 'Ciabatta',   mode: 'bread', hydration: 80, salt: 2.0, oil: false, rye: false, cold: false },
    { key: 'focaccia',   label: 'Focaccia',   mode: 'bread', hydration: 75, salt: 2.5, oil: true,  rye: false, cold: false },
    { key: 'sourdough',  label: 'Sourdough',  mode: 'bread', hydration: 70, salt: 2.0, oil: false, rye: true,  cold: true },
  ];

  const applyPreset = (p) => {
    setMode(p.mode);
    setHydrationBasePct(p.hydration);
    setSaltPct(p.salt);
    setOilOn(!!p.oil);
    setRyeOn(!!p.rye);
    setColdFerment(!!p.cold);
    setActivePreset(p.key);
  };

  // -------- Math (base-only hydration) --------
  const calc = useMemo(() => {
    const F_total = inputMode === 'flour' ? amount : (() => {
      // derive flour from water amount and base-only hydration
      const h = clamp(hydrationBasePct, 40, 110) / 100; // base water / base flour
      const sp = clamp(starterPct, 0, 50) / 100; // starter flour pct of total flour
      // water = baseFlour*h + starterWater; starterWater = sp * F_total / 2
      let W_total = amount;
      if (W_total <= 0) return { flourTotal: 0, waterTotal: 0, baseFlour: 0, baseWater: 0, starter: { flour: 0, water: 0, weight: 0 }, salt: 0, oil: 0, ryeFlour: 0, whiteFlour: 0, seeds: 0, totalWeight: 0 };

      // F_total = (W_total - starterWater) / h + starterFlour
      // with 100% hydration starter: starterFlour = starterWater = sp * F_total / 2
      // W_total = baseFlour*h + sp*F_total/2
      // baseFlour = F_total - sp*F_total/2
      // W_total = (F_total - sp*F_total/2)*h + sp*F_total/2
      // Solve for F_total numerically is overkill; use simple iteration:
      let F = W_total; // init
      for (let i = 0; i < 10; i++) {
        const starterFlour = (sp * F) / 2;
        const baseFlour = Math.max(F - starterFlour, 0);
        const baseWater = baseFlour * h;
        const starterWater = (sp * F) / 2;
        W_total = baseWater + starterWater;
        // next guess
        F = (amount - starterWater) / h + starterFlour;
        if (!Number.isFinite(F)) break;
      }
      return Math.max(Math.round(F), 0);
    })();

    const h = clamp(hydrationBasePct, 40, 110) / 100;
    const sp = clamp(starterPct, 0, 50) / 100;

    const starter = calcStarter(F_total, sp); // { flour, water, weight }

    // base flour/water exclude starter contribution
    const baseFlour = round1(Math.max(F_total - starter.flour, 0));
    const baseWater = round1(Math.max((F_total - starter.flour) * h, 0));
    const W_total = round1(baseWater + starter.water);
    const flourTotal = round1(F_total);
    const waterTotal = round1(W_total);

    const salt = round1(gPct(F_total, clamp(saltPct, 0, 5)));
    const oil = round1(oilOn && mode === 'pizza' ? gPct(F_total, 7) : 0);

    const ryeFlour = round1(ryeOn && mode === 'bread' ? gPct(F_total, clamp(ryePct, 0, 100)) : 0);
    const whiteFlour = round1(Math.max(F_total - ryeFlour, 0));
    const seeds = round1(seedsOn && mode === 'bread' ? gPct(F_total, clamp(seedsPct, 0, 100)) : 0);

    const totalWeight = round1(baseFlour + baseWater + starter.weight + salt + oil + seeds);

    return { flourTotal, waterTotal, baseFlour, baseWater, starter, salt, oil, ryeFlour, whiteFlour, seeds, totalWeight };
  }, [amount, inputMode, hydrationBasePct, starterPct, saltPct, oilOn, ryeOn, ryePct, seedsOn, seedsPct, mode]);

  // -------- Quick Recipe builder (preset-aware) --------
  const quickSteps = useMemo(() => {
    const steps = [];

    if (mode === 'pizza') {
      const style = activePreset === 'new-york' || oilOn ? 'New York–style' : 'Neapolitan';
      steps.push(`Mix ${style === 'Neapolitan' ? 'Tipo 00 flour' : 'flour'} and water until shaggy.`);
      steps.push(`Add starter and salt${oilOn ? ', then oil' : ''}; mix/knead or do stretch & folds until smooth.`);
      steps.push('Rest 20–30 min, then bulk until 50–75% risen with bubbles.');
      steps.push('Divide and ball. Rest 30–60 min at room temp.');
      if (coldFerment) steps.push('Cold ferment dough balls 12–48 h at 4°C; temper 1–2 h before baking.');
      steps.push('Open by hand, top lightly, and bake as hot as possible on stone/steel.');
      return steps;
    }

    // Bread presets
    const isCiabatta = activePreset === 'ciabatta' || hydrationBasePct >= 78;
    const isFocaccia = activePreset === 'focaccia';

    steps.push(`Autolyse: mix flour${ryeOn ? ' (incl. rye)' : ''} and water, rest 20–30 min.`);
    steps.push(`Add starter and salt${isFocaccia ? ', then oil' : ''}; develop gluten with stretch & folds.`);
    steps.push('Bulk until ~50–75% rise and jiggly (1.5–4 h depending on temp).');
    steps.push('Pre-shape, rest 15–20 min; final shape into loaf/banneton.');
    if (coldFerment) steps.push('Cold proof 8–24 h at 4°C; temper 1 h before baking.');
    steps.push('Bake 230–250°C with steam; vent halfway for crisp crust. Cool before slicing.');

    if (isCiabatta) {
      steps.unshift('For very wet dough (ciabatta): use minimal handling; stretch & fold in tub.');
    }
    if (isFocaccia) {
      steps[steps.length - 1] = 'For focaccia: pan with oil, dimple, proof, top, and bake at 220–230°C.';
    }

    return steps;
  }, [mode, activePreset, oilOn, coldFerment, ryeOn, hydrationBasePct]);

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6">
      {/* HERO BANNER */}
      <div className="relative w-full aspect-[21/6] rounded-xl overflow-hidden mb-4">
        <img
          src="https://images.unsplash.com/photo-1608198093002-ad4e005484ec?q=80&w=2070&auto=format&fit=crop"
          alt="Calculator hero"
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column: Controls */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          {/* Presets */}
          <div className="flex flex-wrap gap-2 mb-4" role="group" aria-label="Presets">
            {presets.map((p) => (
              <ToggleButton
                key={p.key}
                active={activePreset === p.key}
                onClick={() => applyPreset(p)}
                aria-pressed={activePreset === p.key}
              >
                {p.label}
              </ToggleButton>
            ))}
          </div>

          {/* Input mode + mode */}
          <div className="flex flex-wrap gap-2 mb-4" role="group" aria-label="Modes">
            <ToggleButton active={inputMode === 'flour'} onClick={() => setInputMode('flour')} aria-pressed={inputMode === 'flour'}>
              {t('flour','Flour')}
            </ToggleButton>
            <ToggleButton active={inputMode === 'water'} onClick={() => setInputMode('water')} aria-pressed={inputMode === 'water'}>
              {t('water','Water')}
            </ToggleButton>
            <div className="ml-auto flex gap-2">
              <ToggleButton active={mode === 'bread'} onClick={() => { setMode('bread'); setActivePreset(null); }}>
                {`🥖 ${t('bread','Bread')}`}
              </ToggleButton>
              <ToggleButton active={mode === 'pizza'} onClick={() => { setMode('pizza'); setActivePreset(null); }}>
                {`🍕 ${t('pizza','Pizza')}`}
              </ToggleButton>
            </div>
          </div>

          {/* Primary inputs */}
          {inputMode === 'flour' ? (
            <InputField id="amount" label={t('amount_flour','Amount (flour)')} suffix="g" value={amount} onChange={setAmount} min={1} />
          ) : (
            <InputField id="amount" label={t('amount_water','Amount (water)')} suffix="ml" value={amount} onChange={setAmount} min={1} />
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <InputField
              id="hydration"
              label={t('hydration_base','Hydration (base)')}
              suffix="%"
              value={hydrationBasePct}
              onChange={(v) => setHydrationBasePct(clamp(v, 40, 110))}
              min={40}
              max={110}
            />
            <InputField id="salt" label={t('salt','Salt')} suffix="%" value={saltPct} onChange={setSaltPct} min={0} max={5} step={0.1} />
            <InputField id="starter" label={t('starter','Starter')} suffix="%" value={starterPct} onChange={setStarterPct} min={0} max={50} step={1} />
          </div>

          {/* Bread options */}
          {mode === 'bread' && (
            <div className="mt-4">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <ToggleButton active={ryeOn} onClick={() => setRyeOn(!ryeOn)}>{t('rye','Rye')}</ToggleButton>
                <ToggleButton active={seedsOn} onClick={() => setSeedsOn(!seedsOn)}>{t('seeds','Seeds')}</ToggleButton>
                <ToggleButton active={coldFerment} onClick={() => setColdFerment(!coldFerment)}>{t('cold_ferment','Cold ferment')}</ToggleButton>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  id="ryePct"
                  label={t('rye_pct_total_flour','Rye % of total flour')}
                  suffix="%"
                  value={ryePct}
                  onChange={setRyePct}
                  min={0}
                  max={100}
                  disabled={!ryeOn}
                />
                <InputField
                  id="seedsPct"
                  label={t('seeds_pct_total_flour','Seeds % of total flour')}
                  suffix="%"
                  value={seedsPct}
                  onChange={setSeedsPct}
                  min={5}
                  max={20}
                  disabled={!seedsOn}
                />
              </div>
            </div>
          )}

          {/* Pizza options */}
          {mode === 'pizza' && (
            <div className="mt-4">
              <div className="flex flex-wrap items-center gap-2">
                <ToggleButton active={oilOn} onClick={() => setOilOn(!oilOn)}>Oil (7%)</ToggleButton>
                <ToggleButton active={garlicOn} onClick={() => setGarlicOn(!garlicOn)}>Garlic</ToggleButton>
                <ToggleButton active={coldFerment} onClick={() => setColdFerment(!coldFerment)}>{t('cold_ferment','Cold ferment')}</ToggleButton>
              </div>
            </div>
          )}
        </div>

        {/* Right column: Ingredients + Quick Recipe */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 text-gray-800 dark:text-gray-100" aria-live="polite">
          <h2 className="text-lg font-bold mb-2">{t('ingredients','Ingredients')}</h2>
          <ul className="space-y-1 text-sm">
            <li>{calc.whiteFlour}g {mode === 'pizza' ? t('tipo00_flour','Tipo 00 Flour') : t('white_flour','White Flour')}</li>
            {mode === 'bread' && ryeOn && <li>{calc.ryeFlour}g {t('rye_flour','Rye Flour')}</li>}
            <li>{calc.baseWater}g {t('water','Water')}</li>
            <li>{calc.starter.weight}g {t('starter','Starter')} ({calc.starter.flour}g flour / {calc.starter.water}g water)</li>
            <li>{calc.salt}g {t('salt','Salt')}</li>
            {mode === 'pizza' && oilOn && <li>{calc.oil}g {t('oil','Oil')}</li>}
            {mode === 'bread' && seedsOn && <li>{calc.seeds}g {t('seeds','Seeds')}</li>}
          </ul>

          <div className="mt-3 flex justify-between text-sm text-gray-600 dark:text-gray-300 border-t border-gray-200 dark:border-gray-700 pt-2">
            <span>{t('total_dough_weight','Total dough weight')}</span>
            <span className="text-gray-900 dark:text-white font-medium">{calc.totalWeight} g</span>
          </div>

          <div className="mt-6">
            <h3 className="text-md font-semibold mb-2">{t('quick_recipe','Quick Recipe')}</h3>
            <ol className="list-decimal pl-5 space-y-1 text-sm text-gray-700 dark:text-gray-300">
              {quickSteps.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
