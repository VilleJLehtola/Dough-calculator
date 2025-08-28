// src/components/Layout.jsx
import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X, LogIn, LogOut, User } from "lucide-react";
import InstallAppButton from "@/components/InstallAppButton";

function navClass({ isActive }) {
  return [
    "block px-3 py-2 rounded-md",
    isActive
      ? "bg-gray-900 text-white dark:bg-slate-800"
      : "text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-slate-800",
  ].join(" ");
}

export default function Layout({ user, onLoginClick, onLogout, children }) {
  const [open, setOpen] = useState(false);

  const navLinks = [
    { to: "/browse", label: "Browse" },
    { to: "/calculator", label: "Calculator" },
    ...(user ? [{ to: "/favorites", label: "Favorites" }] : []),
    ...(user ? [{ to: "/your-recipes", label: "Your recipes" }] : []),
    { to: "/create", label: "Create recipe" },
    { to: "/faq", label: "FAQ" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-950/70 backdrop-blur border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 h-14 flex items-center justify-between gap-3">
          {/* Left: menu */}
          <button
            className="inline-flex items-center justify-center w-9 h-9 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Open menu"
            onClick={() => setOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Center: brand */}
          <Link
            to="/"
            className="shrink min-w-0 px-3 py-1.5 rounded-full bg-slate-900 text-white dark:bg-slate-800 font-semibold"
          >
            Everything Dough
          </Link>

          {/* Right: actions */}
          <div className="flex items-center gap-2">
            {/* Install PWA */}
            <InstallAppButton />

            {/* Login / profile */}
            {user ? (
              <>
                <Link
                  to="/profile"
                  className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <User className="w-4 h-4" />
                  <span className="truncate max-w-[12rem]">
                    {user.email || "Profile"}
                  </span>
                </Link>
                <button
                  onClick={onLogout}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-500"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={onLoginClick}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-500"
              >
                <LogIn className="w-4 h-4" />
                Sign in
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Side drawer */}
      <div
        className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`}
        aria-hidden={!open}
      >
        {/* backdrop */}
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity ${
            open ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setOpen(false)}
        />
        {/* panel */}
        <aside
          className={`absolute left-0 top-0 h-full w-80 max-w-[85%] bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 transform transition-transform ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
          role="dialog"
          aria-label="Main menu"
        >
          <div className="h-14 px-3 sm:px-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="font-semibold">Menu</span>
            <button
              className="inline-flex items-center justify-center w-9 h-9 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="p-3 space-y-1">
            {navLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={navClass}
                onClick={() => setOpen(false)}
              >
                {l.label}
              </NavLink>
            ))}

            <div className="pt-2 mt-2 border-t border-slate-200 dark:border-slate-800">
              {user ? (
                <>
                  <NavLink
                    to="/profile"
                    className={navClass}
                    onClick={() => setOpen(false)}
                  >
                    Profile
                  </NavLink>
                  <button
                    onClick={() => {
                      setOpen(false);
                      onLogout?.();
                    }}
                    className="mt-1 w-full text-left px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-500"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setOpen(false);
                    onLoginClick?.();
                  }}
                  className="w-full px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-500"
                >
                  Sign in
                </button>
              )}
            </div>
          </nav>
        </aside>
      </div>

      {/* Page content */}
      <main className="pb-16">
        {children}
      </main>

      {/* Footer (simple) */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} Everything Dough
      </footer>
    </div>
  );
}
