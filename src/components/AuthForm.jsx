import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function AuthForm({ setUser, setActiveView }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async () => {
    setError('');
    if (!email || !password) {
      setError('Sähköposti ja salasana vaaditaan.');
      return;
    }

    const { data, error } = isRegistering
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
    } else {
      setUser(data.user);
      setActiveView('calculator');
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow border border-blue-200 space-y-4">
      <h2 className="text-xl font-semibold text-blue-800 text-center">
        {isRegistering ? 'Rekisteröidy' : 'Kirjaudu sisään'}
      </h2>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Sähköposti"
        className="w-full p-2 border border-gray-300 rounded"
      />
      <input
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        placeholder="Salasana"
        className="w-full p-2 border border-gray-300 rounded"
      />

      <button
        onClick={handleAuth}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
      >
        {isRegistering ? 'Rekisteröidy' : 'Kirjaudu'}
      </button>

      <p
        className="text-sm text-center text-blue-600 cursor-pointer hover:underline"
        onClick={() => setIsRegistering(prev => !prev)}
      >
        {isRegistering ? 'Onko sinulla jo tili? Kirjaudu' : 'Ei tiliä? Rekisteröidy'}
      </p>

      <button
        onClick={() => setActiveView('calculator')}
        className="w-full text-sm text-gray-500 mt-2 hover:underline"
      >
        ← Palaa laskimeen ilman kirjautumista
      </button>
    </div>
  );
}
