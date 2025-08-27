import { useEffect, useState } from "react";
import {
  X,
  Trash2,
  Printer,
  CheckSquare,
  Square,
  ShoppingCart,
} from "lucide-react";
import {
  getList,
  toggleItem,
  removeItem,
  clearList,
  countUnchecked,
} from "@/utils/shoppingList";

export default function ShoppingListDrawer({ open, onClose }) {
  const [data, setData] = useState(() => getList());
  const [remaining, setRemaining] = useState(() => countUnchecked());

  const refresh = () => {
    setData(getList());
    setRemaining(countUnchecked());
  };

  useEffect(() => {
    if (!open) return;
    refresh();
    const onStorage = (e) => {
      if (e.key === "ed.shoppingList.v1") refresh();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [open]);

  const onToggle = (id) => {
    toggleItem(id);
    refresh();
  };
  const onRemove = (id) => {
    removeItem(id);
    refresh();
  };
  const onClear = () => {
    if (confirm("Clear the shopping list?")) {
      clearList();
      refresh();
    }
  };
  const onPrint = () => {
    const lines = data.items.map((i) => {
      const amt =
        i.amount != null && i.amount !== ""
          ? ` ${i.amount}${i.unit ? " " + i.unit : ""}`
          : "";
      return `□ ${i.name}${amt}`;
    });
    const html = `<!doctype html><title>Shopping List</title>
      <style>body{font:16px/1.5 system-ui,Segoe UI,Roboto,Helvetica,Arial}</style>
      <h2>Shopping List</h2><pre>${lines.join("\n")}</pre>`;
    const w = window.open("", "_blank");
    if (w) {
      w.document.open();
      w.document.write(html);
      w.document.close();
      w.focus();
      w.print();
    }
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-[60] bg-black/40"
          onClick={onClose}
          aria-label="Close shopping list"
        />
      )}
      <aside
        className={`fixed z-[61] top-0 right-0 h-full w-[90%] max-w-md bg-white dark:bg-slate-900 border-l border-gray-200 dark:border-slate-700 transform transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-label="Shopping list"
      >
        <div className="p-3 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            <h3 className="text-lg font-semibold">Shopping list</h3>
            <span className="text-xs opacity-70">
              {remaining} item{remaining === 1 ? "" : "s"} left
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-800"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 overflow-y-auto h-[calc(100%-56px-56px)]">
          {data.items.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Your shopping list is empty. Add ingredients from any recipe.
            </p>
          ) : (
            <ul className="space-y-2">
              {data.items.map((i) => (
                <li
                  key={i.id}
                  className="flex items-center justify-between gap-2 border border-gray-200 dark:border-slate-700 rounded-md px-2 py-1.5"
                >
                  <button
                    onClick={() => onToggle(i.id)}
                    className="inline-flex items-center gap-2"
                    title={i.checked ? "Uncheck" : "Check"}
                  >
                    {i.checked ? (
                      <CheckSquare className="w-5 h-5 text-green-600" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                    <span
                      className={`${
                        i.checked
                          ? "line-through text-gray-400"
                          : "text-gray-800 dark:text-gray-100"
                      }`}
                    >
                      {i.name}
                      {i.amount != null && i.amount !== "" && (
                        <span className="opacity-70">
                          {" "}
                          – {i.amount}
                          {i.unit ? " " + i.unit : ""}
                        </span>
                      )}
                    </span>
                  </button>

                  <button
                    onClick={() => onRemove(i.id)}
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-800"
                    aria-label="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="p-3 border-t border-gray-200 dark:border-slate-700 flex items-center justify-between">
          <button
            onClick={onClear}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-800"
          >
            <Trash2 className="w-4 h-4" />
            Clear
          </button>
          <button
            onClick={onPrint}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-500"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
        </div>
      </aside>
    </>
  );
}
