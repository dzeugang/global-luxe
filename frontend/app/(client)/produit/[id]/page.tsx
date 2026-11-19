'use client';
import { useEffect, useMemo, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShoppingCart, Star, Check, ChevronRight, Truck, Clock, RefreshCw, MessageCircle, Minus, Plus, Zap,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useCart, variantOf } from '@/store/cart';
import { useShop } from '@/components/ShopProvider';
import type { Product, ShippingMethod } from '@/types';

const NEW_DAYS = 30; // un produit est « Nouveau » pendant 30 jours

export default function ProductDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const shop = useShop();
  const [product, setProduct] = useState<Product | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [methods, setMethods] = useState<ShippingMethod[]>([]);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'description' | 'specs'>('description');
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const addItem = useCart((s) => s.addItem);
  const inCart = useCart((s) => (product ? s.quantityOf(product.id) : 0));

  useEffect(() => {
    api.get<Product>(`/products/${id}/`)
      .then((r) => {
        setProduct(r.data);
        setIsNew(!!r.data.created_at && Date.now() - new Date(r.data.created_at).getTime() < NEW_DAYS * 86400000);
        // Présélectionne la première valeur de chaque option
        setSelected(Object.fromEntries((r.data.options || []).map((g) => [g.name, g.values[0]?.label])));
      })
      .catch(() => setNotFound(true));
    api.get('/shipping/').then((r) => setMethods(r.data.results || r.data)).catch(() => {});
  }, [id]);

  const variant = useMemo(() => (product ? variantOf(product, selected) : null), [product, selected]);

  if (notFound) {
    return (
      <div className="container-app py-16 text-center">
        <h1 className="h1 mb-4">Produit introuvable</h1>
        <Link href="/" className="btn-gold">Retour à la boutique</Link>
      </div>
    );
  }

  if (!product || !variant) {
    return (
      <div className="container-app py-12">
        <div className="animate-pulse grid md:grid-cols-2 gap-8">
          <div className="aspect-square bg-gray-200 rounded-2xl" />
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3" />
            <div className="h-10 bg-gray-200 rounded w-3/4" />
            <div className="h-8 bg-gray-200 rounded w-1/4" />
            <div className="h-20 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  const gallery = Array.from(new Set([product.main_image, ...(product.images || [])].filter(Boolean)));
  // L'image de la couleur choisie est prioritaire, sauf si le client clique une miniature
  const mainImage = activeImage || variant.image || product.main_image;
  const remaining = Math.max(0, product.stock - inCart);
  const soldOut = product.stock === 0;
  const cheapest = methods.length ? Math.min(...methods.map((m) => Number(m.price))) : null;
  const threshold = Number(shop.free_shipping_threshold) || 0;
  const specs = [
    ...(product.category_name ? [{ label: 'Catégorie', value: product.category_name }] : []),
    ...(product.specs || []),
    ...(product.sku ? [{ label: 'Référence', value: product.sku }] : []),
    { label: 'Disponibilité', value: soldOut ? 'Rupture de stock' : `${product.stock} en stock` },
  ];

  const choose = (group: string, label: string) => {
    setSelected((s) => ({ ...s, [group]: label }));
    setActiveImage(null);
  };

  const add = () => {
    addItem(product, quantity, selected);
    setAdded(true);
    setQuantity(1);
    setTimeout(() => setAdded(false), 2000);
  };

  const buyNow = () => {
    addItem(product, quantity, selected);
    router.push('/checkout');
  };

  return (
    <div className="container-app py-6">
      {/* Fil d'Ariane */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6" aria-label="Fil d'Ariane">
        <Link href="/" className="hover:text-gold">Accueil</Link>
        {product.category_slug && (
          <>
            <ChevronRight size={14} />
            <Link href={`/categorie/${product.category_slug}`} className="hover:text-gold">{product.category_name}</Link>
          </>
        )}
        <ChevronRight size={14} />
        <span className="text-gray-900 font-medium truncate">{product.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 mb-12">
        {/* GALERIE */}
        <div>
          <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl overflow-hidden mb-4 relative">
            <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
              {isNew && <span className="bg-gold text-dark px-3 py-1 rounded-full text-xs font-bold">NOUVEAU</span>}
              {soldOut ? (
                <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">Rupture de stock</span>
              ) : product.stock <= 5 && (
                <span className="bg-white text-gray-900 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-gray-200">
                  <Zap size={12} /> Plus que {product.stock} en stock
                </span>
              )}
            </div>
            {mainImage && <img src={mainImage} alt={product.name} className="w-full h-full object-cover" />}
          </div>

          {gallery.length > 1 && (
            <div className="grid grid-cols-5 gap-3">
              {gallery.slice(0, 10).map((img) => (
                <button
                  key={img}
                  onClick={() => setActiveImage(img)}
                  className={`aspect-square rounded-xl overflow-hidden border-2 transition ${
                    mainImage === img ? 'border-gray-900' : 'border-gray-200 hover:border-gold'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* INFOS */}
        <div>
          {product.category_name && (
            <p className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-2">{product.category_name}</p>
          )}

          {Number(product.rating) > 0 && (
            <div className="flex items-center gap-2 mb-3">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={16} fill={s <= Math.round(Number(product.rating)) ? '#FBBF24' : 'none'} stroke="#FBBF24" />
                ))}
              </div>
              <span className="text-sm text-gray-500">{Number(product.rating).toFixed(1)} / 5</span>
            </div>
          )}

          <h1 className="text-3xl lg:text-4xl font-black text-gray-900 mb-4 leading-tight">{product.name}</h1>

          <p className="text-4xl font-black text-gray-900 mb-1">{variant.price.toFixed(2)} €</p>
          <p className="text-sm text-gray-500 mb-6">TTC, hors frais de livraison.</p>

          <hr className="border-gray-200 mb-6" />

          {/* OPTIONS (couleurs, tailles…) */}
          {(product.options || []).map((group) => (
            <div key={group.name} className="mb-6">
              <p className="text-sm font-bold mb-3">
                {group.name} : <span className="font-normal text-gray-700">{selected[group.name]}</span>
              </p>
              <div className="flex flex-wrap gap-3">
                {group.values.map((v) => {
                  const active = selected[group.name] === v.label;
                  const extra = v.price_delta ? ` (${v.price_delta > 0 ? '+' : ''}${Number(v.price_delta).toFixed(2)} €)` : '';
                  return group.type === 'color' ? (
                    <button
                      key={v.label}
                      onClick={() => choose(group.name, v.label)}
                      title={`${v.label}${extra}`}
                      aria-label={`${v.label}${extra}`}
                      aria-pressed={active}
                      className={`w-11 h-11 rounded-full border-2 transition ${active ? 'border-gray-900 ring-2 ring-offset-2 ring-gray-900' : 'border-gray-200 hover:border-gray-400'}`}
                      style={{ backgroundColor: v.hex }}
                    />
                  ) : (
                    <button
                      key={v.label}
                      onClick={() => choose(group.name, v.label)}
                      aria-pressed={active}
                      className={`py-2.5 px-4 border-2 rounded-lg font-semibold text-sm transition ${
                        active ? 'border-gold bg-gold/10 text-gray-900' : 'border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      {v.label}{extra && <span className="text-gray-500 font-normal">{extra}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Livraison */}
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mb-6 space-y-2 text-sm">
            <p className="flex items-center gap-2"><Clock size={16} className="text-gold" /> Livraison en <strong>{shop.delivery_days}</strong>, avec suivi</p>
            {cheapest !== null && (
              <p className="flex items-center gap-2"><Truck size={16} className="text-gold" />
                {cheapest === 0 ? 'Livraison gratuite disponible' : `Livraison à partir de ${cheapest.toFixed(2)} €`}
                {threshold > 0 && cheapest > 0 && <span className="text-gray-500">— offerte dès {threshold.toFixed(2)} € d&apos;achat</span>}
              </p>
            )}
          </div>

          {/* Quantité + ajout */}
          {!soldOut && (
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center border border-gray-200 rounded-xl">
                <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="w-11 h-12 flex items-center justify-center hover:bg-gray-100 rounded-l-xl" aria-label="Diminuer"><Minus size={16} /></button>
                <span className="w-10 text-center font-bold">{quantity}</span>
                <button onClick={() => setQuantity((q) => Math.min(remaining, q + 1))} disabled={quantity >= remaining} className="w-11 h-12 flex items-center justify-center hover:bg-gray-100 rounded-r-xl disabled:opacity-30" aria-label="Augmenter"><Plus size={16} /></button>
              </div>
              <button
                onClick={add}
                disabled={remaining === 0}
                className="flex-1 py-3.5 rounded-xl font-bold text-lg transition flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white disabled:bg-gray-200 disabled:text-gray-500"
              >
                {added ? <><Check size={20} /> Ajouté au panier</>
                  : remaining === 0 ? 'Stock maximum dans votre panier'
                  : <><ShoppingCart size={20} /> Ajouter au panier</>}
              </button>
            </div>
          )}
          {soldOut ? (
            <div className="w-full py-4 rounded-xl bg-gray-100 text-gray-500 text-center font-bold">Ce produit est actuellement indisponible</div>
          ) : (
            <button onClick={buyNow} disabled={remaining === 0} className="w-full py-3 rounded-xl border-2 border-dark font-semibold hover:bg-dark hover:text-white transition disabled:opacity-40">
              Acheter maintenant
            </button>
          )}
          {inCart > 0 && (
            <p className="text-sm text-gray-500 mt-3">
              Déjà {inCart} dans votre <Link href="/panier" className="text-gold font-semibold hover:underline">panier</Link>.
            </p>
          )}

          {/* Engagements */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200 text-center">
            <div><Truck size={20} className="mx-auto mb-1 text-gray-600" /><p className="text-xs font-semibold">Livraison</p><p className="text-xs text-gray-500">Suivie</p></div>
            <div><RefreshCw size={20} className="mx-auto mb-1 text-gray-600" /><p className="text-xs font-semibold">Retours</p><p className="text-xs text-gray-500">{shop.return_days} jours</p></div>
            <Link href="/contact" className="hover:text-gold"><MessageCircle size={20} className="mx-auto mb-1 text-gray-600" /><p className="text-xs font-semibold">Une question ?</p><p className="text-xs text-gray-500">Contactez-nous</p></Link>
          </div>
        </div>
      </div>

      {/* ONGLETS */}
      <div className="border-b border-gray-200 mb-6 flex gap-8">
        {([['description', 'Description'], ['specs', 'Caractéristiques']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`pb-4 font-bold text-base transition border-b-2 ${activeTab === key ? 'text-gray-900 border-gold' : 'text-gray-500 border-transparent hover:text-gray-700'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'description' && (
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="text-gray-700 leading-relaxed whitespace-pre-line">
            {product.description || 'Aucune description pour le moment.'}
          </div>
          {(product.features?.length ?? 0) > 0 && (
            <div className="card h-fit">
              <h2 className="font-bold mb-3">Points forts</h2>
              <ul className="space-y-2 text-sm text-gray-700">
                {product.features!.map((f) => (
                  <li key={f} className="flex items-start gap-2"><Check size={16} className="text-gold mt-0.5 flex-shrink-0" /> {f}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {activeTab === 'specs' && (
        <div className="card">
          <table className="w-full text-sm">
            <tbody>
              {specs.map((s) => (
                <tr key={s.label} className="border-b border-gray-100 last:border-0">
                  <td className="py-3 font-bold text-gray-700 w-1/3">{s.label}</td>
                  <td className="py-3 text-gray-600">{s.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
