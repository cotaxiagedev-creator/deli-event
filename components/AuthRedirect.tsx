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
        // If on login page, redirect to `next` (URL or localStorage) or dashboard
        if (pathname === "/login") {
          let next = sp?.get("next") || null;
          if (!next && typeof window !== "undefined") {
            try { next = localStorage.getItem("post_login_next"); } catch {}
          }
          const target = next && next.startsWith("/") ? next : "/compte/annonces";
          try { localStorage.removeItem("post_login_next"); } catch {}
          router.replace(target);
        } else if (pathname === "/") {
          // Also handle landing on root: honor next/localStorage if present
          let next = sp?.get("next") || null;
          if (!next && typeof window !== "undefined") {
            try { next = localStorage.getItem("post_login_next"); } catch {}
          }
          const target = next && next.startsWith("/") ? next : "/compte/annonces";
          try { localStorage.removeItem("post_login_next"); } catch {}
          router.replace(target);
        }
      }, 250);
    }

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        // If user just signed in and we're on home or login, route accordingly
        if (pathname === "/") {
          let next = sp?.get("next") || null;
          if (!next && typeof window !== "undefined") {
            try { next = localStorage.getItem("post_login_next"); } catch {}
          }
          const target = next && next.startsWith("/") ? next : "/compte/annonces";
          try { localStorage.removeItem("post_login_next"); } catch {}
          router.replace(target);
        } else if (pathname === "/login") {
          let next = sp?.get("next") || null;
          if (!next && typeof window !== "undefined") {
            try { next = localStorage.getItem("post_login_next"); } catch {}
          }
          const target = next && next.startsWith("/") ? next : "/compte/annonces";
          try { localStorage.removeItem("post_login_next"); } catch {}
          router.replace(target);
        }
      }
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, [pathname, router, sp]);

  return null;
}
