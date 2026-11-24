import HeroHeader from '@/components/client/HeroHeader'; // ou importez votre HeaderClient
import HeaderClient from '@/components/client/HeaderClient';
import { api } from '@/lib/api';
import { getShopSettings } from '@/lib/shop-server';
import ProductCard from '@/components/client/ProductCard';
import Link from 'next/link';
import type { Product, Category } from '@/types';
import { ArrowRight } from 'lucide-react';

// Si vous utilisez le HeaderClient personnalisé, importez-le ainsi :
// import HeaderClient from '@/components/client/HeaderClient';

// Page régénérée au plus toutes les 60 s : les nouveaux produits apparaissent sans rebuild
export const revalidate = 60;

// Cartes « collections » de l'accueil : photo réaliste + voile de couleur.
// Pour personnaliser : changer l'image (URL ou fichier dans public/), le texte et la catégorie visée.
// « base » = couleur affichée pendant le chargement de la photo.
const COLLECTIONS = [
  {
    title: 'Le son, en grand',
    subtitle: "Enceintes et systèmes audio pour vivre l'expérience ultime",
    cta: 'Découvrir',
    badge: 'Premium',
    href: '/categorie/audio',
    image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=1200&q=75',
    tint: 'from-purple-950/90 via-purple-900/40',
    base: 'bg-purple-900',
  },
  {
    title: 'Réalité virtuelle',
    cta: 'Acheter',
    href: '/categorie/gaming',
    image: 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=900&q=75',
    tint: 'from-rose-900/90 via-rose-700/35',
    base: 'bg-rose-700',
  },
  {
    title: 'Casques audio',
    cta: 'Explorer',
    href: '/categorie/audio',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=900&q=75',
    tint: 'from-blue-950/90 via-blue-800/35',
    base: 'bg-blue-800',
  },
  {
    title: 'Smartphones',
    cta: 'Découvrir',
    href: '/categorie/smartphones',
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=900&q=75',
    tint: 'from-gray-950/90 via-gray-800/35',
    base: 'bg-gray-800',
  },
  {
    title: 'Appareils photo',
    cta: 'Voir la collection',
    href: '/categorie/photo',
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=900&q=75',
    tint: 'from-orange-950/90 via-orange-800/35',
    base: 'bg-orange-800',
  },
];

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
  const [{ featured, bestSellers, categories }, shop] = await Promise.all([getData(), getShopSettings()]);

  return (
    <>
      {/* En-tête client */}
      
      <HeroHeader
        mediaSrc="https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=1920&q=80"           
        mediaType="image"
        badgeText={`✨ ${shop.shop_name}`}
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
          ★ Bienvenue chez {shop.shop_name} ★ {shop.shop_tagline} ★ Livraison suivie ★ Bienvenue chez {shop.shop_name} ★ {shop.shop_tagline} ★
        </div>
      </section>

      {/* ============================================
          🎨 COLLECTIONS BENTO GRID
          ============================================ */}
      <section className="container-app py-8">
        <div className="text-center mb-8">
          <h2 className="h2">Découvrez nos collections</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {COLLECTIONS.map((c, i) => (
            <Link
              key={c.title}
              href={c.href}
              className={`relative rounded-2xl overflow-hidden p-6 flex flex-col justify-end text-white group ${c.base} ${
                i === 0 ? 'md:row-span-2 aspect-square md:aspect-auto min-h-[300px]' : 'min-h-[180px]'
              }`}
            >
              {/* Photo d'arrière-plan, légèrement zoomée au survol */}
              <img
                src={c.image}
                alt=""
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              {/* Voile coloré (couleur de la collection) pour garder le texte lisible */}
              <div className={`absolute inset-0 bg-gradient-to-t ${c.tint} to-transparent`} />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition" />

              <div className="relative z-10">
                {c.badge && (
                  <span className="inline-block bg-gold text-dark text-xs font-bold px-2 py-1 rounded-full mb-3">{c.badge}</span>
                )}
                <h3 className={`font-serif font-bold mb-2 drop-shadow ${i === 0 ? 'text-2xl lg:text-3xl' : 'text-xl'}`}>{c.title}</h3>
                {c.subtitle && <p className="text-sm text-white/85 mb-3">{c.subtitle}</p>}
                <span className="text-sm font-bold inline-flex items-center gap-1 group-hover:gap-2 group-hover:text-gold transition-all">
                  {c.cta} →
                </span>
              </div>
            </Link>
          ))}
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
            <h2 className="h2 mb-3">L&apos;expérience {shop.shop_name}</h2>
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