'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  ResponsiveContainer, Tooltip, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import {
  Package, ShoppingCart, Users, Euro, MessageSquare, AlertTriangle, ArrowUpRight, Receipt,
} from 'lucide-react';
import Link from 'next/link';
import { statusInfo } from '@/lib/orders';

interface Stats {
  total_orders: number;
  total_sales: number;
  total_revenue: number;
  orders_last_30d: number;
  average_order: number;
  status_counts: Record<string, number>;
  revenue_per_week: { week: string; sales: number; revenue: number; orders: number }[];
  sales_by_category: { name: string; total: number; quantity: number }[];
  low_stock: { id: number; name: string; stock: number }[];
  low_stock_threshold: number;
  unread_messages: number;
}

interface Order {
  id: number;
  customer_name: string;
  total: number;
  status: string;
  created_at: string;
}

interface Message {
  id: number;
  customer_name: string;
  customer_email: string;
  subject: string;
  is_read: boolean;
  is_from_admin: boolean;
  created_at: string;
}

// La 1re couleur suit la couleur de marque définie dans globals.css
const PIE_COLORS = ['var(--color-gold)', '#C084A3', '#7C9CB4', '#8B9D83', '#E0A458', '#94A3B8'];

const euros = (v: number) => `${v.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;

function timeAgo(date: string) {
  const minutes = Math.round((Date.now() - new Date(date).getTime()) / 60000);
  if (minutes < 60) return `${Math.max(minutes, 1)} min`;
  if (minutes < 60 * 24) return `${Math.round(minutes / 60)} h`;
  return `${Math.round(minutes / 1440)} j`;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [products, setProducts] = useState(0);
  const [customers, setCustomers] = useState(0);
  const [recent, setRecent] = useState<Order[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    api.get('/orders/stats/').then((r) => setStats(r.data)).catch(() => {});
    api.get('/products/').then((r) => setProducts(r.data.count || 0)).catch(() => {});
    api.get('/customers/').then((r) => setCustomers(r.data.length || 0)).catch(() => {});
    api.get('/orders/', { params: { ordering: '-created_at' } }).then((r) => setRecent(r.data.results.slice(0, 5))).catch(() => {});
    api.get('/messages/').then((r) => {
      const list: Message[] = r.data.results || r.data;
      setMessages(list.filter((m) => !m.is_from_admin).slice(0, 3));
    }).catch(() => {});
  }, []);

  const cards = [
    { label: 'Ventes', value: euros(stats?.total_sales || 0), hint: 'Commandes non annulées', icon: Euro, iconBg: 'from-emerald-500 to-teal-600' },
    { label: 'Commandes', value: (stats?.total_orders || 0).toLocaleString('fr-FR'), hint: `${stats?.orders_last_30d || 0} sur 30 jours`, icon: ShoppingCart, iconBg: 'from-rose-400 to-rose-600' },
    { label: 'Panier moyen', value: euros(stats?.average_order || 0), hint: 'Par commande', icon: Receipt, iconBg: 'from-gold to-gold-dark' },
    { label: 'Clients', value: customers.toLocaleString('fr-FR'), hint: `${products} produits au catalogue`, icon: Users, iconBg: 'from-sky-500 to-blue-600' },
  ];

  const salesTotal = (stats?.sales_by_category || []).reduce((a, c) => a + c.total, 0);
  const categoryData = (stats?.sales_by_category || []).slice(0, 6).map((c, i) => ({
    ...c,
    share: salesTotal ? Math.round((c.total / salesTotal) * 100) : 0,
    color: PIE_COLORS[i % PIE_COLORS.length],
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Tableau de bord</h1>
        <p className="text-gray-500 mt-1">Vue d&apos;ensemble de votre activité</p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
              <div className={`bg-gradient-to-br ${c.iconBg} p-3 rounded-xl shadow-lg shadow-black/10 w-fit mb-4`}>
                <Icon size={20} className="text-white" />
              </div>
              <p className="text-sm text-gray-600 mb-1 font-medium">{c.label}</p>
              <p className="text-2xl lg:text-3xl font-black text-gray-900">{c.value}</p>
              <p className="text-xs text-gray-400 mt-1">{c.hint}</p>
            </div>
          );
        })}
      </div>

      {/* Graphiques */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <h3 className="font-bold text-lg text-gray-900">Ventes des 8 dernières semaines</h3>
          <p className="text-sm text-gray-500 mb-6">Montant des commandes (hors annulées) et part déjà payée</p>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={stats?.revenue_per_week || []}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-gold)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-gold)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="week" fontSize={12} stroke="#94A3B8" tickLine={false} axisLine={false} />
              <YAxis fontSize={12} stroke="#94A3B8" tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v} €`} width={70} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                formatter={(value, name) => [euros(Number(value)), name === 'sales' ? 'Ventes' : 'Payé']}
              />
              <Area type="monotone" dataKey="sales" stroke="var(--color-gold)" strokeWidth={3} fill="url(#colorSales)" />
              <Area type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} strokeDasharray="5 5" fill="transparent" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <h3 className="font-bold text-lg text-gray-900 mb-1">Répartition</h3>
          <p className="text-sm text-gray-500 mb-4">Ventes par catégorie</p>
          {categoryData.length === 0 ? (
            <p className="text-sm text-gray-400 py-16 text-center">Pas encore de ventes</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="total" nameKey="name" stroke="none">
                    {categoryData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(value) => euros(Number(value))} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-4">
                {categoryData.map((cat) => (
                  <div key={cat.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="text-gray-600">{cat.name}</span>
                    </div>
                    <span className="font-bold text-gray-900">{cat.share} %</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Commandes récentes + colonne latérale */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg text-gray-900">Commandes récentes</h3>
              <p className="text-sm text-gray-500">{stats?.status_counts?.pending || 0} en attente de traitement</p>
            </div>
            <Link href="/admin/commandes" className="text-sm text-gold hover:text-gold-dark font-medium flex items-center gap-1">
              Voir tout <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                {recent.length === 0 ? (
                  <tr>
                    <td className="p-12 text-center text-gray-400">
                      <Package size={48} className="mx-auto mb-3 text-gray-300" />
                      Aucune commande pour le moment
                    </td>
                  </tr>
                ) : recent.map((o) => {
                  const s = statusInfo(o.status);
                  return (
                    <tr key={o.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4">
                        <Link href={`/admin/commandes/${o.id}`} className="font-bold text-gray-900 hover:text-gold">#{o.id}</Link>
                        <div className="text-xs text-gray-400">{new Date(o.created_at).toLocaleDateString('fr-FR')}</div>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-700">{o.customer_name}</td>
                      <td className="px-6 py-4 font-bold text-gray-900">{euros(Number(o.total))}</td>
                      <td className="px-6 py-4"><span className={`${s.badge} text-xs px-3 py-1 rounded-full font-semibold`}>{s.label}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          {/* Messages */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <MessageSquare size={18} className="text-gold" /> Messages
              </h3>
              {!!stats?.unread_messages && (
                <span className="bg-rose-100 text-rose-600 text-xs font-bold px-2 py-1 rounded-full">
                  {stats.unread_messages} non lu{stats.unread_messages > 1 ? 's' : ''}
                </span>
              )}
            </div>
            {messages.length === 0 ? (
              <p className="text-sm text-gray-400">Aucun message</p>
            ) : (
              <div className="space-y-2">
                {messages.map((m) => (
                  <Link key={m.id} href="/admin/messages" className="flex gap-3 p-2 rounded-xl hover:bg-gray-50 transition">
                    <div className="w-10 h-10 rounded-full bg-gold/15 text-gold-dark flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {(m.customer_name || m.customer_email).charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm truncate ${m.is_read ? 'text-gray-700' : 'font-bold text-gray-900'}`}>{m.customer_name || m.customer_email}</p>
                        <span className="text-[10px] text-gray-400 flex-shrink-0">{timeAgo(m.created_at)}</span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{m.subject}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            <Link href="/admin/messages" className="block w-full mt-4 py-2.5 text-center bg-gold/10 border border-gold/20 text-gold-dark rounded-xl text-sm font-bold hover:bg-gold/20 transition">
              Voir tous les messages
            </Link>
          </div>

          {/* Stock faible */}
          <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 border border-amber-200/50 rounded-2xl p-6 shadow-sm">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-amber-100 rounded-xl">
                <AlertTriangle size={20} className="text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Stock faible</h3>
                <p className="text-xs text-gray-600 mt-1">
                  Produits en ligne avec {stats?.low_stock_threshold ?? 5} unités ou moins
                </p>
              </div>
            </div>
            {(stats?.low_stock || []).length === 0 ? (
              <p className="text-sm text-gray-600">Tout est bien approvisionné.</p>
            ) : (
              <div className="space-y-2">
                {stats!.low_stock.map((item) => (
                  <Link key={item.id} href={`/admin/produits/${item.id}`} className="block bg-white/80 rounded-xl p-3 border border-amber-100 hover:border-amber-300">
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-xs font-bold text-gray-900 truncate">{item.name}</span>
                      <span className="text-xs font-bold text-rose-600 flex-shrink-0">
                        {item.stock === 0 ? 'Rupture' : `${item.stock} restant${item.stock > 1 ? 's' : ''}`}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            <Link href="/admin/produits" className="block w-full mt-4 py-2.5 text-center bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-bold hover:shadow-lg transition-all">
              Gérer le stock
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
