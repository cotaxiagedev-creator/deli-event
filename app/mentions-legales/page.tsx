export default function MentionsLegalesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-gray-900">Mentions légales</h1>
      <p className="mt-2 text-gray-600">Ces informations sont fournies à titre indicatif pour la V1 du site.</p>

      <section className="mt-6 space-y-3 text-sm text-gray-700">
        <p><span className="font-medium">Éditeur:</span> Deliv’ Event</p>
        <p><span className="font-medium">Contact:</span> contact@deliv-event.fr</p>
        <p><span className="font-medium">Hébergeur:</span> Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA</p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900">Responsabilités</h2>
        <p className="mt-2 text-gray-700 text-sm">Deliv’ Event agit en tant que plateforme de mise en relation. Les annonces et contenus publiés par les utilisateurs sont sous leur responsabilité.</p>
      </section>
    </div>
  );
}
