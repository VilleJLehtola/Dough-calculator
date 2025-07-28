import React from 'react';

export default function RecipeView({
  foldsDone,
  setFoldsDone,
  useSeeds,
  coldFermentation,
  doughType,
}) {
  const foldIntervals = [30, 30, 45, 60];

  const breadSteps = [
    'Sekoita jauhot ja vesi, anna levätä 30 minuuttia.',
    'Lisää juuri ja sekoita tasaiseksi taikinaksi.',
    `Taita taikinaa ${foldIntervals.length} kertaa: ${foldIntervals.join(' min, ')} min välein.`,
    ...(useSeeds ? ['Lisää siemenet ennen viimeistä taittoa.'] : []),
    coldFermentation
      ? 'Muotoile, peitä ja laita jääkaappiin yön yli. Paista uunissa 230 °C.'
      : 'Muotoile, kohota ja paista uunissa 230 °C.',
  ];

  const pizzaSteps = [
    'Sekoita jauhot, vesi, suola ja hiiva tai juuri.',
    coldFermentation
      ? 'Anna taikinan levätä huoneenlämmössä 1–2 h, sitten kylmäkohota jääkaapissa yön yli.'
      : 'Anna kohota huoneenlämmössä 6–8 h.',
    'Muotoile pizzapohjat ja anna levätä vielä 30 min.',
    'Lisää täytteet ja paista uunissa 250–300 °C kivellä tai pellillä.',
  ];

  const steps = doughType === 'pizza' ? pizzaSteps : breadSteps;

  return (
    <div className="bg-white border border-blue-200 rounded-lg p-4 mt-4 space-y-4 shadow-sm">
      <h2 className="text-lg font-bold text-blue-700">📋 Resepti</h2>
      {steps.map((step, index) => (
        <div key={index} className="text-gray-800 flex items-center gap-3">
          {doughType === 'leipa' && index === 2 ? (
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
    </div>
  );
}
