import React, { useState } from 'react';
import InputField from '../components/common/InputField';
import ToggleButton from '../components/common/ToggleButton';
import { clamp, round1, gPct, calcStarter } from '../utils/doughHelpers';

export default function CalculatorPage() {
  const [inputMode, setInputMode] = useState('flour');
  const [amount, setAmount] = useState(500);
  const [mode, setMode] = useState('bread');
  const [hydration, setHydration] = useState(70);
  const [saltPct, setSaltPct] = useState(2);
  const [starterPct, setStarterPct] = useState(20);
  const [ryeOn, setRyeOn] = useState(false);
  const [ryePct, setRyePct] = useState(20);
  const [seedsOn, setSeedsOn] = useState(false);
  const [seedsPct, setSeedsPct] = useState(15);
  const [oilOn, setOilOn] = useState(false);
  const [garlicOn, setGarlicOn] = useState(false);

  const flourTotal = inputMode === 'flour' ? amount : round1(amount / (hydration / 100));
  const starter = calcStarter(flourTotal, starterPct);
  const baseFlour = flourTotal - starter.flour;
  const baseWater = (hydration / 100) * baseFlour;

  const ryeFlour = ryeOn ? gPct(flourTotal, ryePct) : 0;
  const whiteFlour = flourTotal - ryeFlour;
  const seeds = seedsOn ? gPct(flourTotal, seedsPct) : 0;
  const oil = oilOn ? gPct(flourTotal, 7) : 0;
  const salt = gPct(flourTotal, saltPct);

  const totalWeight = round1(whiteFlour + ryeFlour + baseWater + starter.weight + seeds + oil + salt);

  const presets = [
    { label: 'Neapolitan', mode: 'pizza', hydration: 63, salt: 2.8, oil: false, rye: false },
    { label: 'New York', mode: 'pizza', hydration: 65, salt: 2.5, oil: true, rye: false },
    { label: 'Ciabatta', mode: 'bread', hydration: 80, salt: 2, oil: false, rye: false },
    { label: 'Focaccia', mode: 'bread', hydration: 75, salt: 2.5, oil: true, rye: false },
    { label: 'Sourdough', mode: 'bread', hydration: 70, salt: 2, oil: false, rye: true },
  ];

  const applyPreset = (p) => {
    setMode(p.mode);
    setHydration(p.hydration);
    setSaltPct(p.salt);
    setOilOn(!!p.oil);
    setRyeOn(!!p.rye);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-gray-900 rounded-xl overflow-hidden shadow-lg">
        <img src="https://btozmkrowcrjzvxxhlbn.supabase.co/storage/v1/object/public/recipe-images/hero.jpg" alt="Recipe Hero" className="w-full h-64 object-cover" />
        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="flex flex-wrap gap-2 mb-4" role="group" aria-label="Recipe Presets">
              {presets.map((p) => (
                <ToggleButton key={p.label} active={false} onClick={() => applyPreset(p)} aria-label={`Apply ${p.label} preset`}>
                  {p.label}
                </ToggleButton>
              ))}
            </div>

            <div className="flex gap-2 mb-4" role="group" aria-label="Input Mode">
              <ToggleButton active={inputMode === 'flour'} onClick={() => setInputMode('flour')} aria-pressed={inputMode === 'flour'}>Flour</ToggleButton>
              <ToggleButton active={inputMode === 'water'} onClick={() => setInputMode('water')} aria-pressed={inputMode === 'water'}>Water</ToggleButton>
            </div>

            <InputField id="amount" label={`Amount (${inputMode})`} suffix="g" value={amount} onChange={setAmount} min={1} />
            <InputField id="hydration" label="Hydration" suffix="%" value={hydration} onChange={(v) => setHydration(clamp(v, 55, 100))} min={55} max={100} />
            <InputField id="salt" label="Salt" suffix="%" value={saltPct} onChange={setSaltPct} min={1} max={5} />
            <InputField id="starter" label="Starter" suffix="%" value={starterPct} onChange={setStarterPct} min={5} max={50} />

            {mode === 'bread' && (
              <>
                <ToggleButton active={ryeOn} onClick={() => setRyeOn(!ryeOn)}>Rye</ToggleButton>
                {ryeOn && <InputField id="ryePct" label="Rye %" suffix="%" value={ryePct} onChange={setRyePct} min={5} max={100} />} 
                <ToggleButton active={seedsOn} onClick={() => setSeedsOn(!seedsOn)}>Seeds</ToggleButton>
                {seedsOn && <InputField id="seedsPct" label="Seeds %" suffix="%" value={seedsPct} onChange={setSeedsPct} min={5} max={20} />}
              </>
            )}

            {mode === 'pizza' && (
              <>
                <ToggleButton active={oilOn} onClick={() => setOilOn(!oilOn)}>Oil</ToggleButton>
                <ToggleButton active={garlicOn} onClick={() => setGarlicOn(!garlicOn)}>Garlic</ToggleButton>
              </>
            )}
          </div>

          <div className="bg-gray-800 rounded-xl p-4 text-white" aria-live="polite">
            <h2 className="text-lg font-bold mb-2">Ingredients</h2>
            <ul className="space-y-1">
              <li>{round1(whiteFlour)}g White Flour</li>
              {ryeFlour > 0 && <li>{round1(ryeFlour)}g Rye Flour</li>}
              <li>{round1(baseWater)}g Water</li>
              <li>{starter.weight}g Starter ({starter.flour}g flour / {starter.water}g water)</li>
              <li>{salt}g Salt</li>
              {oil > 0 && <li>{round1(oil)}g Oil</li>}
              {seeds > 0 && <li>{round1(seeds)}g Seeds</li>}
            </ul>
            <p className="mt-4">Total dough weight: {totalWeight}g</p>

            <div className="mt-6">
              <h3 className="text-md font-semibold mb-2">Quick Recipe</h3>
              <p className="text-sm text-gray-300">
                Mix flour{ryeOn ? ' (including rye)' : ''}, water, starter, and salt. {seedsOn && 'Add seeds after last fold. '} 
                {oilOn && 'Add oil during mixing. '} 
                Perform folds every 30–45 minutes as needed, then bulk ferment until doubled. Shape and proof before baking.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
