import { DEFAULT_SHOP, type ShopSettings } from '@/lib/shop';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// À n'appeler que depuis des composants serveur.
// Cache de 60 s : un changement fait dans l'admin apparaît en moins d'une minute.
export async function getShopSettings(): Promise<ShopSettings> {
  try {
    const res = await fetch(`${API_URL}/settings/public/`, { next: { revalidate: 60 } });
    if (!res.ok) return DEFAULT_SHOP;
    return { ...DEFAULT_SHOP, ...(await res.json()) };
  } catch {
    return DEFAULT_SHOP;
  }
}
