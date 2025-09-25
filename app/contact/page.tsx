"use client";

import { useState } from "react";
import { sendContactEmail } from "@/lib/email";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    setError(null);
    if (!name || !email || !message) {
      setError("Veuillez remplir tous les champs.");
      return;
    }
    setLoading(true);
    const res = await sendContactEmail({ name, email, message });
    setLoading(false);
    if (res.ok) {
      setStatus("Message envoyé avec succès.");
      setName("");
      setEmail("");
      setMessage("");
    } else {
      setError(res.error || "Erreur d’envoi. Vous pouvez utiliser l’email de secours ci-dessous.");
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-gray-900">Contact</h1>
      <p className="mt-2 text-gray-600">Écrivez-nous et nous reviendrons vers vous rapidement.</p>

      {status && (
        <div className="mt-4 rounded-md border border-teal-200 bg-teal-50 p-3 text-sm text-teal-800">{status}</div>
      )}
      {error && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <form onSubmit={onSubmit} className="mt-6 grid gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Nom</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-md border border-black/10 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-black/10 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Message</label>
          <textarea
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="mt-1 w-full rounded-md border border-black/10 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center rounded-md bg-teal-600 px-5 py-3 text-white shadow hover:bg-teal-700 transition disabled:opacity-60"
          >
            {loading ? "Envoi…" : "Envoyer"}
          </button>
          <a
            href={`mailto:contact@delivevent.local?subject=${encodeURIComponent("Contact via Deliv’ Event")}&body=${encodeURIComponent(`${name} <${email}>

${message}`)}`}
            className="text-sm text-gray-600 hover:text-teal-700"
          >
            Ou m’écrire depuis votre messagerie
          </a>
        </div>
      </form>
    </div>
  );
}
