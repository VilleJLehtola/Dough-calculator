// src/components/CalculatorForm.jsx
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

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
  resetAll,
  user
}) {
  const [favoriteName, setFavoriteName] = useState('');

  const toggleShowRecipe = () => {
    setShowRecipe(!showRecipe);
  };

  const handleSaveFavorite = async () => {
    if (!user || !favoriteName.trim()) return;

    const { error } = await supabase.from('favorites').insert([
      {
        user_id: user.id,
        name: favoriteName.trim(),
        settings: {
          inputGrams,
          inputType,
          hydration,
          saltPct,
          mode,
          useOil,
          coldFermentation,
          useRye,
          useSeeds,
        },
      },
    ]);

    if (error) {
      console.error('Error saving favorite:', error.message);
    } else {
      alert('Suosikki tallennettu!');
      setFavoriteName('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="number"
          value={inputGrams}
          onChange={(e) => setInputGrams(e.target.value)}
          placeholder="Syötä määrä grammoina"
          className="flex-1 p-2 border rounded-lg"
        />
        <select
          value={inputType}
          onChange={(e) => setInputType(e.target.value)}
          className="p-2 border rounded-lg"
        >
          <option value="jauho">Jauho</option>
          <option value="vesi">Vesi</option>
        </select>
      </div>

      <div className="flex gap-2">
        <label className="flex items-center gap-2">
          Hydration (%):
          <input
            type="number"
            min="55"
            value={hydration}
            onChange={(e) => setHydration(Math.max(55, Number(e.target.value)))}
            className="w-20 p-1 border rounded"
          />
        </label>
        <label className="flex items-center gap-2">
          Suola (%):
          <input
            type="number"
            value={saltPct}
            onChange={(e) => setSaltPct(Number(e.target.value))}
            className="w-20 p-1 border rounded"
          />
        </label>
      </div>

      <div className="flex gap-4">
        <button
          className={`px-4 py-2 rounded-lg ${mode === 'leipa' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setMode('leipa')}
        >
          Leipä
        </button>
        <button
          className={`px-4 py-2 rounded-lg ${mode === 'pizza' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setMode('pizza')}
        >
          Pizza
        </button>
      </div>

      {mode === 'pizza' && (
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={useOil}
            onChange={(e) => setUseOil(e.target.checked)}
          />
          Lisää öljyä taikinaan (3%)
        </label>
      )}

      {mode === 'leipa' && (
        <>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={useRye}
              onChange={(e) => setUseRye(e.target.checked)}
            />
            Käytä ruisjauhoja (20%)
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={useSeeds}
              onChange={(e) => setUseSeeds(e.target.checked)}
            />
            Lisää siemeniä (15%)
          </label>
        </>
      )}

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={coldFermentation}
          onChange={(e) => setColdFermentation(e.target.checked)}
        />
        Kylmäfermentointi (yön yli)
      </label>

      <button
        onClick={toggleShowRecipe}
        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
      >
        {showRecipe ? 'Piilota resepti' : 'Näytä resepti'}
      </button>

      {user && (
        <div className="space-y-2">
          <input
            type="text"
            value={favoriteName}
            onChange={(e) => setFavoriteName(e.target.value)}
            placeholder="Suosikin nimi"
            className="w-full p-2 border rounded-lg"
          />
          <button
            onClick={handleSaveFavorite}
            className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
          >
            Tallenna suosikiksi
          </button>
        </div>
      )}

      <button
        onClick={resetAll}
        className="w-full text-sm text-gray-500 underline hover:text-gray-700"
      >
        Nollaa kaikki asetukset
      </button>
    </div>
  );
}
