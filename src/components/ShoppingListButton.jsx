import { useMemo, useState } from "react";
import { ShoppingCart, Check } from "lucide-react";
import { addItems } from "@/utils/shoppingList";

export default function ShoppingListButton({ ingredients = [] }) {
  const [ok, setOk] = useState(false);

  // Normalize & keep even name-only rows; drop empty names
  const normalized = useMemo(() => {
    const norm = (s) => (s == null ? "" : String(s)).trim();
    return (ingredients || [])
      .map((i) => ({
        name: norm(i?.name),
        amount: Number.isFinite(Number(i?.amount))
          ? Number(i.amount)
          : undefined,
        unit: norm(i?.unit),
      }))
      .filter((i) => i.name.length > 0);
  }, [ingredients]);

  const disabled = normalized.length === 0;

  const onClick = () => {
    if (disabled) return;
    addItems(normalized);
    setOk(true);
    setTimeout(() => setOk(false), 1200);
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-sm border ${
        disabled
          ? "opacity-60 cursor-not-allowed border-gray-300 dark:border-slate-600"
          : ok
          ? "bg-green-600 text-white border-green-600"
          : "border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-800 dark:text-gray-200"
      }`}
      title={disabled ? "No ingredients found to add" : ok ? "Added!" : "Add ingredients to shopping list"}
      aria-label="Add ingredients to shopping list"
    >
      {ok ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
      {ok ? "Added!" : "Add to list"}
    </button>
  );
}
