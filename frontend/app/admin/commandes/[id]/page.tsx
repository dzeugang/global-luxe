'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import type { Order } from '@/types';

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [tracking, setTracking] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const fetchOrder = () => api.get(`/orders/${id}/`).then((r) => { setOrder(r.data); setTracking(r.data.tracking_number || ''); });
  useEffect(() => { fetchOrder(); }, [id]);

  const sendToCJ = async () => {
    setSending(true); setError('');
    try {
      await api.post(`/orders/${id}/send_to_cj/`);
      await fetchOrder();
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Erreur');
    } finally { setSending(false); }
  };

  const saveTracking = async () => {
    await api.post(`/orders/${id}/set_tracking/`, { tracking_number: tracking });
    await fetchOrder();
  };

  if (!order) return <div>Chargement…</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Commande #{order.id}</h1>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm">
          <h2 className="font-bold mb-4">Articles</h2>
          {order.items?.map((it) => (
            <div key={it.id} className="flex items-center gap-4 py-3 border-b last:border-b-0">
              {it.product_image && <img src={it.product_image} alt="" className="w-16 h-16 object-cover rounded" />}
              <div className="flex-1">
                <p className="font-semibold">{it.product_name}</p>
                <p className="text-sm text-gray-500">Quantité : {it.quantity}</p>
              </div>
              <p className="font-bold">{Number(it.total).toFixed(2)} €</p>
            </div>
          ))}
          <div className="mt-4 text-right space-y-1">
            <p className="text-sm">Sous-total : {Number(order.subtotal).toFixed(2)} €</p>
            <p className="text-sm">Livraison : {Number(order.shipping_cost).toFixed(2)} €</p>
            <p className="text-xl font-bold">Total : {Number(order.total).toFixed(2)} €</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="font-bold mb-3">Client</h2>
            <p className="text-sm">{order.customer_name}</p>
            <p className="text-sm text-gray-500">{order.customer_email}</p>
            <p className="text-sm text-gray-500">{order.customer_phone}</p>
            <hr className="my-3" />
            <p className="text-sm">{order.address_line1}</p>
            <p className="text-sm">{order.postal_code} {order.city}, {order.country}</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="font-bold mb-3">Statut : <span className="text-gold">{order.status}</span></h2>
            {order.status === 'pending' && (
              <button onClick={sendToCJ} disabled={sending} className="btn-gold w-full mb-3 disabled:opacity-50">
                {sending ? 'Envoi…' : 'Envoyer à CJ'}
              </button>
            )}
            {order.cj_order_id && <p className="text-xs text-gray-500 mb-3">CJ Order ID : {order.cj_order_id}</p>}
            {error && <p className="text-red-500 text-sm">{error}</p>}

            <label className="block text-sm font-medium mt-3 mb-1">Numéro de suivi</label>
            <div className="flex gap-2">
              <input value={tracking} onChange={(e) => setTracking(e.target.value)} className="flex-1 border rounded px-2 py-1 text-sm" />
              <button onClick={saveTracking} className="bg-dark text-white px-3 py-1 rounded text-sm">OK</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}