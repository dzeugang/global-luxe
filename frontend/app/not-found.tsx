import Link from 'next/link';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-dark text-white flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="font-serif text-7xl sm:text-9xl font-bold text-gold mb-4">404</h1>
        <h2 className="text-2xl sm:text-3xl font-bold mb-3">Page introuvable</h2>
        <p className="text-gray-400 mb-8">
          Désolé, la page que vous cherchez n'existe pas ou a été déplacée.
        </p>
        <Link href="/" className="btn-gold inline-flex">
          <Home size={18} /> Retour à l'accueil
        </Link>
      </div>
    </div>
  );
}