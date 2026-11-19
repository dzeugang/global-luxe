'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { Category } from '@/types';

// Les 5 premières catégories actives, chargées depuis l'API
export default function FooterCategories({ linkClass }: { linkClass: string }) {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    api.get('/products/categories/')
      .then((r) => setCategories((r.data.results || r.data).slice(0, 5)))
      .catch(() => {});
  }, []);

  return (
    <>
      {categories.map((c) => (
        <li key={c.slug}><Link href={`/categorie/${c.slug}`} className={linkClass}>{c.name}</Link></li>
      ))}
      <li><Link href="/recherche" className={linkClass}>Tous les produits</Link></li>
    </>
  );
}
