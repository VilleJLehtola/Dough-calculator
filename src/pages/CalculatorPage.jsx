// src/pages/CalculatorPage.jsx
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import InputField from '../components/common/InputField';
import ToggleButton from '../components/common/ToggleButton';
import { clamp, round1, gPct, calcStarter } from '../utils/doughHelpers';
import { track } from '@/analytics'; // [ADDED] Plausible events

export default function CalculatorPage() {
  const { t } = useTranslation();

  // -------- State --------
  const [inputMode, setInputMode] = useState('flour'); // 'flour' | 'water'
  const [amount, setAmount] = useState(500);
  const [mode, setMode] = useState('bread'); // 'bread' | 'pizza'
  const [hydrationBasePct, setHydrationBasePct] = useState(70);
  const [saltPct, setSaltPct] = useState(2);
  const [starterPct, setStarterPct] = useState(20);

  // Bread toggles
  const [ryeOn, setRyeOn] = useState(false);
  const [ryePct, setRyePct] = useState(20);
  const [seedsOn, setSeedsOn] = useState(false);
  const [seedsPct, setSeedsPct] = useState(15);

  // Pizza / general toggles
  const [oilOn, setOilOn] = useState(false);
  const [garlicOn, setGarlicOn] = useState(false);
  const [coldFerment, setColdFerment] = useState(false);

  // UI helper
  const [activePreset, setActivePreset] = useState(null);

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
      const h = clamp(hydrationBasePct, 40, 110) / 100;
      const sp = clamp(starterPct, 0, 50) / 100;

      let W_total = amount;
      if (W_total <= 0) {
        return 0;
      }

      // Iterate to solve F_total given W_total with 100% hydration starter
      let F = W_total;
      for (let i = 0; i < 10; i++) {
        const starterFlour = (sp * F) / 2;
        const baseFlour = Math.max(F - starterFlour, 0);
        const baseWater = baseFlour * h;
        const starterWater = (sp * F) / 2;
        W_total = baseWater + starterWater;
        F = (amount - starterWater) / h + starterFlour;
        if (!Number.isFinite(F)) break;
      }
      return Math.max(Math.round(F), 0);
    })();

    const h = clamp(hydrationBasePct, 40, 110) / 100;
    const sp = clamp(starterPct, 0, 50) / 100;

    const starter = calcStarter(F_total, sp); // { flour, water, weight }
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

  // -------- Quick Recipe builder --------
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
    const isCiabatta = activePreset === 'ciabatta' || hydrationBasePct >= 78;
    const isFocaccia = activePreset === 'focaccia';
    steps.push(`Autolyse: mix flour${ryeOn ? ' (incl. rye)' : ''} and water, rest 20–30 min.`);
    steps.push(`Add starter and salt${isFocaccia ? ', then oil' : ''}; develop gluten with stretch & folds.`);
    steps.push('Bulk until ~50–75% rise and jiggly (1.5–4 h depending on temp).');
    steps.push('Pre-shape, rest 15–20 min; final shape into loaf/banneton.');
    if (coldFerment) steps.push('Cold proof 8–24 h at 4°C; temper 1 h before baking.');
    steps.push('Bake 230–250°C with steam; vent halfway for crisp crust. Cool before slicing.');
    if (isCiabatta) steps.unshift('For very wet dough (ciabatta): use minimal handling; stretch & fold in tub.');
    if (isFocaccia) steps[steps.length - 1] = 'For focaccia: pan with oil, dimple, proof, top, and bake at 220–230°C.';
    return steps;
  }, [mode, activePreset, oilOn, coldFerment, ryeOn, hydrationBasePct]);

  // -------- Analytics: track first meaningful interaction once --------
  const hasTrackedRef = useRef(false);
  const defaultsRef = useRef({
    inputMode: 'flour',
    amount: 500,
    mode: 'bread',
    hydrationBasePct: 70,
    saltPct: 2,
    starterPct: 20,
    ryeOn: false,
    ryePct: 20,
    seedsOn: false,
    seedsPct: 15,
    oilOn: false,
    garlicOn: false,
    coldFerment: false,
    activePreset: null,
  });

  useEffect(() => {
    if (hasTrackedRef.current) return;
    const d = defaultsRef.current;
    const changed =
      inputMode !== d.inputMode ||
      amount !== d.amount ||
      mode !== d.mode ||
      hydrationBasePct !== d.hydrationBasePct ||
      saltPct !== d.saltPct ||
      starterPct !== d.starterPct ||
      ryeOn !== d.ryeOn ||
      ryePct !== d.ryePct ||
      seedsOn !== d.seedsOn ||
      seedsPct !== d.seedsPct ||
      oilOn !== d.oilOn ||
      garlicOn !== d.garlicOn ||
      coldFerment !== d.coldFerment ||
      activePreset !== d.activePreset;
    if (!changed) return;
    hasTrackedRef.current = true;
    track('Calculator Used', {
      input_type: inputMode,
      mode,
      hydration: hydrationBasePct,
      salt: saltPct,
      starter: starterPct,
      oil: oilOn ? 'yes' : 'no',
      garlic: garlicOn ? 'yes' : 'no',
      seeds: seedsOn ? 'yes' : 'no',
      rye: ryeOn ? 'yes' : 'no',
      cold_fermentation: coldFerment ? 'yes' : 'no',
      preset: activePreset || '',
    });
  }, [
    inputMode, amount, mode, hydrationBasePct, saltPct, starterPct,
    ryeOn, ryePct, seedsOn, seedsPct, oilOn, garlicOn, coldFerment, activePreset
  ]);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      {/* ...the rest of your component unchanged... */}
      {/* (all existing UI, hero image, form, results, quick recipe) */}
    </div>
  );
}
