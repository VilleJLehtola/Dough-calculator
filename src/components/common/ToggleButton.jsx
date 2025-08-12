// src/components/common/ToggleButton.jsx
import React from "react";

export default function ToggleButton({ active, onClick, children, ariaPressed }) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ariaPressed ?? active}
      className={`px-3.5 py-1.5 rounded-full text-sm transition
        border shadow-sm
        focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
        ${active
          ? "bg-blue-600/90 border-blue-500 text-white"
          : "bg-gray-800/70 border-gray-700 text-gray-200 hover:bg-gray-700/70"}`}
    >
      {children}
    </button>
  );
}
