'use client';
import Link from 'next/link';
import type { Product } from '@/types';
import { useCart } from '@/store/cart';
import { ShoppingCart, Star, Check } from 'lucide-react';
import { useState } from 'react';

export default function ProductCard({ product }: { product: Product }) {
  const addItem = useCart((s) => s.addItem);
  const [added, setAdded] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="group bg-white rounded-2xl overflow-hidden border border-gray-300 hover:border-gold hover:shadow-2xl transition-all duration-300 flex flex-col">
      <Link href={`/produit/${product.id}`} className="block flex-1">
        {/* Image avec badge note */}
        <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
          {product.main_image ? (
            <img
              src={product.main_image}
              alt={product.name}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <ShoppingCart size={40} />
            </div>
          )}

          {/* Badge note */}
          {product.rating && Number(product.rating) > 0 && (
            <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1 shadow-md">
              <Star size={12} fill="#FBBF24" stroke="#FBBF24" />
              <span className="text-xs font-bold">{Number(product.rating).toFixed(1)}</span>
            </div>
          )}

          {/* Badge stock */}
          {product.stock === 0 && (
            <div className="absolute top-3 left-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">
              Out of stock
            </div>
          )}
        </div>

        <div className="p-4 flex-1">
          <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1">
            {product.category_name || 'Premium'}
          </p>
          <h3 className="font-bold text-sm sm:text-base line-clamp-2 min-h-[2.5rem] mb-2 text-gray-900">
            {product.name}
          </h3>
          <p className="text-lg font-black text-gray-900">
            ${Number(product.sale_price).toFixed(2)}
          </p>
          {product.stock > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              Est. Shipping: <span className="font-semibold">3-5 days</span>
            </p>
          )}
        </div>
      </Link>

      <div className="px-4 pb-4">
        <button
          onClick={handleAdd}
          disabled={product.stock === 0}
          className={`w-full py-2.5 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2 ${
            added
              ? 'bg-emerald-600 text-white'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed'
          }`}
        >
          {added ? <><Check size={16} /> Added</> : <><ShoppingCart size={16} /> Add to Cart</>}
        </button>
      </div>
    </div>
  );
}