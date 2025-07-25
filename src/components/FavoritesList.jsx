// src/components/FavoritesList.jsx
import React from 'react';

export default function FavoritesList({ favorites, onLoadFavorite, onDeleteFavorite }) {
  if (!favorites || favorites.length === 0) {
    return (
      <div className="bg-white border border-blue-200 p-4 rounded-lg text-center">
        <p className="text-gray-600">Ei tallennettuja suosikkeja.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-blue-200 p-4 rounded-lg space-y-3">
      <h2 className="text-lg font-semibold text-blue-700">⭐ Suosikit</h2>
      {favorites.map((fav, index) => (
        <div
          key={index}
          className="border border-blue-100 rounded p-3 bg-blue-50 flex justify-between items-center"
        >
          <div className="text-sm text-gray-800">
            <p>
              <strong>{fav.mode === 'pizza' ? '🍕 Pizza' : '🍞 Leipä'}</strong> – {fav.inputGrams} g {fav.inputType === 'jauho' ? 'jauhoa' : 'vettä'}
            </p>
            <p>
              Hydraatio: {fav.hydration}% | Suola: {fav.saltPct}%
              {fav.useOil && ' | Öljy mukana'}
              {fav.coldFermentation && ' | Kylmäkohotus'}
              {fav.useRye && ' | Ruisjauho'}
              {fav.useSeeds && ' | Siemenet'}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onLoadFavorite(fav)}
              className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Lataa
            </button>
            <button
              onClick={() => onDeleteFavorite(fav.id)}
              className="text-sm px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Poista
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
