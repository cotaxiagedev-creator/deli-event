import { NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { listingId, name, email, message } = body as {
      listingId?: string;
      name?: string;
      email?: string;
      message?: string;
    };

    if (!listingId || !name || !email || !message) {
      return NextResponse.json({ ok: false, error: "missing_fields" }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
    }

    if (isSupabaseConfigured) {
      const { error } = await supabase.from("messages").insert({
        listing_id: listingId,
        name,
        email,
        message,
      });
      if (error) {
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
      }
      return NextResponse.json({ ok: true });
    }

    // Fallback: accept without storing, for demo
    return NextResponse.json({ ok: true, demo: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown_error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
