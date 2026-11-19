'use client';
import { useEffect, useState } from 'react';
import { api, apiError } from '@/lib/api';
import Link from 'next/link';
import { Plus, Download, Search, AlertCircle, Check, Package, Eye, EyeOff, Trash2 } from 'lucide-react';
import Pagination from '@/components/admin/Pagination';
import type { Category } from '@/types';

interface Product {
  id: number;
  name: string;
  sku?: string;
  category_name?: string;
  main_image?: string;
  sale_price: number;
  base_price?: number;
  stock: number;
  is_active: boolean;
}

export default function ProductsAdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [kpis, setKpis] = useState({ total: 0, active: 0, inStock: 0 });
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const t = setTimeout(() => { setQuery(search.trim()); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  // Incrémenté après chaque modification pour recharger liste et compteurs
  const [reloadKey, setReloadKey] = useState(0);
  const refresh = () => setReloadKey((k) => k + 1);

  useEffect(() => {
    api.get('/products/', { params: { page, search: query || undefined, category__slug: category || undefined } })
      .then((r) => { setProducts(r.data.results); setCount(r.data.count); })
      .catch(() => {});
  }, [page, query, category, reloadKey]);

  useEffect(() => {
    Promise.all([
      api.get('/products/'),
      api.get('/products/', { params: { is_active: true } }),
      api.get('/products/', { params: { stock__gt: 0 } }),
    ])
      .then(([all, active, inStock]) => setKpis({ total: all.data.count, active: active.data.count, inStock: inStock.data.count }))
      .catch(() => {});
  }, [reloadKey]);

  useEffect(() => {
    api.get('/products/categories/').then((r) => setCategories(r.data.results || r.data)).catch(() => {});
  }, []);

  const importFromCJ = async () => {
    const margin = prompt('Marge à appliquer sur le prix CJ (en %) :', '50');
    if (margin === null) return;
    setImporting(true);
    try {
      const r = await api.post('/integrations/cj/import-products/', { margin: Number(margin) || 0 });
      setMessage(`${r.data.imported} produit(s) importé(s). Ils sont inactifs : vérifiez-les, mettez un stock puis activez-les.`);
      refresh();
    } catch (e) {
      setMessage(`Erreur d'import : ${apiError(e).detail || 'CJ indisponible'}`);
    } finally { setImporting(false); }
  };

  const toggleActive = async (p: Product) => {
    await api.patch(`/products/${p.id}/`, { is_active: !p.is_active });
    refresh();
  };

  const remove = async (p: Product) => {
    if (!confirm(`Supprimer « ${p.name} » ?`)) return;
    const r = await api.delete(`/products/${p.id}/`);
    setMessage(r.data?.detail || `« ${p.name} » supprimé.`);
    refresh();
  };

  const cards = [
    { label: 'Produits', value: kpis.total, icon: <Package size={16} /> },
    { label: 'En ligne', value: kpis.active, icon: <Check size={16} className="text-emerald-600" /> },
    { label: 'En rupture', value: kpis.total - kpis.inStock, icon: <AlertCircle size={16} className="text-red-500" /> },
    { label: 'Hors ligne', value: kpis.total - kpis.active, icon: <EyeOff size={16} className="text-gray-400" /> },
  ];

  return (
    <div>
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-black mb-2">Produits</h1>
          <p className="text-gray-500">Gérez votre catalogue, vos prix et vos stocks.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button onClick={importFromCJ} disabled={importing} className="px-5 py-2.5 border border-gray-300 rounded-xl text-sm font-bold hover:border-gold flex items-center gap-2 disabled:opacity-50">
            <Download size={16} /> {importing ? 'Import…' : 'Importer depuis CJ'}
          </button>
          <Link href="/admin/produits/nouveau" className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition">
            <Plus size={16} /> Nouveau produit
          </Link>
        </div>
      </div>

      {message && (
        <p className="mb-4 text-sm rounded-lg px-4 py-3 bg-blue-50 text-blue-800 flex justify-between gap-4">
          {message}
          <button onClick={() => setMessage('')} className="font-bold" aria-label="Fermer">×</button>
        </p>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-2xl p-5 border border-gray-300">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">{c.icon} {c.label}</div>
            <p className="text-3xl font-black">{c.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-300 overflow-hidden">
        <div className="p-4 border-b border-gray-300 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom, description ou SKU…"
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gold"
            />
          </div>
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-gold"
          >
            <option value="">Toutes les catégories</option>
            {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Produit', 'Catégorie', 'Stock', 'Coût', 'Prix de vente', ''].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs uppercase text-gray-500 font-bold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr><td colSpan={6} className="p-12 text-center text-gray-400">Aucun produit. Importez depuis CJ ou créez-en un.</td></tr>
              ) : products.map((p) => (
                <tr key={p.id} className={`border-t border-gray-300 hover:bg-gray-50 ${p.is_active ? '' : 'opacity-60'}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {p.main_image ? <img src={p.main_image} alt="" className="w-full h-full object-cover" /> : <Package size={20} className="text-gray-400" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold truncate max-w-xs">{p.name}</p>
                        <p className="text-xs text-gray-500">SKU : {p.sku || '—'} {!p.is_active && '· hors ligne'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{p.category_name || '—'}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold ${
                      p.stock > 5 ? 'bg-emerald-100 text-emerald-700' : p.stock > 0 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'
                    }`}>
                      {p.stock > 0 ? p.stock : 'Rupture'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono">{Number(p.base_price || 0).toFixed(2)} €</td>
                  <td className="px-6 py-4 font-bold">{Number(p.sale_price).toFixed(2)} €</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => toggleActive(p)} title={p.is_active ? 'Mettre hors ligne' : 'Mettre en ligne'} className="p-2 border border-gray-200 rounded-lg hover:border-gold">
                        {p.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <Link href={`/admin/produits/${p.id}`} className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:border-gold inline-flex items-center">
                        Modifier
                      </Link>
                      <button onClick={() => remove(p)} title="Supprimer" className="p-2 border border-gray-200 rounded-lg hover:border-red-400 hover:text-red-600">
                        <Trash2 size={14} />
                      </button>
                    </div>
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
