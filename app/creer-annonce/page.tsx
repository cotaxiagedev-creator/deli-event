"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useToast } from "@/components/ToastProvider";

const categories = [
  "Mobilier",
  "Photobooth",
  "Sonorisation",
  "Lumière",
  "Cuisine",
  "Extérieur",
];

export default function CreateListingPage() {
  const { show } = useToast();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [cat, setCat] = useState("");
  const [price, setPrice] = useState("");
  const [desc, setDesc] = useState("");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [lastId, setLastId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{ display_name: string; lat: string; lon: string }>>([]);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const [locLat, setLocLat] = useState<number | null>(null);
  const [locLon, setLocLon] = useState<number | null>(null);

  useEffect(() => {
    const init = async () => {
      if (!isSupabaseConfigured) return;
      const { data } = await supabase.auth.getUser();
      setUserId(data?.user?.id ?? null);
      if (!data?.user?.id) {
        // Redirect to login with a return path to the create page
        router.push(`/login?next=${encodeURIComponent('/creer-annonce')}&msg=connect_required`);
      }
    };
    init();
  }, []);

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
      show("error", "Champs obligatoires manquants");
      return;
    }
    const priceNum = Number(price);
    if (Number.isNaN(priceNum) || priceNum <= 0) {
      setError("Prix invalide. Entrez un nombre supérieur à 0.");
      show("error", "Prix invalide");
      return;
    }

    if (!isSupabaseConfigured) {
      setError("Supabase n'est pas configuré (variables manquantes).");
      show("error", "Supabase non configuré");
      return;
    }
    if (!userId) {
      setError("Vous devez être connecté pour déposer une annonce.");
      show("error", "Connectez-vous pour déposer une annonce");
      router.push("/login");
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
      // Decide final image URL: upload file if provided, else use the typed URL
      let finalImageUrl: string | null = imageUrl || null;
      if (imageFile && isSupabaseConfigured) {
        try {
          const safeName = imageFile.name.replace(/[^a-zA-Z0-9._-]+/g, "-");
          const path = `listings/${Date.now()}-${safeName}`;
          const { error: upErr } = await supabase.storage.from("listings").upload(path, imageFile, {
            cacheControl: "3600",
            upsert: false,
            contentType: imageFile.type || "image/*",
          });
          if (upErr) throw upErr;
          const { data: pub } = supabase.storage.from("listings").getPublicUrl(path);
          if (pub?.publicUrl) finalImageUrl = pub.publicUrl;
        } catch (e) {
          // If upload fails, keep fallback to typed URL (or null)
          console.warn("Image upload failed, falling back to typed URL", e);
          show("error", "Échec de l'envoi de l'image, on garde l'URL saisie");
        }
      }

      // owner_id must be the logged-in user (userId is guaranteed here)
      const ownerId = userId;

      const { data: inserted, error: insertError } = await supabase.from("listings").insert({
        title,
        category: cat,
        price_per_day: priceNum,
        location_name: location,
        location_lat: lat,
        location_lon: lon,
        image_url: finalImageUrl,
        tags: desc ? ["description"] : [],
        owner_id: ownerId,
        phone: phone || null,
      }).select('id').single();
      if (insertError) throw insertError;

      setMessage("Annonce publiée avec succès.");
      show("success", "Annonce publiée avec succès");
      if (inserted?.id) setLastId(inserted.id);
      setTitle("");
      setCat("");
      setPrice("");
      setDesc("");
      setLocation("");
      setPhone("");
      setImageUrl("");
      setImageFile(null);
      setImagePreview(null);
      setLocLat(null);
      setLocLon(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur lors de la publication";
      setError(msg);
      show("error", msg || "Erreur lors de la publication");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-gray-900">Déposer une annonce</h1>
      <p className="mt-2 text-gray-600">Version 1 (MVP): informations essentielles, sans paiement et sans authentification.</p>

      {error && (
        <div
          className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          {error}
        </div>
      )}
      {message && (
        <div
          className="mt-4 rounded-md border border-teal-200 bg-teal-50 p-3 text-sm text-teal-800"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {message}
        </div>
      )}
      {message && lastId && (
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href={`/annonce/${lastId}`}
            className="inline-flex items-center justify-center rounded-md bg-teal-600 px-4 py-2 text-white shadow hover:bg-teal-700 transition"
          >
            Voir l’annonce
          </Link>
          <Link
            href="/recherche"
            className="inline-flex items-center justify-center rounded-md border border-black/10 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50 transition"
          >
            Aller à la recherche
          </Link>
        </div>
      )}

      {isSupabaseConfigured && !userId && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
          <p className="font-medium">Connexion requise</p>
          <p className="text-sm mt-1">Vous devez être connecté pour déposer une annonce.</p>
          <div className="mt-3 flex gap-2">
            <Link href="/login?next=/creer-annonce&msg=connect_required" className="inline-flex items-center justify-center rounded-md bg-teal-600 px-4 py-2 text-white shadow hover:bg-teal-700 transition text-sm">Se connecter</Link>
            <Link href="/" className="inline-flex items-center justify-center rounded-md border border-black/10 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50 transition text-sm">Retour à l’accueil</Link>
          </div>
        </div>
      )}
      {(!isSupabaseConfigured || !!userId) && (
      <div className="mt-6 rounded-xl border border-black/10 bg-white p-6 shadow-sm">
      <form onSubmit={onSubmit} className="grid gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Titre *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Photobooth rétro"
            className="mt-1 w-full rounded-md border border-black/10 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 placeholder:text-gray-400"
            autoComplete="off"
            name="title"
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Catégorie *</label>
            <select
              value={cat}
              onChange={(e) => setCat(e.target.value)}
              className="mt-1 w-full rounded-md border border-black/10 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900"
              name="category"
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
              className="mt-1 w-full rounded-md border border-black/10 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 placeholder:text-gray-400"
              inputMode="numeric"
              autoComplete="off"
              name="price"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Téléphone (optionnel)</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Ex: 06 12 34 56 78"
            className="mt-1 w-full rounded-md border border-black/10 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 placeholder:text-gray-400"
          />
          <p className="mt-1 text-xs text-gray-500">Affiché sur la fiche si renseigné.</p>
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
              className="mt-1 w-full rounded-md border border-black/10 bg-white px-3 py-2 pr-10 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 placeholder:text-gray-400"
              autoComplete="address-level2"
              aria-controls="loc-suggest"
              aria-expanded={suggestions.length > 0}
              role="combobox"
            />
            {location && (
              <button
                type="button"
                aria-label="Effacer la localisation"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-500 hover:text-gray-700"
                onClick={() => {
                  setLocation("");
                  setSuggestions([]);
                  setLocLat(null);
                  setLocLon(null);
                }}
              >
                ✕
              </button>
            )}
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
                    className="cursor-pointer px-3 py-2 hover:bg-teal-50"
                    role="option"
                    aria-selected="false"
                    onClick={() => onSelectSuggestion(s)}
                  >
                    {s.display_name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Image (fichier)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                setImageFile(f);
                if (f) {
                  const url = URL.createObjectURL(f);
                  setImagePreview(url);
                } else {
                  setImagePreview(null);
                }
              }}
              className="mt-1 w-full rounded-md border border-black/10 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900"
            />
            {imagePreview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imagePreview} alt="Prévisualisation" className="mt-2 h-32 w-full object-cover rounded-md" />
            )}
            <p className="mt-1 text-xs text-gray-500">Le fichier sera envoyé dans le bucket Supabase public `listings`.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Image (URL alternative)</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://…"
              className="mt-1 w-full rounded-md border border-black/10 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 placeholder:text-gray-400"
            />
            <p className="mt-1 text-xs text-gray-500">Si aucun fichier n’est sélectionné, on utilisera cette URL.</p>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={5}
            placeholder="Décrivez le matériel, les conditions de location, la zone couverte, etc."
            className="mt-1 w-full rounded-md border border-black/10 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 placeholder:text-gray-400"
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
      )}
    </div>
  );
}
