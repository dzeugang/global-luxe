'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Search, Globe, ShoppingCart, Menu, X, Mail } from 'lucide-react';
import { useCart } from '@/store/cart';   // ✅ Import du store Zustand
import { useShop } from '@/components/ShopProvider';
import { api } from '@/lib/api';
import type { Category } from '@/types';

// Menu de secours, remplacé par les vraies catégories dès qu'elles sont chargées
const DEFAULT_NAV = [
  { label: 'Smartphones', href: '/categorie/smartphones' },
  { label: 'Beauté', href: '/categorie/beauty' },
  { label: 'Maison', href: '/categorie/home' },
  { label: 'Mode', href: '/categorie/fashion' },
  { label: 'Gaming', href: '/categorie/gaming' },
];

export default function HeaderClient() {
  const shop = useShop();
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMobileOpen, setSearchMobileOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [nav, setNav] = useState(DEFAULT_NAV);

  useEffect(() => {
    api.get('/products/categories/')
      .then((r) => {
        const cats: Category[] = (r.data.results || r.data).slice(0, 5);
        if (cats.length) setNav(cats.map((c) => ({ label: c.name, href: `/categorie/${c.slug}` })));
      })
      .catch(() => {});
  }, []);

  // ✅ COMPTEUR DU PANIER EN TEMPS RÉEL (via Zustand)
  const cartCount = useCart((s) => s.count());

  // Effet pour le scroll
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Effet pour le montage (évite l'erreur d'hydratation)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Raccourci clavier Cmd/Ctrl + K pour focus la recherche
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // ============================================
  // 🔍 GÉRER LA RECHERCHE
  // ============================================
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/recherche?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchMobileOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-white/80 backdrop-blur-xl shadow-lg shadow-black/5 border-b border-gray-100/50'
            : 'bg-white border-b border-gray-100'
        }`}
      >
        <div className="container-app py-4 flex items-center justify-between gap-4">
          {/* LOGO */}
          <Link href="/" className="group relative flex items-center" aria-label={shop.shop_name}>
            {shop.logo_url ? (
              <img src={shop.logo_url} alt={shop.shop_name} className="h-9 lg:h-11 w-auto" />
            ) : (
              <span className="font-serif text-xl lg:text-2xl font-black tracking-wider whitespace-nowrap uppercase bg-gradient-to-r from-gold via-gold-light to-gold-dark bg-[length:200%_auto] animate-shimmer bg-clip-text text-transparent">
                {shop.shop_name}
              </span>
            )}
          </Link>

          {/* Navigation desktop */}
          <nav className="hidden lg:flex gap-8 text-sm font-medium">
            {nav.map((n) => {
              const active =
                (n.href === '/' && pathname === '/') ||
                (n.href !== '/' && pathname?.startsWith(n.href));
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`relative py-1 transition-colors duration-300 group ${
                    active ? 'text-dark' : 'text-gray-500 hover:text-dark'
                  }`}
                >
                  {n.label}
                  <span
                    className={`absolute -bottom-1 left-0 h-[2px] bg-gradient-to-r from-gold to-gold-dark rounded-full transition-all duration-300 ${
                      active ? 'w-full' : 'w-0 group-hover:w-full'
                    }`}
                  />
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* ✅ RECHERCHE DESKTOP — Formulaire fonctionnel */}
            <form
              onSubmit={handleSearch}
              className="hidden md:flex items-center bg-gray-50/80 border border-gray-200 rounded-full px-4 py-2 w-64 transition-all duration-300 focus-within:border-gold/50 focus-within:shadow-[0_0_20px_rgba(212,175,55,0.15)] focus-within:bg-white"
            >
              <Search size={16} className="text-gray-400 mr-2 flex-shrink-0" />
              <input
                ref={searchInputRef}
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher des produits..."
                className="bg-transparent border-0 outline-none text-sm w-full placeholder:text-gray-400"
              />
              {/* Bouton clear */}
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-gray-400 hover:text-gray-700 ml-1"
                >
                  <X size={14} />
                </button>
              )}
              {/* Raccourci */}
              {!searchQuery && (
                <kbd className="hidden lg:inline-block ml-2 px-1.5 py-0.5 text-[10px] text-gray-400 bg-white border border-gray-200 rounded font-mono">
                  ⌘K
                </kbd>
              )}
            </form>

            {/* ✅ BOUTON RECHERCHE MOBILE */}
            <button
              onClick={() => setSearchMobileOpen(true)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-full transition"
              aria-label="Rechercher"
            >
              <Search size={20} className="text-gray-600" />
            </button>

            <button
              className="hidden md:flex p-2 hover:bg-gray-100 rounded-full transition-all duration-300 hover:scale-110"
              aria-label="Langue"
            >
              <Globe size={20} className="text-gray-600" />
            </button>

            {/* ✅ ICÔNE PANIER avec compteur dynamique */}
            <Link
              href="/panier"
              className="relative p-2 hover:bg-gray-100 rounded-full transition-all duration-300 hover:scale-110 group"
              aria-label={`Panier (${mounted ? cartCount : 0} articles)`}
            >
              <ShoppingCart
                size={20}
                className="text-gray-600 group-hover:text-gold transition-colors"
              />
              {/* ✅ BADGE COMPTEUR avec animation */}
              {mounted && cartCount > 0 && (
                <span
                  key={cartCount}  /* ← Force re-render pour animation */
                  className="absolute -top-1 -right-1 bg-gradient-to-br from-gold to-gold-dark text-dark text-xs rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center font-bold shadow-lg shadow-gold/30 animate-bounce-in"
                >
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>

            <Link
              href="/checkout"
              className="hidden lg:inline-flex items-center gap-2 bg-gradient-to-r from-dark to-dark-soft text-white px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 hover:shadow-xl hover:shadow-dark/20 hover:-translate-y-0.5 hover:from-dark-soft hover:to-dark"
            >
              <Mail size={16} className="text-gold" />
              Email to Order
            </Link>

            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-full transition"
              aria-label="Menu"
            >
              <Menu size={24} className="text-gray-700" />
            </button>
          </div>
        </div>
      </header>

      {/* ============================================
          🔍 OVERLAY RECHERCHE MOBILE
          ============================================ */}
      {searchMobileOpen && (
        <div className="fixed inset-0 z-[80] bg-white md:hidden animate-fade-in">
          <div className="p-4 border-b border-gray-200 flex items-center gap-3">
            <button
              onClick={() => setSearchMobileOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-full"
              aria-label="Fermer"
            >
              <X size={24} />
            </button>
            <form onSubmit={handleSearch} className="flex-1 flex items-center bg-gray-50 border border-gray-200 rounded-full px-4 py-2 focus-within:border-gold">
              <Search size={18} className="text-gray-400 mr-2" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher..."
                autoFocus
                className="bg-transparent border-0 outline-none text-sm w-full"
              />
            </form>
          </div>

          {/* Suggestions */}
          <div className="p-4">
            <p className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-3">
              Suggestions populaires
            </p>
            <div className="flex flex-wrap gap-2">
              {['iPhone 15', 'AirPods', 'Apple Watch', 'Sony WH-1000XM5', 'PS5', 'Parfum'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    setSearchQuery(tag);
                    router.push(`/recherche?q=${encodeURIComponent(tag)}`);
                    setSearchMobileOpen(false);
                  }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gold/10 hover:text-gold-dark rounded-full text-sm transition"
                >
                  {tag}
                </button>
              ))}
            </div>

            <p className="text-xs uppercase tracking-wider text-gray-500 font-bold mt-6 mb-3">
              Catégories
            </p>
            <div className="space-y-1">
              {nav.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => setSearchMobileOpen(false)}
                  className="block p-3 hover:bg-gray-50 rounded-lg text-sm font-medium"
                >
                  {n.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================
          📱 DRAWER MENU MOBILE
          ============================================ */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] lg:hidden transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed top-0 right-0 bottom-0 w-[85%] max-w-sm bg-white/95 backdrop-blur-xl z-[70] lg:hidden shadow-2xl overflow-y-auto border-l border-gray-100">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <span className="font-serif text-xl font-black uppercase bg-gradient-to-r from-gold to-gold-dark bg-clip-text text-transparent">
                {shop.shop_name}
              </span>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <X size={24} />
              </button>
            </div>

            {/* Recherche dans le menu mobile */}
            <div className="p-4 border-b border-gray-100">
              <form onSubmit={handleSearch} className="flex items-center bg-gray-50 border border-gray-200 rounded-full px-4 py-2">
                <Search size={16} className="text-gray-400 mr-2" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher..."
                  className="bg-transparent border-0 outline-none text-sm w-full"
                />
              </form>
            </div>

            <nav className="flex flex-col p-4 gap-1">
              {nav.map((n, i) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="py-3 px-3 rounded-lg text-base font-medium hover:bg-gray-50 transition-all duration-300 hover:pl-5 border-l-2 border-transparent hover:border-gold"
                  style={{ animationDelay: `${i * 50}ms` }}
                  onClick={() => setMobileOpen(false)}
                >
                  {n.label}
                </Link>
              ))}

              <Link href="/suivi" onClick={() => setMobileOpen(false)} className="py-3 px-3 rounded-lg text-base font-medium hover:bg-gray-50 transition mt-2">
                Suivre ma commande
              </Link>
              <Link href="/contact" onClick={() => setMobileOpen(false)} className="py-3 px-3 rounded-lg text-base font-medium hover:bg-gray-50 transition">
                Contact
              </Link>

              {/* Lien panier mobile avec compteur */}
              <Link
                href="/panier"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-between py-3 px-3 rounded-lg text-base font-medium hover:bg-gray-50 transition mt-2"
              >
                <span className="flex items-center gap-2">
                  <ShoppingCart size={18} /> Mon panier
                </span>
                {mounted && cartCount > 0 && (
                  <span className="bg-gold text-dark text-xs font-bold px-2 py-1 rounded-full">
                    {cartCount}
                  </span>
                )}
              </Link>

              <Link
                href="/checkout"
                className="mt-4 btn-gold w-full justify-center"
                onClick={() => setMobileOpen(false)}
              >
                <Mail size={18} /> Email to Order
              </Link>
            </nav>
          </aside>
        </>
      )}
    </>
  );
}