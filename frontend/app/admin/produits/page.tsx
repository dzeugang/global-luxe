'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import { Plus, Download, Filter, ChevronDown, AlertCircle, Check, Activity, Package, RefreshCw } from 'lucide-react';

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
  const [importing, setImporting] = useState(false);

  const load = async () => {
    try {
      const r = await api.get('/products/');
      setProducts(r.data.results || r.data);
    } catch {}
  };

  useEffect(() => { load(); }, []);

  const importFromCJ = async () => {
    if (!confirm('Importer les produits depuis CJ Dropshipping ?')) return;
    setImporting(true);
    try {
      const r = await api.post('/integrations/cj/import-products/');
      alert(`✅ ${r.data.imported} produit(s) importé(s)`);
      load();
    } catch { alert('❌ Erreur'); }
    finally { setImporting(false); }
  };

  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.is_active).length;
  const outOfStock = products.filter(p => p.stock === 0).length;

  return (
    <div>
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-black mb-2">Product Inventory</h1>
          <p className="text-gray-500">Manage your dropshipping catalog, pricing, and synchronization status.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button onClick={importFromCJ} disabled={importing} className="px-5 py-2.5 border border-gray-300 rounded-xl text-sm font-bold hover:border-gold flex items-center gap-2 disabled:opacity-50">
            <Download size={16} /> {importing ? 'Importing...' : 'Import CJ'}
          </button>
          <Link href="/admin/produits/nouveau" className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition">
            <Plus size={16} /> Add Product
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 border border-gray-300">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Package size={16} /> Total Products
          </div>
          <p className="text-3xl font-black">{totalProducts.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-300">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Check size={16} className="text-emerald-600" /> Active Listings
          </div>
          <p className="text-3xl font-black">{activeProducts.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-300">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <AlertCircle size={16} className="text-red-500" /> Out of Stock
          </div>
          <p className="text-3xl font-black">{outOfStock}</p>
        </div>
        <div className="bg-gray-900 text-white rounded-2xl p-5">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
            <RefreshCw size={16} /> Last Sync
          </div>
          <p className="text-2xl font-black mb-1">10 mins ago</p>
          <p className="text-xs text-gray-400">CJdropshipping API</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-300 overflow-hidden">
        <div className="p-4 border-b border-gray-300 flex flex-col sm:flex-row justify-between gap-3">
          <div className="flex gap-2">
            <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:border-gold flex items-center gap-2">
              <Filter size={14} /> Filter
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:border-gold flex items-center gap-2">
              Category: All <ChevronDown size={14} />
            </button>
          </div>
          <span className="text-sm text-gray-500 self-center">Showing 1-{products.length} of {totalProducts}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs uppercase text-gray-500 font-bold">Product</th>
                <th className="px-6 py-3 text-left text-xs uppercase text-gray-500 font-bold">Category</th>
                <th className="px-6 py-3 text-left text-xs uppercase text-gray-500 font-bold">Status</th>
                <th className="px-6 py-3 text-left text-xs uppercase text-gray-500 font-bold">Cost (CJ)</th>
                <th className="px-6 py-3 text-left text-xs uppercase text-gray-500 font-bold">Selling Price</th>
                <th className="px-6 py-3 text-right text-xs uppercase text-gray-500 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr><td colSpan={6} className="p-12 text-center text-gray-400">Aucun produit. Importez depuis CJ ou créez-en un.</td></tr>
              ) : products.map((p) => (
                <tr key={p.id} className="border-t border-gray-300 hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-300 rounded-lg overflow-hidden flex-shrink-0">
                        {p.main_image ? <img src={p.main_image} alt="" className="w-full h-full object-cover" /> : <Package size={20} className="m-auto h-full text-gray-400" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold truncate max-w-xs">{p.name}</p>
                        <p className="text-xs text-gray-500">SKU: {p.sku || `GL-${p.id}`}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{p.category_name || '-'}</td>
                  <td className="px-6 py-4">
                    {p.stock > 0 ? (
                      <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md text-xs font-bold">
                        <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full" /> In Stock ({p.stock})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-red-100 text-red-600 px-2 py-1 rounded-md text-xs font-bold">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full" /> Out of Stock
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-mono">${Number(p.base_price || 0).toFixed(2)}</td>
                  <td className="px-6 py-4 font-bold">${Number(p.sale_price).toFixed(2)}</td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/admin/produits/${p.id}`} className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:border-gold inline-block">
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-gray-300 flex justify-between items-center">
          <span className="text-sm text-gray-500">{products.length > 0 ? '1 selected' : ''}</span>
          <div className="flex gap-2">
            <button className="w-9 h-9 border border-gray-300 rounded-lg hover:border-gold">‹</button>
            <button className="w-9 h-9 bg-emerald-600 text-white rounded-lg font-bold">1</button>
            <button className="w-9 h-9 border border-gray-300 rounded-lg hover:border-gold">2</button>
            <button className="w-9 h-9 border border-gray-300 rounded-lg hover:border-gold">3</button>
            <span className="w-9 h-9 flex items-center justify-center text-gray-400">...</span>
            <button className="w-9 h-9 border border-gray-300 rounded-lg hover:border-gold">›</button>
          </div>
        </div>
      </div>
    </div>
  );
}