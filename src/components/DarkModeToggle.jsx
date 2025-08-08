// src/components/DarkModeToggle.jsx
import { useEffect, useState } from 'react';

export default function DarkModeToggle() {
  const [enabled, setEnabled] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const html = document.documentElement;
    if (enabled) {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [enabled]);

  return (
    <label className="toggle-switch cursor-pointer">
      <input
        type="checkbox"
        checked={enabled}
        onChange={() => setEnabled(!enabled)}
      />
      <span className="toggle-slider" />
    </label>
  );
}
