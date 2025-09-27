"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Optionally log the error to monitoring here
    // console.error(error);
  }, [error]);

  return (
    <html lang="fr">
      <body>
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-16 text-center">
          <p className="text-sm font-semibold text-teal-600">Une erreur est survenue</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Oups, quelque chose s&apos;est mal passé
          </h1>
          <p className="mt-2 text-base text-gray-600">
            Réessaie l&rsquo;action ou reviens à l&rsquo;accueil. Si le problème persiste, recharge la page.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              onClick={() => reset()}
              className="inline-flex items-center justify-center rounded-md bg-teal-600 px-4 py-2 text-white shadow hover:bg-teal-700 transition"
            >
              Réessayer
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-md border border-black/10 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50 transition"
            >
              Accueil
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
