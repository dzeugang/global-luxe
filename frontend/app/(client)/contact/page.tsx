'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import Link from 'next/link';
import { Mail, Phone, Send, CheckCircle2, Package } from 'lucide-react';
import { api, apiError } from '@/lib/api';
import { useShop } from '@/components/ShopProvider';

const schema = z.object({
  customer_name: z.string().min(2, 'Nom requis'),
  customer_email: z.string().email('Email invalide'),
  subject: z.string().min(3, 'Sujet requis'),
  content: z.string().min(10, 'Message trop court (10 caractères minimum)'),
});
type FormData = z.infer<typeof schema>;

export default function ContactPage() {
  const shop = useShop();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      await api.post('/messages/', data);
      setSent(true);
      reset();
    } catch (e) {
      setError(apiError(e).status === 429
        ? 'Trop de messages envoyés. Réessayez plus tard.'
        : "Le message n'a pas pu être envoyé. Réessayez ou écrivez-nous par email.");
    }
  };

  return (
    <div className="container-app py-8 lg:py-12 max-w-5xl">
      <h1 className="h1 mb-2">Contactez-nous</h1>
      <p className="text-gray-600 mb-8">Une question sur un produit ou une commande ? Nous répondons sous 48 h ouvrées.</p>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="card">
            <p className="font-bold mb-3">Nos coordonnées</p>
            <p className="text-sm flex items-center gap-2 break-all"><Mail size={16} className="text-gold flex-shrink-0" /> {shop.contact_email}</p>
            {shop.contact_phone && <p className="text-sm flex items-center gap-2 mt-2"><Phone size={16} className="text-gold" /> {shop.contact_phone}</p>}
          </div>
          <Link href="/suivi" className="card flex items-center gap-3 hover:border-gold transition">
            <Package size={20} className="text-gold" />
            <span className="text-sm"><span className="font-bold block">Où est ma commande ?</span>Suivez-la avec son numéro.</span>
          </Link>
          <Link href="/faq" className="card block text-sm hover:border-gold transition">
            <span className="font-bold block">Questions fréquentes</span>Livraison, retours, paiement…
          </Link>
        </div>

        <div className="card lg:col-span-2">
          {sent ? (
            <div className="text-center py-10">
              <CheckCircle2 size={48} className="text-emerald-600 mx-auto mb-4" />
              <p className="text-xl font-bold mb-2">Message envoyé !</p>
              <p className="text-gray-600 mb-6">Nous vous répondrons par email très rapidement.</p>
              <button onClick={() => setSent(false)} className="btn-outline">Envoyer un autre message</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Nom" error={errors.customer_name?.message}>
                  <input {...register('customer_name')} className="input" autoComplete="name" />
                </Field>
                <Field label="Email" error={errors.customer_email?.message}>
                  <input type="email" {...register('customer_email')} className="input" autoComplete="email" />
                </Field>
              </div>
              <Field label="Sujet" error={errors.subject?.message}>
                <input {...register('subject')} className="input" placeholder="ex. Question sur ma commande n° 42" />
              </Field>
              <Field label="Message" error={errors.content?.message}>
                <textarea {...register('content')} rows={6} className="input resize-y" />
              </Field>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button type="submit" disabled={isSubmitting} className="btn-gold flex items-center gap-2">
                <Send size={16} /> {isSubmitting ? 'Envoi…' : 'Envoyer'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
