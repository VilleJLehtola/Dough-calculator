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
  // ✅ NEW props for ARIA wiring
  filtersOpen = false,
  filtersControlsId = "filters-sheet",
}) {
  const inputRef = useRef(null);

  // Focus with "/"
  useEffect(() => {
    const onKey = (e) => {
      if (
        e.key === "/" &&
        e.target instanceof HTMLElement &&
        !["INPUT", "TEXTAREA"].includes(e.target.tagName)
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape" && document.activeElement === inputRef.current) {
        onClear?.();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClear]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.(value);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={clsx("flex items-center gap-2 w-full", className)}
      role="search"
      aria-label="Recipe search"
    >
      <div
        className={clsx(
          "group relative flex-1 rounded-full",
          "bg-white/5 dark:bg-white/5 backdrop-blur-sm",
          "ring-1 ring-white/10 hover:ring-white/15",
          "transition-shadow focus-within:ring-2 focus-within:ring-blue-400/30"
        )}
      >
        <Search
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 opacity-70"
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
            "w-full h-11 pl-12 pr-16 rounded-full",
            "bg-transparent outline-none",
            "text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          )}
          aria-label={placeholder}
        />
        {value?.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
          >
            <X className="h-4 w-4 opacity-85" />
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={onOpenFilters}
        className={clsx(
          "inline-flex items-center gap-2",
          "px-3.5 h-11 rounded-full text-sm",
          "bg-white/5 hover:bg-white/10 transition-colors",
          "ring-1 ring-white/10"
        )}
        aria-label="Open filters"
        // ✅ ARIA wiring to the sheet
        aria-expanded={filtersOpen}
        aria-controls={filtersControlsId}
      >
        <SlidersHorizontal className="h-4 w-4 opacity-85" />
        <span>Suodattimet</span>
      </button>

      <button type="submit" className="sr-only">Search</button>
      <span
        className="ml-1 hidden md:inline-flex items-center px-2 py-1 rounded-md text-xs ring-1 ring-white/15 text-gray-400"
        aria-hidden="true"
      >
        /
      </span>
    </form>
  );
}
