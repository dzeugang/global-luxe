'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const schema = z.object({
  username: z.string().min(1, 'Identifiant requis'),
  password: z.string().min(1, 'Mot de passe requis'),
});

export default function AdminLogin() {
  const router = useRouter();
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data: any) => {
    setError('');
    try {
      const res = await api.post('/auth/login/', data);
      Cookies.set('admin_token', res.data.access, { expires: 1 / 48, sameSite: 'lax' });
      Cookies.set('admin_refresh', res.data.refresh, { expires: 7, sameSite: 'lax' });
      router.push('/admin/dashboard');
    } catch (e: any) {
      setError('Identifiants incorrects');
    }
  };

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center px-4">
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <h1 className="font-serif text-3xl font-bold text-center mb-2">GLOBAL <span className="text-gold">LUXE</span></h1>
        <p className="text-center text-gray-500 mb-6">Connexion administrateur</p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Identifiant</label>
            <input {...register('username')} className="w-full border rounded-md px-3 py-2 focus:border-gold outline-none" />
            {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username.message as string}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Mot de passe</label>
            <input type="password" {...register('password')} className="w-full border rounded-md px-3 py-2 focus:border-gold outline-none" />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message as string}</p>}
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" disabled={isSubmitting} className="btn-gold w-full">
            {isSubmitting ? 'Connexion…' : 'Se connecter'}
          </button>
        </div>
      </form>
    </div>
  );
}