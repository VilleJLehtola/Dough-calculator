import React, { useState } from 'react';
import { useSession } from '@supabase/auth-helpers-react';

export default function RecipeEditor({ onSave }) {
  const session = useSession();
  const isAdmin = session?.user?.email === 'ville.j.lehtola@gmail.com';

  // ❌ Hide form if not admin
  if (!isAdmin) return null;

  const [title, setTitle] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [steps, setSteps] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ title, ingredients, steps });
    setTitle('');
    setIngredients('');
    setSteps('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Reseptin nimi"
        className="w-full border p-2 rounded"
        required
      />
      <textarea
        value={ingredients}
        onChange={e => setIngredients(e.target.value)}
        placeholder="Ainesosat"
        className="w-full border p-2 rounded"
        required
      />
      <textarea
        value={steps}
        onChange={e => setSteps(e.target.value)}
        placeholder="Valmistusohjeet"
        className="w-full border p-2 rounded"
        required
      />
      <button
        type="submit"
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
      >
        Tallenna resepti
      </button>
    </form>
  );
}
