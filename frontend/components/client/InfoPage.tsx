import Link from 'next/link';

export interface InfoSection {
  title: string;
  body: React.ReactNode;
}

// Mise en page commune des pages d'information (FAQ, livraison, CGV, confidentialité…)
export default function InfoPage({ title, intro, sections, updated }: {
  title: string;
  intro?: string;
  sections: InfoSection[];
  updated?: string;
}) {
  return (
    <div className="container-app py-8 lg:py-12 max-w-3xl">
      <h1 className="h1 mb-3">{title}</h1>
      {intro && <p className="text-gray-600 mb-8">{intro}</p>}
      <div className="space-y-4">
        {sections.map((s) => (
          <section key={s.title} className="card">
            <h2 className="font-bold text-lg mb-2">{s.title}</h2>
            <div className="text-sm text-gray-700 leading-relaxed space-y-2">{s.body}</div>
          </section>
        ))}
      </div>
      {updated && <p className="text-xs text-gray-400 mt-6">Dernière mise à jour : {updated}</p>}
      <p className="text-sm text-gray-600 mt-6">
        Une autre question ? <Link href="/contact" className="text-gold font-semibold hover:underline">Contactez-nous</Link>.
      </p>
    </div>
  );
}
