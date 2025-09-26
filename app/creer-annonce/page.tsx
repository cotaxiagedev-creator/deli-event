"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

const categories = [
  "Mobilier",
  "Photobooth",
  "Sonorisation",
  "Lumière",
  "Cuisine",
  "Extérieur",
];

export default function CreateListingPage() {
  const [title, setTitle] = useState("");
  const [cat, setCat] = useState("");
  const [price, setPrice] = useState("");
  const [desc, setDesc] = useState("");
  const [location, setLocation] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{ display_name: string; lat: string; lon: string }>>([]);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const [locLat, setLocLat] = useState<number | null>(null);
  const [locLon, setLocLon] = useState<number | null>(null);

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
          const res = await fetch(url, { signal: controller.signal, headers: { Accept: "application/json" } });
          if (!res.ok) throw new Error("Nominatim error");
          const data = (await res.json()) as Array<{ display_name: string; lat: string; lon: string }>;
          setSuggestions(data);
        } catch {
          // ignore
        } finally {
          setLoadingSuggest(false);
        }
      }, 350),
    []
  );

  const onSelectSuggestion = (s: { display_name: string; lat: string; lon: string }) => {
    setLocation(s.display_name);
    setSuggestions([]);
    setLocLat(parseFloat(s.lat));
    setLocLon(parseFloat(s.lon));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    if (!title || !cat || !price || !location) {
      setError("Veuillez remplir les champs obligatoires (Titre, Catégorie, Prix, Localisation).");
      return;
    }
    const priceNum = Number(price);
    if (Number.isNaN(priceNum) || priceNum <= 0) {
      setError("Prix invalide. Entrez un nombre supérieur à 0.");
      return;
    }

    if (!isSupabaseConfigured) {
      setError("Supabase n'est pas configuré (variables manquantes).");
      return;
    }

    try {
      setLoading(true);
      // Prefer coordinates from a picked suggestion; fallback to geocoding the free text
      let lat: number | null = locLat;
      let lon: number | null = locLon;
      if ((lat === null || lon === null) && location && location.length >= 2) {
        try {
          const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`;
          const res = await fetch(url, { headers: { Accept: "application/json" } });
          if (res.ok) {
            const data = (await res.json()) as Array<{ lat: string; lon: string }>;
            if (data[0]) {
              lat = parseFloat(data[0].lat);
              lon = parseFloat(data[0].lon);
            }
          }
        } catch {
          // ignore geocoding errors
        }
      }
      const { error: insertError } = await supabase.from("listings").insert({
        title,
        category: cat,
        price_per_day: priceNum,
        location_name: location,
        location_lat: lat,
        location_lon: lon,
        image_url: imageUrl || null,
        tags: desc ? ["description"] : [],
      });
      if (insertError) throw insertError;

      setMessage("Annonce publiée avec succès.");
      setTitle("");
      setCat("");
      setPrice("");
      setDesc("");
      setLocation("");
      setImageUrl("");
      setLocLat(null);
      setLocLon(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur lors de la publication";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-gray-900">Déposer une annonce</h1>
      <p className="mt-2 text-gray-600">Version 1 (MVP): informations essentielles, sans paiement et sans authentification.</p>

      {error && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}
      {message && (
        <div className="mt-4 rounded-md border border-teal-200 bg-teal-50 p-3 text-sm text-teal-800">{message}</div>
      )}

      <form onSubmit={onSubmit} className="mt-6 grid gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Titre *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Photobooth rétro"
            className="mt-1 w-full rounded-md border border-black/10 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Catégorie *</label>
            <select
              value={cat}
              onChange={(e) => setCat(e.target.value)}
              className="mt-1 w-full rounded-md border border-black/10 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Sélectionner</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Prix / jour (€) *</label>
            <input
              type="number"
              min="1"
              step="1"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Ex: 50"
              className="mt-1 w-full rounded-md border border-black/10 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Localisation *</label>
          <div className="relative">
            <input
              type="text"
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
                setLocLat(null);
                setLocLon(null);
                fetchSuggestions(e.target.value);
              }}
              placeholder="Ville, code postal"
              className="mt-1 w-full rounded-md border border-black/10 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              aria-autocomplete="list"
              aria-expanded={suggestions.length > 0}
              aria-controls="loc-suggest"
            />
            {loadingSuggest && (
              <div className="absolute right-3 top-3 h-4 w-4 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
            )}
            {suggestions.length > 0 && (
              <ul
                id="loc-suggest"
                className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md border border-black/10 bg-white shadow"
                role="listbox"
              >
                {suggestions.map((s) => (
                  <li
                    key={`${s.display_name}-${s.lat}-${s.lon}`}
                    role="option"
                    className="cursor-pointer px-3 py-2 hover:bg-teal-50"
                    onClick={() => onSelectSuggestion(s)}
                  >
                    {s.display_name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Image (URL)</label>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://…"
            className="mt-1 w-full rounded-md border border-black/10 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={5}
            placeholder="Décrivez le matériel, les conditions de location, la zone couverte, etc."
            className="mt-1 w-full rounded-md border border-black/10 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="inline-flex items-center justify-center rounded-md bg-teal-600 px-5 py-3 text-white shadow hover:bg-teal-700 transition disabled:opacity-60">
            {loading ? "Publication…" : "Publier"}
          </button>
          <Link href="/" className="inline-flex items-center justify-center rounded-md border border-black/10 bg-white px-5 py-3 text-gray-700 hover:bg-gray-50 transition">
            Annuler
          </Link>
        </div>
      </form>
    </div>
  );
}
