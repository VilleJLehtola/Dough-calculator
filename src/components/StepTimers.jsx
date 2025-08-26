import { useEffect, useMemo, useRef, useState } from "react";

/**
 * StepTimers
 * Expects steps like: [{ text, time: minutes, position }]
 */
export default function StepTimers({ steps = [] }) {
  const timed = useMemo(
    () => steps.filter(s => Number(s.time) > 0).map((s, i) => ({
      id: s.position ?? i + 1,
      label: s.text?.split("\n")[0] || `Step ${i + 1}`,
      seconds: Math.round(Number(s.time) * 60),
    })),
    [steps]
  );

  const [state, setState] = useState(
    () => timed.map(t => ({ id: t.id, left: t.seconds, running: false, done: false }))
  );
  const tickRef = useRef(null);

  // Ask notification permission once (on first interaction)
  const ensureNotifPerm = async () => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      try { await Notification.requestPermission(); } catch {}
    }
  };

  useEffect(() => {
    // global ticker (1Hz) drives all running timers
    tickRef.current = setInterval(() => {
      setState(curr =>
        curr.map((s, idx) => {
          if (!s.running || s.done || s.left <= 0) return s;
          const nextLeft = s.left - 1;
          if (nextLeft <= 0) {
            notifyDone(timed[idx].label);
            return { ...s, left: 0, running: false, done: true };
          }
          return { ...s, left: nextLeft };
        })
      );
    }, 1000);
    return () => clearInterval(tickRef.current);
  }, [timed]);

  const fmt = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const notifyDone = (label) => {
    try {
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Step complete", { body: label });
      } else {
        // simple fallback
        console.log("Step complete:", label);
      }
    } catch {}
  };

  const startAll = async () => {
    await ensureNotifPerm();
    setState(curr => curr.map(s => ({ ...s, running: true, done: s.left <= 0 })));
  };
  const pauseAll = () => setState(curr => curr.map(s => ({ ...s, running: false })));
  const resetAll = () => setState(timed.map(t => ({ id: t.id, left: t.seconds, running: false, done: false })));

  const toggle = (id) => setState(curr =>
    curr.map(s => s.id === id ? { ...s, running: !s.running } : s)
  );
  const reset = (id) => setState(curr =>
    curr.map((s, i) => s.id === id ? { ...s, left: timed[i].seconds, running: false, done: false } : s)
  );

  if (!timed.length) return null;

  return (
    <section className="mb-4 rounded-xl border border-gray-200 dark:border-slate-700 p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">Step timers</h3>
        <div className="flex gap-2">
          <button onClick={startAll} className="px-2 py-1 text-sm rounded-md border">Start all</button>
          <button onClick={pauseAll} className="px-2 py-1 text-sm rounded-md border">Pause all</button>
          <button onClick={resetAll} className="px-2 py-1 text-sm rounded-md border">Reset all</button>
        </div>
      </div>

      <ul className="space-y-2">
        {timed.map((t, i) => {
          const s = state[i];
          const status = s.done ? "Done" : s.running ? "Running" : "Paused";
          return (
            <li key={t.id} className="flex items-center justify-between rounded-md bg-gray-50 dark:bg-slate-800 px-3 py-2">
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{t.label}</div>
                <div className="text-xs opacity-70">Target: {fmt(t.seconds)} • {status}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="tabular-nums font-mono">{fmt(s.left)}</span>
                <button onClick={() => toggle(t.id)} className="px-2 py-1 text-xs rounded-md border">{s.running ? "Pause" : "Start"}</button>
                <button onClick={() => reset(t.id)} className="px-2 py-1 text-xs rounded-md border">Reset</button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
