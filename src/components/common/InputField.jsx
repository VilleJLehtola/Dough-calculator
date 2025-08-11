// src/components/common/InputField.jsx
import React from "react";

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
  type = "number",
}) {
  return (
    <label htmlFor={id} className="flex flex-col gap-1 w-full">
      <span className="text-xs font-medium text-gray-300">{label}</span>
      <div className={`flex items-center rounded-xl border bg-[#111827] border-gray-700 
                       focus-within:ring-2 focus-within:ring-blue-500`}>
        <input
          id={id}
          type={type}
          className="w-full bg-transparent px-3 py-2.5 outline-none text-white placeholder-gray-500"
          value={value}
          onChange={(e) => onChange(type === "number" ? Number(e.target.value) : e.target.value)}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
        />
        {suffix && (
          <span className="px-3 text-xs text-gray-400">{suffix}</span>
        )}
      </div>
    </label>
  );
}
