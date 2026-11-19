'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { api, apiError } from '@/lib/api';
import { ORDER_STATUSES, statusInfo } from '@/lib/orders';
import type { Order } from '@/types';

export default function OrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [tracking, setTracking] = useState('');
  const [status, setStatus] = useState('');
  const [notify, setNotify] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    api.get<Order>(`/orders/${id}/`)
      .then((r) => {
        setOrder(r.data);
        setTracking(r.data.tracking_number || '');
        setStatus(r.data.status);
      })
      .catch(() => setError('Commande introuvable'));
  }, [id, reloadKey]);

  // Exécute une action, affiche son erreur éventuelle et recharge la commande
  const run = async (fn: () => Promise<unknown>, success: string) => {
    setBusy(true); setError(''); setInfo('');
    try {
      await fn();
      setReloadKey((k) => k + 1);
      setInfo(success);
    } catch (e) {
      setError(apiError(e).detail || 'Une erreur est survenue');
    } finally { setBusy(false); }
  };

  const sendToCJ = () => run(() => api.post(`/orders/${id}/send_to_cj/`), 'Commande transmise à CJ.');
  const saveTracking = () => run(
    () => api.post(`/orders/${id}/set_tracking/`, { tracking_number: tracking }),
    'Numéro de suivi enregistré.',
  );
  const saveStatus = () => run(
    () => api.post(`/orders/${id}/update_status/`, { status, notify }),
    notify ? 'Statut mis à jour, client prévenu par email.' : 'Statut mis à jour.',
  );

  const deleteOrder = async () => {
    if (!confirm(`Supprimer définitivement la commande #${id} ? Les articles seront remis en stock.`)) return;
    try {
      await api.delete(`/orders/${id}/`);
      router.push('/admin/commandes');
    } catch {
      setError('Suppression impossible');
    }
  };

  if (!order) return <div>{error || 'Chargement…'}</div>;

  const current = statusInfo(order.status);

  return (
    <div>
      <Link href="/admin/commandes" className="text-sm text-gray-500 hover:text-dark inline-flex items-center gap-1 mb-4">
        <ArrowLeft size={16} /> Commandes
      </Link>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <h1 className="text-3xl font-bold">Commande #{order.id}</h1>
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${current.badge}`}>{current.label}</span>
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${order.paid ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
          {order.paid ? 'Payée' : 'Non payée'}
        </span>
        <span className="text-sm text-gray-500">
          {new Date(order.created_at).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}
        </span>
      </div>

      {(error || info) && (
        <p className={`mb-4 text-sm rounded-lg px-4 py-3 ${error ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
          {error || info}
        </p>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm">
          <h2 className="font-bold mb-4">Articles</h2>
          {order.items?.map((it) => (
            <div key={it.id} className="flex items-center gap-4 py-3 border-b last:border-b-0">
              {it.product_image && <img src={it.product_image} alt="" className="w-16 h-16 object-cover rounded" />}
              <div className="flex-1">
                <Link href={`/admin/produits/${it.product}`} className="font-semibold hover:text-gold">{it.product_name}</Link>
                {it.options_label && <p className="text-sm font-medium text-gray-700">{it.options_label}</p>}
                <p className="text-sm text-gray-500">{it.quantity} × {Number(it.unit_price).toFixed(2)} €</p>
              </div>
              <p className="font-bold">{Number(it.total).toFixed(2)} €</p>
            </div>
          ))}
          <div className="mt-4 text-right space-y-1">
            <p className="text-sm">Sous-total : {Number(order.subtotal).toFixed(2)} €</p>
            <p className="text-sm">
              Livraison{order.shipping_method_name ? ` (${order.shipping_method_name})` : ''} : {Number(order.shipping_cost).toFixed(2)} €
            </p>
            <p className="text-xl font-bold">Total : {Number(order.total).toFixed(2)} €</p>
            {order.payment_method && <p className="text-xs text-gray-500">Moyen de paiement choisi : {order.payment_method}</p>}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="font-bold mb-3">Client</h2>
            <Link href={`/admin/clients/${encodeURIComponent(order.customer_email)}`} className="text-sm font-semibold hover:text-gold">
              {order.customer_name}
            </Link>
            <p className="text-sm text-gray-500 break-all">{order.customer_email}</p>
            <p className="text-sm text-gray-500">{order.customer_phone}</p>
            <hr className="my-3" />
            <p className="text-sm">{order.address_line1}</p>
            {order.address_line2 && <p className="text-sm">{order.address_line2}</p>}
            <p className="text-sm">{order.postal_code} {order.city}, {order.country}</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
            <h2 className="font-bold">Traitement</h2>

            {order.status === 'pending' && (
              <button onClick={sendToCJ} disabled={busy} className="btn-gold w-full disabled:opacity-50">
                {busy ? 'Envoi…' : 'Envoyer à CJ'}
              </button>
            )}
            {order.cj_order_id && <p className="text-xs text-gray-500">CJ Order ID : {order.cj_order_id}</p>}

            <div>
              <label className="block text-sm font-medium mb-1">Statut</label>
              <div className="flex gap-2">
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="flex-1 border rounded px-2 py-1.5 text-sm">
                  {ORDER_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <button onClick={saveStatus} disabled={busy || status === order.status} className="bg-dark text-white px-3 py-1 rounded text-sm disabled:opacity-40">
                  OK
                </button>
              </div>
              <label className="flex items-center gap-2 text-xs text-gray-600 mt-2">
                <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
                Prévenir le client par email
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Numéro de suivi</label>
              <div className="flex gap-2">
                <input value={tracking} onChange={(e) => setTracking(e.target.value)} className="flex-1 border rounded px-2 py-1 text-sm" />
                <button onClick={saveTracking} disabled={busy} className="bg-dark text-white px-3 py-1 rounded text-sm disabled:opacity-40">OK</button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Saisir un numéro passe la commande en « Expédiée » et prévient le client.</p>
            </div>
          </div>

          <button onClick={deleteOrder} className="w-full text-sm text-red-600 border border-red-200 rounded-xl py-2 hover:bg-red-50 flex items-center justify-center gap-2">
            <Trash2 size={16} /> Supprimer la commande
          </button>
        </div>
      </div>
    </div>
  );
}
