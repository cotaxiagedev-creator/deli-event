"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useToast } from "@/components/ToastProvider";

 type Listing = {
  id: string;
  title: string;
  category: string;
  price_per_day?: number | null;
  image_url?: string | null;
};

export default function MyListingsPage() {
  const { show } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Listing[]>([]);

  useEffect(() => {
    const boot = async () => {
      if (!isSupabaseConfigured) {
        setLoading(false);
        return;
      }
      const { data } = await supabase.auth.getUser();
      const uid = data?.user?.id ?? null;
      setUserId(uid);
      if (!uid) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const { data: listings, error } = await supabase
          .from("listings")
          .select("id, title, category, price_per_day, image_url")
          .eq("owner_id", uid)
          .order("created_at", { ascending: false });
        if (error) throw error;
        setItems((listings as unknown as Listing[]) || []);
      } catch (e) {
        show("error", e instanceof Error ? e.message : "Impossible de charger vos annonces");
      } finally {
        setLoading(false);
      }
    };
    boot();
  }, [show]);

  const onDelete = async (id: string) => {
    if (!confirm("Supprimer cette annonce ?")) return;
    try {
      const { error } = await supabase.from("listings").delete().eq("id", id);
      if (error) throw error;
      setItems((arr) => arr.filter((x) => x.id !== id));
      show("success", "Annonce supprimée");
    } catch (e) {
      show("error", e instanceof Error ? e.message : "Suppression impossible");
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-gray-900">Mes annonces</h1>
      {!isSupabaseConfigured && (
        <div className="mt-4 rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
          Supabase n'est pas configuré. Renseignez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY.
        </div>
      )}

      {isSupabaseConfigured && !loading && !userId && (
        <div className="mt-6 rounded-md border border-teal-200 bg-teal-50 p-4">
          <p className="text-teal-800">Vous devez être connecté pour voir vos annonces.</p>
          <Link href="/login" className="mt-3 inline-flex items-center justify-center rounded-md bg-teal-600 px-4 py-2 text-white shadow hover:bg-teal-700 transition">
            Se connecter
          </Link>
        </div>
      )}

      {isSupabaseConfigured && userId && (
        <div className="mt-8">
          {loading ? (
            <div>Chargement…</div>
          ) : items.length === 0 ? (
            <div className="rounded-md border border-gray-200 p-6 text-center text-gray-600">
              Aucune annonce pour le moment.
              <div className="mt-4">
                <Link href="/creer-annonce" className="inline-flex items-center justify-center rounded-md bg-teal-600 px-4 py-2 text-white shadow hover:bg-teal-700 transition">
                  Créer une annonce
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((l) => (
                <div key={l.id} className="rounded-xl border border-black/5 bg-white p-5">
                  <div className="relative aspect-video overflow-hidden rounded-lg bg-gray-50">
                    {l.image_url ? (
                      <Image src={l.image_url} alt={l.title} fill className="object-cover" sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw" />
                    ) : (
                      <Image src="/logo.png" alt={l.title} fill className="object-contain p-6" sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw" />
                    )}
                  </div>
                  <h3 className="mt-3 font-medium text-gray-900">{l.title}</h3>
                  <p className="text-sm text-gray-600">{l.category} {l.price_per_day ? `• ${l.price_per_day}€/jour` : ""}</p>
                  <div className="mt-4 flex gap-2">
                    <Link href={`/annonce/${l.id}`} className="inline-flex items-center justify-center rounded-md bg-teal-600 px-3 py-2 text-white shadow hover:bg-teal-700 transition text-sm">
                      Voir
                    </Link>
                    <button onClick={() => onDelete(l.id)} className="inline-flex items-center justify-center rounded-md border border-red-200 bg-white px-3 py-2 text-red-700 hover:bg-red-50 transition text-sm">
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
