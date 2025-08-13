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
  disabled = false,
  type = "number",
}) {
  const inputProps =
    type === "number"
      ? { type, inputMode: "decimal", step, min, max }
      : { type, step, min, max };

  return (
    <label htmlFor={id} className="block">
      {/* Label */}
      {label && (
        <div className="mb-1 text-xs font-medium text-gray-700 dark:text-gray-300">
          {label}
        </div>
      )}

      {/* Field shell */}
      <div
        className={[
          "flex items-center rounded-xl border transition",
          "bg-white border-gray-300 text-gray-900",
          "dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100",
          "focus-within:ring-2 focus-within:ring-blue-500",
          disabled ? "opacity-60 cursor-not-allowed" : "shadow-sm",
        ].join(" ")}
      >
        <input
          id={id}
          className={[
            "w-full bg-transparent px-3 py-2.5 outline-none",
            "placeholder-gray-400 dark:placeholder-gray-500",
            "appearance-none",
            disabled ? "cursor-not-allowed" : "",
          ].join(" ")}
          value={value}
          onChange={(e) =>
            onChange(
              type === "number" ? Number(e.target.value) : e.target.value
            )
          }
          disabled={disabled}
          aria-disabled={disabled || undefined}
          {...inputProps}
        />

        {suffix ? (
          <span className="px-3 text-xs text-gray-500 dark:text-gray-400">
            {suffix}
          </span>
        ) : null}
      </div>
    </label>
  );
}
