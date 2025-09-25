export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10 prose prose-teal">
      <h1>À propos</h1>
      <p>
        Deliv’ Event est une plateforme locale de mise en relation pour la location de
        matériel événementiel: mobilier, photobooths, sonorisation, éclairage, etc.
        Notre objectif: une expérience simple, rapide et transparente.
      </p>
      <h2>Philosophie</h2>
      <ul>
        <li>Simplicité d’utilisation</li>
        <li>Transparence des prix</li>
        <li>Proximité avec les loueurs</li>
      </ul>
      <h2>Roadmap V1</h2>
      <ul>
        <li>Recherche par lieu / date</li>
        <li>Formulaire dépôt d’annonce</li>
        <li>Contact par email (sans paiement intégré)</li>
        <li>PWA installable</li>
      </ul>
    </div>
  );
}
