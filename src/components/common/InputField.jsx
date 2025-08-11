// src/components/common/InputField.jsx
import React, { useId } from "react";

export default function InputField({
  id,
  label,
  suffix,
  value,
  onChange,
  min,
  max,
  step = 1,
  disabled,
  placeholder = "",
  className = "",
  type = "number",
  helper
}) {
  const autoId = useId();
  const inputId = id || autoId;

  return (
    <div className={`group relative ${disabled ? "opacity-60" : ""} ${className}`}>
      {/* Floating label background */}
      <div className="absolute inset-0 rounded-2xl bg-gray-800/70 border border-gray-700
                      shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]
                      transition-colors group-focus-within:border-blue-500" />
      {/* Input row */}
      <div className="relative flex items-center">
        <input
          id={inputId}
          type={type}
          inputMode={type === "number" ? "decimal" : undefined}
          className="peer w-full bg-transparent px-4 py-3 pr-16 outline-none text-white
                     placeholder-transparent
                     focus:ring-0"
          value={value}
          onChange={(e) => onChange(type === "number" ? Number(e.target.value) : e.target.value)}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          placeholder={placeholder || label}
          aria-label={label}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2
                           text-xs font-medium text-gray-300
                           bg-gray-700/70 rounded-lg px-2 py-1">
            {suffix}
          </span>
        )}
      </div>

      {/* Floating label */}
      <label
        htmlFor={inputId}
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2
                   text-sm text-gray-400 transition-all
                   peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm
                   peer-focus:-translate-y-5 peer-focus:text-xs peer-focus:text-blue-300
                   group-focus-within:-translate-y-5 group-focus-within:text-xs">
        {label}
      </label>

      {/* Bottom helper line */}
      {helper && (
        <div className="mt-1 ml-1 text-xs text-gray-400">{helper}</div>
      )}
    </div>
  );
}
