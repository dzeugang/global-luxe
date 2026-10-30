'use client';
import { useEffect, useState, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import ProductCard from '@/components/client/ProductCard';
import type { Product } from '@/types';
import { Filter, X, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

interface Category {
  id: number;
  name: string;
  slug: string;
  image?: string;
  products_count?: number;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export default function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('-created_at');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [page, setPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [inStock, setInStock] = useState(false);
  const [minRating, setMinRating] = useState(0);

  // ============================================
  // 📥 RÉCUPÉRER TOUTES LES CATÉGORIES (depuis l'API)
  // ============================================
  useEffect(() => {
    api.get('/products/categories/')
      .then((r) => {
        const data = r.data.results || r.data;
        setAllCategories(Array.isArray(data) ? data : []);
      })
      .catch(() => setAllCategories([]));
  }, []);

  // ============================================
  // 📦 RÉCUPÉRER LES PRODUITS (avec filtres)
  // ============================================
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        category__slug: slug,
        ordering: sortBy,
        page,
      };

      if (minPrice) params.sale_price__gte = minPrice;
      if (maxPrice) params.sale_price__lte = maxPrice;
      if (inStock) params.stock__gt = 0;
      if (minRating > 0) params.rating__gte = minRating;

      const r = await api.get<PaginatedResponse<Product> | Product[]>('/products/', { params });

      // Gérer pagination Django (count + results)
      if ('results' in r.data) {
        setProducts(r.data.results);
        setTotalProducts(r.data.count);
        setTotalPages(Math.ceil(r.data.count / 20)); // 20 par page (DRF default)
      } else {
        setProducts(r.data as Product[]);
        setTotalProducts((r.data as Product[]).length);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Erreur chargement produits:', error);
      setProducts([]);
      setTotalProducts(0);
    } finally {
      setLoading(false);
    }
  }, [slug, sortBy, minPrice, maxPrice, page, inStock, minRating]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // ============================================
  // 🏷️ CHANGER DE CATÉGORIE (navigation)
  // ============================================
  const handleCategoryChange = (newSlug: string) => {
    setFiltersOpen(false);
    router.push(`/categorie/${newSlug}`);
  };

  // ============================================
  // 🔄 RESET TOUS LES FILTRES
  // ============================================
  const resetFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setSortBy('-created_at');
    setInStock(false);
    setMinRating(0);
    setPage(1);
  };

  // ============================================
  // 📄 NAVIGATION PAGES
  // ============================================
  const goToPage = (n: number) => {
    setPage(n);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Générer les numéros de page à afficher
  const getPageNumbers = (): (number | '...')[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);

    const pages: (number | '...')[] = [1];
    if (page > 3) pages.push('...');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
    return pages;
  };

  const title = slug.charAt(0).toUpperCase() + slug.slice(1).replace('-', ' ');
  const currentCategory = allCategories.find((c) => c.slug === slug);

  return (
    <div className="container-app py-6 lg:py-10">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="h1 mb-1">{currentCategory?.name || `Premium ${title}`}</h1>
          <p className="text-gray-500 text-sm">
            {loading ? '...' : `${totalProducts.toLocaleString()} produits trouvés`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setFiltersOpen(true)}
            className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:border-gold"
          >
            <Filter size={16} /> Filtres
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 whitespace-nowrap">Trier par :</span>
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
              className="input !min-h-[40px] !py-1.5 !pr-8 cursor-pointer"
            >
              <option value="-created_at">Plus récents</option>
              <option value="sale_price">Prix : croissant</option>
              <option value="-sale_price">Prix : décroissant</option>
              <option value="-rating">Mieux notés</option>
              <option value="name">Nom A-Z</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* ============================================
            🎛️ SIDEBAR FILTRES
            ============================================ */}
        <aside className={`
          ${filtersOpen ? 'fixed inset-0 z-50 bg-white p-4 overflow-y-auto' : 'hidden'}
          lg:block lg:static lg:z-auto lg:bg-transparent lg:p-0
        `}>
          {/* Header mobile */}
          {filtersOpen && (
            <div className="flex justify-between items-center mb-4 lg:hidden">
              <h2 className="font-bold text-lg">Filtres</h2>
              <button onClick={() => setFiltersOpen(false)}>
                <X size={24} />
              </button>
            </div>
          )}

          <div className="card sticky top-24 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">Filtres</h3>
              <button
                onClick={resetFilters}
                className="text-xs text-gold hover:underline font-semibold flex items-center gap-1"
              >
                <RotateCcw size={12} /> Reset
              </button>
            </div>

            {/* ============================================
                🏷️ CATÉGORIES (depuis l'API)
                ============================================ */}
            <div>
              <h4 className="font-semibold text-sm mb-3">Catégories</h4>
              {allCategories.length === 0 ? (
                <p className="text-xs text-gray-400">Chargement...</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                  {allCategories.map((cat) => (
                    <label
                      key={cat.id}
                      className="flex items-center justify-between gap-2 cursor-pointer text-sm p-2 rounded hover:bg-gray-50 transition"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="category"
                          checked={slug === cat.slug}
                          onChange={() => handleCategoryChange(cat.slug)}
                          className="w-4 h-4 accent-gold cursor-pointer"
                        />
                        <span className={slug === cat.slug ? 'font-bold text-gold-dark' : ''}>
                          {cat.name}
                        </span>
                      </div>
                      {cat.products_count !== undefined && (
                        <span className="text-xs text-gray-400">({cat.products_count})</span>
                      )}
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* ============================================
                💰 PRIX
                ============================================ */}
            <div>
              <h4 className="font-semibold text-sm mb-3">Prix (€)</h4>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => { setMinPrice(e.target.value); setPage(1); }}
                  className="input !min-h-[36px] !py-1.5"
                  min="0"
                />
                <span className="text-gray-400">—</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }}
                  className="input !min-h-[36px] !py-1.5"
                  min="0"
                />
              </div>

              {/* Suggestions de prix */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {[
                  { label: '< 100€', min: '', max: '100' },
                  { label: '100-500€', min: '100', max: '500' },
                  { label: '500€+', min: '500', max: '' },
                ].map((range) => (
                  <button
                    key={range.label}
                    onClick={() => {
                      setMinPrice(range.min);
                      setMaxPrice(range.max);
                      setPage(1);
                    }}
                    className="text-xs px-2 py-1 bg-gray-100 hover:bg-gold/10 hover:text-gold-dark rounded transition"
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ============================================
                ⭐ NOTE MINIMALE
                ============================================ */}
            <div>
              <h4 className="font-semibold text-sm mb-3">Note minimale</h4>
              <div className="space-y-1">
                {[4, 3, 2, 0].map((rating) => (
                  <label
                    key={rating}
                    className="flex items-center gap-2 cursor-pointer text-sm p-1.5 rounded hover:bg-gray-50"
                  >
                    <input
                      type="radio"
                      name="rating"
                      checked={minRating === rating}
                      onChange={() => { setMinRating(rating); setPage(1); }}
                      className="w-4 h-4 accent-gold"
                    />
                    {rating === 0 ? (
                      <span className="text-gray-600">Toutes</span>
                    ) : (
                      <span className="flex items-center">
                        {Array.from({ length: rating }).map((_, i) => (
                          <span key={i} className="text-amber-400">★</span>
                        ))}
                        <span className="ml-1 text-gray-500 text-xs">et plus</span>
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* ============================================
                📦 DISPONIBILITÉ
                ============================================ */}
            <div>
              <h4 className="font-semibold text-sm mb-3">Disponibilité</h4>
              <label className="flex items-center gap-2 cursor-pointer text-sm p-2 rounded hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={inStock}
                  onChange={(e) => { setInStock(e.target.checked); setPage(1); }}
                  className="w-4 h-4 accent-gold rounded"
                />
                <span>En stock uniquement</span>
              </label>
            </div>

            {/* ============================================
                📊 FILTRES ACTIFS
                ============================================ */}
            {(minPrice || maxPrice || inStock || minRating > 0) && (
              <div className="pt-3 border-t border-gray-200">
                <h4 className="font-semibold text-xs mb-2 text-gray-500 uppercase tracking-wider">
                  Filtres actifs
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {minPrice && (
                    <span className="text-xs bg-gold/10 text-gold-dark px-2 py-1 rounded-full flex items-center gap-1">
                      Min : {minPrice}€
                      <button onClick={() => setMinPrice('')}>
                        <X size={10} />
                      </button>
                    </span>
                  )}
                  {maxPrice && (
                    <span className="text-xs bg-gold/10 text-gold-dark px-2 py-1 rounded-full flex items-center gap-1">
                      Max : {maxPrice}€
                      <button onClick={() => setMaxPrice('')}>
                        <X size={10} />
                      </button>
                    </span>
                  )}
                  {inStock && (
                    <span className="text-xs bg-gold/10 text-gold-dark px-2 py-1 rounded-full flex items-center gap-1">
                      En stock
                      <button onClick={() => setInStock(false)}>
                        <X size={10} />
                      </button>
                    </span>
                  )}
                  {minRating > 0 && (
                    <span className="text-xs bg-gold/10 text-gold-dark px-2 py-1 rounded-full flex items-center gap-1">
                      {minRating}★+
                      <button onClick={() => setMinRating(0)}>
                        <X size={10} />
                      </button>
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Bouton appliquer (mobile uniquement) */}
            <button
              onClick={() => setFiltersOpen(false)}
              className="btn-gold w-full lg:hidden"
            >
              Voir {totalProducts} produits
            </button>
          </div>
        </aside>

        {/* ============================================
            📦 GRILLE PRODUITS
            ============================================ */}
        <div className="lg:col-span-3">
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
          ) : products.length === 0 ? (
            <div className="card text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-gray-700 font-semibold text-lg mb-2">
                Aucun produit trouvé
              </p>
              <p className="text-sm text-gray-400 mb-6">
                Essayez de modifier vos filtres ou de changer de catégorie
              </p>
              <button
                onClick={resetFilters}
                className="btn-gold inline-flex"
              >
                <RotateCcw size={16} /> Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>

              {/* ============================================
                  📄 PAGINATION DYNAMIQUE
                  ============================================ */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-10 flex-wrap">
                  {/* Bouton précédent */}
                  <button
                    onClick={() => goToPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="w-10 h-10 rounded-lg border border-gray-200 hover:border-gold flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-gray-200 transition"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {/* Numéros de pages */}
                  {getPageNumbers().map((n, i) => (
                    n === '...' ? (
                      <span key={`dots-${i}`} className="px-2 text-gray-400">...</span>
                    ) : (
                      <button
                        key={n}
                        onClick={() => goToPage(n)}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center font-semibold transition ${
                          page === n
                            ? 'bg-gray-900 text-white'
                            : 'border border-gray-200 hover:border-gold'
                        }`}
                      >
                        {n}
                      </button>
                    )
                  ))}

                  {/* Bouton suivant */}
                  <button
                    onClick={() => goToPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="w-10 h-10 rounded-lg border border-gray-200 hover:border-gold flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-gray-200 transition"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}

              {/* Info pagination */}
              <p className="text-center text-sm text-gray-500 mt-4">
                Page {page} sur {totalPages} • {totalProducts} produits au total
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}