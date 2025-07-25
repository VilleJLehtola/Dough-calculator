import React from "react";
import { GiKnifeFork } from "react-icons/gi";

export default function Header({ isLoggedIn, onLoginClick, onLogoutClick, onToggleView, currentView }) {
  return (
    <header className="flex items-center justify-between bg-white shadow-md p-4 rounded-lg mb-4">
      <div className="flex items-center gap-2 text-blue-800 text-xl font-bold">
        <GiKnifeFork className="text-2xl" />
        Taikinalaskin
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={onToggleView}
          className="text-sm bg-blue-100 hover:bg-blue-200 px-3 py-1 rounded transition"
        >
          {currentView === "calculator" ? "Näytä suosikit" : "Näytä laskin"}
        </button>

        {isLoggedIn ? (
          <button
            onClick={onLogoutClick}
            className="text-sm text-red-600 hover:text-red-800 transition"
          >
            Kirjaudu ulos
          </button>
        ) : (
          <button
            onClick={onLoginClick}
            className="text-sm text-blue-600 hover:text-blue-800 transition"
          >
            Kirjaudu sisään
          </button>
        )}
      </div>
    </header>
  );
}
