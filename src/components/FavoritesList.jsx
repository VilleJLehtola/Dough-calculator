// src/components/FavoritesList.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function FavoritesList({ user, setActiveView, setInputGrams, setInputType, setHydration, setSaltPct, setMode, setUseOil, setColdFermentation, setUseRye, setUseSeeds }) {
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    const fetchFavorites = async () => {
      const { data, error } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching favorites:', error.message);
      } else {
        setFavorites(data);
      }
    };

    if (user) fetchFavorites();
  }, [user]);

  const applyFavorite = (fav) => {
    setInputGrams(fav.input_grams.toString());
    setInputType(fav.input_type);
    setHydration(fav.hydration);
    setSaltPct(fav.salt_pct);
    setMode(fav.mode);
    setUseOil(fav.use_oil);
    setColdFermentation(fav.cold_fermentation);
    setUseRye(fav.use_rye);
    setUseSeeds(fav.use_seeds);
    setActiveView('calculator');
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-blue-800">⭐ Tallennetut suosikit</h2>
      {favorites.length === 0 ? (
        <p className="text-gray-600">Ei suosikkeja vielä.</p>
      ) : (
        <ul className="space-y-2">
          {favorites.map((fav) => (
            <li key={fav.id} className="border rounded p-3 flex justify-between items-center bg-white shadow-sm">
              <div>
                <strong>{fav.name}</strong>
                <div className="text-sm text-gray-500">{fav.mode} - {fav.input_type} {fav.input_grams}g</div>
              </div>
              <button
                onClick={() => applyFavorite(fav)}
                className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
              >
                Käytä
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
