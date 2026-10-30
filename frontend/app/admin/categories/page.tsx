'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import {
  Plus, Edit2, Trash2, Search, Image as ImageIcon,
  Package, Eye, EyeOff, GripVertical, AlertCircle,
} from 'lucide-react';
import CategoryFormModal from '@/components/admin/CategoryFormModal';

interface Category {
  id: number;
  name: string;
  slug: string;
  image?: string;
  image_url?: string;
  image_file?: string;
  banner?: string;
  banner_url?: string;
  banner_file?: string;
  description?: string;
  order: number;
  is_active: boolean;
  products_count?: number;
}

export default function CategoriesAdminPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const r = await api.get('/products/categories/');
      setCategories(r.data.results || r.data);
    } catch (error) {
      console.error('Erreur chargement catégories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleCreate = () => {
    setEditingCategory(null);
    setShowForm(true);
  };

  const handleEdit = (cat: Category) => {
    setEditingCategory(cat);
    setShowForm(true);
  };

  const handleDelete = async (cat: Category) => {
    if (!confirm(`⚠️ Supprimer "${cat.name}" ?\n\nCela ne supprimera PAS les produits, ils seront juste sans catégorie.`)) {
      return;
    }
    try {
      await api.delete(`/products/categories/${cat.slug}/`);
      loadCategories();
    } catch {
      alert('❌ Erreur lors de la suppression');
    }
  };

  const toggleActive = async (cat: Category) => {
    try {
      const fd = new FormData();
      fd.append('is_active', String(!cat.is_active));
      await api.patch(`/products/categories/${cat.slug}/`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      loadCategories();
    } catch {
      alert('❌ Erreur');
    }
  };

  const filtered = categories.filter(
    (c) =>
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.slug.toLowerCase().includes(search.toLowerCase())
  );

  const totalProducts = categories.reduce((sum, c) => sum + (c.products_count || 0), 0);
  const activeCount = categories.filter((c) => c.is_active).length;

  return (
    <div>
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="h1 mb-1">📂 Catégories</h1>
          <p className="text-gray-500">
            Gérez les catégories de produits, leurs images et leur ordre d&apos;affichage
          </p>
        </div>
        <button onClick={handleCreate} className="btn-gold">
          <Plus size={18} /> Nouvelle catégorie
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card text-center">
          <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Total</p>
          <p className="text-3xl font-black text-gray-900">{categories.length}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Actives</p>
          <p className="text-3xl font-black text-emerald-600">{activeCount}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Produits</p>
          <p className="text-3xl font-black text-gold">{totalProducts}</p>
        </div>
      </div>

      {/* RECHERCHE */}
      <div className="card mb-6">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une catégorie..."
            className="input pl-10"
          />
        </div>
      </div>

      {/* GRILLE DES CATÉGORIES */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="aspect-square bg-gray-200 rounded-xl mb-3"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <Package size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-gray-700 font-semibold mb-2">Aucune catégorie</p>
          <button onClick={handleCreate} className="btn-gold mt-3">
            <Plus size={16} /> Créer la première
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((cat) => (
            <div
              key={cat.id}
              className={`group relative bg-white rounded-2xl overflow-hidden border-2 ${
                cat.is_active ? 'border-gray-200' : 'border-red-200 opacity-60'
              } hover:border-gold hover:shadow-xl transition-all duration-300`}
            >
              {/* IMAGE */}
              <div className="aspect-square bg-gray-100 relative overflow-hidden">
                {cat.image_url || cat.image ? (
                  <img
                    src={cat.image_url || cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/400x400?text=' + cat.name;
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon size={48} className="text-gray-300" />
                  </div>
                )}

                {/* Overlay au hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition" />

                {/* Actions au hover */}
                <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={() => handleEdit(cat)}
                    className="w-10 h-10 bg-white text-gray-900 rounded-full flex items-center justify-center hover:bg-gold hover:text-white transition shadow-lg"
                    title="Modifier"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => toggleActive(cat)}
                    className="w-10 h-10 bg-white text-gray-900 rounded-full flex items-center justify-center hover:bg-blue-500 hover:text-white transition shadow-lg"
                    title={cat.is_active ? 'Désactiver' : 'Activer'}
                  >
                    {cat.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button
                    onClick={() => handleDelete(cat)}
                    className="w-10 h-10 bg-white text-red-500 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition shadow-lg"
                    title="Supprimer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Badge actif/inactif */}
                <div className="absolute top-2 left-2">
                  {cat.is_active ? (
                    <span className="bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-white rounded-full"></span> Actif
                    </span>
                  ) : (
                    <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                      Inactif
                    </span>
                  )}
                </div>

                {/* Ordre */}
                <div className="absolute top-2 right-2 bg-gray-900/70 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full font-mono">
                  #{cat.order}
                </div>
              </div>

              {/* INFOS */}
              <div className="p-4">
                <h3 className="font-bold text-base text-gray-900 mb-1">{cat.name}</h3>
                <p className="text-xs text-gray-500 font-mono mb-2">/{cat.slug}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-1">
                    <Package size={12} /> {cat.products_count || 0} produits
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL DE FORMULAIRE */}
      {showForm && (
        <CategoryFormModal
          category={editingCategory}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            loadCategories();
          }}
        />
      )}
    </div>
  );
}