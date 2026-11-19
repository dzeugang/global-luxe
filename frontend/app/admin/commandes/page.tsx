'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import { Search, Download, Eye } from 'lucide-react';
import Pagination from '@/components/admin/Pagination';
import { ORDER_STATUSES, statusInfo } from '@/lib/orders';

interface Order {
  id: number;
  customer_name: string;
  customer_email: string;
  total: number;
  status: string;
  paid: boolean;
  created_at: string;
  items_count?: number;
  tracking_number?: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [exporting, setExporting] = useState(false);

  // Attendre que la saisie se stabilise avant d'interroger l'API
  useEffect(() => {
    const t = setTimeout(() => { setQuery(search.trim()); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    api.get('/orders/', { params: { page, search: query || undefined, status: statusFilter || undefined } })
      .then((r) => { setOrders(r.data.results); setCount(r.data.count); })
      .catch(() => {});
  }, [page, query, statusFilter]);

  useEffect(() => {
    api.get('/orders/stats/').then((r) => setStatusCounts(r.data.status_counts || {})).catch(() => {});
  }, []);

  // Export CSV de toutes les commandes correspondant aux filtres courants
  const exportCsv = async () => {
    setExporting(true);
    try {
      const rows: Order[] = [];
      for (let p = 1; ; p++) {
        const r = await api.get('/orders/', { params: { page: p, search: query || undefined, status: statusFilter || undefined } });
        rows.push(...r.data.results);
        if (!r.data.next) break;
      }
      const escape = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
      const header = ['N°', 'Date', 'Client', 'Email', 'Total', 'Statut', 'Payée', 'Suivi'];
      const lines = rows.map((o) => [
        o.id, new Date(o.created_at).toLocaleDateString('fr-FR'), o.customer_name, o.customer_email,
        Number(o.total).toFixed(2), statusInfo(o.status).label, o.paid ? 'oui' : 'non', o.tracking_number,
      ].map(escape).join(';'));
      const blob = new Blob(['﻿' + [header.join(';'), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `commandes-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const total = Object.values(statusCounts).reduce((a, b) => a + b, 0);
  const cards = [
    { label: 'Total', value: total, color: 'text-gray-900' },
    { label: 'En attente', value: statusCounts.pending || 0, color: 'text-amber-600' },
    { label: 'Expédiées', value: statusCounts.shipped || 0, color: 'text-blue-600' },
    { label: 'Livrées', value: statusCounts.delivered || 0, color: 'text-emerald-600' },
  ];

  return (
    <div>
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-black mb-2">Commandes</h1>
          <p className="text-gray-500">Suivez et traitez les commandes de vos clients.</p>
        </div>
        <button onClick={exportCsv} disabled={exporting || count === 0} className="bg-gold hover:bg-gold-dark text-dark px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition shadow-sm disabled:opacity-50">
          <Download size={16} /> {exporting ? 'Export…' : 'Exporter (CSV)'}
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-5 border border-gray-200">
            <p className="text-sm text-gray-500 mb-2">{s.label}</p>
            <p className={`text-3xl font-black ${s.color}`}>{s.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom, email, n° de commande ou de suivi…"
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gold"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gold cursor-pointer bg-white"
          >
            <option value="">Tous les statuts</option>
            {ORDER_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        {/* Mobile */}
        <div className="lg:hidden divide-y divide-gray-200">
          {orders.length === 0 ? (
            <div className="p-8 text-center text-gray-400">Aucune commande</div>
          ) : orders.map((o) => (
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
                <span className="font-black">{Number(o.total).toFixed(2)} €</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Bureau */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['N°', 'Client', 'Total', 'Statut', 'Date', ''].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs uppercase text-gray-500 font-bold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr><td colSpan={6} className="p-12 text-center text-gray-400">Aucune commande trouvée</td></tr>
              ) : orders.map((o) => (
                <tr key={o.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-4 font-bold">#{o.id}</td>
                  <td className="px-6 py-4">
                    <p className="font-semibold">{o.customer_name}</p>
                    <p className="text-xs text-gray-500">{o.customer_email}</p>
                  </td>
                  <td className="px-6 py-4 font-bold">{Number(o.total).toFixed(2)} €</td>
                  <td className="px-6 py-4"><StatusBadge status={o.status} /></td>
                  <td className="px-6 py-4 text-gray-500">{new Date(o.created_at).toLocaleDateString('fr-FR')}</td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/admin/commandes/${o.id}`} className="inline-flex items-center gap-1 text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:border-gold hover:bg-gold/5 transition">
                      <Eye size={12} /> Voir
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination page={page} count={count} onChange={setPage} />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = statusInfo(status);
  return <span className={`${s.badge} text-xs px-2.5 py-1 rounded-full font-bold`}>{s.label}</span>;
}
