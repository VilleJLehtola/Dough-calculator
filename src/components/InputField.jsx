import React from 'react';

export default function InputField({ id, label, suffix, value, onChange, min, max, step = 1, disabled }) {
  return (
    <label htmlFor={id} className="flex flex-col gap-1 w-full">
      <span className="text-sm text-gray-300">{label}</span>
      <div className={`flex items-center rounded-xl border border-gray-700 bg-gray-800/60 focus-within:ring-2 focus-within:ring-blue-500 ${disabled ? 'opacity-50' : ''}`}>
        <input
          id={id}
          type="number"
          aria-label={label}
          className="w-full bg-transparent px-3 py-2 outline-none text-white"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
        />
        {suffix && <span className="px-3 text-gray-400 text-sm">{suffix}</span>}
      </div>
    </label>
  );
}
