'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCart, optionsLabel } from '@/store/cart';
import { useShop } from '@/components/ShopProvider';
import { useHydrated } from '@/lib/useHydrated';
import axios from 'axios';
import { api } from '@/lib/api';
import { rememberLastOrder } from '@/lib/orders';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import type { ShippingMethod } from '@/types';

const schema = z.object({
  customer_name: z.string().min(2, 'Nom requis'),
  customer_email: z.string().email('Email invalide'),
  customer_phone: z.string().min(6, 'Téléphone requis'),
  address_line1: z.string().min(3, 'Adresse requise'),
  address_line2: z.string().optional(),
  city: z.string().min(2, 'Ville requise'),
  postal_code: z.string().min(2, 'Code postal requis'),
  country: z.string().min(2, 'Pays requis'),
  shipping_method_id: z.number().optional(),
  payment_method: z.enum(['stripe', 'paypal']),
});
type FormData = z.infer<typeof schema>;

export default function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const router = useRouter();
  const [methods, setMethods] = useState<ShippingMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { payment_method: 'stripe', country: 'France' },
  });

  const shop = useShop();
  const hydrated = useHydrated();
  const selectedMethod = watch('shipping_method_id');
  // Même règle que le serveur : livraison offerte au-delà du seuil défini dans les Paramètres
  const threshold = Number(shop.free_shipping_threshold) || 0;
  const freeShipping = threshold > 0 && subtotal() >= threshold;
  const shippingCost = freeShipping ? 0 : methods.find((m) => m.id === Number(selectedMethod))?.price || 0;
  const total = subtotal() + Number(shippingCost);

  useEffect(() => {
    api.get('/shipping/').then((r) => setMethods(r.data.results || r.data)).catch(() => {});
  }, []);

  const onSubmit = async (data: FormData) => {
    if (items.length === 0) return;
    setLoading(true); setError('');
    try {
      const payload = {
        ...data,
        shipping_method_id: data.shipping_method_id ? Number(data.shipping_method_id) : null,
        items: items.map((i) => ({ product_id: i.product.id, quantity: i.quantity, options: i.options })),
      };
      const res = await api.post('/orders/', payload);
      rememberLastOrder(res.data.id, data.customer_email);
      clear();
      router.push('/confirmation');
    } catch (e) {
      // Afficher les erreurs de validation du backend (stock, pays, produit indisponible…)
      const data = axios.isAxiosError(e) ? e.response?.data : undefined;
      const fieldErrors = data && typeof data === 'object' && !data.detail
        ? Object.values(data).flat().filter((m) => typeof m === 'string').join(' ')
        : '';
      setError(data?.detail || fieldErrors || 'Erreur lors de la commande');
    } finally { setLoading(false); }
  };

  if (!hydrated) {
    return <div className="container-app py-12 text-center text-gray-400">Chargement…</div>;
  }

  if (items.length === 0) {
    return <div className="container-app py-12 text-center">Votre panier est vide.</div>;
  }

  return (
    <div className="container-app py-6 sm:py-8">
      <h1 className="h1 mb-4 sm:mb-6">Checkout</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="grid lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-2 space-y-5 sm:space-y-6 card">
          <h2 className="font-bold text-base sm:text-lg">Informations de livraison</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Field label="Nom complet" error={errors.customer_name?.message}>
              <input {...register('customer_name')} className="input" />
            </Field>
            <Field label="Email" error={errors.customer_email?.message}>
              <input type="email" {...register('customer_email')} className="input" />
            </Field>
            <Field label="Téléphone" error={errors.customer_phone?.message}>
              <input type="tel" {...register('customer_phone')} className="input" />
            </Field>
            <Field label="Pays" error={errors.country?.message}>
              <input {...register('country')} className="input" />
            </Field>
            <Field label="Adresse" error={errors.address_line1?.message} className="sm:col-span-2">
              <input {...register('address_line1')} className="input" />
            </Field>
            <Field label="Ville" error={errors.city?.message}>
              <input {...register('city')} className="input" />
            </Field>
            <Field label="Code postal" error={errors.postal_code?.message}>
              <input {...register('postal_code')} className="input" />
            </Field>
          </div>

          <h2 className="font-bold text-base sm:text-lg mt-4 sm:mt-6">Méthode d&apos;expédition</h2>
          <div className="space-y-2">
            {methods.map((m) => (
              <label key={m.id} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition">
                <input type="radio" value={m.id} {...register('shipping_method_id', { valueAsNumber: true })} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm sm:text-base">{m.name}</p>
                  <p className="text-xs sm:text-sm text-gray-500">{m.delivery_days}</p>
                </div>
                <p className="font-bold text-sm sm:text-base whitespace-nowrap">{Number(m.price).toFixed(2)} €</p>
              </label>
            ))}
            {methods.length === 0 && <p className="text-sm text-gray-500">Aucune méthode configurée.</p>}
          </div>

          <h2 className="font-bold text-base sm:text-lg mt-4 sm:mt-6">Paiement</h2>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer flex-1">
              <input type="radio" value="stripe" {...register('payment_method')} /> Stripe (CB)
            </label>
            <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer flex-1">
              <input type="radio" value="paypal" {...register('payment_method')} /> PayPal
            </label>
          </div>
        </div>

        {/* Résumé sticky desktop */}
        <div className="card h-fit lg:sticky lg:top-24">
          <h2 className="font-bold text-base sm:text-lg mb-3 sm:mb-4">Résumé</h2>
          <div className="max-h-60 overflow-y-auto mb-3">
            {items.map((i) => (
              <div key={i.key} className="flex justify-between text-xs sm:text-sm mb-2">
                <span className="truncate pr-2">
                  {i.product.name} × {i.quantity}
                  {Object.keys(i.options).length > 0 && <span className="block text-gray-500">{optionsLabel(i.options)}</span>}
                </span>
                <span className="whitespace-nowrap">{(i.unitPrice * i.quantity).toFixed(2)} €</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-3 text-sm space-y-2">
            <div className="flex justify-between"><span>Sous-total</span><span>{subtotal().toFixed(2)} €</span></div>
            <div className="flex justify-between"><span>Livraison</span><span>{freeShipping ? 'Offerte' : `${Number(shippingCost).toFixed(2)} €`}</span></div>
            <div className="flex justify-between font-bold text-base sm:text-lg pt-2 border-t">
              <span>Total</span><span>{total.toFixed(2)} €</span>
            </div>
          </div>
          {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
          <button type="submit" disabled={loading} className="btn-gold w-full mt-5 sm:mt-6 disabled:opacity-50">
            {loading ? 'Traitement…' : 'Confirmer la commande'}
          </button>
        </div>
      </form>
    </div>
  );
}

interface FieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

function Field({ label, error, children, className = '' }: FieldProps) {
  return (
    <div className={className}>
      <label className="block text-xs sm:text-sm font-medium mb-1">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}