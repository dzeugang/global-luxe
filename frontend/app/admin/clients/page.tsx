'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import { Search, Mail, Eye, TrendingUp } from 'lucide-react';

interface Customer {
  customer_email: string;
  customer_name: string;
  orders_count: number;
  total_spent: number;
  last_order?: string;
}

export default function CustomersPage() {
  const [list, setList] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/customers/').then((r) => setList(r.data)).catch(() => {});
  }, []);

  const filtered = list.filter(c =>
    c.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.customer_email?.toLowerCase().includes(search.toLowerCase())
  );

  const totalSpent = list.reduce((s, c) => s + Number(c.total_spent), 0);
  const avgOrder = list.length > 0 ? totalSpent / list.reduce((s, c) => s + c.orders_count, 0) : 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-black mb-2">Customers</h1>
        <p className="text-gray-500">View all customers and their order history.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card text-center">
          <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Total Customers</p>
          <p className="text-3xl font-black">{list.length.toLocaleString()}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Total Revenue</p>
          <p className="text-3xl font-black text-emerald-600">€{totalSpent.toFixed(0)}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Avg Order Value</p>
          <p className="text-3xl font-black text-gold">€{avgOrder.toFixed(0)}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-300 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gold"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs uppercase text-gray-500 font-bold">Customer</th>
                <th className="px-6 py-3 text-left text-xs uppercase text-gray-500 font-bold">Orders</th>
                <th className="px-6 py-3 text-left text-xs uppercase text-gray-500 font-bold">Total Spent</th>
                <th className="px-6 py-3 text-left text-xs uppercase text-gray-500 font-bold">Last Order</th>
                <th className="px-6 py-3 text-right text-xs uppercase text-gray-500 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="p-12 text-center text-gray-400">Aucun client</td></tr>
              ) : filtered.map((c) => (
                <tr key={c.customer_email} className="border-t border-gray-300 hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center text-white font-bold">
                        {c.customer_name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold truncate">{c.customer_name}</p>
                        <p className="text-xs text-gray-500 truncate">{c.customer_email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-xs font-bold">
                      {c.orders_count} order{c.orders_count > 1 ? 's' : ''}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold">€{Number(c.total_spent).toFixed(2)}</td>
                  <td className="px-6 py-4 text-gray-500">
                    {c.last_order ? new Date(c.last_order).toLocaleDateString('fr-FR') : '-'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <a href={`mailto:${c.customer_email}`} className="p-2 hover:bg-gold/10 rounded-lg text-gray-600 hover:text-gold transition">
                        <Mail size={14} />
                      </a>
                      <Link href={`/admin/clients/${encodeURIComponent(c.customer_email)}`} className="inline-flex items-center gap-1 text-xs px-3 py-1.5 border border-gray-300 rounded-lg hover:border-gold hover:bg-gold/5 transition">
                        <Eye size={12} /> View
                      </Link>
                    </div>
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