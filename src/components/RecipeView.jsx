import React, { useState } from 'react';

export default function RecipeView({
  doughType,
  useSeeds,
  coldFermentation,
  foldsDone,
  setFoldsDone,
  useOil
}) {
  const foldSchedule = [30, 30, 45, 60];

  const foldTexts = foldSchedule.map((time, i) => {
    const seedNote = useSeeds && i === foldSchedule.length - 1 ? ' (lisää siemenet)' : '';
    return `${i + 1}. taitto ${time} min${seedNote}`;
  });

  return (
    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-300 space-y-2">
      <h2 className="text-lg font-semibold text-yellow-700 mb-2">📋 Resepti</h2>

      <div>
        <strong>Kylmäkohotus:</strong> {coldFermentation ? 'Kyllä' : 'Ei'}
      </div>

      {doughType === 'pizza' && useOil && (
        <div>
          <strong>Öljyä:</strong> lisätään taikinaan ennen ensimmäistä taittoa
        </div>
      )}

      <div className="space-y-1">
        {foldTexts.map((text, i) => (
          <label key={i} className="block">
            <input
              type="checkbox"
              checked={foldsDone > i}
              onChange={() =>
                setFoldsDone(foldsDone > i ? i : i + 1)
              }
              className="mr-2"
            />
            {text}
          </label>
        ))}
      </div>
    </div>
  );
}
