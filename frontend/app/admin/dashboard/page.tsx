'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  ResponsiveContainer, Tooltip,
  PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis,
} from 'recharts';
import {
  Package, ShoppingCart, Users, DollarSign, MessageSquare,
  AlertTriangle, ArrowUpRight, ArrowDownRight,
  Calendar, Download, MoreHorizontal,
} from 'lucide-react';
import Link from 'next/link';

// === TYPES ===
interface OrderStats {
  total_orders?: number;
  total_revenue?: number;
  revenue_per_week?: { week: string; revenue: number }[];
}

interface Order {
  id: number;
  customer_name: string;
  customer_email?: string;
  total: number;
  status: string;
  created_at: string;
}

export default function DashboardPage() {
  // ✅ Types corrects (pas de "any")
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [products, setProducts] = useState(0);
  const [customers, setCustomers] = useState(0);
  const [recent, setRecent] = useState<Order[]>([]);
  const [period, setPeriod] = useState('7d');

  useEffect(() => {
    api.get('/orders/stats/').then((r) => setStats(r.data)).catch(() => {});
    api.get('/products/').then((r) => setProducts(r.data.count || 0)).catch(() => {});
    api.get('/customers/').then((r) => setCustomers(r.data.length || 0)).catch(() => {});
    api.get('/orders/?ordering=-created_at').then((r) => setRecent((r.data.results || r.data).slice(0, 5))).catch(() => {});
  }, []);

  // Données simulées
  const revenueData = Array.from({ length: 12 }, (_, i) => ({
    month: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'][i],
    revenue: Math.floor(Math.random() * 15000) + 5000,
    target: Math.floor(Math.random() * 12000) + 8000,
  }));

  const categoryData = [
    { name: 'Électronique', value: 42, color: '#D4AF37' },
    { name: 'Beauté', value: 28, color: '#C084A3' },
    { name: 'Maison', value: 18, color: '#7C9CB4' },
    { name: 'Mode', value: 12, color: '#8B9D83' },
  ];

  // KPI Cards
  const cards = [
    {
      label: 'Produits',
      value: products.toLocaleString(),
      icon: Package,
      change: '+16.8%',
      up: true,
      gradient: 'from-amber-50 to-orange-50',
      iconBg: 'bg-gradient-to-br from-gold to-gold-dark',
      iconColor: 'text-white',
      chart: [40, 35, 45, 42, 50, 48, 55],
    },
    {
      label: 'Commandes',
      value: (stats?.total_orders || 0).toLocaleString(),
      icon: ShoppingCart,
      change: '-1.21%',
      up: false,
      gradient: 'from-rose-50 to-pink-50',
      iconBg: 'bg-gradient-to-br from-rose-400 to-rose-600',
      iconColor: 'text-white',
      chart: [30, 32, 28, 35, 30, 25, 28],
    },
    {
      label: 'Revenus',
      value: `€${(stats?.total_revenue || 0).toLocaleString()}`,
      icon: DollarSign,
      change: '+8.4%',
      up: true,
      gradient: 'from-emerald-50 to-teal-50',
      iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-600',
      iconColor: 'text-white',
      chart: [45, 48, 52, 50, 58, 62, 65],
    },
    {
      label: 'Clients',
      value: customers.toLocaleString(),
      icon: Users,
      change: '-4.20%',
      up: false,
      gradient: 'from-sky-50 to-blue-50',
      iconBg: 'bg-gradient-to-br from-sky-500 to-blue-600',
      iconColor: 'text-white',
      chart: [20, 22, 25, 24, 28, 26, 30],
    },
  ];

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Tableau de bord</h1>
          <p className="text-gray-500 mt-1">Vue d&apos;ensemble de votre activité</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
            <Calendar size={16} className="text-gray-400 mr-2" />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-transparent border-0 outline-none text-sm text-gray-700 cursor-pointer"
            >
              <option value="7d">7 derniers jours</option>
              <option value="30d">30 derniers jours</option>
              <option value="90d">3 mois</option>
              <option value="1y">1 an</option>
            </select>
          </div>
          <button className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-medium text-gray-700 hover:border-gold hover:text-gold transition shadow-sm">
            <Download size={16} /> Exporter
          </button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.label}
              className={`bg-gradient-to-br ${c.gradient} rounded-2xl p-5 border-2 border-gray-300 shadow-md hover:shadow-xl hover:border-gold transition-all duration-300 hover:-translate-y-1`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`${c.iconBg} p-3 rounded-xl shadow-lg shadow-black/10`}>
                  <Icon size={20} className={c.iconColor} />
                </div>
                <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${
                  c.up ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                }`}>
                  {c.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {c.change}
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-1 font-medium">{c.label}</p>
              <p className="text-2xl lg:text-3xl font-black text-gray-900 mb-3">{c.value}</p>

              {/* ✅ Mini sparkline CORRIGÉE */}
              <div className="h-8 w-full opacity-60">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={c.chart.map((v, idx) => ({ idx, v }))}>
                    <Area
                      type="monotone"
                      dataKey="v"
                      stroke={c.up ? '#10B981' : '#F43F5E'}
                      fill={c.up ? '#10B98120' : '#F43F5E20'}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })}
      </div>

      {/* CHARTS GRID */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Revenus */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-lg text-gray-900">Revenus &amp; Objectifs</h3>
              <p className="text-sm text-gray-500">Comparaison mensuelle</p>
            </div>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition">
              <MoreHorizontal size={20} className="text-gray-400" />
            </button>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#94A3B8" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#94A3B8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" fontSize={12} stroke="#CBD5E1" tickLine={false} axisLine={false} />
              <YAxis fontSize={12} stroke="#CBD5E1" tickLine={false} axisLine={false} tickFormatter={(v: number) => `€${v / 1000}k`} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                formatter={(value) => [`€${Number(value).toLocaleString()}`, '']}
              />
              <Area type="monotone" dataKey="revenue" stroke="#D4AF37" strokeWidth={3} fill="url(#colorRevenue)" />
              <Area type="monotone" dataKey="target" stroke="#94A3B8" strokeWidth={2} strokeDasharray="5 5" fill="url(#colorTarget)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Donut Catégories */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <h3 className="font-bold text-lg text-gray-900 mb-2">Répartition</h3>
          <p className="text-sm text-gray-500 mb-6">Ventes par catégorie</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={85}
                dataKey="value"
                stroke="none"
              >
                {categoryData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [`${value}%`, '']}
                contentStyle={{ borderRadius: '12px', border: 'none' }}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="space-y-2 mt-4">
            {categoryData.map((cat) => (
              <div key={cat.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-gray-600">{cat.name}</span>
                </div>
                <span className="font-bold text-gray-900">{cat.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* COMMANDES + SIDEBAR */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg text-gray-900">Commandes récentes</h3>
              <p className="text-sm text-gray-500">Dernières transactions</p>
            </div>
            <Link href="/admin/commandes" className="text-sm text-gold hover:text-gold-dark font-medium flex items-center gap-1">
              Voir tout <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/80">
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Commande</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recent.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-gray-400">
                      <Package size={48} className="mx-auto mb-3 text-gray-300" />
                      Aucune commande pour le moment
                    </td>
                  </tr>
                ) : recent.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center font-bold text-gray-500 text-xs">
                          #{o.id}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">CMD-{String(o.id).padStart(4, '0')}</div>
                          <div className="text-xs text-gray-400">{new Date(o.created_at).toLocaleDateString('fr-FR')}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold/20 to-gold/40 flex items-center justify-center text-xs font-bold text-gold-dark">
                          {o.customer_name?.charAt(0)?.toUpperCase() || 'C'}
                        </div>
                        <span className="font-medium text-gray-700">{o.customer_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900">€{Number(o.total).toFixed(2)}</td>
                    <td className="px-6 py-4"><StatusBadge status={o.status} /></td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/admin/commandes/${o.id}`} className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-gray-100 rounded-lg inline-flex">
                        <ArrowUpRight size={16} className="text-gray-400" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* SIDEBAR */}
        <div className="space-y-4">
          {/* Messages */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <MessageSquare size={18} className="text-gold" /> Messages
              </h3>
              <span className="bg-rose-100 text-rose-600 text-xs font-bold px-2 py-1 rounded-full">3 nouveaux</span>
            </div>
            <div className="space-y-3">
              {[
                { name: 'Marie L.', msg: 'Question sur la livraison...', time: '2m', color: 'bg-purple-100 text-purple-600' },
                { name: 'Jean D.', msg: 'Problème de paiement', time: '15m', color: 'bg-blue-100 text-blue-600' },
                { name: 'Sophie M.', msg: 'Demande de retour', time: '1h', color: 'bg-emerald-100 text-emerald-600' },
              ].map((msg, i) => (
                <div key={i} className="flex gap-3 p-2 rounded-xl hover:bg-gray-50 transition cursor-pointer">
                  <div className={`w-10 h-10 rounded-full ${msg.color} flex items-center justify-center font-bold text-sm`}>
                    {msg.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-gray-900">{msg.name}</p>
                      <span className="text-[10px] text-gray-400">{msg.time}</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{msg.msg}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 py-2.5 text-center bg-gradient-to-r from-gold/10 to-gold/5 border border-gold/20 text-gold-dark rounded-xl text-sm font-bold hover:bg-gold/20 transition">
              Voir tous les messages
            </button>
          </div>

          {/* Alertes Stock */}
          <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 border border-amber-200/50 rounded-2xl p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/20 rounded-full blur-3xl" />

            <div className="flex items-start gap-3 mb-4 relative z-10">
              <div className="p-2 bg-amber-100 rounded-xl">
                <AlertTriangle size={20} className="text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Stock critique</h3>
                <p className="text-xs text-gray-600 mt-1">5 produits nécessitent votre attention</p>
              </div>
            </div>

            <div className="space-y-2 relative z-10">
              {[
                { label: 'iPhone 15 Pro', stock: 2, max: 50 },
                { label: 'Casque Sony XM5', stock: 1, max: 30 },
                { label: 'Parfum Chanel N°5', stock: 3, max: 40 },
              ].map((item) => (
                <div key={item.label} className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-amber-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-gray-900">{item.label}</span>
                    <span className="text-xs font-bold text-rose-600">{item.stock} restant</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-rose-400 rounded-full transition-all"
                      style={{ width: `${(item.stock / item.max) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <button className="w-full mt-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-amber-500/25 transition-all">
              Gérer le stock
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// === BADGE STATUS ===
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    pending: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', label: 'En attente' },
    processing: { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500', label: 'En cours' },
    sent_to_cj: { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500', label: 'Expédié CJ' },
    shipped: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', label: 'En livraison' },
    delivered: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Livré' },
    cancelled: { bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500', label: 'Annulé' },
  };
  const s = map[status] || { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-500', label: status };

  return (
    <span className={`${s.bg} ${s.text} text-xs px-3 py-1.5 rounded-full font-semibold inline-flex items-center gap-1.5`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot} ${status === 'pending' || status === 'processing' ? 'animate-pulse' : ''}`} />
      {s.label}
    </span>
  );
}