export default function CategoriesPage() {
  const categories = [
    { name: "Mobilier", desc: "Chaises, tables, mange-debout…", color: "from-teal-50 to-white" },
    { name: "Photobooth", desc: "Bornes, imprimantes, accessoires.", color: "from-violet-50 to-white" },
    { name: "Sonorisation", desc: "Enceintes, micros, platines.", color: "from-teal-50 to-white" },
    { name: "Lumière", desc: "Projecteurs, guirlandes, effets.", color: "from-violet-50 to-white" },
    { name: "Cuisine", desc: "Machines à popcorn, crêpières, etc.", color: "from-teal-50 to-white" },
    { name: "Extérieur", desc: "Barnums, chauffages, déco.", color: "from-violet-50 to-white" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-gray-900">Catégories</h1>
      <p className="mt-2 text-gray-600">Parcourez les catégories pour trouver le matériel idéal.</p>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => (
          <div key={c.name} className={`rounded-xl border border-black/10 bg-gradient-to-br ${c.color} p-5 hover:shadow-card transition`}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">{c.name}</h2>
              <span className="text-xs text-teal-700 bg-teal-50 border border-teal-100 px-2 py-1 rounded">Populaire</span>
            </div>
            <p className="mt-2 text-sm text-gray-600">{c.desc}</p>
            <a href={`/recherche?categorie=${encodeURIComponent(c.name)}`} className="mt-4 inline-block text-teal-700 hover:text-teal-800">Voir les annonces →</a>
          </div>
        ))}
      </div>
    </div>
  );
}
