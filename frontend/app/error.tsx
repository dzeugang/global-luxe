'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw, Home } from 'lucide-react';

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-dark text-white flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="font-serif text-5xl sm:text-7xl font-bold text-gold mb-4">Oups !</h1>
        <h2 className="text-xl sm:text-2xl font-bold mb-3">Une erreur est survenue</h2>
        <p className="text-gray-400 mb-8 text-sm">{error.message || 'Erreur inconnue'}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={reset} className="btn-gold"><RefreshCw size={18} /> Réessayer</button>
          <Link href="/" className="btn-outline"><Home size={18} /> Accueil</Link>
        </div>
      </div>
    </div>
  );
}