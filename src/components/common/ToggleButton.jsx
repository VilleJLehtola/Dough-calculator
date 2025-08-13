// src/components/common/ToggleButton.jsx
import React from "react";

export default function ToggleButton({ active, onClick, children, ariaPressed }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ariaPressed ?? active}
      className={`px-3.5 py-1.5 rounded-full text-sm transition
        border shadow-sm
        focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
        ${active
          ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
          : "bg-white border-gray-200 text-gray-800 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700"}`}
    >
      {children}
    </button>
  );
}
