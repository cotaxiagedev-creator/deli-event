"use client";

import { useState } from "react";
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
      const { error: insertError } = await supabase.from("listings").insert({
        title,
        category: cat,
        price_per_day: priceNum,
        location_name: location,
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
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Ville, code postal"
            className="mt-1 w-full rounded-md border border-black/10 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
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
