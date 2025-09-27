export default function ConfidentialitePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-gray-900">Politique de confidentialité</h1>
      <p className="mt-2 text-gray-600">Version initiale pour la V1 du site. Nous mettrons à jour cette page au fur et à mesure.</p>

      <section className="mt-6 space-y-3 text-sm text-gray-700">
        <p>Nous collectons uniquement les informations nécessaires au fonctionnement du service (annonces, messages de contact).</p>
        <p>Vous pouvez demander la suppression de vos données en écrivant à <span className="font-medium">contact@deliv-event.fr</span>.</p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900">Cookies</h2>
        <p className="mt-2 text-gray-700 text-sm">Nous n’utilisons pas de cookies de suivi marketing dans la V1. Des cookies techniques peuvent être utilisés pour améliorer l’expérience (PWA, préférences).</p>
      </section>
    </div>
  );
}
