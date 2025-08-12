import React, { useMemo, useState } from 'react';
import InputField from '../components/common/InputField';
import ToggleButton from '../components/common/ToggleButton';
import { clamp, round1, gPct, calcStarter } from '../utils/doughHelpers';
import { useTranslation } from 'react-i18next';

// CalculatorPage — styled like RecipeViewPage with hero, two-column layout,
// base-only hydration (excluding starter), per-preset {t('quick_recipe')} steps.
export default function CalculatorPage(
  const { t } = useTranslation();) {
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

  // UI helper: track which preset last applied (for {t('quick_recipe')} text tweaks)
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
    const h = clamp(hydrationBasePct, 40, 110) / 100; // base water / base flour
    const sp = clamp(starterPct, 0, 50) / 100;        // starter % of TOTAL flour (weight), 100% hydration

    let F_total = 0; // TOTAL flour (incl. starter flour)
    let W_total = 0; // TOTAL water (incl. starter water)

    if (inputMode === 'flour') {
      F_total = Number(amount) || 0;
      // Base flour excludes starter flour; compute base water from base flour
      const starterFlour = (sp * F_total) / 2;
      const baseFlour = Math.max(F_total - starterFlour, 0);
      const baseWater = baseFlour * h;
      const starterWater = (sp * F_total) / 2;
      W_total = baseWater + starterWater;
    } else {
      // amount is TOTAL water; solve for TOTAL flour
      const W = Number(amount) || 0;
      // Derivation: W_total = F_total * [ h*(1 - sp/2) + sp/2 ]
      const denom = h * (1 - sp / 2) + sp / 2;
      F_total = denom > 0 ? W / denom : 0;
      const starterFlour = (sp * F_total) / 2;
      const baseFlour = Math.max(F_total - starterFlour, 0);
      const baseWater = baseFlour * h;
      const starterWater = (sp * F_total) / 2;
      W_total = baseWater + starterWater;
    }

    const starter = {
      weight: round1(sp * F_total),
      flour: round1((sp * F_total) / 2),
      water: round1((sp * F_total) / 2),
    };

    const baseFlour = round1(Math.max(F_total - starter.flour, 0));
    const baseWater = round1(Math.max(W_total - starter.water, 0));

    const flourTotal = round1(F_total);
    const waterTotal = round1(W_total);

    const salt = round1(gPct(F_total, saltPct));
    const oil  = round1(oilOn && mode === 'pizza' ? gPct(F_total, 7) : 0);

    const ryeFlour = round1(ryeOn && mode === 'bread' ? gPct(F_total, clamp(ryePct, 0, 100)) : 0);
    const whiteFlour = round1(Math.max(F_total - ryeFlour, 0));
    const seeds = round1(seedsOn && mode === 'bread' ? gPct(F_total, clamp(seedsPct, 0, 100)) : 0);

    const totalWeight = round1(baseFlour + baseWater + starter.weight + salt + oil + seeds);

    return { flourTotal, waterTotal, baseFlour, baseWater, starter, salt, oil, ryeFlour, whiteFlour, seeds, totalWeight };
  }, [amount, inputMode, hydrationBasePct, starterPct, saltPct, oilOn, ryeOn, ryePct, seedsOn, seedsPct, mode]);

  // -------- {t('quick_recipe')} builder (preset-aware) --------
  const quickSteps = useMemo(() => {
    const steps = [];

    if (mode === 'pizza') {
      const style = activePreset === 'new-york' || oilOn ? 'New York–style' : 'Neapolitan';
      steps.push(`Mix ${style === 'Neapolitan' ? 'Tipo 00 flour' : 'flour'} and water until shaggy.`);
      steps.push(`Add starter and salt${oilOn ? ', then oil' : ''}; mix/knead or do stretch & folds until smooth.`);
      steps.push('Rest 20–30 min, then bulk until 50–75% risen with bubbles.');
      steps.push('Divide and ball. Rest 30–60 min at room temp.');
      if (coldFerment) steps.push('{t('cold_ferment')} dough balls 12–48 h at 4°C; temper 1–2 h before baking.');
      steps.push('Open by hand, top lightly, and bake as hot as possible on stone/steel.');
      return steps;
    }

    // Bread presets
    const isCiabatta = activePreset === 'ciabatta' || hydrationBasePct >= 78;
    const isFocaccia = activePreset === 'focaccia';

    steps.push(`Autolyse: mix flour${ryeOn ? ' (incl. rye)' : ''} and water, rest 20–30 min.`);
    steps.push(`Add starter and salt${oilOn ? ', and oil' : ''}; mix to medium gluten.`);
    steps.push('Fold schedule: every 30–45 min for 3–4 rounds.');
    if (seedsOn) steps.push('Add seeds during the last fold so they distribute evenly.');

    if (isCiabatta) {
      steps.push('Gentle letter folds on a floured bench; proof on a floured couche.');
    } else if (isFocaccia) {
      steps.push('Oil a pan generously, dimple the dough, proof in pan; top with oil/salt/herbs.');
    } else {
      steps.push('Bulk until ~50–75% rise and jiggly (1.5–4 h depending on temp).');
      steps.push('Pre‑shape, rest 15–20 min; final shape into loaf/banneton.');
    }

    if (coldFerment) steps.push('Cold proof 8–18 h at 4°C; bake straight from cold for best scoring.');
    else steps.push('Final proof at room temp until finger‑poke ready (30–90 min).');

    steps.push('Bake 230–250°C with steam; vent halfway for crisp crust. Cool before slicing.');
    return steps;
  }, [mode, activePreset, oilOn, coldFerment, ryeOn, seedsOn, hydrationBasePct]);

  // -------- UI --------
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-gray-900 rounded-xl overflow-hidden shadow-lg">
        <img src="https://btozmkrowcrjzvxxhlbn.supabase.co/storage/v1/object/public/recipe-images/hero.jpg" alt="Recipe Hero" className="w-full h-64 object-cover" />

        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column: Controls */}
          <div>
            {/* Presets */}
            <div className="flex flex-wrap gap-2 mb-4" role="group" aria-label="{t('recipe_presets')}">
              {presets.map((p) => (
                <ToggleButton key={p.key} active={activePreset === p.key} onClick={() => applyPreset(p)} aria-label={`Apply ${p.label} preset`}>
                  {p.label}
                </ToggleButton>
              ))}
            </div>

            {/* Input mode + mode */}
            <div className="flex flex-wrap gap-2 mb-4" role="group" aria-label={t('modes')}>
              <ToggleButton active={inputMode === 'flour'} onClick={() => setInputMode('flour')} aria-pressed={inputMode === 'flour'}>{t('flour')}</ToggleButton>
              <ToggleButton active={inputMode === 'water'} onClick={() => setInputMode('water')} aria-pressed={inputMode === 'water'}>{t('water')}</ToggleButton>
              <div className="ml-auto flex gap-2">
                <ToggleButton active={mode === 'bread'} onClick={() => { setMode('bread'); setActivePreset(null); }}>🥖 {t('bread')}</ToggleButton>
                <ToggleButton active={mode === 'pizza'} onClick={() => { setMode('pizza'); setActivePreset(null); }}>🍕 {t('pizza')}</ToggleButton>
              </div>
            </div>

            {/* Primary inputs */}
            {inputMode === 'flour' ? (
              <InputField id="amount" label="{t('amount_flour')}" suffix="g" value={amount} onChange={setAmount} min={1} />
            ) : (
              <InputField id="amount" label="{t('amount_water')}" suffix="ml" value={amount} onChange={setAmount} min={1} />
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <InputField id="hydration" label="Hydration (base)" suffix="%" value={hydrationBasePct} onChange={(v) => setHydrationBasePct(clamp(v, 40, 110))} min={40} max={110} />
              <InputField id="salt" label="Salt" suffix="%" value={saltPct} onChange={setSaltPct} min={0} max={5} step={0.1} />
              <InputField id="starter" label="Starter" suffix="% (100% hydr.)" value={starterPct} onChange={setStarterPct} min={0} max={50} step={1} />
            </div>

            {/* Bread options */}
            {mode === 'bread' && (
              <div className="mt-4">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <ToggleButton active={ryeOn} onClick={() => setRyeOn(!ryeOn)}>Rye</ToggleButton>
                  <ToggleButton active={seedsOn} onClick={() => setSeedsOn(!seedsOn)}>Seeds</ToggleButton>
                  <ToggleButton active={coldFerment} onClick={() => setColdFerment(!coldFerment)}>{t('cold_ferment')}</ToggleButton>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField id="ryePct" label="{t('rye_pct_total')}" suffix="%" value={ryePct} onChange={setRyePct} min={0} max={100} disabled={!ryeOn} />
                  <InputField id="seedsPct" label="{t('seeds_pct_total')}" suffix="%" value={seedsPct} onChange={setSeedsPct} min={5} max={20} disabled={!seedsOn} />
                </div>
              </div>
            )}

            {/* Pizza options */}
            {mode === 'pizza' && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <ToggleButton active={oilOn} onClick={() => setOilOn(!oilOn)}>{t('oil_7_pct')}</ToggleButton>
                <ToggleButton active={garlicOn} onClick={() => setGarlicOn(!garlicOn)}>{t('garlic')}</ToggleButton>
                <ToggleButton active={coldFerment} onClick={() => setColdFerment(!coldFerment)}>{t('cold_ferment')}</ToggleButton>
              </div>
            )}
          </div>

          {/* Right column: Ingredients + {t('quick_recipe')} */}
          <div className="bg-gray-800 rounded-xl p-4 text-white" aria-live="polite">
            <h2 className="text-lg font-bold mb-2">{t('ingredients')}</h2>
            <ul className="space-y-1 text-sm">
              <li>{calc.whiteFlour}g {mode === 'pizza' ? 'Tipo 00 Flour' : 'White Flour'}</li>
              {mode === 'bread' && ryeOn && <li>{calc.ryeFlour}g Rye Flour</li>}
              <li>{calc.baseWater}g Water</li>
              <li>{calc.starter.weight}g Starter ({calc.starter.flour}g flour / {calc.starter.water}g water)</li>
              <li>{calc.salt}g Salt</li>
              {mode === 'pizza' && oilOn && <li>{calc.oil}g Oil</li>}
              {mode === 'bread' && seedsOn && <li>{calc.seeds}g Seeds</li>}
            </ul>

            <div className="mt-3 flex justify-between text-sm text-gray-300 border-t border-gray-700 pt-2">
              <span>Total dough weight</span>
              <span className="text-white font-medium">{calc.totalWeight} g</span>
            </div>

            <div className="mt-6">
              <h3 className="text-md font-semibold mb-2">{t('quick_recipe')}</h3>
              <ol className="list-decimal pl-5 space-y-1 text-sm text-gray-300">
                {quickSteps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
