"use client";

// Lightweight wrapper around EmailJS. Will no-op if env vars are missing.
// Env required:
// - NEXT_PUBLIC_EMAILJS_PUBLIC_KEY
// - NEXT_PUBLIC_EMAILJS_SERVICE_ID
// - NEXT_PUBLIC_EMAILJS_TEMPLATE_ID
// Optional:
// - NEXT_PUBLIC_EMAILJS_TO_NAME

export type ContactPayload = {
  name: string;
  email: string;
  message: string;
};

export async function sendContactEmail(payload: ContactPayload): Promise<{ ok: boolean; error?: string }>
{
  const PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;
  const SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
  const TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
  const TO_NAME = process.env.NEXT_PUBLIC_EMAILJS_TO_NAME || "Deliv’ Event";

  if (!PUBLIC_KEY || !SERVICE_ID || !TEMPLATE_ID) {
    return { ok: false, error: "EmailJS non configuré" };
  }

  try {
    const emailjs = (await import("@emailjs/browser")).default;
    emailjs.init(PUBLIC_KEY);

    const res = await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      {
        // Champs courants reconnus par défaut par EmailJS
        from_name: payload.name,
        from_email: payload.email,
        reply_to: payload.email,
        to_name: TO_NAME,
        subject: "Contact via Deliv’ Event",
        message: payload.message,
      }
    );

    if (res.status === 200) return { ok: true };
    return { ok: false, error: `EmailJS status ${res.status}` };
  } catch (e: any) {
    // 422 (Unprocessable Content) arrive généralement quand les noms de variables
    // ne correspondent pas à ceux attendus par le template EmailJS.
    const msg = e?.text || e?.message || "Erreur d’envoi";
    return { ok: false, error: msg };
  }
}
