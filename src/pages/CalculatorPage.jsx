// src/pages/CalculatorPage.jsx
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import InputField from '../components/common/InputField';
import ToggleButton from '../components/common/ToggleButton';
import { clamp, round1, gPct, calcStarter } from '../utils/doughHelpers';
import { track } from '@/analytics';

function yesNo(v) {
  return v ? 'yes' : 'no';
}

export default function CalculatorPage() {
  const { t } = useTranslation();

  // -------- Core state --------
  const [inputMode, setInputMode] = useState('flour'); // 'flour' | 'water'
  const [amount, setAmount] = useState(500); // grams for the chosen inputMode
  const [mode, setMode] = useState('bread'); // 'bread' | 'pizza'

  // Base hydration/salt (excludes starter water/flour)
  const [hydrationBasePct, setHydrationBasePct] = useState(70);
  const [saltPct, setSaltPct] = useState(2);

  // Starter percentage (of flour)
  const [starterPct, setStarterPct] = useState(20);

  // Bread options
  const [ryeOn, setRyeOn] = useState(false);
  const [ryePct, setRyePct] = useState(20);
  const [seedsOn, setSeedsOn] = useState(false);
  const [seedsPct, setSeedsPct] = useState(15);

  // Pizza options
  const [oilOn, setOilOn] = useState(false);

  // Common
  const [coldFerment, setColdFerment] = useState(false);

  // Optional quick presets (null when not chosen)
  const [activePreset, setActivePreset] = useState(null);

  // -------- Derived values --------
  const baseFlour = useMemo(() => {
    if (inputMode === 'flour') {
      return Math.max(0, Number(amount) || 0);
    } else {
      // input is water grams; compute base flour from hydration
      const water = Math.max(0, Number(amount) || 0);
      const h = Math.max(1, Number(hydrationBasePct) || 0);
      return Math.round((water * 100) / h);
    }
  }, [inputMode, amount, hydrationBasePct]);

  const baseWater = useMemo(() => {
    const f = baseFlour;
    const h = Math.max(0, Number(hydrationBasePct) || 0);
    return round1((f * h) / 100);
  }, [baseFlour, hydrationBasePct]);

  const starter = useMemo(() => {
    const f = baseFlour;
    const pct = clamp(Number(starterPct) || 0, 0, 100);
    // Assume 100% hydration starter: half flour, half water
    return calcStarter(f, pct);
  }, [baseFlour, starterPct]);

  const salt = useMemo(() => {
    const f = baseFlour;
    return round1(gPct(f, saltPct));
  }, [baseFlour, saltPct]);

  const oil = useMemo(() => {
    if (mode !== 'pizza' || !oilOn) return 0;
    // Use 2% oil as a default when oil is toggled on
    return round1(gPct(baseFlour, 2));
  }, [mode, oilOn, baseFlour]);

  const rye = useMemo(() => {
    if (mode !== 'bread' || !ryeOn) return 0;
    return round1(gPct(baseFlour, ryePct));
  }, [mode, ryeOn, ryePct, baseFlour]);

  const seeds = useMemo(() => {
    if (mode !== 'bread' || !seedsOn) return 0;
    return round1(gPct(baseFlour, seedsPct));
  }, [mode, seedsOn, seedsPct, baseFlour]);

  const totalFlour = useMemo(() => {
    // base flour + starter flour + rye (rye counted as part of flour breakdown)
    return round1(baseFlour + starter.flour + rye);
  }, [baseFlour, starter.flour, rye]);

  const totalWater = useMemo(() => {
    // base water + starter water
    return round1(baseWater + starter.water);
  }, [baseWater, starter.water]);

  const totalWeight = useMemo(() => {
    return round1(totalFlour + totalWater + salt + oil + seeds);
  }, [totalFlour, totalWater, salt, oil, seeds]);

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
      coldFerment !== d.coldFerment ||
      activePreset !== d.activePreset;

    if (!changed) return;

    hasTrackedRef.current = true;
    track('Calculator Used', {
      input_type: inputMode,               // 'water' | 'flour'
      mode,                                // 'bread' | 'pizza'
      hydration: Number(hydrationBasePct),
      salt: Number(saltPct),
      starter: Number(starterPct),
      oil: yesNo(oilOn),
      seeds: yesNo(seedsOn),
      rye: yesNo(ryeOn),
      cold_fermentation: yesNo(coldFerment),
      preset: activePreset || '',
    });
  }, [
    inputMode, amount, mode, hydrationBasePct, saltPct, starterPct,
    ryeOn, ryePct, seedsOn, seedsPct, oilOn, coldFerment, activePreset
  ]);

  // -------- UI handlers --------
  const toggleMode = (m) => setMode(m);
  const toggleInputMode = (m) => setInputMode(m);

  const applyPreset = (key) => {
    setActivePreset(key);
    if (key === 'neapolitan') {
      setMode('pizza');
      setHydrationBasePct(62);
      setSaltPct(2.5);
      setStarterPct(0);
      setOilOn(false);
    } else if (key === 'country_bread') {
      setMode('bread');
      setHydrationBasePct(75);
      setSaltPct(2);
      setStarterPct(20);
      setRyeOn(true);
      setRyePct(20);
      setSeedsOn(false);
    } else {
      setActivePreset(null);
    }
  };

  // -------- Render --------
  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <ToggleButton
          options={[
            { value: 'bread', label: t('bread','Bread') },
            { value: 'pizza', label: t('pizza','Pizza') },
          ]}
          value={mode}
          onChange={toggleMode}
          ariaLabel={t('dough_type','Dough type')}
        />

        <ToggleButton
          options={[
            { value: 'flour', label: t('input_flour','Flour') },
            { value: 'water', label: t('input_water','Water') },
          ]}
          value={inputMode}
          onChange={toggleInputMode}
          ariaLabel={t('input_label','Input')}
        />

        <div className="flex items-center gap-2">
          <button
            className={`px-3 py-1.5 rounded-lg border text-sm ${activePreset === 'neapolitan' ? 'bg-blue-600 text-white' : 'border-gray-300 dark:border-gray-600'}`}
            onClick={() => applyPreset('neapolitan')}
          >
            {t('preset_neapolitan','Neapolitan')}
          </button>
          <button
            className={`px-3 py-1.5 rounded-lg border text-sm ${activePreset === 'country_bread' ? 'bg-blue-600 text-white' : 'border-gray-300 dark:border-gray-600'}`}
            onClick={() => applyPreset('country_bread')}
          >
            {t('preset_country_bread','Country bread')}
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <InputField
            label={inputMode === 'flour' ? t('flour_grams','Flour (g)') : t('water_grams','Water (g)')}
            value={amount}
            onChange={(v) => setAmount(Number(v))}
            type="number"
            min="0"
            inputMode="numeric"
          />

          <InputField
            label={t('hydration','Hydration (%)')}
            value={hydrationBasePct}
            onChange={(v) => setHydrationBasePct(clamp(Number(v), 55, 100))}
            type="number"
            min="55"
            max="100"
            inputMode="numeric"
            helpText={t('hydration_help','Base hydration; starter water is added on top')}
          />

          <InputField
            label={t('salt','Salt (%)')}
            value={saltPct}
            onChange={(v) => setSaltPct(clamp(Number(v), 0, 5))}
            type="number"
            min="0"
            max="5"
            inputMode="numeric"
          />

          <InputField
            label={t('starter_pct','Starter (%)')}
            value={starterPct}
            onChange={(v) => setStarterPct(clamp(Number(v), 0, 50))}
            type="number"
            min="0"
            max="50"
            inputMode="numeric"
          />

          {mode === 'bread' && (
            <>
              <div className="flex items-center justify-between gap-2">
                <label className="text-sm">{t('include_rye','Include rye')}</label>
                <input
                  type="checkbox"
                  checked={ryeOn}
                  onChange={(e) => setRyeOn(e.target.checked)}
                />
              </div>
              {ryeOn && (
                <InputField
                  label={t('rye_pct','Rye (%)')}
                  value={ryePct}
                  onChange={(v) => setRyePct(clamp(Number(v), 1, 50))}
                  type="number"
                  min="1"
                  max="50"
                />
              )}

              <div className="flex items-center justify-between gap-2">
                <label className="text-sm">{t('include_seeds','Include seeds')}</label>
                <input
                  type="checkbox"
                  checked={seedsOn}
                  onChange={(e) => setSeedsOn(e.target.checked)}
                />
              </div>
              {seedsOn && (
                <InputField
                  label={t('seeds_pct','Seeds (%)')}
                  value={seedsPct}
                  onChange={(v) => setSeedsPct(clamp(Number(v), 1, 30))}
                  type="number"
                  min="1"
                  max="30"
                />
              )}
            </>
          )}

          {mode === 'pizza' && (
            <div className="flex items-center justify-between gap-2">
              <label className="text-sm">{t('include_oil','Include oil')}</label>
              <input
                type="checkbox"
                checked={oilOn}
                onChange={(e) => setOilOn(e.target.checked)}
              />
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <label className="text-sm">{t('cold_fermentation','Cold fermentation')}</label>
            <input
              type="checkbox"
              checked={coldFerment}
              onChange={(e) => setColdFerment(e.target.checked)}
            />
          </div>
        </div>

        <div className="rounded-lg border p-4 dark:border-gray-700">
          <h3 className="font-semibold mb-2">{t('results','Results')}</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between"><span>{t('base_flour','Base flour')}</span><span>{baseFlour} g</span></div>
            <div className="flex justify-between"><span>{t('base_water','Base water')}</span><span>{baseWater} g</span></div>
            <div className="flex justify-between"><span>{t('starter_flour','Starter flour')}</span><span>{starter.flour} g</span></div>
            <div className="flex justify-between"><span>{t('starter_water','Starter water')}</span><span>{starter.water} g</span></div>
            <div className="flex justify-between"><span>{t('salt_g','Salt')}</span><span>{salt} g</span></div>
            {oil > 0 && <div className="flex justify-between"><span>{t('oil_g','Oil')}</span><span>{oil} g</span></div>}
            {rye > 0 && <div className="flex justify-between"><span>{t('rye_g','Rye flour')}</span><span>{rye} g</span></div>}
            {seeds > 0 && <div className="flex justify-between"><span>{t('seeds_g','Seeds')}</span><span>{seeds} g</span></div>}
            <div className="border-t my-2" />
            <div className="flex justify-between font-medium"><span>{t('total_weight','Total dough')}</span><span>{totalWeight} g</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
