import CTAAnnounceButton from "@/components/CTAAnnounceButton";

export default function Home() {
  return (
    <div className="font-sans">
      <section className="relative overflow-hidden bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900">
                Louez du matériel événementiel
                <span className="block text-teal-600">simple, rapide et local</span>
              </h1>
              <p className="mt-4 text-lg text-gray-700">
                Deliv’ Event met en relation particuliers et professionnels pour la location de mobilier, photobooths, sonorisation, machines à popcorn, et plus encore.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="/recherche" className="inline-flex items-center justify-center rounded-md bg-teal-600 px-5 py-3 text-white shadow hover:bg-teal-700 transition">
                  Rechercher par lieu & date
                </a>
                <a href="/categories" className="inline-flex items-center justify-center rounded-md border border-black/10 bg-white px-5 py-3 text-gray-700 hover:bg-gray-50 transition">
                  Parcourir les catégories
                </a>
                <CTAAnnounceButton className="inline-flex items-center justify-center rounded-md border border-black/10 bg-white px-5 py-3 text-gray-700 hover:bg-gray-50 transition" />
              </div>
              <div className="mt-6 flex items-center gap-4 text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-teal-500" />
                  Local & transparent
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-gray-400" />
                  Sans paiement intégré (V1)
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-lg">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    "Mobilier",
                    "Photobooth",
                    "Sonorisation",
                    "Lumière",
                    "Cuisine",
                    "Extérieur",
                  ].map((c) => (
                    <div key={c} className="rounded-lg border border-black/10 bg-white p-4 hover:shadow-card transition">
                      <p className="text-sm font-medium text-gray-900">{c}</p>
                      <p className="mt-1 text-xs text-gray-600">À partir de 20€/jour</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
