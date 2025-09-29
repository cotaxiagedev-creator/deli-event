"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
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
  createdAt?: string; // ISO string
};

type ListingWithDistance = Listing & { _distance: number };

function SearchPage() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [date, setDate] = useState(""); // conservé pour futur usage, non affiché
  const [cat, setCat] = useState("");
  const [radius, setRadius] = useState(10); // km
  const [sortBy, setSortBy] = useState<"recent" | "price_asc" | "price_desc">("recent");
  const [withPhoto, setWithPhoto] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<Array<{ display_name: string; lat: string; lon: string }>>([]);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<{ name: string; lat: number; lon: number } | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [submittedMsg, setSubmittedMsg] = useState<string | null>(null);
  const [step, setStep] = useState<number>(1);
  const hasLocation = Boolean(selectedPlace?.name || query);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedMsg(
      `Recherche appliquée — Lieu: ${selectedPlace?.name || query || "-"} • Rayon: ${radius} km • Catégorie: ${cat || "Toutes"}`
    );
    setStep(3);
    // Save recent search (keep max 5)
    try {
      const now = Date.now();
      const item = {
        q: selectedPlace?.name || query || "",
        cat,
        date: date || "",
        radius,
        at: now,
      };
      type RecentSearch = { q: string; cat?: string; date?: string; radius?: number; at?: number };
      const raw = typeof window !== "undefined" ? localStorage.getItem("recent_searches") : null;
      const arr: RecentSearch[] = raw ? JSON.parse(raw) as RecentSearch[] : [];
      const filtered = arr.filter((x) => !(x.q === item.q && x.cat === item.cat && x.radius === item.radius));
      const nextArr = [item, ...filtered].slice(0, 5);
      if (typeof window !== "undefined") localStorage.setItem("recent_searches", JSON.stringify(nextArr));
      // Save recent location separately
      if (item.q) {
        const rawLoc = typeof window !== "undefined" ? localStorage.getItem("recent_locations") : null;
        const locs = rawLoc ? (JSON.parse(rawLoc) as string[]) : [];
        const nextLocs = [item.q, ...locs.filter((l) => l !== item.q)].slice(0, 5);
        if (typeof window !== "undefined") localStorage.setItem("recent_locations", JSON.stringify(nextLocs));
      }
    } catch {}
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
          const polite = "contact@deliv-event.fr"; // per Nominatim usage policy (optional)
          const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&addressdetails=1&limit=5&email=${encodeURIComponent(polite)}`;
          const res = await fetch(url, {
            signal: controller.signal,
            headers: {
              // Nominatim etiquette: include a descriptive header
              "Accept": "application/json",
              "Accept-Language": typeof navigator !== "undefined" ? navigator.language : "fr-FR",
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

  // Clear UI suggestions when switching steps to avoid visual overlap
  useEffect(() => {
    setSuggestions([]);
  }, [step]);

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
            .select("id, title, category, price_per_day, location_name, location_lat, location_lon, image_url, tags, created_at")
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
              created_at?: string | null;
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
              createdAt: row.created_at ?? undefined,
            }));
            setListings(mapped);
            loaded = true;
          }
        }
        if (!loaded) {
          const res = await fetch("/listings.json", { cache: "no-store" });
          const data: Listing[] = await res.json();
          setListings(
            data.map((d) => ({
              ...d,
              createdAt: d.createdAt || new Date().toISOString(),
            }))
          );
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
    let base: Array<Listing | ListingWithDistance> = arr;
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

      const inRadius = withDist.filter((l) => l._distance <= radius);
      base = [...inRadius, ...withoutCoords];
    }

    // Only listings with an image when requested
    if (withPhoto) {
      base = base.filter((l) => Boolean((l as Listing).image));
    }

    // Sorting
    const sorted = [...base];
    if (sortBy === "recent") {
      sorted.sort((a, b) => {
        const ca = (a as Listing).createdAt ?? "";
        const cb = (b as Listing).createdAt ?? "";
        return (cb > ca ? 1 : cb < ca ? -1 : 0);
      });
    } else if (sortBy === "price_asc") {
      sorted.sort((a, b) => (a.pricePerDay || 0) - (b.pricePerDay || 0));
    } else if (sortBy === "price_desc") {
      sorted.sort((a, b) => (b.pricePerDay || 0) - (a.pricePerDay || 0));
    }
    return sorted;
  }, [listings, cat, selectedPlace, radius, sortBy, withPhoto]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-gray-900">Recherche</h1>
      <p className="mt-2 text-gray-600">
        Recherchez par lieu. La V1 utilise des données de démonstration (sans paiement, sans authentification).
      </p>

      {/* Single linear progress used as step indicator */}

      {/* Suggestions contextuelles par étape */}
      <RecentBlocks
        step={step}
        onApplyCategory={(c) => setCat(c)}
        onApplyLocation={(name) => {
          setQuery(name);
          setSelectedPlace({ name, lat: 0, lon: 0 });
        }}
        onApplySearch={(s) => {
          setQuery(s.q);
          setCat(s.cat || "");
          setDate(s.date || "");
          setRadius(s.radius || 10);
          setSubmittedMsg(`Recherche rejouée — Lieu: ${s.q || "-"} • Rayon: ${s.radius} km • Date: ${s.date || "-"} • Catégorie: ${s.cat || "Toutes"}`);
        }}
      />

      {submittedMsg && (
        <div className="mt-4 rounded-md border border-teal-200 bg-teal-50 p-3 text-sm text-teal-800">
          {submittedMsg}
        </div>
      )}

      {/* Wizard container (steps 1 and 2 only) */}
      {step !== 3 && (
      <div className="mt-6 rounded-xl border border-black/10 bg-white p-6 shadow-sm">
      {/* Linear progress */}
      <div className="h-2 w-full rounded bg-gray-100 overflow-hidden">
        <div
          className="h-2 bg-teal-600 transition-all"
          style={{ width: `${(step/3)*100}%` }}
        />
      </div>
      <form onSubmit={onSubmit} className="mt-6 grid gap-4 sm:grid-cols-6 items-start">
        {step === 1 && (<div className="sm:col-span-6 -mb-2 text-sm text-gray-600">Étape 1 • Choisissez un lieu et réglez le rayon</div>)}
        <div className={`sm:col-span-3 ${step===1?"":"hidden"}`}>
          <label className="block text-sm font-medium text-gray-700">Lieu</label>
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ville ou adresse"
              className="mt-1 w-full rounded-md border border-black/10 bg-white px-3 py-2 pr-10 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 placeholder:text-gray-400"
              role="combobox"
              aria-controls="loc-suggest"
              aria-expanded={suggestions.length > 0}
            />
            {query && (
              <button
                type="button"
                aria-label="Effacer le lieu"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-500 hover:text-gray-700"
                onClick={() => {
                  setQuery("");
                  setSuggestions([]);
                  setSelectedPlace(null);
                }}
              >
                ✕
              </button>
            )}
          </div>
          {/* Suggestions dropdown */}
          {suggestions.length > 0 && (
            <ul id="loc-suggest" role="listbox" className="mt-1 max-h-56 overflow-auto rounded-md border border-black/10 bg-white shadow">
              {suggestions.map((s) => (
                <li
                  key={`${s.lat}-${s.lon}`}
                  className="cursor-pointer px-3 py-2 text-sm text-gray-700 hover:bg-teal-50"
                  role="option"
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
            <p className="mt-1 text-xs text-gray-500">Lieu sélectionné: {selectedPlace.name}</p>
          )}
          {step === 1 && !hasLocation && (
            <p className="mt-1 text-xs text-amber-700">Veuillez saisir un lieu ou choisir une suggestion avant de continuer.</p>
          )}
        </div>
        {/* Rayon en étape 1 */}
        <div className={`sm:col-span-1 ${step===1?"":"hidden"}`}>
          <label className="block text-sm font-medium text-gray-700">Rayon (km)</label>
          <input
            type="number"
            min={1}
            max={100}
            value={radius}
            onChange={(e) => setRadius(parseInt(e.target.value || "10", 10))}
            className="mt-1 w-full rounded-md border border-black/10 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 placeholder:text-gray-400"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {[5,10,25,50].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRadius(r)}
                className={`inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm border ${radius===r?"bg-teal-600 text-white border-teal-600":"bg-white text-gray-700 border-black/10 hover:bg-gray-50"}`}
              >
                {r} km
              </button>
            ))}
          </div>
        </div>

        {/* Étape 2: Catégorie (boutons) */}
        {step === 2 && (
          <div className="sm:col-span-6 -mb-2 text-sm text-gray-600">Étape 2 • Sélectionnez une catégorie</div>
        )}
        <div className={`sm:col-span-6 ${step===2?"":"hidden"}`}>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => { setCat(""); }}
              className={`inline-flex items-center justify-center rounded-md px-3 py-2 text-sm border ${cat===""?"bg-teal-600 text-white border-teal-600":"bg-white text-gray-700 border-black/10 hover:bg-gray-50"}`}
            >
              Toutes
            </button>
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => { setCat(c); }}
                className={`inline-flex items-center justify-center rounded-md px-3 py-2 text-sm border ${cat===c?"bg-teal-600 text-white border-teal-600":"bg-white text-gray-700 border-black/10 hover:bg-gray-50"}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        {/* Navigation bar: Reset (left), Prev (center), Next (right) */}
        <div className="sm:col-span-6 grid grid-cols-3 items-center gap-3 mt-2">
          <div className="justify-self-start">
            <button
              type="button"
              onClick={() => {
                setCat("");
                setSelectedPlace(null);
                setQuery("");
                setSuggestions([]);
                setDate("");
                setRadius(10);
                setSortBy("recent");
                setWithPhoto(false);
                setSubmittedMsg(null);
                setStep(1);
              }}
              className="inline-flex items-center justify-center rounded-md border border-black/10 bg-white px-4 py-3 text-gray-700 hover:bg-gray-50 transition"
            >
              Réinitialiser
            </button>
          </div>
          <div className="justify-self-center">
            {step > 1 && (
              <button type="button" onClick={() => setStep(step - 1)} className="inline-flex items-center justify-center rounded-md border border-black/10 bg-white px-4 py-3 text-gray-700 hover:bg-gray-50 transition">
                Précédent
              </button>
            )}
          </div>
          <div className="justify-self-end">
            <button
              type="button"
              onClick={() => setStep(Math.min(3, step + 1))}
              disabled={(step===1 && !hasLocation) || step===3}
              className="inline-flex items-center justify-center rounded-md bg-teal-600 px-5 py-3 text-white shadow hover:bg-teal-700 transition disabled:opacity-60"
            >
              Suivant
            </button>
          </div>
        </div>
      </form>
      </div>
      )}

      {step === 3 && (
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-gray-900">Résultats (démo)</h2>
        {/* Résumé des critères */}
        <div className="mt-3 rounded-md border border-black/10 bg-white p-3 text-sm text-gray-700">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded bg-teal-50 px-2 py-1 text-teal-700 border border-black/10">Lieu: {selectedPlace?.name || query || "-"}</span>
            <span className="rounded bg-teal-50 px-2 py-1 text-teal-700 border border-black/10">Rayon: {radius} km</span>
            <span className="rounded bg-teal-50 px-2 py-1 text-teal-700 border border-black/10">Catégorie: {cat || "Toutes"}</span>
            <button type="button" onClick={() => setStep(1)} className="ml-2 inline-flex items-center justify-center rounded-md border border-black/10 bg-white px-2 py-1 text-gray-700 hover:bg-gray-50">Modifier lieu/rayon</button>
            <button type="button" onClick={() => setStep(2)} className="inline-flex items-center justify-center rounded-md border border-black/10 bg-white px-2 py-1 text-gray-700 hover:bg-gray-50">Modifier catégorie</button>
          </div>
        </div>
        {/* Filtres résultats (Rayon, Plus récent, Avec photo) */}
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700">Rayon</label>
            <input
              type="number"
              min={1}
              max={100}
              value={radius}
              onChange={(e) => setRadius(parseInt(e.target.value || "10", 10))}
              className="w-20 rounded-md border border-black/10 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900"
            />
            <div className="flex items-center gap-2">
              {[5,10,25,50].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRadius(r)}
                  className={`inline-flex items-center justify-center rounded-md px-2.5 py-1 text-xs border ${radius===r?"bg-teal-600 text-white border-teal-600":"bg-white text-gray-700 border-black/10 hover:bg-gray-50"}`}
                >
                  {r} km
                </button>
              ))}
            </div>
          </div>
          <div className="text-sm text-gray-700">Tri: Plus récent</div>
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={withPhoto}
              onChange={(e) => setWithPhoto(e.target.checked)}
              className="h-4 w-4 rounded border-black/20 text-teal-600 focus:ring-teal-500"
            />
            Avec photo
          </label>
          <span className="text-sm text-gray-500">{filtered.length} annonce(s)</span>
        </div>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loadingListings && (
            <>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-black/10 bg-white p-5">
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
          {!loadingListings && filtered.length > 0 && filtered.map((l) => (
            <div key={l.id} className="rounded-xl border border-black/10 bg-white p-5 hover:shadow-card transition">
              <div className="relative aspect-video overflow-hidden rounded-lg bg-gray-50">
                {l.image ? (
                  <Image
                    src={l.image}
                    alt={l.title}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover"
                    priority={false}
                  />
                ) : (
                  <Image
                    src="/logo.png"
                    alt={l.title}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-contain p-6"
                    priority={false}
                  />
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
                <span className="rounded bg-teal-50 px-2 py-1 text-teal-700 border border-black/10">{l.category}</span>
                {l.tags?.slice(0, 2).map((t: string) => (
                  <span key={t} className="rounded bg-violet-50 px-2 py-1 text-violet-700 border border-black/10">{t}</span>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <Link
                  href={`/annonce/${l.id}`}
                  className="inline-flex items-center justify-center rounded-md bg-teal-600 px-3 py-2 text-white shadow hover:bg-teal-700 transition text-sm"
                >
                  Voir
                </Link>
                <a
                  href={`/contact?subject=${encodeURIComponent("Demande d’information • " + l.title)}&name=&email=`}
                  className="inline-flex items-center justify-center rounded-md border border-black/10 bg-white px-3 py-2 text-gray-700 hover:bg-gray-50 transition text-sm"
                >
                  Contacter
                </a>
              </div>
            </div>
          ))}
          {!loadingListings && filtered.length === 0 && (
            <div className="sm:col-span-2 lg:col-span-3">
              <div className="rounded-xl border border-dashed border-black/10 bg-white p-8 text-center">
                <p className="text-gray-700 font-medium">Aucune annonce trouvée</p>
                <p className="text-sm text-gray-500 mt-1">Essayez d’élargir le rayon, de changer de lieu, ou de réinitialiser les filtres.</p>
                <button
                  onClick={() => {
                    setCat("");
                    setSelectedPlace(null);
                    setQuery("");
                    setSuggestions([]);
                  }}
                  className="mt-4 inline-flex items-center justify-center rounded-md bg-teal-600 px-4 py-2 text-white shadow hover:bg-teal-700 transition"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
      )}
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

function RecentBlocks({
  step,
  onApplyCategory,
  onApplyLocation,
  onApplySearch,
}: {
  step: number;
  onApplyCategory: (c: string) => void;
  onApplyLocation: (name: string) => void;
  onApplySearch: (s: { q: string; cat?: string; date?: string; radius?: number }) => void;
}) {
  const [recentSearches, setRecentSearches] = useState<Array<{ q: string; cat?: string; date?: string; radius?: number; at?: number }>>([]);
  const [recentLocations, setRecentLocations] = useState<string[]>([]);

  useEffect(() => {
    try {
      const rs = typeof window !== "undefined" ? localStorage.getItem("recent_searches") : null;
      const rl = typeof window !== "undefined" ? localStorage.getItem("recent_locations") : null;
      if (rs) setRecentSearches(JSON.parse(rs));
      if (rl) setRecentLocations(JSON.parse(rl));
    } catch {}
  }, []);

  return (
    <div className="mt-6 grid gap-4">
      {/* Recent locations (only step 1) */}
      {step === 1 && recentLocations.length > 0 && (
        <div>
          <p className="text-sm text-gray-600">Lieux récents</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {recentLocations.map((name) => (
              <button
                key={name}
                onClick={() => onApplyLocation(name)}
                className="inline-flex items-center justify-center rounded-md border border-black/10 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recent searches (only step 1) */}
      {step === 1 && recentSearches.length > 0 && (
        <div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">Recherches récentes</p>
            <button
              className="text-xs text-gray-500 hover:text-gray-700"
              onClick={() => {
                try { if (typeof window !== "undefined") localStorage.removeItem("recent_searches"); } catch {}
                setRecentSearches([]);
              }}
            >
              Effacer
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {recentSearches.map((s, i) => (
              <button
                key={i}
                onClick={() => onApplySearch(s)}
                className="inline-flex items-center justify-center rounded-md border border-black/10 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                title={`Lieu: ${s.q || '-'} • Cat: ${s.cat || 'Toutes'} • Rayon: ${s.radius || 10}km`}
              >
                {s.q || "(Lieu)"} • {s.cat || "Toutes"}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
