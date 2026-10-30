'use client';
import { useEffect, useState, use } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import { ArrowLeft, Mail, ShoppingBag, Euro } from 'lucide-react';

export default function CustomerDetailPage({ params }: { params: Promise<{ email: string }> }) {
  const { email } = use(params);
  const decodedEmail = decodeURIComponent(email);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.get(`/customers/${decodedEmail}/`).then((r) => setData(r.data));
  }, [decodedEmail]);

  if (!data) return <div className="p-8">Chargement…</div>;

  return (
    <div>
      <Link href="/admin/clients" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gold mb-4">
        <ArrowLeft size={16} /> Retour aux clients
      </Link>

      <h1 className="text-2xl sm:text-3xl font-bold mb-2">{decodedEmail}</h1>

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div className="card flex items-center gap-3">
          <div className="bg-blue-100 text-blue-600 p-3 rounded-lg"><ShoppingBag size={20} /></div>
          <div>
            <p className="text-sm text-gray-500">Commandes</p>
            <p className="text-2xl font-bold">{data.orders_count}</p>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="bg-green-100 text-green-600 p-3 rounded-lg"><Euro size={20} /></div>
          <div>
            <p className="text-sm text-gray-500">Total dépensé</p>
            <p className="text-2xl font-bold">{Number(data.total_spent).toFixed(2)} €</p>
          </div>
        </div>
        <a href={`mailto:${decodedEmail}`} className="card flex items-center gap-3 hover:bg-gray-50">
          <div className="bg-gold/10 text-gold p-3 rounded-lg"><Mail size={20} /></div>
          <div>
            <p className="text-sm text-gray-500">Contacter</p>
            <p className="font-bold text-sm">Envoyer un email</p>
          </div>
        </a>
      </div>

      <div className="card">
        <h2 className="font-bold mb-4">Historique des commandes</h2>
        <div className="space-y-2">
          {data.orders.map((o: any) => (
            <Link
              key={o.id}
              href={`/admin/commandes/${o.id}`}
              className="flex justify-between items-center p-3 rounded-lg hover:bg-gray-50 transition"
            >
              <div>
                <p className="font-semibold">#{o.id}</p>
                <p className="text-xs text-gray-500">{new Date(o.created_at).toLocaleDateString('fr-FR')}</p>
              </div>
              <div className="text-right">
                <p className="font-bold">{Number(o.total).toFixed(2)} €</p>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-300">{o.status}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}