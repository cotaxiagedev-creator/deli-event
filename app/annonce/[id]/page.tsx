"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useToast } from "@/components/ToastProvider";

type Listing = {
  id: string;
  title: string;
  category: string;
  pricePerDay: number;
  location?: { name?: string; lat?: number; lon?: number };
  image?: string | null;
  tags?: string[] | null;
  description?: string | null;
  phone?: string | null;
};

export default function ListingDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string | undefined;
  const { show } = useToast();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  // Contact form state
  const [cName, setCName] = useState("");
  const [cEmail, setCEmail] = useState("");
  const [cMsg, setCMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [hp, setHp] = useState(""); // honeypot
  // Inline messages replaced by toasts

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        setLoading(true);
        let loaded = false;
        if (isSupabaseConfigured) {
          const { data, error } = await supabase
            .from("listings")
            .select("id, title, category, price_per_day, location_name, location_lat, location_lon, image_url, tags, phone")
            .eq("id", id)
            .maybeSingle();
          if (!error && data) {
            const row: { phone?: string | null } = data as { phone?: string | null };
            setListing({
              id: data.id,
              title: data.title,
              category: data.category,
              pricePerDay: Number(data.price_per_day) || 0,
              location: {
                name: data.location_name ?? undefined,
                lat: typeof data.location_lat === "number" ? data.location_lat : undefined,
                lon: typeof data.location_lon === "number" ? data.location_lon : undefined,
              },
              image: data.image_url ?? undefined,
              tags: data.tags ?? undefined,
              phone: row.phone ?? null,
            });
            loaded = true;
          }
        }
        if (!loaded) {
          const res = await fetch("/listings.json", { cache: "no-store" });
          const arr = (await res.json()) as Listing[];
          const found = arr.find((l) => l.id === id) || null;
          setListing(found);
        }
      } catch {
        setListing(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">Chargement…</div>
    );
  }

  if (!listing) {
    return (
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-2xl font-semibold text-gray-900">Annonce introuvable</h1>
        <p className="mt-2 text-gray-600">L’annonce n’existe pas ou a été supprimée.</p>
        <Link href="/recherche" className="mt-6 inline-flex items-center justify-center rounded-md bg-teal-600 px-4 py-2 text-white shadow hover:bg-teal-700 transition">
          Retour à la recherche
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
      <nav className="text-sm text-gray-600"><Link href="/">Accueil</Link> / <Link href="/recherche">Recherche</Link> / <span className="text-gray-900">{listing.title}</span></nav>
      <h1 className="mt-3 text-3xl font-bold text-gray-900">{listing.title}</h1>
      <p className="mt-1 text-gray-600">Catégorie: {listing.category}</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="relative aspect-video overflow-hidden rounded-lg bg-gradient-to-br from-teal-50 to-violet-50">
          {listing.image ? (
            <Image src={listing.image} alt={listing.title} fill className="object-cover" sizes="(min-width: 1024px) 50vw, 100vw" />
          ) : (
            <Image src="/logo.png" alt={listing.title} fill className="object-contain p-6" sizes="(min-width: 1024px) 50vw, 100vw" />
          )}
        </div>
        <div>
          <p className="text-xl font-semibold text-gray-900">{listing.pricePerDay}€ / jour</p>
          {listing.location?.name && (
            <p className="mt-1 text-sm text-gray-600">Lieu: {listing.location.name}</p>
          )}
          {listing.phone && (
            <p className="mt-1 text-sm text-gray-600">Téléphone: <span className="font-medium text-gray-900">{listing.phone}</span></p>
          )}
          {listing.tags && listing.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              {listing.tags.map((t) => (
                <span key={t} className="rounded bg-violet-50 px-2 py-1 text-violet-700 border border-violet-100">{t}</span>
              ))}
            </div>
          )}
          <div className="mt-6 flex gap-2">
            <Link href={`/contact?subject=${encodeURIComponent("Demande d’information • " + listing.title)}&name=&email=`}
              className="inline-flex items-center justify-center rounded-md border border-teal-200 bg-white px-4 py-2 text-teal-700 hover:bg-teal-50 transition">
              Contacter
            </Link>
            <Link href="/recherche" className="inline-flex items-center justify-center rounded-md bg-teal-600 px-4 py-2 text-white shadow hover:bg-teal-700 transition">
              Retour à la recherche
            </Link>
          </div>
        </div>
      </div>

      {/* Contact form */}
      <section aria-labelledby="contact-title" className="mt-10">
        <h2 id="contact-title" className="text-xl font-semibold text-gray-900">Contacter le propriétaire</h2>
        <p className="mt-1 text-gray-600">Envoyez un message au propriétaire propos de cette annonce.</p>

        <form
          className="mt-4 grid gap-4 sm:grid-cols-2"
          onSubmit={async (e) => {
            e.preventDefault();
            // Client-side validation to avoid 400 when possible
            const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!cName || !cEmail || !cMsg) {
              show("error", "Veuillez renseigner nom, e‑mail et message.");
              return;
            }
            if (cName.trim().length < 2) {
              show("error", "Votre nom doit contenir au moins 2 caractères.");
              return;
            }
            if (!emailRe.test(cEmail.trim())) {
              show("error", "Adresse e‑mail invalide.");
              return;
            }
            if (cMsg.trim().length < 10) {
              show("error", "Votre message doit contenir au moins 10 caractères.");
              return;
            }
            try {
              setBusy(true);
              const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ listingId: listing.id, name: cName, email: cEmail, message: cMsg, honeypot: hp }),
              });
              const data = await res.json();
              if (!res.ok || data?.ok !== true) {
                const code = data?.error as string | undefined;
                const map: Record<string, string> = {
                  missing_fields: "Veuillez remplir tous les champs.",
                  invalid_email: "Adresse e‑mail invalide.",
                  invalid_name_length: "Votre nom doit contenir entre 2 et 100 caractères.",
                  invalid_email_length: "Votre e‑mail semble invalide.",
                  invalid_message_length: "Votre message doit contenir entre 10 et 2000 caractères.",
                  duplicate_recent: "Vous avez déjà envoyé un message récemment. Réessayez dans quelques minutes.",
                  server_error: "Le serveur ne peut pas traiter la demande pour le moment.",
                };
                const msg = (code && map[code]) || "Envoi impossible";
                throw new Error(msg);
              }
              show("success", "Message envoyé au propriétaire");
              setCMsg("");
            } catch (err) {
              show("error", err instanceof Error ? err.message : "Erreur inconnue");
            } finally {
              setBusy(false);
            }
          }}
        >
          {/* Honeypot anti-spam field (visually hidden) */}
          <div className="hidden" aria-hidden>
            <label>Votre site web</label>
            <input type="text" tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} />
          </div>
          <div className="sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700">Nom</label>
            <input
              type="text"
              value={cName}
              onChange={(e) => setCName(e.target.value)}
              autoComplete="name"
              className="mt-1 w-full rounded-md border border-black/10 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 placeholder:text-gray-400"
              placeholder="Votre nom"
            />
          </div>
          <div className="sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={cEmail}
              onChange={(e) => setCEmail(e.target.value)}
              autoComplete="email"
              className="mt-1 w-full rounded-md border border-black/10 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 placeholder:text-gray-400"
              placeholder="vous@exemple.com"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Message</label>
            <textarea
              rows={5}
              value={cMsg}
              onChange={(e) => setCMsg(e.target.value)}
              className="mt-1 w-full rounded-md border border-black/10 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 placeholder:text-gray-400"
              placeholder="Bonjour, je suis intéressé par votre annonce..."
            />
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center justify-center rounded-md bg-teal-600 px-5 py-3 text-white shadow hover:bg-teal-700 transition disabled:opacity-60"
            >
              {busy ? "Envoi…" : "Envoyer le message"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
