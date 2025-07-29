import React from 'react';

export default function CalculatorForm({
  inputGrams,
  setInputGrams,
  inputType,
  setInputType,
  hydration,
  setHydration,
  saltPct,
  setSaltPct,
  mode,
  setMode,
  useOil,
  setUseOil,
  coldFermentation,
  setColdFermentation,
  useRye,
  setUseRye,
  useSeeds,
  setUseSeeds,
  showRecipe,
  setShowRecipe,
  resetAll
}) {
  return (
    <div className="space-y-4">
      {/* Type + Input */}
      <div className="flex space-x-2">
  <select
    value={inputType}
    onChange={(e) => setInputType(e.target.value)}
    className="border rounded px-3 py-2 h-[42px]" // 🔧 match height manually
  >
    <option value="jauho">Jauho</option>
    <option value="vesi">Vesi</option>
  </select>
  <input
    type="number"
    placeholder="Grammat"
    value={inputGrams}
    onChange={(e) => setInputGrams(e.target.value)}
    className="flex-1 border rounded px-3 py-2 h-[42px]"
  />
</div>


      {/* Hydration + Salt */}
      <div className="flex space-x-2">
        <div className="flex-1">
          <label className="block text-sm">Hydration (%)</label>
          <input
            type="number"
            value={hydration}
            onChange={(e) => setHydration(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm">Suola (%)</label>
          <input
            type="number"
            value={saltPct}
            onChange={(e) => setSaltPct(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>
      </div>

      {/* Mode switch */}
      <div className="flex space-x-2">
        <button
          type="button"
          onClick={() => setMode('leipa')}
          className={`flex-1 px-4 py-2 rounded font-semibold ${
            mode === 'leipa' ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}
        >
          Leipä
        </button>
        <button
          type="button"
          onClick={() => setMode('pizza')}
          className={`flex-1 px-4 py-2 rounded font-semibold ${
            mode === 'pizza' ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}
        >
          Pizza
        </button>
      </div>

      {/* Options - checkboxes */}
<div className="space-y-2">
  {mode === 'leipa' && (
    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        id="rye"
        checked={useRye}
        onChange={() => setUseRye(!useRye)}
        className="h-4 w-4"
      />
      <label htmlFor="rye" className="text-sm">Sisältää 20% ruisjauhoja</label>
    </div>
  )}

  {mode === 'leipa' && (
    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        id="seeds"
        checked={useSeeds}
        onChange={() => setUseSeeds(!useSeeds)}
        className="h-4 w-4"
      />
      <label htmlFor="seeds" className="text-sm">Lisää siemeniä (15%)</label>
    </div>
  )}

  <div className="flex items-center gap-2">
    <input
      type="checkbox"
      id="cold"
      checked={coldFermentation}
      onChange={() => setColdFermentation(!coldFermentation)}
      className="h-4 w-4"
    />
    <label htmlFor="cold" className="text-sm">Kylmäkohotus</label>
  </div>

  {mode === 'pizza' && (
    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        id="oil"
        checked={useOil}
        onChange={() => setUseOil(!useOil)}
        className="h-4 w-4"
      />
      <label htmlFor="oil" className="text-sm">Sisältää öljyä (3%)</label>
    </div>
  )}
</div>


      {/* Buttons */}
      <div className="flex space-x-2">
        <button
          type="button"
          onClick={() => setShowRecipe(true)}
          className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Näytä resepti
        </button>
        <button
          type="button"
          onClick={resetAll}
          className="flex-1 bg-gray-300 text-black py-2 rounded hover:bg-gray-400"
        >
          Tyhjennä
        </button>
      </div>
    </div>
  );
}
