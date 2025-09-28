"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import CTAAnnounceButton from "@/components/CTAAnnounceButton";

const navLinks = [
  { href: "/", label: "Accueil" },
  { href: "/categories", label: "Catégories" },
  { href: "/recherche", label: "Recherche" },
  { href: "/creer-annonce", label: "Déposer une annonce" },
  { href: "/a-propos", label: "À propos" },
];
export default function Navbar() {
  const pathname = usePathname();
  const [logoError, setLogoError] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      if (!isSupabaseConfigured) return;
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      setUserId(data?.user?.id ?? null);
    };
    init();
    if (isSupabaseConfigured) {
      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
        setUserId(session?.user?.id ?? null);
      });
      return () => {
        mounted = false;
        sub.subscription.unsubscribe();
      };
    }
    return () => { mounted = false; };
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-black/5 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          {/* Brand logo with fallback */}
          {logoError ? (
            <span className="inline-block h-8 w-8 rounded bg-gradient-to-br from-teal-400 to-violet-500" />
          ) : (
            <Image
              src="/logo.png"
              alt="Deliv’ Event"
              width={32}
              height={32}
              className="h-8 w-8 rounded"
              priority
              onError={() => setLogoError(true)}
            />
          )}
          <span className="font-semibold">Deliv’ Event</span>
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(({ href, label }) => (
            href === "/creer-annonce" ? (
              <CTAAnnounceButton
                key={href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors hover:text-teal-600 hover:bg-teal-50 ${
                  pathname === href ? "text-teal-700" : "text-gray-700"
                }`}
              />
            ) : (
              <Link
                key={href}
                href={href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors hover:text-teal-600 hover:bg-teal-50 ${
                  pathname === href ? "text-teal-700" : "text-gray-700"
                }`}
              >
                {label}
              </Link>
            )
          ))}
        </nav>
        <div className="hidden md:flex items-center gap-2">
          {isSupabaseConfigured ? (
            userId ? (
              <>
                <Link href="/compte/annonces" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-teal-700 hover:bg-teal-50">Mes annonces</Link>
                <button
                  onClick={() => supabase.auth.signOut()}
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-teal-700 hover:bg-teal-50"
                >
                  Se déconnecter
                </button>
              </>
            ) : (
              <Link href="/login" className="px-3 py-2 rounded-md text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 shadow">Se connecter</Link>
            )
          ) : null}
        </div>
        {/* Mobile menu button */}
        <div className="md:hidden">
          <button
            aria-label="Ouvrir le menu"
            onClick={() => setMobileOpen((v) => !v)}
            className="inline-flex items-center justify-center rounded-md border border-black/10 bg-white px-3 py-2 text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Menu
          </button>
        </div>
      </div>
      {/* Mobile panel */}
      {mobileOpen && (
        <div className="md:hidden border-t border-black/5 bg-white/95 backdrop-blur">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex flex-col gap-1">
            {navLinks.map(({ href, label }) => (
              href === "/creer-annonce" ? (
                <CTAAnnounceButton
                  key={href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors hover:text-teal-700 hover:bg-teal-50 ${
                    pathname === href ? "text-teal-700" : "text-gray-700"
                  }`}
                />
              ) : (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors hover:text-teal-700 hover:bg-teal-50 ${
                    pathname === href ? "text-teal-700" : "text-gray-700"
                  }`}
                >
                  {label}
                </Link>
              )
            ))}
            {isSupabaseConfigured ? (
              userId ? (
                <div className="mt-2 flex items-center gap-2">
                  <Link href="/compte/annonces" onClick={() => setMobileOpen(false)} className="flex-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-teal-700 hover:bg-teal-50">Mes annonces</Link>
                  <button
                    onClick={() => { supabase.auth.signOut(); setMobileOpen(false); }}
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-teal-700 hover:bg-teal-50"
                  >
                    Se déconnecter
                  </button>
                </div>
              ) : (
                <Link href="/login" onClick={() => setMobileOpen(false)} className="mt-2 inline-flex items-center justify-center rounded-md bg-teal-600 px-3 py-2 text-white shadow hover:bg-teal-700 text-sm">
                  Se connecter
                </Link>
              )
            ) : null}
          </div>
        </div>
      )}
    </header>
  );
}
