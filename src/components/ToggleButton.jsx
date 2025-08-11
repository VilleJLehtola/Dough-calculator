import React from 'react';

export default function ToggleButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`px-3 py-1.5 rounded-xl border text-sm transition ${
        active
          ? 'bg-blue-600 border-blue-500 text-white shadow'
          : 'bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700'
      }`}
    >
      {children}
    </button>
  );
}
