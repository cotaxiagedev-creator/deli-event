import { NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    let { listingId, name, email, message, honeypot } = body as {
      listingId?: string;
      name?: string;
      email?: string;
      message?: string;
      honeypot?: string;
    };

    // Normalize inputs
    listingId = typeof listingId === "string" ? listingId.trim() : undefined;
    name = typeof name === "string" ? name.trim() : undefined;
    email = typeof email === "string" ? email.trim().toLowerCase() : undefined;
    message = typeof message === "string" ? message.trim() : undefined;
    const hp = typeof honeypot === "string" ? honeypot.trim() : "";

    // Honeypot: if filled, silently accept without storing
    if (hp) {
      return NextResponse.json({ ok: true });
    }

    if (!listingId || !name || !email || !message) {
      return NextResponse.json({ ok: false, error: "missing_fields" }, { status: 400 });
    }

    // Length constraints (basic)
    if (name.length < 2 || name.length > 100) {
      return NextResponse.json({ ok: false, error: "invalid_name_length" }, { status: 400 });
    }
    if (email.length < 5 || email.length > 320) {
      return NextResponse.json({ ok: false, error: "invalid_email_length" }, { status: 400 });
    }
    if (message.length < 10 || message.length > 2000) {
      return NextResponse.json({ ok: false, error: "invalid_message_length" }, { status: 400 });
    }

    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
    }

    if (isSupabaseConfigured) {
      // Anti-spam: block duplicate submissions for same email/listing in last 2 minutes
      const sinceIso = new Date(Date.now() - 2 * 60 * 1000).toISOString();
      const { data: recent, error: recentErr } = await supabase
        .from("messages")
        .select("id, created_at")
        .eq("listing_id", listingId)
        .eq("email", email)
        .gte("created_at", sinceIso)
        .limit(1);
      if (!recentErr && recent && recent.length > 0) {
        return NextResponse.json({ ok: false, error: "duplicate_recent" }, { status: 429 });
      }

      const { error } = await supabase.from("messages").insert({
        listing_id: listingId,
        name,
        email,
        message,
      });
      if (error) {
        console.warn("contact_insert_error", error.message);
        return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
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
