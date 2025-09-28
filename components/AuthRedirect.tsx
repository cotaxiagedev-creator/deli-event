"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export default function AuthRedirect() {
  const pathname = usePathname();
  const router = useRouter();
  const sp = useSearchParams();

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    // If we land with a hash token (magic link), strip hash and optionally redirect
    if (typeof window !== "undefined" && window.location.hash && /access_token=/.test(window.location.hash)) {
      // Let Supabase parse hash and set session, then clean URL shortly after
      setTimeout(() => {
        const cleanUrl = window.location.pathname + window.location.search;
        window.history.replaceState(null, "", cleanUrl);
        // If on login page, redirect to `next` or dashboard
        if (pathname === "/login") {
          const next = sp?.get("next") || "/compte/annonces";
          router.replace(next.startsWith("/") ? next : "/compte/annonces");
        } else if (pathname === "/") {
          router.replace("/compte/annonces");
        }
      }, 250);
    }

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        // If user just signed in and we're on home or login, route accordingly
        if (pathname === "/") {
          router.replace("/compte/annonces");
        } else if (pathname === "/login") {
          const next = sp?.get("next") || "/compte/annonces";
          router.replace(next.startsWith("/") ? next : "/compte/annonces");
        }
      }
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, [pathname, router, sp]);

  return null;
}
