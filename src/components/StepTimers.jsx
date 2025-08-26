import { useEffect, useMemo, useRef, useState } from "react";

/**
 * StepTimers — compact, multi-line with expand-on-click
 * - Smaller fonts & paddings
 * - Shows up to 2 lines, click label to expand/collapse
 * - Single 1Hz ticker for all rows
 */
export default function StepTimers({ steps = [] }) {
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
  const [expanded, setExpanded] = useState(() => new Set());

  // Keep arrays in sync when steps change
  useEffect(() => {
    setState(timed.map((t) => ({ id: t.id, left: t.seconds, running: false, done: false })));
    setExpanded(new Set());
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

  const toggleExpand = (id) =>
    setExpanded((set) => {
      const next = new Set(set);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  if (!timed.length) return null;

  return (
    <section className="rounded-xl border border-gray-200 dark:border-slate-700 p-3 text-[13px]">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">Step timers</h3>
        <div className="flex gap-1">
          <button onClick={startAll} className="px-2 py-1 text-[11px] rounded-md border">
            Start all
          </button>
          <button onClick={pauseAll} className="px-2 py-1 text-[11px] rounded-md border">
            Pause all
          </button>
          <button onClick={resetAll} className="px-2 py-1 text-[11px] rounded-md border">
            Reset all
          </button>
        </div>
      </div>

      <ul className="space-y-1.5">
        {timed.map((t, i) => {
          const s = state[i];
          const isExpanded = expanded.has(t.id);
          return (
            <li
              key={t.id}
              className="flex items-center justify-between gap-2 rounded-md bg-gray-50 dark:bg-slate-800 px-2 py-1.5"
            >
              <div className="min-w-0 flex-1 pr-2">
                <button
                  className={[
                    "text-[13px] font-medium text-left w-full cursor-pointer select-text",
                    isExpanded ? "line-clamp-none whitespace-normal break-words" : "line-clamp-2",
                  ].join(" ")}
                  title={t.label}
                  onClick={() => toggleExpand(t.id)}
                  aria-expanded={isExpanded}
                >
                  {t.label}
                </button>
                <div className="text-[11px] opacity-70 mt-0.5">
                  Tgt: {fmt(t.seconds)} • {s.done ? "Done" : s.running ? "Running" : "Paused"}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <span className="tabular-nums font-mono text-sm w-16 text-right">{fmt(s.left)}</span>
                <button
                  onClick={() => toggle(t.id)}
                  className="px-2 py-1 text-[11px] rounded-md border"
                  title={s.running ? "Pause" : "Start"}
                >
                  {s.running ? "Pause" : "Start"}
                </button>
                <button
                  onClick={() => reset(t.id)}
                  className="px-2 py-1 text-[11px] rounded-md border"
                  title="Reset"
                >
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
