// src/components/SearchBar.jsx
import { useEffect, useRef } from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";
import clsx from "clsx";

export default function SearchBar({
  value,
  onChange,
  onSubmit,
  onClear,
  onOpenFilters,
  placeholder = "Hae reseptejä",
  className,
}) {
  const inputRef = useRef(null);

  // Focus with "/" like many apps
  useEffect(() => {
    const onKey = (e) => {
      if (
        e.key === "/" &&
        // don't steal focus if user is typing in an input already
        e.target instanceof HTMLElement &&
        !["INPUT", "TEXTAREA"].includes(e.target.tagName)
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.(value);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={clsx(
        "flex items-center gap-2 w-full",
        className
      )}
      role="search"
      aria-label="Recipe search"
    >
      <div
        className={clsx(
          "group relative flex-1",
          // glassy, subtle container
          "rounded-2xl bg-white/5 dark:bg-white/5 backdrop-blur",
          "ring-1 ring-black/5 dark:ring-white/10",
          "hover:bg-white/7.5 transition-colors"
        )}
      >
        {/* Search icon */}
        <Search
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 opacity-70"
          aria-hidden="true"
        />

        <input
          ref={inputRef}
          type="search"
          inputMode="search"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          className={clsx(
            "w-full pl-11 pr-16 py-3",
            "bg-transparent outline-none",
            "text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400",
            "rounded-2xl"
          )}
          aria-label={placeholder}
        />

        {/* Clear button */}
        {value?.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
          >
            <X className="h-4 w-4 opacity-80" />
          </button>
        )}

        {/* Focus ring (subtle) */}
        <span className="pointer-events-none absolute inset-0 rounded-2xl ring-0 group-focus-within:ring-2 group-focus-within:ring-white/20" />
      </div>

      {/* Filters / options button */}
      <button
        type="button"
        onClick={onOpenFilters}
        className={clsx(
          "hidden sm:inline-flex items-center gap-2",
          "px-3.5 py-2.5 rounded-2xl",
          "bg-white/5 hover:bg-white/10 transition-colors",
          "ring-1 ring-black/5 dark:ring-white/10",
          "text-sm"
        )}
        aria-label="Open filters"
      >
        <SlidersHorizontal className="h-4 w-4 opacity-80" />
        <span>Suodattimet</span>
      </button>

      {/* Submit for accessibility (Enter already works) */}
      <button type="submit" className="sr-only">Search</button>

      {/* Keyboard shortcut hint */}
      <span
        className="ml-1 hidden md:inline-flex items-center px-2 py-1 rounded-lg text-xs
                   ring-1 ring-white/15 text-gray-400"
        aria-hidden="true"
      >
        /
      </span>
    </form>
  );
}
