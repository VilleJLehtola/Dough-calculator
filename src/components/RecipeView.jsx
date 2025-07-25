// src/components/RecipeView.jsx
import React from 'react';

export default function RecipeView({ showRecipe, setShowRecipe, foldsDone, setFoldsDone, useSeeds, coldFermentation }) {
  if (!showRecipe) return null;

  const foldIntervals = [30, 30, 45, 60];
  const baseSteps = [
    'Sekoita jauhot ja vesi, anna levätä 30 minuuttia.',
    'Lisää juuri ja sekoita tasaiseksi taikinaksi.',
    `Taita taikinaa ${foldIntervals.length} kertaa: ${foldIntervals.join(' min, ')} min välein.`,
    ...(useSeeds ? ['Lisää siemenet ennen viimeistä taittoa.'] : []),
    coldFermentation
      ? 'Muotoile, peitä ja laita jääkaappiin yön yli. Paista uunissa 230 °C.'
      : 'Muotoile, kohota ja paista uunissa 230 °C.',
  ];

  return (
    <div className="bg-white border border-blue-200 rounded-lg p-4 mt-4 space-y-4 shadow-sm">
      <h2 className="text-lg font-bold text-blue-700">📋 Resepti</h2>
      {baseSteps.map((step, index) => (
        <div key={index} className="text-gray-800 flex items-center gap-3">
          {index === 2 ? (
            <>
              <span>{step}</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((n) => (
                  <input
                    key={n}
                    type="checkbox"
                    checked={foldsDone >= n}
                    onChange={() =>
                      setFoldsDone((prev) =>
                        prev === n ? n - 1 : Math.max(n, prev)
                      )
                    }
                  />
                ))}
              </div>
            </>
          ) : (
            <span>{step}</span>
          )}
        </div>
      ))}

      <button
        onClick={() => setShowRecipe(false)}
        className="text-sm text-blue-600 underline hover:text-blue-800 mt-2"
      >
        Piilota resepti
      </button>
    </div>
  );
}
