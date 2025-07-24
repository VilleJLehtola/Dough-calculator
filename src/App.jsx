import React, { useState } from "react";
import "./styles.css";

export default function App() {
  const [flour, setFlour] = useState("");
  const [water, setWater] = useState("");
  const [mode, setMode] = useState("bread");

  const hydration = (() => {
    const f = parseFloat(flour);
    const w = parseFloat(water);
    if (!f || !w) return 0;
    return ((w / f) * 100).toFixed(1);
  })();

  return (
    <div className="container">
      <div className="card">
        <h1 className="text-xl font-bold mb-4">Dough Calculator</h1>

        <div className="mb-4">
          <button
            className={`mode ${mode === "pizza" ? "active" : "inactive"}`}
            onClick={() => setMode("pizza")}
          >
            Pizza
          </button>
          <button
            className={`mode ${mode === "bread" ? "active" : "inactive"}`}
            onClick={() => setMode("bread")}
          >
            Bread
          </button>
        </div>

        <div>
          <label>Flour (g)</label>
          <input
            type="number"
            value={flour}
            onChange={e => setFlour(e.target.value)}
            placeholder="e.g. 500"
          />
        </div>

        <div>
          <label>Water (g)</label>
          <input
            type="number"
            value={water}
            onChange={e => setWater(e.target.value)}
            placeholder="e.g. 375"
          />
        </div>

        <div className="output">
          Hydration: <span>{hydration}%</span>
          <div className="subtext">Dough type: {mode}</div>
        </div>
      </div>
    </div>
  );
}
