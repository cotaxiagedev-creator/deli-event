import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center">
        <p className="text-sm font-semibold text-teal-600">404</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Page introuvable</h1>
        <p className="mt-2 text-base text-gray-600">
          Désolé, la page que vous recherchez n&apos;existe pas ou a été déplacée.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-teal-600 px-4 py-2 text-white shadow hover:bg-teal-700 transition"
          >
            Retour à l’accueil
          </Link>
          <Link
            href="/recherche"
            className="inline-flex items-center justify-center rounded-md border border-black/10 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50 transition"
          >
            Voir les annonces
          </Link>
        </div>
      </div>
    </div>
  );
}
