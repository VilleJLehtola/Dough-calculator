import React from 'react';
import { useTranslation } from 'react-i18next';

export default function RecipeView({
  foldsDone,
  setFoldsDone,
  useSeeds,
  coldFermentation,
  doughType,
  useOil,
}) {
  const { t } = useTranslation();
  const foldIntervals = [30, 30, 45, 60];

  const foldLabels = foldIntervals.map((minutes, index) => {
    const seedNote = useSeeds && index === foldIntervals.length - 1 ? ` (${t("Add seeds")})` : '';
    return `${index + 1}. ${t("fold")} ${minutes} min${seedNote}`;
  });

  const breadSteps = [
    t("Mix flour and water. Let rest for 30 minutes."),
    t("Add the starter and mix into a smooth dough."),
    "Taita taikinaa:", // This one is used as a placeholder
    coldFermentation
      ? t("Shape, cover, and refrigerate overnight. Bake at 230°C.")
      : t("Shape, proof, and bake at 230°C."),
  ];

  const pizzaSteps = [
    t("Mix flour, water, salt, and yeast or starter."),
    ...(useOil ? [t("Add oil and mix into the dough.")] : []),
    "Taita taikinaa:",
    coldFermentation
      ? t("Let the dough rest 1–2h at room temperature, then cold ferment overnight.")
      : t("Let rise for 6–8 hours at room temperature."),
    t("Shape the pizza bases and let rest 30 min."),
    t("Add toppings and bake at 250–300°C on stone or tray."),
  ];

  const steps = doughType === 'pizza' ? pizzaSteps : breadSteps;

  return (
    <div className="bg-white border border-blue-200 rounded-lg p-4 mt-4 space-y-4 shadow-sm">
      <h2 className="text-lg font-bold text-blue-700">📋 {t("Recipe")}</h2>

      {steps.map((step, index) => {
        if (step === "Taita taikinaa:") {
          return (
            <div key={index} className="flex flex-col gap-1 text-gray-800">
              {foldLabels.map((label, i) => (
                <label key={i} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={foldsDone > i}
                    onChange={() => setFoldsDone(foldsDone > i ? i : i + 1)}
                    className="w-4 h-4 cursor-pointer"
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          );
        }

        return (
          <p key={index} className="text-gray-800">
            {step}
          </p>
        );
      })}

      <div>
        <strong>{t("Cold fermentation")}:</strong> {coldFermentation ? t("Yes") : t("No")}
      </div>
    </div>
  );
}
