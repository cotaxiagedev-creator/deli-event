"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useToast } from "@/components/ToastProvider";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md px-4 sm:px-6 lg:px-8 py-10">Chargement…</div>}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const { show } = useToast();
  const sp = useSearchParams();
  const next = sp?.get("next") || "/compte/annonces";
  const msg = sp?.get("msg") || null;
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div className="mx-auto max-w-md px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-gray-900">Connexion</h1>
      <p className="mt-2 text-gray-600">Recevez un lien magique par e‑mail pour vous connecter.</p>

      {!isSupabaseConfigured && (
        <div className="mt-4 rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
          Supabase n&apos;est pas configuré. Renseignez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY pour activer la connexion.
        </div>
      )}
      {msg === "connect_required" && (
        <div className="mt-4 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
          Connexion requise pour déposer une annonce. Veuillez vous connecter.
        </div>
      )}

      <div className="mt-6 rounded-xl border border-black/10 bg-white p-6 shadow-sm">
      <form
        className="grid gap-3"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!email) {
            show("error", "Entrez votre e‑mail");
            return;
          }
          if (!isSupabaseConfigured) {
            show("error", "Supabase non configuré");
            return;
          }
          try {
            setBusy(true);
            const redirectTo = typeof window !== "undefined" ? `${window.location.origin}${next.startsWith("/") ? next : "/compte/annonces"}` : undefined;
            const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } });
            if (error) throw error;
            show("success", "Lien magique envoyé. Vérifiez votre boîte mail.");
          } catch (err) {
            show("error", err instanceof Error ? err.message : "Erreur d&apos;envoi");
          } finally {
            setBusy(false);
          }
        }}
      >
        <label className="block text-sm font-medium text-gray-700">E‑mail</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-md border border-black/10 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 placeholder:text-gray-400"
          placeholder="vous@exemple.com"
          autoComplete="email"
        />
        <button
          type="submit"
          disabled={busy}
          className="mt-3 inline-flex items-center justify-center rounded-md bg-teal-600 px-4 py-2 text-white shadow hover:bg-teal-700 transition disabled:opacity-60"
        >
          {busy ? "Envoi…" : "Recevoir le lien"}
        </button>
      </form>
      </div>
    </div>
  );
}
