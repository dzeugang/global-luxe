'use client';
import { useCart, optionsLabel } from '@/store/cart';
import Link from 'next/link';
import { Trash2, Plus, Minus, Shield, Truck } from 'lucide-react';
import { useShop } from '@/components/ShopProvider';
import { useHydrated } from '@/lib/useHydrated';

export default function CartPage() {
  const { items, removeItem, updateQty, subtotal, quantityOf } = useCart();
  const shop = useShop();
  const hydrated = useHydrated();
  const sub = subtotal();
  const itemsCount = items.reduce((s, i) => s + i.quantity, 0);
  const threshold = Number(shop.free_shipping_threshold) || 0;
  const missing = threshold > 0 ? threshold - sub : 0;

  return (
    <div className="container-app py-6 lg:py-10">
      <div className="mb-8">
        <h1 className="h1 mb-2">Mon panier</h1>
        <p className="text-gray-500 text-sm">Vérifiez votre sélection avant de passer commande.</p>
      </div>

      {!hydrated ? (
        <div className="card text-center py-16 text-gray-400">Chargement du panier…</div>
      ) : items.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-gray-500 mb-4">Votre panier est vide.</p>
          <Link href="/" className="btn-gold">Continuer mes achats</Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => {
              const atMax = quantityOf(item.product.id) >= item.product.stock;
              return (
                <div key={item.key} className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-4">
                  <Link href={`/produit/${item.product.id}`} className="flex-shrink-0">
                    <img src={item.image || item.product.main_image} alt={item.product.name} className="w-24 h-24 lg:w-32 lg:h-32 object-cover rounded-xl bg-gray-100" />
                  </Link>
                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="flex justify-between gap-2 mb-1">
                      <Link href={`/produit/${item.product.id}`} className="font-bold text-base lg:text-lg line-clamp-2 hover:text-gold">{item.product.name}</Link>
                      <p className="font-black text-lg whitespace-nowrap">{(item.unitPrice * item.quantity).toFixed(2)} €</p>
                    </div>
                    {Object.keys(item.options).length > 0 && <p className="text-sm text-gray-500">{optionsLabel(item.options)}</p>}
                    <p className="text-xs text-gray-400 mb-3">{item.unitPrice.toFixed(2)} € l&apos;unité</p>

                    <div className="flex items-center justify-between mt-auto flex-wrap gap-3">
                      <div className="flex items-center border border-gray-200 rounded-lg">
                        <button onClick={() => updateQty(item.key, item.quantity - 1)} className="w-8 h-8 hover:bg-gray-100 flex items-center justify-center" aria-label="Retirer un">
                          <Minus size={14} />
                        </button>
                        <span className="w-10 text-center font-bold">{item.quantity}</span>
                        <button
                          onClick={() => updateQty(item.key, item.quantity + 1)}
                          disabled={atMax}
                          className="w-8 h-8 hover:bg-gray-100 flex items-center justify-center disabled:opacity-30"
                          aria-label="Ajouter un"
                          title={atMax ? 'Stock maximum atteint' : undefined}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <button onClick={() => removeItem(item.key)} className="flex items-center gap-1 text-sm text-gray-600 hover:text-red-600">
                        <Trash2 size={14} /> Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="card lg:sticky lg:top-24 h-fit">
            <h2 className="text-xl font-black mb-6">Récapitulatif</h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Sous-total ({itemsCount} article{itemsCount > 1 ? 's' : ''})</span>
                <span className="font-semibold">{sub.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Livraison</span>
                <span className="font-semibold text-gray-500">{threshold > 0 && missing <= 0 ? 'Offerte' : 'Calculée à l\'étape suivante'}</span>
              </div>
              <hr className="border-gray-200 my-3" />
              <div className="flex justify-between text-xl font-black">
                <span>Total TTC</span>
                <span>{sub.toFixed(2)} €</span>
              </div>
            </div>

            {threshold > 0 && missing > 0 && (
              <p className="mt-4 text-xs text-gray-700 bg-gold/10 border border-gold/20 rounded-lg p-3 flex items-center gap-2">
                <Truck size={16} className="text-gold flex-shrink-0" />
                Plus que {missing.toFixed(2)} € pour la livraison offerte.
              </p>
            )}

            <Link href="/checkout" className="w-full mt-6 btn-gold justify-center !py-4">
              Passer commande →
            </Link>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-2">
              <Shield size={18} className="text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-gray-700 leading-relaxed">
                Livraison suivie en {shop.delivery_days}. Retours acceptés sous {shop.return_days} jours.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
