// src/components/StepTimers.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Play, Pause, RotateCw, Bell, BellOff, SunMoon, ChevronDown, ChevronUp } from "lucide-react";

export default function StepTimers({ steps = [] }) {
  const models = useMemo(() => {
    return steps
      .map((s, idx) => {
        const mins = numberOrNull(s?.time);
        const durMs = mins && mins > 0 ? Math.round(mins * 60_000) : null;
        return durMs ? { idx, text: s?.text || `Step ${idx + 1}`, durMs } : null;
      })
      .filter(Boolean);
  }, [steps]);

  // 👇 New: stable fingerprint of models so we react when text OR durations change
  const modelsKey = useMemo(
    () => models.map(m => `${m.idx}:${m.durMs}:${m.text}`).join("|"),
    [models]
  );

  const [timers, setTimers] = useState(() =>
    models.map(m => ({
      idx: m.idx,
      text: m.text,
      durMs: m.durMs,
      running: false,
      remainingMs: m.durMs,
      endAt: null,
      doneAtLeastOnce: false,
      expanded: false,
    }))
  );

  // 🔁 When language (texts) or durations change, sync without losing progress
  useEffect(() => {
    setTimers(prev => {
      const byIdx = new Map(prev.map(t => [t.idx, t]));
      return models.map(m => {
        const old = byIdx.get(m.idx);
        if (!old) {
          return {
            idx: m.idx,
            text: m.text,
            durMs: m.durMs,
            running: false,
            remainingMs: m.durMs,
            endAt: null,
            doneAtLeastOnce: false,
            expanded: false,
          };
        }
        // If duration changed, scale remaining proportionally
        let remainingMs = old.remainingMs;
        if (old.durMs !== m.durMs && old.durMs > 0) {
          const ratio = m.durMs / old.durMs;
          remainingMs = Math.max(0, Math.round(remainingMs * ratio));
        }
        // If running, recompute endAt from now
        const endAt = old.running ? Date.now() + remainingMs : null;
        return {
          idx: m.idx,
          text: m.text,          // 👈 update text to new language
          durMs: m.durMs,
          running: old.running,
          remainingMs,
          endAt,
          doneAtLeastOnce: old.doneAtLeastOnce,
          expanded: old.expanded,
        };
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelsKey]);

  // ---- ticking / resume after lock ----
  const tickRef = useRef(null);
  useEffect(() => {
    const anyRunning = timers.some(t => t.running);
    if (!anyRunning) {
      clearRef(tickRef);
      return;
    }
    if (!tickRef.current) {
      tickRef.current = setInterval(() => {
        setTimers(curr =>
          curr.map(t => {
            if (!t.running || t.endAt == null) return t;
            const remaining = Math.max(0, t.endAt - Date.now());
            if (remaining === 0) {
              notifyDone(t.text);
              return { ...t, running: false, endAt: null, remainingMs: 0, doneAtLeastOnce: true };
            }
            return { ...t, remainingMs: remaining };
          })
        );
      }, 250);
    }
    return () => clearRef(tickRef);
  }, [timers]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") {
        setTimers(curr =>
          curr.map(t => {
            if (!t.running || t.endAt == null) return t;
            const remaining = Math.max(0, t.endAt - Date.now());
            if (remaining === 0) {
              notifyDone(t.text);
              return { ...t, running: false, endAt: null, remainingMs: 0, doneAtLeastOnce: true };
            }
            return { ...t, remainingMs: remaining };
          })
        );
        reAcquireWakeLock();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // ---- Keep screen awake (best-effort) ----
  const [keepAwake, setKeepAwake] = useState(isLikelyMobile());
  const wakeSentinelRef = useRef(null);
  async function acquireWakeLock() {
    if (!keepAwake || !("wakeLock" in navigator)) return;
    try {
      if (!wakeSentinelRef.current) {
        const s = await navigator.wakeLock.request("screen");
        wakeSentinelRef.current = s;
        s.addEventListener?.("release", () => (wakeSentinelRef.current = null));
      }
    } catch {}
  }
  function releaseWakeLock() {
    wakeSentinelRef.current?.release?.();
    wakeSentinelRef.current = null;
  }
  function reAcquireWakeLock() {
    if (timers.some(t => t.running)) acquireWakeLock();
  }
  useEffect(() => {
    const anyRunning = timers.some(t => t.running);
    if (anyRunning) acquireWakeLock();
    else releaseWakeLock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timers, keepAwake]);

  // ---- Notifications + beep ----
  const [notiAllowed, setNotiAllowed] = useState(
    typeof Notification !== "undefined" && Notification.permission === "granted"
  );
  async function ensureNotifications() {
    if (typeof Notification === "undefined") return false;
    if (Notification.permission === "granted") return true;
    if (Notification.permission === "denied") return false;
    try {
      const perm = await Notification.requestPermission();
      setNotiAllowed(perm === "granted");
      return perm === "granted";
    } catch {
      return false;
    }
  }
  const audioCtxRef = useRef(null);
  function initAudio() {
    if (audioCtxRef.current) return;
    try {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      audioCtxRef.current = null;
    }
  }
  function beep() {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = 880;
    g.gain.value = 0.001;
    o.connect(g); g.connect(ctx.destination);
    const now = ctx.currentTime; o.start(now); o.stop(now + 0.25);
  }
  function vibrate() { try { navigator.vibrate?.(200); } catch {} }
  async function notifyDone(label) {
    beep(); vibrate();
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      try { new Notification("Timer finished", { body: label || "Step complete", silent: true }); } catch {}
    }
  }

  // ---- controls ----
  const startTimer = (i) => {
    initAudio(); ensureNotifications();
    setTimers(curr =>
      curr.map((t, idx) => idx !== i ? t : ({
        ...t, running: true, endAt: Date.now() + (t.remainingMs ?? t.durMs), remainingMs: (t.remainingMs ?? t.durMs)
      }))
    );
  };
  const pauseTimer = (i) => {
    setTimers(curr =>
      curr.map((t, idx) => {
        if (idx !== i) return t;
        const remaining = t.endAt ? Math.max(0, t.endAt - Date.now()) : t.remainingMs;
        return { ...t, running: false, endAt: null, remainingMs: remaining };
      })
    );
  };
  const resetTimer = (i) => {
    setTimers(curr =>
      curr.map((t, idx) => idx !== i ? t : ({
        ...t, running: false, endAt: null, remainingMs: t.durMs, doneAtLeastOnce: false
      }))
    );
  };
  const startAll = () => { initAudio(); ensureNotifications();
    setTimers(curr => curr.map(t => ({
      ...t, running: true, endAt: Date.now() + (t.remainingMs ?? t.durMs), remainingMs: (t.remainingMs ?? t.durMs)
    })));
  };
  const pauseAll = () => {
    setTimers(curr => curr.map(t => {
      const remaining = t.endAt ? Math.max(0, t.endAt - Date.now()) : t.remainingMs;
      return { ...t, running: false, endAt: null, remainingMs: remaining };
    }));
  };
  const resetAll = () => {
    setTimers(curr => curr.map(t => ({
      ...t, running: false, endAt: null, remainingMs: t.durMs, doneAtLeastOnce: false
    })));
  };

  const toggleExpand = (i) => {
    setTimers(curr => curr.map((t, idx) => idx === i ? { ...t, expanded: !t.expanded } : t));
  };

  if (!models.length) return null;

  return (
    <div className="rounded-lg border border-gray-200 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 p-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex items-center gap-2">
          <button onClick={startAll} className="px-2 py-1 rounded-md border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 text-sm inline-flex items-center gap-1">
            <Play className="w-4 h-4" /> Start all
          </button>
          <button onClick={pauseAll} className="px-2 py-1 rounded-md border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 text-sm inline-flex items-center gap-1">
            <Pause className="w-4 h-4" /> Pause all
          </button>
          <button onClick={resetAll} className="px-2 py-1 rounded-md border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 text-sm inline-flex items-center gap-1">
            <RotateCw className="w-4 h-4" /> Reset
          </button>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={keepAwake} onChange={(e) => setKeepAwake(e.target.checked)} />
            <span className="inline-flex items-center gap-1">
              <SunMoon className="w-4 h-4" />
              Keep screen awake
            </span>
          </label>

          {typeof Notification !== "undefined" ? (
            notiAllowed ? (
              <span className="text-xs inline-flex items-center gap-1 px-2 py-1 rounded-full border border-green-300 text-green-700 dark:text-green-300">
                <Bell className="w-3.5 h-3.5" /> Notifications on
              </span>
            ) : (
              <button
                onClick={ensureNotifications}
                className="text-xs inline-flex items-center gap-1 px-2 py-1 rounded-full border border-gray-300 hover:bg-gray-50 dark:border-slate-600 dark:hover:bg-slate-700"
                title="Enable notifications"
              >
                <BellOff className="w-3.5 h-3.5" /> Enable notifications
              </button>
            )
          ) : null}
        </div>
      </div>

      {/* Timers list */}
      <div className="mt-3 space-y-2">
        {timers.map((t, i) => {
          const clamped = t.expanded ? "" : "line-clamp-3 sm:line-clamp-2";
          return (
            <div
              key={t.idx}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 rounded-md border border-gray-200 dark:border-slate-700 px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className={`text-sm text-gray-900 dark:text-gray-100 leading-snug whitespace-normal break-words ${clamped}`}>
                  {t.text}
                </p>
                <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  {formatMs(t.durMs)} total{t.doneAtLeastOnce ? " • completed" : ""}
                </div>
                <button
                  className="mt-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  onClick={() => toggleExpand(i)}
                >
                  {t.expanded ? (
                    <span className="inline-flex items-center gap-1"><ChevronUp className="w-3 h-3" /> Show less</span>
                  ) : (
                    <span className="inline-flex items-center gap-1"><ChevronDown className="w-3 h-3" /> Show more</span>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <span
                  className={[
                    "tabular-nums font-semibold",
                    "text-base sm:text-lg",
                    t.running ? "text-blue-700 dark:text-blue-300" : "text-gray-800 dark:text-gray-200",
                  ].join(" ")}
                  aria-live="polite"
                >
                  {formatMs(t.remainingMs)}
                </span>

                {t.running ? (
                  <button
                    onClick={() => pauseTimer(i)}
                    className="px-2 py-1 rounded-md border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 inline-flex items-center gap-1"
                    title="Pause"
                  >
                    <Pause className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => startTimer(i)}
                    className="px-2 py-1 rounded-md border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 inline-flex items-center gap-1"
                    title="Start"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={() => resetTimer(i)}
                  className="px-2 py-1 rounded-md border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 inline-flex items-center gap-1"
                  title="Reset"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {!("wakeLock" in navigator) && (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Tip: Your browser may not support keeping the screen awake. Timers stay accurate and will catch up when you return.
        </p>
      )}
    </div>
  );
}

function numberOrNull(v) {
  const n = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}
function formatMs(ms) {
  const total = Math.max(0, Math.round((ms ?? 0) / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
function isLikelyMobile() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || navigator.vendor || "";
  return /android|iphone|ipad|ipod|mobile/i.test(ua);
}
function clearRef(ref) {
  if (ref.current) { clearInterval(ref.current); ref.current = null; }
}
