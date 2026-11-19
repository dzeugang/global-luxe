'use client';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import OrderSummary from '@/components/client/OrderSummary';
import { trackOrder } from '@/lib/orders';
import { apiError } from '@/lib/api';
import type { TrackedOrder } from '@/types';

function TrackingForm() {
  const params = useSearchParams();
  const [orderId, setOrderId] = useState(params.get('order') || '');
  const [email, setEmail] = useState('');
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setOrder(null);
    setLoading(true);
    try {
      setOrder(await trackOrder(orderId.replace(/\D/g, ''), email.trim()));
    } catch (err) {
      const { status } = apiError(err);
      setError(
        status === 404 ? 'Aucune commande ne correspond à ce numéro et cet email.'
          : status === 429 ? 'Trop de tentatives. Réessayez dans un moment.'
          : 'Impossible de récupérer la commande. Réessayez plus tard.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-app py-8 lg:py-12 max-w-4xl">
      <h1 className="h1 mb-2">Suivre ma commande</h1>
      <p className="text-gray-600 mb-6">
        Saisissez le numéro reçu par email lors de votre commande et l&apos;adresse email utilisée.
      </p>

      <form onSubmit={onSubmit} className="card grid sm:grid-cols-[1fr_2fr_auto] gap-3 items-end mb-8">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="order-id">N° de commande</label>
          <input id="order-id" className="input" inputMode="numeric" required value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="ex. 42" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="order-email">Email</label>
          <input id="order-email" type="email" className="input" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.com" />
        </div>
        <button type="submit" disabled={loading} className="btn-gold flex items-center justify-center gap-2">
          <Search size={16} /> {loading ? 'Recherche…' : 'Rechercher'}
        </button>
        {error && <p className="text-red-500 text-sm sm:col-span-3">{error}</p>}
      </form>

      {order && <OrderSummary order={order} />}
    </div>
  );
}

export default function TrackingPage() {
  return (
    <Suspense fallback={<div className="container-app py-12 text-center">Chargement…</div>}>
      <TrackingForm />
    </Suspense>
  );
}
