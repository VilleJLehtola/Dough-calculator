// src/components/FavoritesList.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function FavoritesList({ user, setActiveView }) {
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    const fetchFavorites = async () => {
      const { data, error } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', user.id);

      if (!error) setFavorites(data);
    };

    if (user) fetchFavorites();
  }, [user]);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-blue-800">Suosikit</h2>
      {favorites.length === 0 ? (
        <p>Ei tallennettuja suosikkeja.</p>
      ) : (
        favorites.map((fav, idx) => (
          <div
            key={idx}
            className="p-4 border rounded-lg bg-white shadow-sm space-y-1"
          >
            <h3 className="font-semibold">{fav.name}</h3>
            <p>Jauhot: {fav.flour}g</p>
            <p>Hydraatio: {fav.hydration}%</p>
            <p>Suola: {fav.salt}%</p>
            <p>Tyyppi: {fav.mode}</p>
            <p>Ruis: {fav.useRye ? 'Kyllä' : 'Ei'}, Siemenet: {fav.useSeeds ? 'Kyllä' : 'Ei'}</p>
          </div>
        ))
      )}

      <button
        onClick={() => setActiveView('calculator')}
        className="text-sm text-blue-600 underline hover:text-blue-800"
      >
        Takaisin laskimeen
      </button>
    </div>
  );
}
