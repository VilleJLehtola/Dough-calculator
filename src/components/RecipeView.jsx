import React from 'react';

export default function RecipeView({
  foldsDone,
  setFoldsDone,
  useSeeds,
  coldFermentation,
  doughType,
  useOil,
}) {
  const foldIntervals = [30, 30, 45, 60];

  // Generate fold labels with optional seed note on last fold
  const foldLabels = foldIntervals.map((minutes, index) => {
    const seedNote = useSeeds && index === foldIntervals.length - 1 ? ' (lisää siemenet)' : '';
    return `${index + 1}. taitto ${minutes} min${seedNote}`;
  });

  const breadSteps = [
    'Sekoita jauhot ja vesi, anna levätä 30 minuuttia.',
    'Lisää juuri ja sekoita tasaiseksi taikinaksi.',
    // The fold checkboxes will be rendered below, so just include a placeholder here
    'Taita taikinaa:',
    coldFermentation
      ? 'Muotoile, peitä ja laita jääkaappiin yön yli. Paista uunissa 230 °C.'
      : 'Muotoile, kohota ja paista uunissa 230 °C.',
  ];

  const pizzaSteps = [
    'Sekoita jauhot, vesi, suola ja hiiva tai juuri.',
    ...(useOil ? ['Lisää öljy ja sekoita taikinaan.'] : []),
    'Taita taikinaa:',
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

      {steps.map((step, index) => {
        if (step === 'Taita taikinaa:') {
          // Render fold checkboxes here instead of plain text
          return (
            <div key={index} className="flex flex-col gap-1 text-gray-800">
              {foldLabels.map((label, i) => (
                <label key={i} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={foldsDone > i}
                    onChange={() =>
                      setFoldsDone(foldsDone > i ? i : i + 1)
                    }
                    className="w-4 h-4 cursor-pointer"
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          );
        }

        // Render normal step text
        return (
          <p key={index} className="text-gray-800">
            {step}
          </p>
        );
      })}

      <div>
        <strong>Kylmäkohotus:</strong> {coldFermentation ? 'Kyllä' : 'Ei'}
      </div>
    </div>
  );
}
