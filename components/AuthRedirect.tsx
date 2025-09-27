"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export default function AuthRedirect() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    // Fallback: if we land with a hash token on '/', send to dashboard
    if (typeof window !== "undefined" && pathname === "/") {
      if (window.location.hash && /access_token=/.test(window.location.hash)) {
        // Let Supabase parse hash and set session, then redirect shortly after
        setTimeout(() => {
          router.replace("/compte/annonces");
        }, 250);
      }
    }

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        // If user just signed in and we're on home, route to dashboard
        if (pathname === "/") {
          router.replace("/compte/annonces");
        }
      }
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, [pathname, router]);

  return null;
}
