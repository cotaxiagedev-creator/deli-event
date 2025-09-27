import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
export const viewport = {
  themeColor: "#40E0E0",
};
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";
import InstallPrompt from "@/components/InstallPrompt";
import ToastProvider from "@/components/ToastProvider";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import AuthRedirect from "@/components/AuthRedirect";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Deliv’ Event | Location de matériel événementiel",
  description:
    "PWA de mise en relation entre loueurs et particuliers/pros pour la location de matériel événementiel (mobilier, photobooth, sonorisation, etc.). Simple, rapide et locale.",
  applicationName: "Deliv’ Event",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/logo.png", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Deliv’ Event",
  },
  openGraph: {
    title: "Deliv’ Event | Location de matériel événementiel",
    description:
      "Louez et proposez du matériel événementiel: mobilier, photobooth, sonorisation, et plus. Simple, rapide et local.",
    url: "https://deliv-event.fr",
    siteName: "Deliv’ Event",
    images: [
      { url: "/logo.png", width: 1200, height: 630, alt: "Deliv’ Event" },
    ],
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Deliv’ Event | Location de matériel événementiel",
    description:
      "Louez et proposez du matériel événementiel: mobilier, photobooth, sonorisation, et plus.",
    images: ["/logo.png"],
    creator: "@delivevent",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        <link rel="dns-prefetch" href="https://nominatim.openstreetmap.org" />
        <link rel="preconnect" href="https://nominatim.openstreetmap.org" crossOrigin="anonymous" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-gray-900`}>
        <ToastProvider>
          <div className="min-h-dvh flex flex-col">
            <Navbar />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
            <InstallPrompt />
            <ServiceWorkerRegistrar />
          </div>
          <Analytics />
          <SpeedInsights />
          <AuthRedirect />
        </ToastProvider>
      </body>
    </html>
  );
}
