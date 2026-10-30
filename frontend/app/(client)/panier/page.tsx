'use client';
import { useCart } from '@/store/cart';
import Link from 'next/link';
import { Trash2, Plus, Minus, Heart, Shield } from 'lucide-react';

export default function CartPage() {
  const { items, removeItem, updateQty, subtotal } = useCart();
  const sub = subtotal();
  const itemsCount = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="container-app py-6 lg:py-10">
      <div className="mb-8">
        <h1 className="h1 mb-2">Your Cart</h1>
        <p className="text-gray-500 text-sm">Review your selection of premium items before checkout.</p>
      </div>

      {items.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-gray-500 mb-4">Your cart is empty.</p>
          <Link href="/" className="btn-gold">Continue Shopping</Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* LISTE ARTICLES */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item.product.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-4">
                <img
                  src={item.product.main_image}
                  alt={item.product.name}
                  className="w-24 h-24 lg:w-32 lg:h-32 object-cover rounded-xl bg-gray-100 flex-shrink-0"
                />
                <div className="flex-1 min-w-0 flex flex-col">
                  <div className="flex justify-between gap-2 mb-1">
                    <h3 className="font-bold text-base lg:text-lg line-clamp-2">{item.product.name}</h3>
                    <p className="font-black text-lg whitespace-nowrap">
                      ${(item.product.sale_price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">Color: Midnight Black</p>

                  <div className="flex items-center justify-between mt-auto flex-wrap gap-3">
                    {/* Quantité */}
                    <div className="flex items-center border border-gray-200 rounded-lg">
                      <button
                        onClick={() => updateQty(item.product.id, item.quantity - 1)}
                        className="w-8 h-8 hover:bg-gray-100 flex items-center justify-center"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-10 text-center font-bold">{item.quantity}</span>
                      <button
                        onClick={() => updateQty(item.product.id, item.quantity + 1)}
                        className="w-8 h-8 hover:bg-gray-100 flex items-center justify-center"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-4 text-sm">
                      <button className="flex items-center gap-1 text-gray-600 hover:text-emerald-600">
                        <Heart size={14} /> Move to Wishlist
                      </button>
                      <button
                        onClick={() => removeItem(item.product.id)}
                        className="flex items-center gap-1 text-gray-600 hover:text-red-600"
                      >
                        <Trash2 size={14} /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* SOMMAIRE COMMANDE */}
          <div className="card lg:sticky lg:top-24 h-fit">
            <h2 className="text-xl font-black mb-6">Order Summary</h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal ({itemsCount} items)</span>
                <span className="font-semibold">${sub.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Estimated Shipping</span>
                <span className="font-semibold text-gray-500">Calculated at checkout</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Estimated Tax</span>
                <span className="font-semibold">$0.00</span>
              </div>

              <hr className="border-gray-200 my-3" />

              <div className="flex justify-between text-xl font-black">
                <span>Total</span>
                <span>${sub.toFixed(2)}</span>
              </div>
            </div>

            <Link
              href="/checkout"
              className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition"
            >
              Proceed to Checkout →
            </Link>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-2">
              <Shield size={18} className="text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-gray-700 leading-relaxed">
                Secure, encrypted checkout. International shipping fees and duties calculated transparently.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}