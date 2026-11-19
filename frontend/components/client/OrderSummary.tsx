'use client';
import { FileText, Package, Truck, CheckCircle2, XCircle, Clock, MapPin } from 'lucide-react';
import type { TrackedOrder } from '@/types';
import { STATUS_STEPS, stepIndex } from '@/lib/orders';
import { useShop } from '@/components/ShopProvider';

const STEP_ICONS = [FileText, Package, Truck, CheckCircle2];

function euros(value: number | string) {
  return `${Number(value).toFixed(2)} €`;
}

export default function OrderSummary({ order }: { order: TrackedOrder }) {
  const shop = useShop();
  const current = stepIndex(order.status);
  const cancelled = order.status === 'cancelled';

  return (
    <div className="space-y-6">
      {/* Frise de statut */}
      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
          <div>
            <p className="text-sm text-gray-500">Commande n° {order.id}</p>
            <p className="text-xs text-gray-400">
              Passée le {new Date(order.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
            cancelled ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
          }`}>
            {order.status_label}
          </span>
        </div>

        {cancelled ? (
          <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-700">
            <XCircle size={20} /> Cette commande a été annulée.
          </div>
        ) : (
          <div className="relative">
            <div className="absolute top-6 left-6 right-6 h-0.5 bg-gray-200">
              <div className="h-full bg-emerald-600 transition-all" style={{ width: `${(current / (STATUS_STEPS.length - 1)) * 100}%` }} />
            </div>
            <ol className="relative flex justify-between">
              {STATUS_STEPS.map((step, i) => {
                const Icon = STEP_ICONS[i];
                const done = i <= current;
                return (
                  <li key={step.key} className="flex flex-col items-center w-16 sm:w-24 text-center">
                    <span className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                      done ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-400 border-2 border-gray-200'
                    }`}>
                      <Icon size={20} />
                    </span>
                    <span className={`text-xs sm:text-sm font-bold ${done ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</span>
                  </li>
                );
              })}
            </ol>
          </div>
        )}

        {order.tracking_number && (
          <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm">
            <p className="font-bold mb-1 flex items-center gap-2"><Truck size={16} className="text-blue-600" /> Numéro de suivi</p>
            <p className="font-mono">{order.tracking_number}</p>
          </div>
        )}
        {!cancelled && order.status !== 'delivered' && (
          <p className="mt-4 text-sm text-gray-500 flex items-center gap-2">
            <Clock size={16} /> Livraison estimée : {shop.delivery_days} après expédition.
          </p>
        )}
      </div>

      {/* Articles + livraison */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="card md:col-span-2">
          <h3 className="font-bold text-lg mb-4">Articles</h3>
          <ul className="divide-y divide-gray-100">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 py-3">
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                  {item.product_image && <img src={item.product_image} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{item.product_name}</p>
                  {item.options_label && <p className="text-xs text-gray-500">{item.options_label}</p>}
                  <p className="text-xs text-gray-500">Quantité : {item.quantity}</p>
                </div>
                <p className="font-bold text-sm whitespace-nowrap">{euros(item.total)}</p>
              </li>
            ))}
          </ul>
          <div className="border-t pt-3 mt-2 text-sm space-y-1">
            <div className="flex justify-between"><span>Sous-total</span><span>{euros(order.subtotal)}</span></div>
            <div className="flex justify-between">
              <span>Livraison{order.shipping_method_name ? ` (${order.shipping_method_name})` : ''}</span>
              <span>{euros(order.shipping_cost)}</span>
            </div>
            <div className="flex justify-between font-bold text-base pt-2 border-t"><span>Total</span><span>{euros(order.total)}</span></div>
          </div>
        </div>

        <div className="card h-fit">
          <h3 className="font-bold text-lg mb-4">Livraison</h3>
          <p className="text-sm font-semibold">{order.customer_name}</p>
          <p className="text-sm text-gray-600 flex items-start gap-2 mt-2">
            <MapPin size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
            <span>{order.postal_code} {order.city}, {order.country}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
