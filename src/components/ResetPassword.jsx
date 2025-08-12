import React, { useState } from 'react';
import supabase from '@/supabaseClient';


export default function ResetPassword({ setActiveView }) {
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleUpdate = async () => {
    setError('');
    setMessage('');

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
    } else {
      setMessage('Salasana päivitetty! Voit nyt kirjautua sisään.');
      setTimeout(() => {
        setActiveView('auth');
      }, 2000);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow border border-blue-200 space-y-4">
      <h2 className="text-xl font-semibold text-blue-800 text-center">Vaihda salasana</h2>

      {message && <p className="text-green-600 text-sm">{message}</p>}
      {error && <p className="text-red-500 text-sm">{error}</p>}

      <input
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        placeholder="Uusi salasana"
        className="w-full p-2 border border-gray-300 rounded"
      />

      <button
        onClick={handleUpdate}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
      >
        Aseta uusi salasana
      </button>
    </div>
  );
}
