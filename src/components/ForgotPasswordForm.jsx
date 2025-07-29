import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function ForgotPasswordForm({ setActiveView }) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleReset = async () => {
    setError('');
    setMessage('');

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://your-app.vercel.app/reset-password', // Update this to your deployed URL
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage('Salasanan palautuslinkki on lähetetty sähköpostiisi.');
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow border border-blue-200 space-y-4">
      <h2 className="text-xl font-semibold text-blue-800 text-center">Unohtuiko salasana?</h2>

      {message && <p className="text-green-600 text-sm">{message}</p>}
      {error && <p className="text-red-500 text-sm">{error}</p>}

      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Sähköpostisi"
        className="w-full p-2 border border-gray-300 rounded"
      />

      <button
        onClick={handleReset}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
      >
        Lähetä palautuslinkki
      </button>

      <button
        onClick={() => setActiveView('auth')}
        className="w-full text-sm text-gray-500 mt-2 hover:underline"
      >
        ← Takaisin kirjautumiseen
      </button>
    </div>
  );
}
