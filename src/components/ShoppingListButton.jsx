import React, { useMemo, useState } from "react";

export default function ShoppingListButton({ items = [], title = "Shopping list" }) {
  const [status, setStatus] = useState("");

  // Normalize list like: "500 g Bread flour"
  const lines = useMemo(() => {
    const rows = [];
    for (const it of items) {
      const name = (it?.name || "").trim();
      const amt  = it?.amount != null && it?.amount !== "" ? String(it.amount) : "";
      const unit = (it?.unit || "").trim();
      const left = [amt, unit].filter(Boolean).join(" ");
      const line = [left, name].filter(Boolean).join(" ").trim();
      if (line) rows.push(line);
    }
    return rows;
  }, [items]);

  const asText = () => lines.join("\n");
  const asCSV  = () => {
    const header = "amount,unit,name";
    const rows = items.map((it) => {
      const amt  = it?.amount != null && it?.amount !== "" ? String(it.amount) : "";
      const unit = it?.unit ? String(it.unit) : "";
      const name = it?.name ? String(it.name) : "";
      const esc = (s) => `"${String(s).replace(/"/g, '""')}"`;
      return [amt, unit, name].map(esc).join(",");
    });
    return [header, ...rows].join("\n");
  };

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(asText());
      setStatus("Copied ✓");
    } catch {
      download("shopping-list.txt", asText(), "text/plain");
      setStatus("Downloaded");
    } finally {
      setTimeout(() => setStatus(""), 1500);
    }
  };

  const downloadCSV = () => {
    download("shopping-list.csv", asCSV(), "text/csv");
    setStatus("Downloaded");
    setTimeout(() => setStatus(""), 1500);
  };

  const download = (filename, content, type) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  if (!lines.length) {
    return (
      <button
        disabled
        className="inline-flex items-center gap-1 text-sm px-2.5 py-1.5 rounded-md border border-gray-300 dark:border-slate-600 opacity-60 cursor-not-allowed"
        title="No ingredients to export"
      >
        🛒 {title}
      </button>
    );
  }

  return (
    <div className="relative inline-flex items-center gap-2">
      <button
        onClick={copyText}
        className="inline-flex items-center gap-1 text-sm px-2.5 py-1.5 rounded-md border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700"
        title="Copy as text"
      >
        🛒 {title}
      </button>
      <button
        onClick={downloadCSV}
        className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700"
        title="Download CSV"
      >
        CSV
      </button>
      {status && <span className="text-xs opacity-70">{status}</span>}
    </div>
  );
}
