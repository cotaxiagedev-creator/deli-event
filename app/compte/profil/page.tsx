"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useToast } from "@/components/ToastProvider";

export default function ProfilePage() {
  const { show } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");

  // metadata fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [locationName, setLocationName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    const boot = async () => {
      try {
        if (!isSupabaseConfigured) {
          setLoading(false);
          return;
        }
        const { data } = await supabase.auth.getUser();
        const user = data?.user || null;
        setUserId(user?.id ?? null);
        if (!user) {
          setLoading(false);
          router.push("/login?next=/compte/profil&msg=connect_required");
          return;
        }
        setEmail(user.email || "");
        const m = (user.user_metadata || {}) as {
          full_name?: string;
          phone?: string;
          company?: string;
          location_name?: string;
          avatar_url?: string;
          bio?: string;
        };
        setFullName(m.full_name || "");
        setPhone(m.phone || "");
        setCompany(m.company || "");
        setLocationName(m.location_name || "");
        setAvatarUrl(m.avatar_url || "");
        setBio(m.bio || "");
      } catch {
        // noop
      } finally {
        setLoading(false);
      }
    };
    boot();
  }, [router]);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      show("error", "Supabase non configuré");
      return;
    }
    if (!userId) {
      router.push("/login?next=/compte/profil&msg=connect_required");
      return;
    }
    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          phone,
          company,
          location_name: locationName,
          avatar_url: avatarUrl,
          bio,
        },
      });
      if (error) throw error;
      // sync some local defaults used elsewhere
      try {
        if (typeof window !== "undefined") {
          if (phone) localStorage.setItem("last_phone", phone);
          if (locationName) localStorage.setItem("last_location_name", locationName);
        }
      } catch {}
      show("success", "Profil enregistré");
    } catch (err) {
      show("error", err instanceof Error ? err.message : "Erreur d'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-gray-900">Mon profil</h1>
      {!isSupabaseConfigured && (
        <div className="mt-4 rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
          Supabase n'est pas configuré. Renseignez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY.
        </div>
      )}

      {loading ? (
        <div className="mt-6">Chargement…</div>
      ) : (
        <div className="mt-6 rounded-xl border border-black/10 bg-white p-6 shadow-sm">
          <form onSubmit={onSave} className="grid gap-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nom complet</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1 w-full rounded-md border border-black/10 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 placeholder:text-gray-400"
                  placeholder="Ex: Marie Dupont"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">E‑mail</label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="mt-1 w-full rounded-md border border-black/10 bg-gray-50 px-3 py-2 text-gray-700"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Téléphone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 w-full rounded-md border border-black/10 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 placeholder:text-gray-400"
                  placeholder="Ex: 06 12 34 56 78"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Société (optionnel)</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="mt-1 w-full rounded-md border border-black/10 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 placeholder:text-gray-400"
                  placeholder="Nom de l&apos;entreprise"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Localisation par défaut</label>
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className="mt-1 w-full rounded-md border border-black/10 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 placeholder:text-gray-400"
                placeholder="Ville ou zone"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Avatar (URL)</label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="mt-1 w-full rounded-md border border-black/10 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 placeholder:text-gray-400"
                  placeholder="https://…"
                />
              </div>
              <div className="flex items-end">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 overflow-hidden rounded-full bg-gray-100 relative">
                    {avatarUrl ? (
                      <Image src={avatarUrl} alt="Avatar" fill className="object-cover" sizes="48px" />
                    ) : (
                      <Image src="/logo.png" alt="Avatar" fill className="object-contain p-2" sizes="48px" />
                    )}
                  </div>
                  <span className="text-sm text-gray-500">Aperçu</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">À propos (bio)</label>
              <textarea
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="mt-1 w-full rounded-md border border-black/10 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 placeholder:text-gray-400"
                placeholder="Décrivez votre activité, vos spécialités, etc."
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center rounded-md bg-teal-600 px-5 py-3 text-white shadow hover:bg-teal-700 transition disabled:opacity-60"
              >
                {loading ? "Enregistrement…" : "Enregistrer"}
              </button>
              <Link href="/compte/annonces" className="inline-flex items-center justify-center rounded-md border border-black/10 bg-white px-5 py-3 text-gray-700 hover:bg-gray-50 transition">
                Mes annonces
              </Link>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
