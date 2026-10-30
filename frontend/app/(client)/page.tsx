import HeroHeader from '@/components/client/HeroHeader'; // ou importez votre HeaderClient
import HeaderClient from '@/components/client/HeaderClient';
import { api } from '@/lib/api';
import ProductCard from '@/components/client/ProductCard';
import Link from 'next/link';
import type { Product, Category } from '@/types';
import { ArrowRight } from 'lucide-react';

// Si vous utilisez le HeaderClient personnalisé, importez-le ainsi :
// import HeaderClient from '@/components/client/HeaderClient';

interface PaginatedResponse<T> {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results: T[];
}

async function getData() {
  try {
    const [featured, bestSellers, cats] = await Promise.all([
      api.get<Product[]>('/products/featured/'),
      api.get<Product[]>('/products/best_sellers/'),
      api.get<PaginatedResponse<Category> | Category[]>('/products/categories/'),
    ]);

    const categoriesData = cats.data;
    const categories: Category[] = Array.isArray(categoriesData)
      ? categoriesData
      : categoriesData.results || [];

    return {
      featured: featured.data,
      bestSellers: bestSellers.data,
      categories,
    };
  } catch (error) {
    console.error('Erreur de chargement:', error);
    return { featured: [], bestSellers: [], categories: [] };
  }
}

