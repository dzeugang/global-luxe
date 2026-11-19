'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, ArrowRight, Mail } from 'lucide-react';
import OrderSummary from '@/components/client/OrderSummary';
import { getLastOrder, trackOrder } from '@/lib/orders';
import type { TrackedOrder } from '@/types';

export default function ConfirmationPage() {
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const last = getLastOrder();
    (last ? trackOrder(last.id, last.email) : Promise.reject(new Error('Aucune commande récente')))
      .then(setOrder)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="container-app py-12 text-center text-gray-500">Chargement…</div>;
  }

  if (!order) {
    return (
      <div className="container-app py-12 max-w-xl text-center">
        <h1 className="h1 mb-4">Aucune commande récente</h1>
        <p className="text-gray-600 mb-6">Retrouvez une commande grâce à son numéro et à votre email.</p>
        <Link href="/suivi" className="btn-gold inline-flex items-center gap-2">Suivre une commande <ArrowRight size={16} /></Link>
      </div>
    );
  }

  return (
    <div className="container-app py-8 lg:py-12 max-w-4xl space-y-6">
      <div className="card text-center py-10">
        <div className="w-20 h-20 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Check size={40} className="text-emerald-600" strokeWidth={3} />
        </div>
        <h1 className="text-3xl lg:text-4xl font-black mb-2">Merci pour votre commande !</h1>
        <p className="text-gray-600">
          Votre numéro de commande est le <span className="font-bold text-emerald-600">{order.id}</span>.
          Gardez-le pour suivre votre colis.
        </p>
        <p className="text-sm text-gray-500 mt-3 flex items-center justify-center gap-2">
          <Mail size={16} /> Un email de confirmation vous a été envoyé.
        </p>
      </div>

      <OrderSummary order={order} />

      <div className="flex flex-col sm:flex-row justify-end gap-3">
        <Link href="/" className="px-6 py-3 border border-gray-200 rounded-xl text-sm font-bold hover:bg-white transition text-center">
          Continuer mes achats
        </Link>
        <Link
          href={`/suivi?order=${order.id}`}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition"
        >
          Suivre ma commande <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
