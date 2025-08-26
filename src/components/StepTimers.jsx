import { useEffect, useMemo, useRef, useState } from "react";

/**
 * StepTimers — compact layout
 * - Smaller fonts & paddings
 * - Truncates long labels
 * - Single 1Hz ticker for all rows
 */
export default function StepTimers({ steps = [], compact = true }) {
  const timed = useMemo(
    () =>
      (steps || [])
        .filter((s) => Number(s?.time) > 0)
        .map((s, i) => ({
          id: s.position ?? i + 1,
          label: String(s.text || `Step ${i + 1}`).split("\n")[0],
          seconds: Math.round(Number(s.time) * 60),
        })),
    [steps]
  );

  const [state, setState] = useState(() =>
    timed.map((t) => ({ id: t.id, left: t.seconds, running: false, done: false }))
  );

  // Keep state array in sync if "steps" changes shape
  useEffect(() => {
    setState(timed.map((t) => ({ id: t.id, left: t.seconds, running: false, done: false })));
  }, [timed]);

  const tickRef = useRef(null);

  useEffect(() => {
    tickRef.current = setInterval(() => {
      setState((curr) =>
        curr.map((s, idx) => {
          if (!s.running || s.done || s.left <= 0) return s;
          const nextLeft = s.left - 1;
          if (nextLeft <= 0) {
            notifyDone(timed[idx]?.label || `Step ${idx + 1}`);
            return { ...s, left: 0, running: false, done: true };
          }
          return { ...s, left: nextLeft };
        })
      );
    }, 1000);
    return () => clearInterval(tickRef.current);
  }, [timed]);

  const ensureNotifPerm = async () => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      try {
        await Notification.requestPermission();
      } catch {}
    }
  };

  const notifyDone = (label) => {
    try {
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Step complete", { body: label });
      }
    } catch {}
  };

  const fmt = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const startAll = async () => {
    await ensureNotifPerm();
    setState((curr) => curr.map((s) => ({ ...s, running: true, done: s.left <= 0 })));
  };
  const pauseAll = () => setState((curr) => curr.map((s) => ({ ...s, running: false })));
  const resetAll = () =>
    setState(timed.map((t) => ({ id: t.id, left: t.seconds, running: false, done: false })));

  const toggle = (id) =>
    setState((curr) => curr.map((s) => (s.id === id ? { ...s, running: !s.running } : s)));
  const reset = (id) =>
    setState((curr) =>
      curr.map((s, i) =>
        s.id === id ? { ...s, left: timed[i].seconds, running: false, done: false } : s
      )
    );

  if (!timed.length) return null;

  return (
    <section className="rounded-xl border border-gray-200 dark:border-slate-700 p-3 text-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">Step timers</h3>
        <div className="flex gap-1">
          <button onClick={startAll} className="px-2 py-1 text-xs rounded-md border">
            Start all
          </button>
          <button onClick={pauseAll} className="px-2 py-1 text-xs rounded-md border">
            Pause all
          </button>
          <button onClick={resetAll} className="px-2 py-1 text-xs rounded-md border">
            Reset all
          </button>
        </div>
      </div>

      <ul className="space-y-1.5">
        {timed.map((t, i) => {
          const s = state[i];
          return (
            <li
              key={t.id}
              className="flex items-center justify-between rounded-md bg-gray-50 dark:bg-slate-800 px-2 py-1.5"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium truncate" title={t.label}>
                  {t.label}
                </div>
                <div className="text-[11px] opacity-70">
                  Tgt: {fmt(t.seconds)} • {s.done ? "Done" : s.running ? "Running" : "Paused"}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className="tabular-nums font-mono text-sm w-16 text-right">{fmt(s.left)}</span>
                <button onClick={() => toggle(t.id)} className="px-2 py-1 text-[11px] rounded-md border">
                  {s.running ? "Pause" : "Start"}
                </button>
                <button onClick={() => reset(t.id)} className="px-2 py-1 text-[11px] rounded-md border">
                  Reset
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