export default async function HomePage() {
  const { featured, bestSellers, categories } = await getData();

  return (
    <>
      {/* En-tête client */}
      
      <HeroHeader
        mediaSrc="https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=1920&q=80"           
        mediaType="image"
        badgeText="✨ Global Luxe Premium"
        title={['Shop Smarter.', 'Live Better.', 'Experience Luxury.']}
        subtitle="Votre marketplace premium..."
        ctaText="Explorer les produits"
        ctaHref="/categorie/electronics"
        showCategories={true}
      /> {/* ou <HeaderClient /> selon votre choix */}

      {/* ============================================
      🎯 CATÉGORIES — Avec images réelles
      ============================================ */}
      {categories.length > 0 && (
  <section className="container-app py-10 lg:py-14">
    <div className="text-center mb-8">
      <p className="text-xs text-gold uppercase tracking-widest font-bold mb-2">
        Nos univers
      </p>
      <h2 className="h2">Découvrez nos catégories</h2>
      <p className="text-gray-500 text-sm mt-1">Trouvez ce qui vous correspond</p>
    </div>

    {/* Grille moderne avec images */}
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-3 sm:gap-4">
      {categories.slice(0, 8).map((c) => (
        <Link
          key={c.id}
          href={`/categorie/${c.slug}`}
          className="group relative aspect-square rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
        >
          {/* Image de fond */}
          {c.image ? (
            <img
              src={c.image}
              alt={c.name}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition duration-500"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-gold via-gold-light to-gold-dark" />
          )}

          {/* Overlay sombre */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

          {/* Bordure dorée au hover */}
          <div className="absolute inset-0 border-2 border-transparent group-hover:border-gold rounded-2xl transition" />

          {/* Contenu */}
          <div className="absolute inset-x-0 bottom-0 p-4 z-10">
            <h3 className="text-white font-bold text-lg group-hover:text-gold transition">
              {c.name}
            </h3>
            {c.products_count !== undefined && (
              <p className="text-white/70 text-xs mt-1">
                {c.products_count} produit{c.products_count > 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Flèche en haut à droite */}
          <div className="absolute top-3 right-3 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
            <ArrowRight size={16} className="text-white" />
          </div>
        </Link>
      ))}
    </div>
  </section>
      )}

      {/* ============================================
          ⭐ HIGHLY RECOMMENDED
          ============================================ */}
      <section className="container-app py-8">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="h2">Highly Recommended</h2>
            <p className="text-gray-500 text-sm mt-1">
              Shop More, Save More! Big Discounts!
            </p>
          </div>
          <Link
            href="/categorie/electronics"
            className="hidden sm:block text-sm text-gray-700 hover:text-gold font-medium border border-gray-300 px-4 py-2 rounded-full hover:border-gold transition"
          >
            Voir tout →
          </Link>
        </div>
        {featured.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            Aucun produit pour le moment
          </div>
        )}
      </section>

      {/* ============================================
          📢 BANDEAU PROMO ANIMÉ
          ============================================ */}
      <section className="bg-gradient-to-r from-gray-900 via-black to-gray-900 text-gold py-4 my-12 overflow-hidden border-y-2 border-gold/30">
        <div className="whitespace-nowrap animate-marquee font-serif tracking-widest text-sm md:text-base">
          ★ Smart Shopping! ★ Shop More, Save More! ★ Exclusive Big Discounts! ★ Welcome to Global Luxe ★ Smart Shopping! ★ Shop More, Save More! ★
        </div>
      </section>

      {/* ============================================
          🎨 COLLECTIONS BENTO GRID
          ============================================ */}
      <section className="container-app py-8">
        <div className="text-center mb-8">
          <h2 className="h2">Découvrez nos Collections</h2>
          <p className="text-gray-500 text-sm mt-1">
            Discover our curated collections
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {/* GROSSE CARTE */}
          <Link
            href="/categorie/electronics"
            className="md:row-span-2 bg-gradient-to-br from-purple-900 to-purple-700 rounded-2xl overflow-hidden relative aspect-square md:aspect-auto p-6 flex flex-col justify-end text-white min-h-[300px] hover:scale-[1.02] transition group cursor-pointer"
          >
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition" />
            <div className="relative z-10">
              <span className="inline-block bg-gold text-dark text-xs font-bold px-2 py-1 rounded-full mb-3">
                Premium
              </span>
              <h3 className="font-serif text-2xl font-bold mb-2">
                Smart Sound with Smart System
              </h3>
              <p className="text-sm text-white/80 mb-3">
                Découvrez l&apos;expérience audio ultime
              </p>
              <span className="text-sm font-bold hover:text-gold flex items-center gap-1">
                Shop Now →
              </span>
            </div>
          </Link>

          {/* Carte 2 : VR */}
          <Link
            href="/categorie/electronics"
            className="bg-gradient-to-br from-pink-600 to-rose-500 rounded-2xl overflow-hidden relative p-6 flex flex-col justify-end text-white min-h-[180px] hover:scale-[1.02] transition group cursor-pointer"
          >
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition" />
            <div className="relative z-10">
              <h3 className="font-serif text-xl font-bold mb-2">
                Virtual Reality Experience
              </h3>
              <span className="text-sm hover:text-yellow-200">Buy Now →</span>
            </div>
          </Link>

          {/* Carte 3 : Headphone */}
          <Link
            href="/categorie/electronics"
            className="bg-gradient-to-br from-blue-700 to-cyan-600 rounded-2xl overflow-hidden relative p-6 flex flex-col justify-end text-white min-h-[180px] hover:scale-[1.02] transition group cursor-pointer"
          >
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition" />
            <div className="relative z-10">
              <h3 className="font-serif text-xl font-bold mb-2">
                Smart Headphone
              </h3>
              <span className="text-sm hover:text-yellow-200">Explore →</span>
            </div>
          </Link>

          {/* Carte 4 : Smartphone */}
          <Link
            href="/categorie/electronics"
            className="bg-gradient-to-br from-gray-800 to-gray-600 rounded-2xl overflow-hidden relative p-6 flex flex-col justify-end text-white min-h-[180px] hover:scale-[1.02] transition group cursor-pointer"
          >
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition" />
            <div className="relative z-10">
              <h3 className="font-serif text-xl font-bold mb-2">Smartphone</h3>
              <span className="text-sm hover:text-gold">Discover →</span>
            </div>
          </Link>

          {/* Carte 5 : Camera */}
          <Link
            href="/categorie/electronics"
            className="bg-gradient-to-br from-amber-700 to-orange-600 rounded-2xl overflow-hidden relative p-6 flex flex-col justify-end text-white min-h-[180px] hover:scale-[1.02] transition group cursor-pointer"
          >
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition" />
            <div className="relative z-10">
              <h3 className="font-serif text-xl font-bold mb-2">
                Camera Collection
              </h3>
              <span className="text-sm hover:text-yellow-200">
                Shop Cameras →
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* ============================================
          🔥 BEST SELLERS
          ============================================ */}
      <section className="container-app py-8 mb-12">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="h2">Best Selling Products</h2>
            <p className="text-gray-500 text-sm mt-1">
              Selected with care for the smartest experience
            </p>
          </div>
          <Link
            href="/categorie/electronics"
            className="hidden sm:block text-sm text-gray-700 hover:text-gold font-medium border border-gray-300 px-4 py-2 rounded-full hover:border-gold transition"
          >
            Plus →
          </Link>
        </div>
        {bestSellers.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {bestSellers.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            Aucun best-seller pour le moment
          </div>
        )}
      </section>

      {/* ============================================
          💎 SECTION POURQUOI NOUS CHOISIR
          ============================================ */}
      <section className="bg-gradient-to-br from-gray-50 to-white py-16 border-t border-gray-100">
        <div className="container-app">
          <div className="text-center mb-12">
            <p className="text-xs text-gold uppercase tracking-widest font-bold mb-2">
              Pourquoi nous choisir
            </p>
            <h2 className="h2 mb-3">L&apos;expérience Global Luxe</h2>
            <p className="text-gray-500 text-sm max-w-xl mx-auto">
              Une marketplace pensée pour vous offrir le meilleur du shopping en ligne
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                icon: '🚚',
                title: 'Livraison rapide',
                desc: 'Livraison gratuite dès 50€ partout dans le monde en 7-12 jours',
              },
              {
                icon: '🔒',
                title: 'Paiement sécurisé',
                desc: 'Vos données sont protégées par les meilleurs standards de sécurité',
              },
              {
                icon: '🎁',
                title: 'Service premium',
                desc: 'Support client 24/7 et retours gratuits sous 30 jours',
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="card text-center group hover:shadow-xl transition"
              >
                <div className="text-5xl mb-4 group-hover:scale-110 transition">
                  {feature.icon}
                </div>
                <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          📧 NEWSLETTER
          ============================================ */}
      <section className="container-app py-12 mb-8">
        <div className="bg-gradient-to-br from-dark via-dark-soft to-dark rounded-3xl p-8 lg:p-12 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gold/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gold/5 rounded-full blur-3xl" />

          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="font-serif text-3xl lg:text-4xl font-black mb-3">
              Restez informé des dernières{' '}
              <span className="bg-gradient-to-r from-gold to-gold-light bg-clip-text text-transparent">
                nouveautés
              </span>
            </h2>
            <p className="text-gray-300 mb-6 text-sm lg:text-base">
              Inscrivez-vous à notre newsletter et recevez 10% de réduction sur votre première commande.
            </p>

            <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Votre adresse email"
                className="flex-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 outline-none focus:border-gold transition"
              />
              <button
                type="submit"
                className="btn-gold whitespace-nowrap"
              >
                S&apos;inscrire
              </button>
            </form>

            <p className="text-xs text-gray-400 mt-4">
              🔒 Vos données sont protégées. Désinscription en 1 clic.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}