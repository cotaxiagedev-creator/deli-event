
export default function Home() {
  return (
    <div className="font-sans">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-teal-50 via-white to-violet-50" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900">
                Louez du matériel événementiel
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-violet-500">simple, rapide et local</span>
              </h1>
              <p className="mt-4 text-lg text-gray-600">
                Deliv’ Event met en relation particuliers et professionnels pour la location de mobilier, photobooths, sonorisation, machines à popcorn, et plus encore.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="/recherche" className="inline-flex items-center justify-center rounded-md bg-teal-600 px-5 py-3 text-white shadow hover:bg-teal-700 transition">
                  Rechercher par lieu & date
                </a>
                <a href="/categories" className="inline-flex items-center justify-center rounded-md border border-teal-200 bg-white px-5 py-3 text-teal-700 hover:bg-teal-50 transition">
                  Parcourir les catégories
                </a>
                <a href="/creer-annonce" className="inline-flex items-center justify-center rounded-md border border-violet-200 bg-white px-5 py-3 text-violet-700 hover:bg-violet-50 transition">
                  Déposer une annonce
                </a>
              </div>
              <div className="mt-6 flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-teal-500" />
                  Local & transparent
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-violet-500" />
                  Sans paiement intégré (V1)
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="rounded-2xl border border-black/5 bg-white/80 p-6 shadow-lg backdrop-blur">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    "Mobilier",
                    "Photobooth",
                    "Sonorisation",
                    "Lumière",
                    "Cuisine",
                    "Extérieur",
                  ].map((c) => (
                    <div key={c} className="rounded-lg border border-teal-100 bg-gradient-to-br from-white to-teal-50 p-4">
                      <p className="text-sm font-medium text-gray-700">{c}</p>
                      <p className="mt-1 text-xs text-gray-500">À partir de 20€/jour</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="pointer-events-none absolute -top-4 -right-4 h-20 w-20 rounded-full bg-violet-200 blur-2xl opacity-60" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
