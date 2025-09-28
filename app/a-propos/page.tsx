export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-gray-900">À propos</h1>
      <p className="mt-3 text-gray-700">
        Deliv’ Event est une plateforme locale de mise en relation pour la location de matériel événementiel: mobilier, photobooths, sonorisation, éclairage, etc. Notre objectif: une expérience simple, rapide et transparente.
      </p>
      <h2 className="mt-8 text-xl font-semibold text-gray-900">Philosophie</h2>
      <ul className="mt-3 list-disc pl-6 text-gray-700">
        <li>Simplicité d’utilisation</li>
        <li>Transparence des prix</li>
        <li>Proximité avec les loueurs</li>
      </ul>
      <h2 className="mt-8 text-xl font-semibold text-gray-900">Roadmap V1</h2>
      <ul className="mt-3 list-disc pl-6 text-gray-700">
        <li>Recherche par lieu / date</li>
        <li>Formulaire dépôt d’annonce</li>
        <li>Contact par email (sans paiement intégré)</li>
        <li>PWA installable</li>
      </ul>
    </div>
  );
}
