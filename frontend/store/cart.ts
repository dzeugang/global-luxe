import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '@/types';

export interface CartLine {
  key: string;                       // produit + options choisies
  product: Product;
  options: Record<string, string>;   // ex. { Couleur: 'Noir', Taille: 'M' }
  unitPrice: number;                 // prix de vente + suppléments des options
  image: string;                     // image de la variante choisie
  quantity: number;
}

interface CartState {
  items: CartLine[];
  addItem: (product: Product, quantity?: number, options?: Record<string, string>) => void;
  removeItem: (key: string) => void;
  updateQty: (key: string, quantity: number) => void;
  clear: () => void;
  subtotal: () => number;
  count: () => number;
  quantityOf: (productId: number) => number;
}

export function lineKey(productId: number, options: Record<string, string> = {}) {
  const opts = Object.keys(options).sort().map((k) => `${k}=${options[k]}`).join('|');
  return opts ? `${productId}|${opts}` : String(productId);
}

// Prix et image d'une variante, d'après les options du produit
export function variantOf(product: Product, options: Record<string, string> = {}) {
  let price = Number(product.sale_price);
  let image = product.main_image;
  for (const group of product.options || []) {
    const value = group.values.find((v) => v.label === options[group.name]);
    if (!value) continue;
    price += Number(value.price_delta || 0);
    if (value.image) image = value.image;
  }
  return { price, image };
}

export function optionsLabel(options: Record<string, string>) {
  return Object.entries(options).map(([k, v]) => `${k} : ${v}`).join(', ');
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, quantity = 1, options = {}) => {
        const key = lineKey(product.id, options);
        const { price, image } = variantOf(product, options);
        // Le stock est commun à toutes les variantes d'un produit
        const room = Math.max(0, product.stock - get().quantityOf(product.id));
        const qty = Math.min(quantity, room);
        if (qty <= 0) return;
        set((state) => {
          const existing = state.items.find((i) => i.key === key);
          if (existing) {
            return { items: state.items.map((i) => (i.key === key ? { ...i, quantity: i.quantity + qty } : i)) };
          }
          return { items: [...state.items, { key, product, options, unitPrice: price, image, quantity: qty }] };
        });
      },

      removeItem: (key) => set((state) => ({ items: state.items.filter((i) => i.key !== key) })),

      updateQty: (key, quantity) => {
        const line = get().items.find((i) => i.key === key);
        if (!line) return;
        if (quantity <= 0) {
          get().removeItem(key);
          return;
        }
        const others = get().quantityOf(line.product.id) - line.quantity;
        const capped = Math.min(quantity, Math.max(1, line.product.stock - others));
        set((state) => ({ items: state.items.map((i) => (i.key === key ? { ...i, quantity: capped } : i)) }));
      },

      clear: () => set({ items: [] }),

      subtotal: () => get().items.reduce((total, item) => total + item.unitPrice * item.quantity, 0),

      count: () => get().items.reduce((total, item) => total + item.quantity, 0),

      quantityOf: (productId) => get().items.filter((i) => i.product.id === productId).reduce((t, i) => t + i.quantity, 0),
    }),
    {
      name: 'gl-cart',
      version: 1,
      // Paniers enregistrés avant l'arrivée des options : on complète chaque ligne
      migrate: (persisted) => {
        const state = persisted as { items?: { product: Product; quantity: number }[] };
        return {
          items: (state.items || []).map((i) => ({
            key: lineKey(i.product.id),
            product: i.product,
            options: {},
            unitPrice: Number(i.product.sale_price),
            image: i.product.main_image,
            quantity: i.quantity,
          })),
        } as unknown as CartState;
      },
    }
  )
);
