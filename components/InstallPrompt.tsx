"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault?.();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler as EventListener);
    return () => window.removeEventListener("beforeinstallprompt", handler as EventListener);
  }, []);

  if (!visible || !deferred) return null;

  return (
    <div className="fixed inset-x-0 bottom-4 z-50 mx-auto w-[92%] max-w-lg rounded-lg border border-black/10 bg-white p-4 shadow-xl">
      <div className="flex items-start gap-3">
        <div className="mt-1 h-6 w-6 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center">⇩</div>
        <div className="flex-1">
          <p className="font-medium text-gray-900">Installer Deliv’ Event</p>
          <p className="text-sm text-gray-600">Ajoute l’application à ton écran d’accueil pour un accès rapide hors connexion.</p>
          <div className="mt-3 flex gap-2">
            <button
              className="inline-flex items-center justify-center rounded-md bg-teal-600 px-3 py-2 text-white shadow hover:bg-teal-700 transition text-sm"
              onClick={async () => {
                try {
                  await deferred.prompt();
                  await deferred.userChoice;
                } finally {
                  setVisible(false);
                  setDeferred(null);
                }
              }}
            >
              Installer
            </button>
            <button
              className="inline-flex items-center justify-center rounded-md border border-black/10 bg-white px-3 py-2 text-gray-700 hover:bg-gray-50 transition text-sm"
              onClick={() => setVisible(false)}
            >
              Plus tard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
