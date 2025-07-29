// RecipeEditor.jsx
import { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function RecipeEditor({ user, onRecipeCreated }) {
  const isAdmin = user?.email === 'ville.j.lehtola@gmail.com';
  const [form, setForm] = useState({
    title: '',
    description: '',
    instructions: '',
    tags: '',
    mode: 'leipa',
    hydration: 70,
    salt_pct: 2,
    use_oil: false,
    cold_fermentation: false,
    use_rye: false,
    use_seeds: false,
  });
  const [message, setMessage] = useState('');

  if (!isAdmin) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async () => {
    const { title, description, instructions } = form;
    if (!title || !description || !instructions) {
      setMessage('Täytä kaikki kentät');
      return;
    }

    const { error } = await supabase.from('recipes').insert([
      {
        ...form,
        tags: form.tags.split(',').map((t) => t.trim()),
        created_by: user.id,
      },
    ]);

    if (error) {
      setMessage('Tallennus epäonnistui');
    } else {
      setMessage('Resepti tallennettu!');
      setForm({
        title: '',
        description: '',
        instructions: '',
        tags: '',
        mode: 'leipa',
        hydration: 70,
        salt_pct: 2,
        use_oil: false,
        cold_fermentation: false,
        use_rye: false,
        use_seeds: false,
      });
      onRecipeCreated?.();
    }
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow max-w-2xl mx-auto mb-6">
      <h3 className="text-xl font-bold mb-2">Lisää uusi resepti</h3>
      <div className="grid grid-cols-1 gap-2">
        <input name="title" value={form.title} onChange={handleChange} placeholder="Nimi" className="border px-2 py-1 rounded" />
        <input name="description" value={form.description} onChange={handleChange} placeholder="Kuvaus" className="border px-2 py-1 rounded" />
        <textarea name="instructions" value={form.instructions} onChange={handleChange} placeholder="Ohjeet" className="border px-2 py-1 rounded" rows={4} />
        <input name="tags" value={form.tags} onChange={handleChange} placeholder="Tagit (pilkulla eroteltu)" className="border px-2 py-1 rounded" />
        <select name="mode" value={form.mode} onChange={handleChange} className="border px-2 py-1 rounded">
          <option value="leipa">Leipä</option>
          <option value="pizza">Pizza</option>
        </select>
        <input name="hydration" type="number" value={form.hydration} onChange={handleChange} placeholder="Hydraatio %" className="border px-2 py-1 rounded" />
        <input name="salt_pct" type="number" value={form.salt_pct} onChange={handleChange} placeholder="Suola %" className="border px-2 py-1 rounded" />
        <label><input type="checkbox" name="use_oil" checked={form.use_oil} onChange={handleChange} /> Öljy</label>
        <label><input type="checkbox" name="cold_fermentation" checked={form.cold_fermentation} onChange={handleChange} /> Kylmäkohotus</label>
        <label><input type="checkbox" name="use_rye" checked={form.use_rye} onChange={handleChange} /> Ruis</label>
        <label><input type="checkbox" name="use_seeds" checked={form.use_seeds} onChange={handleChange} /> Siemenet</label>
        <button onClick={handleSubmit} className="bg-green-600 text-white py-2 rounded hover:bg-green-700">Tallenna resepti</button>
        {message && <p className="text-sm text-blue-600 mt-1">{message}</p>}
      </div>
    </div>
  );
}
