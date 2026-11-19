'use client';
import { createContext, useContext } from 'react';
import { DEFAULT_SHOP, type ShopSettings } from '@/lib/shop';

const ShopContext = createContext<ShopSettings>(DEFAULT_SHOP);

// Rend les réglages de la boutique (chargés par le layout racine) accessibles aux composants client
export function ShopProvider({ settings, children }: { settings: ShopSettings; children: React.ReactNode }) {
  return <ShopContext.Provider value={settings}>{children}</ShopContext.Provider>;
}

export function useShop() {
  return useContext(ShopContext);
}
