// src/components/AuthForm.jsx

import React, { useState } from "react";

export default function AuthForm({ onAuth, errorMessage }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  const handleSubmit = e => {
    e.preventDefault();
    onAuth(email, password, isRegistering);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-sm mx-auto border border-yellow-200 mt-6">
      <h2 className="text-xl font-bold text-center text-yellow-800 mb-4">
        {isRegistering ? "Rekisteröidy" : "Kirjaudu"}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="Sähköposti"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="w-full p-2 border border-yellow-300 rounded"
        />
        <input
          type="password"
          placeholder="Salasana"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          className="w-full p-2 border border-yellow-300 rounded"
        />

        {errorMessage && (
          <div className="text-red-500 text-sm text-center">{errorMessage}</div>
        )}

        <button
          type="submit"
          className="w-full bg-yellow-600 text-white py-2 rounded hover:bg-yellow-700"
        >
          {isRegistering ? "Rekisteröidy" : "Kirjaudu"}
        </button>
      </form>
      <p className="text-sm text-center mt-4">
        {isRegistering ? "Onko sinulla jo tili?" : "Ei vielä tiliä?"}{" "}
        <button
          onClick={() => setIsRegistering(!isRegistering)}
          className="text-blue-600 hover:underline"
        >
          {isRegistering ? "Kirjaudu" : "Rekisteröidy"}
        </button>
      </p>
    </div>
  );
}
