"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

const categories = [
  "Mobilier",
  "Photobooth",
  "Sonorisation",
  "Lumière",
  "Cuisine",
  "Extérieur",
];

type Listing = {
  id: string;
  title: string;
  category: string;
  pricePerDay: number;
  location: { name: string; lat: number; lon: number };
  image?: string;
  tags?: string[];
};

type ListingWithDistance = Listing & { _distance: number };

function SearchPage() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [date, setDate] = useState("");
  const [cat, setCat] = useState("");
  const [radius, setRadius] = useState(10); // km
  const [suggestions, setSuggestions] = useState<Array<{ display_name: string; lat: string; lon: string }>>([]);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<{ name: string; lat: number; lon: number } | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [submittedMsg, setSubmittedMsg] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedMsg(
      `Recherche appliquée — Lieu: ${selectedPlace?.name || query || "-"} • Rayon: ${radius} km • Date: ${date || "-"} • Catégorie: ${cat || "Toutes"}`
    );
  };

  // Debounce helper specialized for our query string use-case
  const debounce = (fn: (q: string) => unknown, delay = 300) => {
    let t: ReturnType<typeof setTimeout>;
    return (q: string) => {
      clearTimeout(t);
      t = setTimeout(() => fn(q), delay);
    };
  };

  const fetchSuggestions = useMemo(
    () =>
      debounce(async (q: string) => {
        if (!q || q.length < 2) {
          setSuggestions([]);
          return;
        }
        try {
          setLoadingSuggest(true);
          abortRef.current?.abort();
          const controller = new AbortController();
          abortRef.current = controller;
          const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&addressdetails=1&limit=5`;
          const res = await fetch(url, {
            signal: controller.signal,
            headers: {
              // Nominatim etiquette: include a descriptive header
              "Accept": "application/json",
            },
          });
          if (!res.ok) throw new Error("Nominatim error");
          const data = (await res.json()) as Array<{ display_name: string; lat: string; lon: string }>;
          setSuggestions(
            data.map((d) => ({ display_name: d.display_name, lat: d.lat, lon: d.lon }))
          );
        } catch {
          // ignore abort errors
        } finally {
          setLoadingSuggest(false);
        }
      }, 350),
    []
  );

  useEffect(() => {
    setSelectedPlace(null);
    fetchSuggestions(query);
  }, [query, fetchSuggestions]);

  const handleSelectSuggestion = (s: { display_name: string; lat: string; lon: string }) => {
    setSelectedPlace({ name: s.display_name, lat: parseFloat(s.lat), lon: parseFloat(s.lon) });
    setQuery(s.display_name);
    setSuggestions([]);
  };

  // Charger les annonces mock depuis /public/listings.json
  useEffect(() => {
    const load = async () => {
      try {
        setLoadingListings(true);
        let loaded = false;
        if (isSupabaseConfigured) {
          const { data, error } = await supabase
            .from("listings")
            .select("id, title, category, price_per_day, location_name, location_lat, location_lon, image_url, tags")
            .order("created_at", { ascending: false })
            .limit(50);
          if (!error && data && data.length > 0) {
            type ListingRow = {
              id: string;
              title: string;
              category: string;
              price_per_day: number | string;
              location_name: string | null;
              location_lat: number | null;
              location_lon: number | null;
              image_url: string | null;
              tags: string[] | null;
            };
            const rows = (data as unknown as ListingRow[]) || [];
            const mapped: Listing[] = rows.map((row) => ({
              id: row.id,
              title: row.title,
              category: row.category,
              pricePerDay: Number(row.price_per_day) || 0,
              location: {
                name: row.location_name ?? "",
                lat: typeof row.location_lat === "number" ? row.location_lat : 0,
                lon: typeof row.location_lon === "number" ? row.location_lon : 0,
              },
              image: row.image_url ?? undefined,
              tags: Array.isArray(row.tags) ? row.tags : undefined,
            }));
            setListings(mapped);
            loaded = true;
          }
        }
        if (!loaded) {
          const res = await fetch("/listings.json", { cache: "no-store" });
          const data: Listing[] = await res.json();
          setListings(data);
        }
      } catch {
        // noop
      } finally {
        setLoadingListings(false);
      }
    };
    load();
  }, []);

  // Pré-sélection catégorie depuis l'URL ?categorie=
  useEffect(() => {
    const c = searchParams.get("categorie");
    if (c && categories.includes(c)) setCat(c);
  }, [searchParams]);

  // Calcul distance Haversine en km
  const distKm = (a: { lat: number; lon: number }, b: { lat: number; lon: number }): number => {
    const R = 6371;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLon = ((b.lon - a.lon) * Math.PI) / 180;
    const lat1 = (a.lat * Math.PI) / 180;
    const lat2 = (b.lat * Math.PI) / 180;
    const sinDLat = Math.sin(dLat / 2);
    const sinDLon = Math.sin(dLon / 2);
    const x = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
    const c2 = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
    return R * c2;
  };

  const filtered: Array<Listing | ListingWithDistance> = useMemo(() => {
    let arr: Listing[] = listings;
    if (cat) arr = arr.filter((l) => l.category === cat);
    if (selectedPlace) {
      const withCoords = arr.filter((l) =>
        Number.isFinite(l.location?.lat) &&
        Number.isFinite(l.location?.lon) &&
        (l.location.lat !== 0 || l.location.lon !== 0)
      );
      const withoutCoords = arr.filter((l) => !withCoords.includes(l));

      const withDist: ListingWithDistance[] = withCoords.map((l) => ({
        ...l,
        _distance: distKm(
          { lat: selectedPlace.lat, lon: selectedPlace.lon },
          { lat: l.location.lat, lon: l.location.lon }
        ),
      }));

      const inRadius = withDist
        .filter((l) => l._distance <= radius)
        .sort((a, b) => a._distance - b._distance);

      // Concat: d'abord résultats triés avec distance, puis ceux sans coordonnées
      return [...inRadius, ...withoutCoords];
    }
    return arr;
  }, [listings, cat, selectedPlace, radius]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-gray-900">Recherche</h1>
      <p className="mt-2 text-gray-600">
        Recherchez par lieu et date. La V1 utilise des données de démonstration (sans
        paiement, sans authentification).
      </p>

      {submittedMsg && (
        <div className="mt-4 rounded-md border border-teal-200 bg-teal-50 p-3 text-sm text-teal-800">
          {submittedMsg}
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-8 grid gap-4 sm:grid-cols-6 items-start">
        <div className="sm:col-span-3">
          <label className="block text-sm font-medium text-gray-700">Lieu</label>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ville ou adresse"
            className="mt-1 w-full rounded-md border border-black/10 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          {/* Suggestions dropdown */}
          {suggestions.length > 0 && (
            <ul className="mt-1 max-h-56 overflow-auto rounded-md border border-black/10 bg-white shadow">
              {suggestions.map((s) => (
                <li
                  key={`${s.lat}-${s.lon}`}
                  className="cursor-pointer px-3 py-2 text-sm text-gray-700 hover:bg-teal-50"
                  onClick={() => handleSelectSuggestion(s)}
                >
                  {s.display_name}
                </li>
              ))}
              {loadingSuggest && (
                <li className="px-3 py-2 text-xs text-gray-500">Chargement…</li>
              )}
            </ul>
          )}
          {selectedPlace && (
            <p className="mt-1 text-xs text-gray-500">Sélectionné: {selectedPlace.name}</p>
          )}
        </div>
        <div className="sm:col-span-1">
          <label className="block text-sm font-medium text-gray-700">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 w-full rounded-md border border-black/10 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <div className="sm:col-span-1">
          <label className="block text-sm font-medium text-gray-700">Catégorie</label>
          <select
            value={cat}
            onChange={(e) => setCat(e.target.value)}
            className="mt-1 w-full rounded-md border border-black/10 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">Toutes</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-1">
          <label className="block text-sm font-medium text-gray-700">Rayon (km)</label>
          <input
            type="number"
            min={1}
            max={100}
            value={radius}
            onChange={(e) => setRadius(parseInt(e.target.value || "10", 10))}
            className="mt-1 w-full rounded-md border border-black/10 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <div className="sm:col-span-6">
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-md bg-teal-600 px-5 py-3 text-white shadow hover:bg-teal-700 transition"
          >
            Rechercher
          </button>
        </div>
      </form>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-gray-900">Résultats (démo)</h2>
        <p className="mt-2 text-gray-600">{filtered.length} annonce(s) trouvée(s).</p>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loadingListings && (
            <>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-black/5 bg-white p-5">
                  <div className="aspect-video overflow-hidden rounded-lg bg-gray-100 animate-pulse" />
                  <div className="mt-3 h-4 w-2/3 bg-gray-100 animate-pulse rounded" />
                  <div className="mt-2 h-3 w-1/2 bg-gray-100 animate-pulse rounded" />
                  <div className="mt-3 flex gap-2">
                    <span className="h-6 w-16 bg-gray-100 animate-pulse rounded" />
                    <span className="h-6 w-12 bg-gray-100 animate-pulse rounded" />
                  </div>
                </div>
              ))}
            </>
          )}
          {!loadingListings && filtered.map((l) => (
            <div key={l.id} className="rounded-xl border border-black/5 bg-white p-5 hover:shadow-card transition">
              <div className="aspect-video overflow-hidden rounded-lg bg-gradient-to-br from-teal-50 to-violet-50">
                {l.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={l.image}
                    alt={l.title}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).onerror = null;
                      (e.currentTarget as HTMLImageElement).src = "/logo.png";
                    }}
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src="/logo.png" alt={l.title} className="h-full w-full object-contain p-6" />
                )}
              </div>
              <h3 className="mt-3 font-medium text-gray-900">{l.title}</h3>
              <p className="text-sm text-gray-600">
                À partir de {l.pricePerDay}€/jour
                {selectedPlace && (l as ListingWithDistance)._distance !== undefined && (
                  <> • {(l as ListingWithDistance)._distance.toFixed(1)} km</>
                )}
              </p>
              <p className="mt-1 text-xs text-gray-500">{l.location?.name}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded bg-teal-50 px-2 py-1 text-teal-700 border border-teal-100">{l.category}</span>
                {l.tags?.slice(0, 2).map((t: string) => (
                  <span key={t} className="rounded bg-violet-50 px-2 py-1 text-violet-700 border border-violet-100">{t}</span>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <a
                  href={`/contact?subject=${encodeURIComponent("Demande d’information • " + l.title)}&name=&email=`}
                  className="inline-flex items-center justify-center rounded-md border border-teal-200 bg-white px-3 py-2 text-teal-700 hover:bg-teal-50 transition text-sm"
                >
                  Contacter
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">Chargement…</div>}>
      <SearchPage />
    </Suspense>
  );
}
