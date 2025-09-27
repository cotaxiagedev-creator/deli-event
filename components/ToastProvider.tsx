"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

export type ToastKind = "success" | "error" | "info";
export type Toast = {
  id: string;
  kind: ToastKind;
  message: string;
  timeout?: number;
};

type ToastContextType = {
  show: (kind: ToastKind, message: string, timeout?: number) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider/>");
  return ctx;
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((kind: ToastKind, message: string, timeout = 3500) => {
    const id = Math.random().toString(36).slice(2);
    const t: Toast = { id, kind, message, timeout };
    setToasts((arr) => [...arr, t]);
    if (timeout > 0) {
      setTimeout(() => {
        setToasts((arr) => arr.filter((x) => x.id !== id));
      }, timeout);
    }
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={[
              "pointer-events-auto w-full max-w-md rounded-md border px-4 py-3 shadow-md",
              t.kind === "success" && "border-teal-200 bg-teal-50 text-teal-800",
              t.kind === "error" && "border-red-200 bg-red-50 text-red-700",
              t.kind === "info" && "border-gray-200 bg-white text-gray-800",
            ].filter(Boolean).join(" ")}
            role="status"
            aria-live={t.kind === "error" ? "assertive" : "polite"}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 h-5 w-5 flex items-center justify-center rounded-full bg-black/5">{t.kind === "success" ? "✓" : t.kind === "error" ? "!" : "i"}</div>
              <div className="flex-1 text-sm">{t.message}</div>
              <button
                className="-mr-2 rounded px-2 text-gray-500 hover:text-gray-700"
                onClick={() => setToasts((arr) => arr.filter((x) => x.id !== t.id))}
                aria-label="Fermer la notification"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
