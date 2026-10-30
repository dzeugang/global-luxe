'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import ProductCard from '@/components/client/ProductCard';
import type { Product } from '@/types';
import { Search, X, ArrowLeft } from 'lucide-react';

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [newQuery, setNewQuery] = useState(query);

  useEffect(() => {
    if (!query) {
      setLoading(false);
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      try {
        const r = await api.get('/products/', {
          params: { search: query },
        });
        setProducts(r.data.results || r.data);
      } catch (error) {
        console.error('Erreur recherche:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query]);

  const handleNewSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (newQuery.trim()) {
      router.push(`/recherche?q=${encodeURIComponent(newQuery.trim())}`);
    }
  };

  return (
    <div className="container-app py-6 lg:py-10">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gold mb-4"
        >
          <ArrowLeft size={14} /> Retour
        </button>

        <h1 className="h1 mb-4">
          Résultats de recherche
          {query && (
            <span className="text-gold ml-2">&quot;{query}&quot;</span>
          )}
        </h1>

        {/* Nouvelle barre de recherche */}
        <form
          onSubmit={handleNewSearch}
          className="max-w-2xl flex items-center bg-white border-2 border-gray-200 rounded-full px-5 py-3 focus-within:border-gold transition"
        >
          <Search size={20} className="text-gray-400 mr-3" />
          <input
            type="search"
            value={newQuery}
            onChange={(e) => setNewQuery(e.target.value)}
            placeholder="Rechercher autre chose..."
            className="bg-transparent border-0 outline-none flex-1 text-base"
          />
          {newQuery && (
            <button
              type="button"
              onClick={() => setNewQuery('')}
              className="text-gray-400 hover:text-gray-700"
            >
              <X size={18} />
            </button>
          )}
          <button type="submit" className="btn-gold ml-2 !min-h-[36px] !py-1.5 !px-4">
            Chercher
          </button>
        </form>

        {!loading && (
          <p className="text-gray-500 text-sm mt-3">
            {products.length} résultat{products.length > 1 ? 's' : ''} trouvé{products.length > 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Résultats */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
              <div className="aspect-square bg-gray-200 rounded-xl mb-3"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : !query ? (
        <div className="card text-center py-16">
          <Search size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-gray-700 font-semibold mb-2">Que cherchez-vous ?</p>
          <p className="text-sm text-gray-400">
            Tapez un mot-clé pour découvrir nos produits
          </p>
        </div>
      ) : products.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-6xl mb-4">😔</div>
          <p className="text-gray-700 font-semibold text-lg mb-2">
            Aucun produit trouvé pour &quot;{query}&quot;
          </p>
          <p className="text-sm text-gray-400 mb-6">
            Essayez avec d&apos;autres mots-clés ou parcourez nos catégories
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {['iPhone', 'Sony', 'Apple', 'Parfum', 'Montre'].map((tag) => (
              <button
                key={tag}
                onClick={() => router.push(`/recherche?q=${tag}`)}
                className="px-4 py-2 bg-gray-100 hover:bg-gold/10 hover:text-gold-dark rounded-full text-sm transition"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="container-app py-12 text-center">Chargement...</div>}>
      <SearchContent />
    </Suspense>
  );
}