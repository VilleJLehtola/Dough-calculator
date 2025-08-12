import React, { useMemo, useState } from 'react';
import InputField from '../components/common/InputField';
import ToggleButton from '../components/common/ToggleButton';
import { clamp, round1, gPct, calcStarter } from '../utils/doughHelpers';
import { useTranslation } from 'react-i18next';

// CalculatorPage — styled like RecipeViewPage with hero, two-column layout,
// base-only hydration (excluding starter), per-preset {t('quick_recipe')} steps.
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
  const [coldFerment, setColdFerment] = useState(false);
  const [oilOn, setOilOn] = useState(false);

  // -------- Derived base flour/water from input mode --------
  const {
    baseFlour,
    baseWater,
    starterFlour,
    starterWater,
    totalFlour,
    totalWater,
    salt,
    oil,
  } = useMemo(() => {
    // Amount interpretation
    const asFlour = inputMode === 'flour';
    const asWater = inputMode === 'water';

    // derive base amounts (excluding starter) from chosen mode
    let baseFlour = 0;
    let baseWater = 0;

    if (asFlour) {
      baseFlour = amount;
      baseWater = (hydrationBasePct / 100) * baseFlour;
    } else if (asWater) {
      baseWater = amount;
      baseFlour = baseWater / (hydrationBasePct / 100);
    }

    // starter contributions (100% hydration starter)
    const starterFlour = (starterPct / 100) * baseFlour;
    const starterWater = starterFlour; // 100% hydration
    const totalFlour = baseFlour + starterFlour;
    const totalWater = baseWater + starterWater;

    const salt = (saltPct / 100) * totalFlour;
    const oil = oilOn ? 0.07 * totalFlour : 0; // ~7% oil if enabled

    return {
      baseFlour,
      baseWater,
      starterFlour,
      starterWater,
      totalFlour,
      totalWater,
      salt,
      oil,
    };
  }, [
    amount,
    inputMode,
    hydrationBasePct,
    saltPct,
    starterPct,
    oilOn,
  ]);

  // -------- Preset labels --------
  const presetLabels = {
    bread: t('bread'),
    pizza: t('pizza'),
    focaccia: 'Focaccia',
  };

  // -------- Quick recipe steps (localized where needed) --------
  const quickSteps = useMemo(() => {
    const steps = [];
    const isPizza = mode === 'pizza';
    const isBread = mode === 'bread';
    const isFocaccia = false; // set true only if you support a focaccia preset

    // Shared-ish intro
    steps.push(`Autolyse: mix flour${ryeOn ? ' (incl. rye)' : ''} and water, rest 20–30 min.`);
    steps.push(`Add starter and salt${oilOn ? ', and oil' : ''}; mix to medium gluten.`);

    if (isBread) {
      steps.push('Fold schedule: every 30–45 min for 3–4 rounds.');
      steps.push('Bulk until ~50–75% risen with bubbles; bench rest 15–20 min.');
      steps.push('Shape, then proof 1–2 h at room temp or 8–18 h cold at ~4°C.');
      steps.push('Bake in preheated oven or dutch oven until deeply colored.');
    } else if (isPizza) {
      steps.push('Rest 20–30 min, then bulk until 50–75% risen with bubbles.');
      steps.push('Divide and ball. Rest 30–60 min at room temp.');
      if (coldFerment) {
        steps.push(`${t('cold_ferment')} dough balls 12–48 h at 4°C; temper 1–2 h before baking.`);
      }
      steps.push('Open by hand, top lightly, and bake as hot as possible on stone/steel.');
    } else if (isFocaccia) {
      steps.push('Bulk until visibly risen; pan with oil; dimple, proof, top, and bake.');
    }

    return steps;
  }, [mode, ryeOn, oilOn, coldFerment, t]);

  // -------- Rendering --------
  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold mb-4">
        {t('quick_recipe')}
      </h1>

      {/* form controls etc. — keeping your existing UI structure */}
      {/* ... your existing JSX for inputs, toggles, and results ... */}

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">{t('instructions')}</h2>
        <ol className="list-decimal pl-5 space-y-2">
          {quickSteps.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
      </div>
    </div>
  );
}
