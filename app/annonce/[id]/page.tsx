"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type Listing = {
  id: string;
  title: string;
  category: string;
  pricePerDay: number;
  location?: { name?: string; lat?: number; lon?: number };
  image?: string | null;
  tags?: string[] | null;
  description?: string | null;
};

export default function ListingDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string | undefined;
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        setLoading(true);
        let loaded = false;
        if (isSupabaseConfigured) {
          const { data, error } = await supabase
            .from("listings")
            .select("id, title, category, price_per_day, location_name, location_lat, location_lon, image_url, tags")
            .eq("id", id)
            .maybeSingle();
          if (!error && data) {
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
    </div>
  );
}
