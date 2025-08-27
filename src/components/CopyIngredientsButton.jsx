import { useMemo, useState } from "react";
import { Check, Clipboard } from "lucide-react";

export default function CopyIngredientsButton({ ingredients = [], title = "Recipe" }) {
  const [copied, setCopied] = useState(false);

  const text = useMemo(() => {
    const lines = [title, ""].concat(
      ingredients.map((i) =>
        [i.name, i.amount != null ? String(i.amount) : "", i.unit || ""]
          .join(" ")
          .replace(/\s+/g, " ")
          .trim()
      )
    );
    return lines.join("\n");
  }, [ingredients, title]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      window.prompt("Copy ingredients", text);
    }
  };

  return (
    <button
      onClick={copy}
      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-sm border ${
        copied
          ? "bg-green-600 text-white border-green-600"
          : "border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-800 dark:text-gray-200"
      }`}
      aria-label="Copy ingredients"
      title={copied ? "Copied!" : "Copy ingredients"}
    >
      {copied ? <Check className="w-4 h-4" /> : <Clipboard className="w-4 h-4" />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}
