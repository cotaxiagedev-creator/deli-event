/** @type {import('next').NextConfig} */
const domains = [];
try {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const u = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
    if (u.hostname) domains.push(u.hostname);
  }
} catch {}

const nextConfig = {
  // Ensures Next.js traces files relative to this project root when building
  outputFileTracingRoot: __dirname,
  images: {
    domains,
    formats: ["image/avif", "image/webp"],
  },
};

module.exports = nextConfig;
