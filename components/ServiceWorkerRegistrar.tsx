"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const showUpdateToast = () => {
      // Avoid duplicating
      if (document.getElementById("sw-update-toast")) return;

      const container = document.createElement("div");
      container.id = "sw-update-toast";
      container.style.position = "fixed";
      container.style.left = "50%";
      container.style.transform = "translateX(-50%)";
      container.style.bottom = "16px";
      container.style.zIndex = "9999";
      container.style.background = "#111827"; // gray-900
      container.style.color = "#fff";
      container.style.padding = "10px 14px";
      container.style.borderRadius = "10px";
      container.style.boxShadow = "0 10px 15px -3px rgba(0,0,0,.1), 0 4px 6px -2px rgba(0,0,0,.05)";
      container.style.display = "flex";
      container.style.gap = "8px";
      container.style.alignItems = "center";

      const text = document.createElement("span");
      text.textContent = "Nouvelle version disponible";
      text.style.fontSize = "14px";
      container.appendChild(text);

      const btn = document.createElement("button");
      btn.textContent = "Mettre à jour";
      btn.style.background = "#14b8a6"; // teal-500
      btn.style.color = "#fff";
      btn.style.border = "1px solid rgba(0,0,0,.1)";
      btn.style.borderRadius = "8px";
      btn.style.padding = "6px 10px";
      btn.style.cursor = "pointer";
      btn.onclick = () => {
        // Reload to activate new SW
        window.location.reload();
      };
      container.appendChild(btn);

      const close = document.createElement("button");
      close.textContent = "×";
      close.setAttribute("aria-label", "Fermer");
      close.style.background = "transparent";
      close.style.color = "#fff";
      close.style.border = "none";
      close.style.fontSize = "18px";
      close.style.lineHeight = "1";
      close.style.cursor = "pointer";
      close.onclick = () => container.remove();
      container.appendChild(close);

      document.body.appendChild(container);
    };

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        // Update on new SW available
        if (reg.waiting) {
          reg.waiting.postMessage({ type: "SKIP_WAITING" });
          showUpdateToast();
        }
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              showUpdateToast();
            }
          });
        });
      } catch (e) {
        console.warn("SW registration failed", e);
      }
    };

    register();

    // Listen messages from SW (e.g., on activate)
    const onMsg = (event: MessageEvent) => {
      const data = event.data as unknown;
      if (typeof data === "object" && data !== null && (data as { type?: string }).type === "SW_ACTIVATED") {
        // after activation, prompt the user
        showUpdateToast();
      }
    };
    navigator.serviceWorker.addEventListener("message", onMsg);

    return () => {
      navigator.serviceWorker.removeEventListener("message", onMsg);
      const el = document.getElementById("sw-update-toast");
      if (el) el.remove();
    };
  }, []);

  return null;
}
