"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useToast } from "@/components/ToastProvider";

export default function EditListingPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string | undefined;
  const router = useRouter();
  const { show } = useToast();

  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState<string>("");
  const [locationName, setLocationName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [phone, setPhone] = useState<string>("");

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      if (!isSupabaseConfigured) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("listings")
          .select("id, title, category, price_per_day, location_name, image_url, phone")
          .eq("id", id)
          .maybeSingle();
        if (error) throw error;
        if (!data) {
          show("error", "Annonce introuvable");
          router.push("/compte/annonces");
          return;
        }
        setTitle(data.title || "");
        setCategory(data.category || "");
        setPrice(String(data.price_per_day ?? ""));
        setLocationName(data.location_name || "");
        setImageUrl(data.image_url || "");
        setPhone((data as any).phone || "");
      } catch (e) {
        show("error", e instanceof Error ? e.message : "Chargement impossible");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, router, show]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      show("error", "Supabase non configuré");
      return;
    }
    const priceNum = Number(price);
    if (!title || !category || Number.isNaN(priceNum) || priceNum <= 0) {
      show("error", "Titre, catégorie et prix valides sont requis");
      return;
    }
    try {
      setLoading(true);
      // If a new file is provided, upload it and update imageUrl
      let finalImageUrl: string | null = imageUrl || null;
      if (imageFile) {
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
          console.warn("Image upload failed on edit", e);
          show("error", "Échec de l'envoi de l'image, on garde l'URL actuelle");
        }
      }
      const { error } = await supabase
        .from("listings")
        .update({
          title,
          category,
          price_per_day: priceNum,
          location_name: locationName,
          image_url: finalImageUrl,
          phone: phone || null,
        })
        .eq("id", id);
      if (error) throw error;
      show("success", "Annonce mise à jour");
      router.push("/compte/annonces");
    } catch (e) {
      show("error", e instanceof Error ? e.message : "Mise à jour impossible");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-gray-900">Éditer l’annonce</h1>
      <p className="mt-2 text-gray-600">Modifiez les informations ci‑dessous puis enregistrez.</p>

      {!isSupabaseConfigured && (
        <div className="mt-4 rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
          Supabase n&apos;est pas configuré. Renseignez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY.
        </div>
      )}

      {loading ? (
        <div className="mt-6">Chargement…</div>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 grid gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Titre</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-md border border-black/10 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 placeholder:text-gray-400"
              placeholder="Titre de l’annonce"
            />
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700">Catégorie</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 w-full rounded-md border border-black/10 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 placeholder:text-gray-400"
                placeholder="Ex: Photobooth"
              />
            </div>
            <div className="sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700">Prix / jour (€)</label>
              <input
                type="number"
                min={1}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="mt-1 w-full rounded-md border border-black/10 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 placeholder:text-gray-400"
                placeholder="Ex: 50"
              />
            </div>
            <div className="sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700">Lieu (texte)</label>
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className="mt-1 w-full rounded-md border border-black/10 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 placeholder:text-gray-400"
                placeholder="Ex: Paris"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Image (URL)</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="mt-1 w-full rounded-md border border-black/10 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 placeholder:text-gray-400"
              placeholder="https://…"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Téléphone (optionnel)</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded-md border border-black/10 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 placeholder:text-gray-400"
              placeholder="Ex: 06 12 34 56 78"
            />
          </div>
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
            <p className="mt-1 text-xs text-gray-500">Si un fichier est choisi, il sera envoyé dans le bucket Supabase `listings` et remplacera l&apos;image.</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="inline-flex items-center justify-center rounded-md bg-teal-600 px-5 py-3 text-white shadow hover:bg-teal-700 transition disabled:opacity-60">
              {loading ? "Enregistrement…" : "Enregistrer"}
            </button>
            <Link href="/compte/annonces" className="inline-flex items-center justify-center rounded-md border border-black/10 bg-white px-5 py-3 text-gray-700 hover:bg-gray-50 transition">
              Annuler
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
