import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import clsx from "clsx";

export default function FiltersSheet({
  open,
  onClose,
  onApply,
  initial = { sort: "newest", hasImage: false, tags: [] },
  availableTags = [],
}) {
  const { t } = useTranslation();
  const [state, setState] = useState(initial);

  // refs for focus management
  const closeBtnRef = useRef(null);
  const openerRef = useRef(null);

  useEffect(() => setState(initial), [initial, open]);

  // lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // focus + ESC key handling
  useEffect(() => {
    if (!open) return;

    // remember opener (focused element) to restore later
    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    // move focus to close button when opening
    const id = requestAnimationFrame(() => closeBtnRef.current?.focus?.());

    const onKey = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose?.();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(id);
      document.removeEventListener("keydown", onKey);
      // restore focus to opener if still in DOM
      openerRef.current?.focus?.();
    };
  }, [open, onClose]);

  const apply = () => onApply?.(state);

  return (
    <div
      className={clsx(
        "fixed inset-0 z-[60] pointer-events-none",
        open && "pointer-events-auto"
      )}
      aria-hidden={!open}
    >
      {/* Backdrop */}
      <div
        className={clsx(
          "absolute inset-0 bg-black/50 transition-opacity",
          open ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className={clsx(
          "absolute right-0 top-0 h-full w-full sm:w-[380px]",
          "bg-white dark:bg-slate-900 border-l border-gray-200 dark:border-slate-800",
          "transition-transform",
          open ? "translate-x-0" : "translate-x-full",
          "shadow-2xl"
        )}
        id="filters-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="filters-title"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-slate-800">
          <h3
            id="filters-title"
            className="text-lg font-semibold text-gray-900 dark:text-white"
          >
            {t("filters", "Filters")}
          </h3>
          <button
            ref={closeBtnRef}
            onClick={onClose}
            className="p-2 rounded-md hover:bg-black/5 dark:hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label={t("close", "Close")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-6 overflow-y-auto h-[calc(100%-56px-64px)]">
          {/* Sort */}
          <section>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              {t("sort_by", "Sort by")}
            </div>
            <div
              className="flex gap-2"
              role="radiogroup"
              aria-label={t("sort_by", "Sort by")}
            >
              {[
                { key: "newest", label: t("newest", "Newest") },
                { key: "oldest", label: t("oldest", "Oldest") },
              ].map((opt) => {
                const checked = state.sort === opt.key;
                return (
                  <button
                    key={opt.key}
                    onClick={() => setState((s) => ({ ...s, sort: opt.key }))}
                    role="radio"
                    aria-checked={checked}
                    className={
                      "px-3 py-1.5 rounded-full text-sm ring-1 " +
                      (checked
                        ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-blue-500/30"
                        : "bg-white/5 dark:bg-white/5 text-gray-700 dark:text-gray-300 ring-white/10 hover:bg-white/10")
                    }
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Has image */}
          <section className="flex items-center justify-between">
            <label
              htmlFor="filters-has-image"
              className="text-sm text-gray-700 dark:text-gray-200"
            >
              {t("has_images_only", "Show only recipes with images")}
            </label>
            <input
              id="filters-has-image"
              type="checkbox"
              className="h-4 w-4"
              checked={state.hasImage}
              onChange={(e) =>
                setState((s) => ({ ...s, hasImage: e.target.checked }))
              }
            />
          </section>

          {/* Tags */}
          {availableTags.length > 0 && (
            <section>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                {t("tags", "Tags")}
              </div>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => {
                  const active = state.tags.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() =>
                        setState((s) => ({
                          ...s,
                          tags: active
                            ? s.tags.filter((t) => t !== tag)
                            : [...s.tags, tag],
                        }))
                      }
                      aria-pressed={active}
                      className={
                        "text-xs px-2 py-1 rounded-full border " +
                        (active
                          ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30"
                          : "bg-white/5 dark:bg-white/5 text-gray-700 dark:text-gray-300 border-white/10 hover:bg-white/10")
                      }
                    >
                      #{tag}
                    </button>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-slate-800 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full ring-1 ring-white/15 hover:bg-white/10"
          >
            {t("cancel", "Cancel")}
          </button>
          <button
            onClick={apply}
            className="px-4 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-500"
          >
            {t("apply", "Apply")}
          </button>
        </div>
      </div>
    </div>
  );
}
