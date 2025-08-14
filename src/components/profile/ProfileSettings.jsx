import { useState } from 'react';
import supabase from '@/supabaseClient';

export default function ProfileSettings({ profile }) {
  const [bio, setBio] = useState(profile.bio || '');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const save = async () => {
    setSaving(true);
    setMsg('');
    const { error } = await supabase
      .from('users')
      .update({ bio })
      .eq('id', profile.id);

    setSaving(false);
    setMsg(error ? 'Failed to save.' : 'Saved!');
  };

  return (
    <div className="max-w-2xl space-y-3">
      <label className="block text-sm text-gray-700 dark:text-gray-300">Bio</label>
      <textarea
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        rows={5}
        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500"
        placeholder="Tell a bit about yourself…"
      />
      <button
        onClick={save}
        disabled={saving}
        className="rounded-lg bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 disabled:opacity-70"
      >
        {saving ? 'Saving…' : 'Save'}
      </button>
      {msg && <p className="text-sm text-gray-600 dark:text-gray-300">{msg}</p>}
    </div>
  );
}
