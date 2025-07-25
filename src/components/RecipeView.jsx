// src/components/RecipeView.jsx
import React from 'react';

export default function RecipeView({
  showRecipe,
  reseptiSteps,
  foldsDone,
  setFoldsDone,
}) {
  if (!showRecipe) return null;

  return (
    <div className="bg-white p-4 border border-blue-300 rounded-lg space-y-4 transition-all duration-300">
      <h2 className="text-lg font-bold text-blue-700">📋 Resepti</h2>

      {reseptiSteps.map(step => (
        <div key={step.id} className="space-y-2">
          <p className="flex items-start gap-2">
            <span>{step.text}</span>
            {step.id === 3 && (
              <div className="flex gap-1 mt-1">
                {[1, 2, 3, 4].map(n => (
                  <input
                    key={n}
                    type="checkbox"
                    checked={foldsDone >= n}
                    onChange={() =>
                      setFoldsDone(prev =>
                        prev === n ? n - 1 : Math.max(n, prev)
                      )
                    }
                    className="accent-blue-600"
                  />
                ))}
              </div>
            )}
          </p>
        </div>
      ))}
    </div>
  );
}
