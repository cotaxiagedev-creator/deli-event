"use client";

import { useEffect, useMemo, useState } from "react";
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
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"recent" | "price_asc" | "price_desc">("recent");
  const [page, setPage] = useState(1);
  const pageSize = 12;
  const [total, setTotal] = useState(0);

  // debounce for search
  const debounce = (fn: (...args: any[]) => void, delay = 300) => {
    let t: ReturnType<typeof setTimeout> | null = null;
    return (...args: any[]) => {
      if (t) clearTimeout(t as any);
      t = setTimeout(() => fn(...args), delay);
    };
  };

  const fetchData = useMemo(() => debounce(async (uid: string, query: string, sortBy: typeof sort, pageNum: number) => {
    try {
      setLoading(true);
      let req = supabase
        .from("listings")
        .select("id, title, category, price_per_day, image_url", { count: "exact" })
        .eq("owner_id", uid);
      if (query) req = req.ilike("title", `%${query}%`);
      if (sortBy === "recent") req = req.order("created_at", { ascending: false });
      if (sortBy === "price_asc") req = req.order("price_per_day", { ascending: true, nullsFirst: true });
      if (sortBy === "price_desc") req = req.order("price_per_day", { ascending: false, nullsFirst: true });
      const from = (pageNum - 1) * pageSize;
      const to = from + pageSize - 1;
      const { data: listings, error, count } = await req.range(from, to);
      if (error) throw error;
      setItems((listings as unknown as Listing[]) || []);
      setTotal(count || 0);
    } catch (e) {
      show("error", e instanceof Error ? e.message : "Impossible de charger vos annonces");
    } finally {
      setLoading(false);
    }
  }, 300), [show]);

  // bootstrap auth and initial fetch
  useEffect(() => {
    const boot = async () => {
      if (!isSupabaseConfigured) { setLoading(false); return; }
      const { data } = await supabase.auth.getUser();
      const uid = data?.user?.id ?? null;
      setUserId(uid);
      if (!uid) { setLoading(false); return; }
      fetchData(uid, q, sort, page);
    };
    boot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // refetch on filters change
  useEffect(() => {
    if (!userId) return;
    fetchData(userId, q, sort, page);
  }, [userId, q, sort, page, fetchData]);

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
          Supabase n&apos;est pas configuré. Renseignez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY.
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
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={q}
                onChange={(e) => { setPage(1); setQ(e.target.value); }}
                placeholder="Rechercher par titre…"
                className="w-full rounded-md border border-black/10 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 placeholder:text-gray-400"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Trier</label>
              <select
                value={sort}
                onChange={(e) => { setPage(1); setSort(e.target.value as any); }}
                className="rounded-md border border-black/10 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="recent">Plus récentes</option>
                <option value="price_asc">Prix croissant</option>
                <option value="price_desc">Prix décroissant</option>
              </select>
            </div>
          </div>
          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-black/10 bg-white p-5">
                  <div className="aspect-video overflow-hidden rounded-lg bg-gray-100 animate-pulse" />
                  <div className="mt-3 h-4 w-2/3 bg-gray-100 animate-pulse rounded" />
                  <div className="mt-2 h-3 w-1/2 bg-gray-100 animate-pulse rounded" />
                  <div className="mt-3 flex gap-2">
                    <span className="h-8 w-20 bg-gray-100 animate-pulse rounded" />
                    <span className="h-8 w-24 bg-gray-100 animate-pulse rounded" />
                  </div>
                </div>
              ))}
            </div>
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
                <div key={l.id} className="rounded-xl border border-black/10 bg-white p-5 hover:shadow-card transition">
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
                    <Link href={`/compte/annonces/${l.id}/edit`} className="inline-flex items-center justify-center rounded-md border border-black/10 bg-white px-3 py-2 text-gray-700 hover:bg-gray-50 transition text-sm">
                      Éditer
                    </Link>
                    <button onClick={() => onDelete(l.id)} className="inline-flex items-center justify-center rounded-md border border-red-200 bg-white px-3 py-2 text-red-700 hover:bg-red-50 transition text-sm">
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* Pagination */}
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {items.length ? `${(page-1)*pageSize+1}–${Math.min(page*pageSize, total)} sur ${total}` : `0 sur ${total}`}
            </p>
            <div className="flex gap-2">
              <button
                disabled={page===1 || loading}
                onClick={() => setPage((p)=>Math.max(1,p-1))}
                className="inline-flex items-center justify-center rounded-md border border-black/10 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition disabled:opacity-60"
              >
                Précédent
              </button>
              <button
                disabled={page*pageSize>=total || loading}
                onClick={() => setPage((p)=>p+1)}
                className="inline-flex items-center justify-center rounded-md border border-black/10 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition disabled:opacity-60"
              >
                Suivant
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
