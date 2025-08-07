// ResultDisplay.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';

export default function ResultDisplay({ result }) {
  const { t } = useTranslation();

  return (
    <div className="bg-blue-50 dark:bg-gray-700 p-4 rounded-lg border border-blue-200 dark:border-gray-600 text-gray-900 dark:text-white">
      <h2 className="text-lg font-semibold text-blue-700 dark:text-yellow-300 mb-2">
        🍞 {t("Ingredient amounts")}
      </h2>

      <ul className="text-gray-800 space-y-1">
        <li>
          <strong>{t("Water")}:</strong> {result.vesi.toFixed(1)} g
        </li>
        <li>
          <strong>{t("Salt")}:</strong> {result.suola.toFixed(1)} g
        </li>
        <li>
          <strong>{t("Starter")}:</strong> {result.juuri.toFixed(1)} g
        </li>
        {result.öljy > 0 && (
          <li>
            <strong>{t("Oil")}:</strong> {result.öljy.toFixed(1)} g
          </li>
        )}
        {result.siemenet > 0 && (
          <li>
            <strong>{t("Seeds")}:</strong> {result.siemenet.toFixed(1)} g
          </li>
        )}
        <li>
          <strong>{t("Total")}:</strong> {result.yhteensa.toFixed(1)} g
        </li>
      </ul>

      <h3 className="mt-4 font-semibold text-gray-800 dark:text-gray-200">{t("Flour types")}:</h3>
      <ul className="text-sm text-gray-600 dark:text-gray-300">
        {Object.entries(result.jauhotyypit).map(([type, val]) => (
          <li key={type}>
            {t(type)}: {val.toFixed(1)} g
          </li>
        ))}
      </ul>
    </div>
  );
}
