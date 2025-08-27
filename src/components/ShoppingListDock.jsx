import { useEffect, useState } from "react";
import { ShoppingCart } from "lucide-react";
import ShoppingListDrawer from "./ShoppingListDrawer";
import { countUnchecked } from "@/utils/shoppingList";

export default function ShoppingListDock() {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(() => countUnchecked());

  useEffect(() => {
    const id = setInterval(() => setCount(countUnchecked()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed z-50 bottom-4 right-4 sm:bottom-6 sm:right-6 rounded-full shadow-lg bg-blue-600 text-white w-12 h-12 flex items-center justify-center hover:bg-blue-500"
        aria-label="Open shopping list"
      >
        <ShoppingCart className="w-6 h-6" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 text-[11px] leading-none px-1.5 py-0.5 rounded-full bg-white text-blue-700 shadow border border-blue-100">
            {count}
          </span>
        )}
      </button>
      <ShoppingListDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}
