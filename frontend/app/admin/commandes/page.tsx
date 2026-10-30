'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import { Search, Filter, Download, Eye, ChevronDown } from 'lucide-react';

interface Order {
  id: number;
  customer_name: string;
  customer_email: string;
  total: number;
  status: string;
  created_at: string;
  items_count?: number;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    api.get('/orders/').then((r) => setOrders(r.data.results || r.data)).catch(() => {});
  }, []);

  const filtered = orders.filter(o => {
    const matchSearch = !search || o.customer_name.toLowerCase().includes(search.toLowerCase()) || o.customer_email.toLowerCase().includes(search.toLowerCase()) || String(o.id).includes(search);
    const matchStatus = !statusFilter || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
  };

  return (
    <div>
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-black mb-2">Orders</h1>
          <p className="text-gray-500">Manage and track all your customer orders.</p>
        </div>
        <button className="bg-gold hover:bg-gold-dark text-dark px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition shadow-sm">
          <Download size={16} /> Export
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Orders', value: stats.total, color: 'text-gray-900' },
          { label: 'Pending', value: stats.pending, color: 'text-amber-600' },
          { label: 'Shipped', value: stats.shipped, color: 'text-blue-600' },
          { label: 'Delivered', value: stats.delivered, color: 'text-emerald-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-5 border border-gray-200">
            <p className="text-sm text-gray-500 mb-2">{s.label}</p>
            <p className={`text-3xl font-black ${s.color}`}>{s.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Filtres + tableau */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email or order #..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gold"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gold cursor-pointer bg-white"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="sent_to_cj">Sent to CJ</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Mobile cards */}
        <div className="lg:hidden divide-y divide-gray-200">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-400">Aucune commande</div>
          ) : filtered.map((o) => (
            <Link key={o.id} href={`/admin/commandes/${o.id}`} className="block p-4 hover:bg-gray-50">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-bold">#{o.id}</p>
                  <p className="text-sm">{o.customer_name}</p>
                  <p className="text-xs text-gray-500 truncate max-w-[200px]">{o.customer_email}</p>
                </div>
                <StatusBadge status={o.status} />
              </div>
              <div className="flex justify-between items-center text-sm mt-3 pt-3 border-t border-gray-100">
                <span className="text-gray-500">{new Date(o.created_at).toLocaleDateString('fr-FR')}</span>
                <span className="font-black">€{Number(o.total).toFixed(2)}</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs uppercase text-gray-500 font-bold">Order #</th>
                <th className="px-6 py-3 text-left text-xs uppercase text-gray-500 font-bold">Customer</th>
                <th className="px-6 py-3 text-left text-xs uppercase text-gray-500 font-bold">Total</th>
                <th className="px-6 py-3 text-left text-xs uppercase text-gray-500 font-bold">Status</th>
                <th className="px-6 py-3 text-left text-xs uppercase text-gray-500 font-bold">Date</th>
                <th className="px-6 py-3 text-right text-xs uppercase text-gray-500 font-bold">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="p-12 text-center text-gray-400">Aucune commande trouvée</td></tr>
              ) : filtered.map((o) => (
                <tr key={o.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-4 font-bold">#{o.id}</td>
                  <td className="px-6 py-4">
                    <p className="font-semibold">{o.customer_name}</p>
                    <p className="text-xs text-gray-500">{o.customer_email}</p>
                  </td>
                  <td className="px-6 py-4 font-bold">€{Number(o.total).toFixed(2)}</td>
                  <td className="px-6 py-4"><StatusBadge status={o.status} /></td>
                  <td className="px-6 py-4 text-gray-500">{new Date(o.created_at).toLocaleDateString('fr-FR')}</td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/admin/commandes/${o.id}`} className="inline-flex items-center gap-1 text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:border-gold hover:bg-gold/5 transition">
                      <Eye size={12} /> View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Pending' },
    processing: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Processing' },
    sent_to_cj: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Sent to CJ' },
    shipped: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Shipped' },
    delivered: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Delivered' },
    cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelled' },
  };
  const s = map[status] || { bg: 'bg-gray-100', text: 'text-gray-700', label: status };
  return <span className={`${s.bg} ${s.text} text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wide`}>{s.label}</span>;
}