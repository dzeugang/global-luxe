'use client';
import { useEffect, useState, use } from 'react';
import { api } from '@/lib/api';
import ProductForm from '@/components/admin/ProductForm';
import Link from 'next/link';
import { ArrowLeft, AlertCircle } from 'lucide-react';

interface ProductData {
  id: number;
  name: string;
  sku?: string;
  description?: string;
  main_image?: string;
  images?: string[];
  base_price: number;
  sale_price: number;
  stock: number;
  category?: number;
  is_active: boolean;
  is_featured: boolean;
  is_best_seller: boolean;
}

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/products/${id}/`)
      .then((r) => {
        setData(r.data);
        setLoading(false);
      })
      .catch((e) => {
        console.error('Erreur chargement produit:', e);
        setError('Impossible de charger le produit');
        setLoading(false);
      });
  }, [id]);

  // État de chargement
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 bg-gray-200 rounded w-1/3 animate-pulse"></div>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="card h-64 animate-pulse bg-gray-100"></div>
            <div className="card h-96 animate-pulse bg-gray-100"></div>
          </div>
          <div className="space-y-4">
            <div className="card h-64 animate-pulse bg-gray-100"></div>
            <div className="card h-96 animate-pulse bg-gray-100"></div>
          </div>
        </div>
      </div>
    );
  }

  // État d'erreur
  if (error || !data) {
    return (
      <div className="card text-center py-12">
        <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
        <h2 className="text-xl font-bold mb-2">Produit introuvable</h2>
        <p className="text-gray-500 mb-6">{error || 'Ce produit n\'existe pas ou plus.'}</p>
        <Link
          href="/admin/produits"
          className="inline-flex items-center gap-2 btn-gold"
        >
          <ArrowLeft size={16} /> Retour aux produits
        </Link>
      </div>
    );
  }

  return <ProductForm productId={id} initialData={data} />;
}