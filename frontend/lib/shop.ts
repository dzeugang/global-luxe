// Réglages de la boutique, modifiables dans Admin > Paramètres (endpoint /settings/public/).
// Ces valeurs par défaut ne servent que si l'API est injoignable.

export interface ShopSettings {
  shop_name: string;
  shop_tagline: string;
  contact_email: string;
  contact_phone: string;
  legal_name: string;
  legal_address: string;
  legal_id: string;
  legal_host: string;
  logo_url: string;
  color_primary: string;
  color_dark: string;
  meta_title: string;
  meta_description: string;
  delivery_days: string;
  return_days: string;
  free_shipping_threshold: string;
  social_instagram: string;
  social_facebook: string;
  social_tiktok: string;
}

export const DEFAULT_SHOP: ShopSettings = {
  shop_name: 'Global Luxe',
  shop_tagline: 'Boutique premium en ligne',
  contact_email: 'contact@globalluxe.com',
  contact_phone: '',
  legal_name: '',
  legal_address: '',
  legal_id: '',
  legal_host: '',
  logo_url: '',
  color_primary: '#D4AF37',
  color_dark: '#0A0A0A',
  meta_title: 'Global Luxe - Boutique de luxe en ligne',
  meta_description: 'Découvrez notre sélection de produits high-tech et lifestyle',
  delivery_days: '7 à 12 jours ouvrés',
  return_days: '14',
  free_shipping_threshold: '',
  social_instagram: '',
  social_facebook: '',
  social_tiktok: '',
};

const HEX = /^#[0-9a-fA-F]{6}$/;

// Mélange une couleur avec du blanc (amount > 0) ou du noir (amount < 0)
export function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const target = amount > 0 ? 255 : 0;
  const mix = (c: number) => Math.round(c + (target - c) * Math.abs(amount));
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(mix);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

// Variables CSS de la charte : elles remplacent celles de globals.css sur tout le site
export function themeCss(s: Pick<ShopSettings, 'color_primary' | 'color_dark'>): string {
  const primary = HEX.test(s.color_primary) ? s.color_primary : DEFAULT_SHOP.color_primary;
  const dark = HEX.test(s.color_dark) ? s.color_dark : DEFAULT_SHOP.color_dark;
  return `:root{--color-gold:${primary};--color-gold-dark:${shade(primary, -0.18)};--color-gold-light:${shade(primary, 0.35)};`
    + `--color-border-focus:${primary};--color-dark:${dark};--color-dark-soft:${shade(dark, 0.08)};--color-dark-muted:${shade(dark, 0.16)};}`;
}

// Fiche « vendeur » des pages légales : raison sociale si renseignée, sinon nom commercial
export function legalName(s: ShopSettings) {
  return s.legal_name || s.shop_name;
}

export function returnDays(s: ShopSettings) {
  return Number(s.return_days) || 14;
}
