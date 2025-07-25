// src/components/FavoritesList.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function FavoritesList({ user, setActiveView }) {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Virhe haettaessa suosikkeja:', error.message);
      } else {
        setFavorites(data);
      }
      setLoading(false);
    };

    fetchFavorites();
  }, [user]);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-blue-700">⭐ Suosikit</h2>
      <button
        onClick={() => setActiveView('calculator')}
        className="text-sm text-blue-600 underline hover:text-blue-800"
      >
        Takaisin laskimeen
      </button>
      {loading ? (
        <p>Ladataan suosikkeja...</p>
      ) : favorites.length === 0 ? (
        <p>Ei tallennettuja suosikkeja.</p>
      ) : (
        <ul className="space-y-2">
          {favorites.map((fav) => (
            <li
              key={fav.id}
              className="p-3 border border-blue-200 rounded shadow-sm bg-blue-50"
            >
              <strong>{fav.name}</strong>
              <div className="text-sm text-gray-700">
                <p>
                  {fav.input_type === 'jauho' ? 'Jauhoja' : 'Vettä'}: {fav.input_grams}g
                </p>
                <p>Hydraatio: {fav.hydration}%</p>
                <p>Suola: {fav.salt_pct}%</p>
                <p>Tyyppi: {fav.mode === 'pizza' ? '🍕 Pizza' : '🍞 Leipä'}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
