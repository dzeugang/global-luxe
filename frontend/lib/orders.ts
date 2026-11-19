import { api } from '@/lib/api';
import type { OrderStatus, TrackedOrder } from '@/types';

const LAST_ORDER_KEY = 'gl-last-order';

// La dernière commande est gardée le temps de la session pour la page de confirmation
// (l'email ne passe jamais dans l'URL).
export function rememberLastOrder(id: number, email: string) {
  try {
    sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify({ id, email }));
  } catch {}
}

export function getLastOrder(): { id: number; email: string } | null {
  try {
    const raw = sessionStorage.getItem(LAST_ORDER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function trackOrder(orderId: number | string, email: string): Promise<TrackedOrder> {
  const res = await api.post<TrackedOrder>('/orders/track/', { order_id: Number(orderId), email });
  return res.data;
}

export const ORDER_STATUSES: { value: OrderStatus; label: string; badge: string }[] = [
  { value: 'pending', label: 'En attente', badge: 'bg-amber-100 text-amber-700' },
  { value: 'processing', label: 'En préparation', badge: 'bg-sky-100 text-sky-700' },
  { value: 'sent_to_cj', label: 'Transmise au fournisseur', badge: 'bg-violet-100 text-violet-700' },
  { value: 'shipped', label: 'Expédiée', badge: 'bg-blue-100 text-blue-700' },
  { value: 'delivered', label: 'Livrée', badge: 'bg-emerald-100 text-emerald-700' },
  { value: 'cancelled', label: 'Annulée', badge: 'bg-red-100 text-red-700' },
];

export function statusInfo(status: string) {
  return ORDER_STATUSES.find((s) => s.value === status) ?? { value: status, label: status, badge: 'bg-gray-100 text-gray-700' };
}

export const STATUS_STEPS = [
  { key: 'pending', label: 'Confirmée' },
  { key: 'processing', label: 'En préparation' },
  { key: 'shipped', label: 'Expédiée' },
  { key: 'delivered', label: 'Livrée' },
] as const;

// Position d'un statut sur la frise (sent_to_cj = en préparation chez le fournisseur)
export function stepIndex(status: string): number {
  const map: Record<string, number> = { pending: 0, processing: 1, sent_to_cj: 1, shipped: 2, delivered: 3 };
  return map[status] ?? 0;
}
