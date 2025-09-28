"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export default function CTAAnnounceButton({ className }: { className?: string }) {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      if (!isSupabaseConfigured) return;
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      setUserId(data?.user?.id ?? null);
    };
    init();
    return () => {
      mounted = false;
    };
  }, []);

  const href = userId ? "/creer-annonce" : "/login?next=/creer-annonce&msg=connect_required";

  return (
    <Link
      href={href}
      className={className}
      onClick={() => {
        if (!userId && typeof window !== "undefined") {
          try { localStorage.setItem("post_login_next", "/creer-annonce"); } catch {}
        }
      }}
    >
      Déposer une annonce
    </Link>
  );
}
