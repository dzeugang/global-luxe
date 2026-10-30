'use client';
import { useEffect, useState, use } from 'react';
import { api } from '@/lib/api';
import { useCart } from '@/store/cart';
import type { Product } from '@/types';
import Link from 'next/link';
import {
  ShoppingCart, Star, Check, ChevronRight, Truck, Clock,
  Shield, RefreshCw, HeadphonesIcon, Battery, Activity,
  Droplets, MapPin, Play
} from 'lucide-react';

export default function ProductDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [activeTab, setActiveTab] = useState<'description' | 'specs' | 'reviews'>('description');
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedSize, setSelectedSize] = useState('41mm');
  const [added, setAdded] = useState(false);
  const addItem = useCart((s) => s.addItem);

  useEffect(() => {
    api.get(`/products/${id}/`).then((r) => setProduct(r.data)).catch(() => {});
  }, [id]);

  const handleAdd = () => {
    if (!product) return;
    addItem(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (!product) {
    return (
      <div className="container-app py-12">
        <div className="animate-pulse grid md:grid-cols-2 gap-8">
          <div className="aspect-square bg-gray-200 rounded-2xl"></div>
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="h-10 bg-gray-200 rounded w-3/4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const images = product.images?.length ? product.images : [product.main_image];
  const colors = ['#9CA3AF', '#1F2937', '#FCD34D'];

  return (
    <div className="container-app py-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-gold">Accueil</Link>
        <ChevronRight size={14} />
        <Link href={`/categorie/${product.category_slug || 'electronics'}`} className="hover:text-gold">
          {product.category_name || 'Électronique'}
        </Link>
        <ChevronRight size={14} />
        <span className="text-gray-900 font-medium truncate">{product.name}</span>
      </div>

      {/* MAIN PRODUCT SECTION */}
      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 mb-12">
        {/* GALERIE */}
        <div>
          <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl overflow-hidden mb-4 relative">
            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
              <span className="bg-emerald-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                NOUVEAU
              </span>
              <span className="bg-white text-gray-900 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-gray-200">
                ⚡ Stock Limité
              </span>
            </div>

            <img
              src={images[activeImage] || product.main_image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Thumbnails */}
          <div className="grid grid-cols-4 gap-3">
            {images.slice(0, 4).map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImage(i)}
                className={`aspect-square rounded-xl overflow-hidden border-2 transition relative ${
                  activeImage === i ? 'border-gray-900' : 'border-gray-200 hover:border-gold'
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
                {i === 3 && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white">
                    <Play size={24} />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* INFOS PRODUIT */}
        <div>
          <p className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-2">
            {product.category_name || 'LUMINA TECH'}
          </p>

          {/* Note */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} size={16} fill="#FBBF24" stroke="#FBBF24" />
              ))}
            </div>
            <span className="text-sm text-gray-500">(128 avis)</span>
          </div>

          <h1 className="text-3xl lg:text-4xl font-black text-gray-900 mb-4 leading-tight">
            {product.name}
          </h1>

          {/* Prix */}
          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-4xl font-black text-gray-900">
              {Number(product.sale_price).toFixed(2)} €
            </span>
            {product.base_price && Number(product.base_price) > Number(product.sale_price) && (
              <>
                <span className="text-xl text-gray-400 line-through">
                  {Number(product.base_price).toFixed(2)} €
                </span>
                <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded">
                  -25%
                </span>
              </>
            )}
          </div>
          <p className="text-sm text-gray-500 mb-6 flex items-center gap-1">
            ℹ️ Taxes incluses. TVA calculée à l&apos;étape de paiement.
          </p>

          <hr className="border-gray-200 mb-6" />

          {/* Couleur */}
          <div className="mb-6">
            <p className="text-sm font-bold mb-3">
              Couleur: <span className="font-normal text-gray-700">Gris Titane</span>
            </p>
            <div className="flex gap-3">
              {colors.map((color, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedColor(i)}
                  className={`w-12 h-12 rounded-full border-2 transition relative ${
                    selectedColor === i ? 'border-gray-900 ring-2 ring-offset-2 ring-gray-900' : 'border-gray-200'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Taille */}
          <div className="mb-6">
            <div className="flex justify-between mb-3">
              <p className="text-sm font-bold">Taille du boîtier</p>
              <button className="text-sm text-emerald-600 hover:underline">Guide des tailles</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {['41mm', '45mm (+30€)'].map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`py-3 px-4 border-2 rounded-lg font-semibold transition ${
                    selectedSize === size
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Infos livraison */}
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Truck size={18} className="text-emerald-600" />
              <span className="font-bold text-sm">Informations de livraison</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm mb-3">
              <div>
                <p className="text-gray-500">Livrer vers</p>
                <p className="font-semibold">France ▾</p>
              </div>
              <div className="text-right">
                <p className="text-gray-500">Frais estimés</p>
                <p className="font-semibold text-emerald-600">Livraison Gratuite</p>
              </div>
            </div>
            <div className="bg-white rounded-lg p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                <Clock size={16} className="text-emerald-600" />
              </div>
              <div>
                <p className="font-bold text-sm">Livraison estimée : 7-12 jours ouvrables</p>
                <p className="text-xs text-gray-500">Expédition rapide depuis notre entrepôt international (Suivi inclus)</p>
              </div>
            </div>
          </div>

          {/* Boutons */}
          <button
            onClick={handleAdd}
            className={`w-full py-4 rounded-xl font-bold text-lg mb-3 transition flex items-center justify-center gap-2 ${
              added ? 'bg-emerald-600' : 'bg-emerald-600 hover:bg-emerald-700'
            } text-white`}
          >
            {added ? <><Check size={20} /> Ajouté au panier ✓</> : <><ShoppingCart size={20} /> Ajouter au panier</>}
          </button>
          <button className="w-full py-3 rounded-xl border-2 border-gray-900 font-semibold hover:bg-gray-900 hover:text-white transition">
            Acheter maintenant avec <span className="font-black">GPay</span>
          </button>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
            {[
              { icon: Shield, label: 'Paiement', sub: 'Sécurisé' },
              { icon: RefreshCw, label: 'Retours', sub: '30 Jours' },
              { icon: HeadphonesIcon, label: 'Support', sub: '24/7' },
            ].map((t, i) => {
              const Icon = t.icon;
              return (
                <div key={i} className="text-center">
                  <Icon size={20} className="mx-auto mb-1 text-gray-600" />
                  <p className="text-xs font-semibold">{t.label}</p>
                  <p className="text-xs text-gray-500">{t.sub}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-8">
          {[
            { key: 'description', label: 'Description' },
            { key: 'specs', label: 'Caractéristiques' },
            { key: 'reviews', label: 'Avis (128)' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as 'description' | 'specs' | 'reviews')}
              className={`pb-4 font-bold text-base transition border-b-2 ${
                activeTab === tab.key
                  ? 'text-emerald-600 border-emerald-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENU TAB */}
      {activeTab === 'description' && (
        <div className="grid lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-black mb-4">Conçue pour repousser les limites</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              {product.description || 'Découvrez une qualité exceptionnelle avec ce produit premium. Conçu pour offrir une expérience inoubliable, il combine technologie de pointe et design raffiné.'}
            </p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2"><span className="text-emerald-600">•</span> Boîtier en titane ultra-résistant</li>
              <li className="flex items-start gap-2"><span className="text-emerald-600">•</span> Écran Always-On OLED 1.9&quot;</li>
              <li className="flex items-start gap-2"><span className="text-emerald-600">•</span> Autonomie jusqu&apos;à 14 jours</li>
              <li className="flex items-start gap-2"><span className="text-emerald-600">•</span> Résistance à l&apos;eau 5 ATM</li>
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Battery, title: 'Batterie Longue Durée', desc: 'Jusqu\'à 14 jours d\'autonomie en mode standard, 30 jours en mode économie.' },
              { icon: Activity, title: 'Suivi Santé Avancé', desc: 'Capteurs biométriques de dernière génération pour l\'ECG et le SpO2.' },
              { icon: Droplets, title: 'Étanchéité 5 ATM', desc: 'Plongez jusqu\'à 50 mètres sans crainte. Parfaite pour la natation.' },
              { icon: MapPin, title: 'GPS Double Bande', desc: 'Positionnement ultra-précis même dans les environnements urbains denses.' },
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="bg-gray-50 rounded-xl p-4">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mb-3 shadow-sm">
                    <Icon size={20} className="text-gray-700" />
                  </div>
                  <h3 className="font-bold text-sm mb-1">{f.title}</h3>
                  <p className="text-xs text-gray-600 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'specs' && (
        <div className="card">
          <table className="w-full text-sm">
            <tbody>
              {[
                ['Marque', product.category_name || 'Lumina Tech'],
                ['Catégorie', product.category_name || 'Montres Connectées'],
                ['Matière', 'Titane'],
                ['Poids', '45g'],
                ['Stock', `${product.stock} unités`],
                ['SKU', product.sku || 'N/A'],
              ].map(([k, v]) => (
                <tr key={k} className="border-b border-gray-100 last:border-0">
                  <td className="py-3 font-bold text-gray-700 w-1/3">{k}</td>
                  <td className="py-3 text-gray-600">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'reviews' && (
        <div className="card text-center py-12 text-gray-500">
          <Star size={40} className="mx-auto mb-3 text-gray-300" />
          <p>Les avis seront affichés ici.</p>
        </div>
      )}
    </div>
  );
}