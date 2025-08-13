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
        F = (amount - starterWater) / h
