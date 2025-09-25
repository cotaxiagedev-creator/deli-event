"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useState } from "react";

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
            <Link
              key={href}
              href={href}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors hover:text-teal-600 hover:bg-teal-50 ${
                pathname === href ? "text-teal-700" : "text-gray-700"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="md:hidden" />
      </div>
    </header>
  );
}
