import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-black/5 bg-white/60 backdrop-blur supports-[backdrop-filter]:bg-white/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 grid gap-6 md:grid-cols-3 text-sm text-gray-600">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-block h-6 w-6 rounded bg-gradient-to-br from-teal-400 to-violet-500" />
            <span className="font-semibold text-gray-800">Deliv’ Event</span>
          </div>
          <p>Location de matériel événementiel, simple, rapide et locale.</p>
        </div>
        <div>
          <h3 className="font-medium text-gray-800 mb-2">Liens</h3>
          <ul className="space-y-1">
            <li><Link href="/categories" className="hover:text-teal-600">Catégories</Link></li>
            <li><Link href="/recherche" className="hover:text-teal-600">Recherche</Link></li>
            <li><Link href="/creer-annonce" className="hover:text-teal-600">Déposer une annonce</Link></li>
            <li><Link href="/a-propos" className="hover:text-teal-600">À propos</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-medium text-gray-800 mb-2">Contact</h3>
          <p>Une question ? Écrivez-nous et nous reviendrons vers vous.</p>
          <Link href="/contact" className="inline-block mt-3 text-teal-700 hover:text-teal-800">Contact</Link>
        </div>
      </div>
      <div className="border-t border-black/5 py-4 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} Deliv’ Event. Tous droits réservés.
      </div>
    </footer>
  );
}
