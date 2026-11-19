'use client';
import Link from 'next/link';
import type { Product } from '@/types';
import { useCart } from '@/store/cart';
import { ShoppingCart, Star, Check, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import { useShop } from '@/components/ShopProvider';
import { useHydrated } from '@/lib/useHydrated';

export default function ProductCard({ product }: { product: Product }) {
  const addItem = useCart((s) => s.addItem);
  const hydrated = useHydrated();
  const inCartStored = useCart((s) => s.quantityOf(product.id));
  const inCart = hydrated ? inCartStored : 0;
  const shop = useShop();
  const [added, setAdded] = useState(false);
  const hasOptions = (product.options?.length ?? 0) > 0;
  const soldOut = product.stock === 0;
  const maxed = !soldOut && inCart >= product.stock;
  const colors = product.options?.find((g) => g.type === 'color')?.values ?? [];

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="group bg-white rounded-2xl overflow-hidden border border-gray-300 hover:border-gold hover:shadow-2xl transition-all duration-300 flex flex-col">
      <Link href={`/produit/${product.id}`} className="block flex-1">
        <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
          {product.main_image ? (
            <img src={product.main_image} alt={product.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300"><ShoppingCart size={40} /></div>
          )}

          {Number(product.rating) > 0 && (
            <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1 shadow-md">
              <Star size={12} fill="#FBBF24" stroke="#FBBF24" />
              <span className="text-xs font-bold">{Number(product.rating).toFixed(1)}</span>
            </div>
          )}

          {soldOut ? (
            <div className="absolute top-3 left-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">Rupture</div>
          ) : product.stock <= 5 && (
            <div className="absolute top-3 left-3 bg-white text-gray-900 text-xs px-2 py-1 rounded-full font-bold border border-gray-200">
              Plus que {product.stock}
            </div>
          )}
        </div>

        <div className="p-4 flex-1">
          <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1">{product.category_name || shop.shop_name}</p>
          <h3 className="font-bold text-sm sm:text-base line-clamp-2 min-h-[2.5rem] mb-2 text-gray-900">{product.name}</h3>
          <p className="text-lg font-black text-gray-900">
            {hasOptions && product.options!.some((g) => g.values.some((v) => v.price_delta > 0)) && <span className="text-xs font-normal text-gray-500">dès </span>}
            {Number(product.sale_price).toFixed(2)} €
          </p>
          {colors.length > 1 && (
            <div className="flex gap-1 mt-2" aria-label={`${colors.length} couleurs`}>
              {colors.slice(0, 6).map((c) => (
                <span key={c.label} title={c.label} className="w-4 h-4 rounded-full border border-black/10" style={{ background: c.hex }} />
              ))}
              {colors.length > 6 && <span className="text-xs text-gray-500">+{colors.length - 6}</span>}
            </div>
          )}
          {!soldOut && <p className="text-xs text-gray-500 mt-1">Livraison : <span className="font-semibold">{shop.delivery_days}</span></p>}
        </div>
      </Link>

      <div className="px-4 pb-4">
        {hasOptions && !soldOut ? (
          <Link href={`/produit/${product.id}`} className="w-full py-2.5 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2 bg-dark text-white hover:opacity-90">
            <SlidersHorizontal size={16} /> Choisir les options
          </Link>
        ) : (
          <button
            onClick={handleAdd}
            disabled={soldOut || maxed}
            className="w-full py-2.5 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            {added ? <><Check size={16} /> Ajouté</>
              : soldOut ? 'Indisponible'
              : maxed ? 'Stock max. dans le panier'
              : <><ShoppingCart size={16} /> Ajouter au panier</>}
          </button>
        )}
      </div>
    </div>
  );
}
