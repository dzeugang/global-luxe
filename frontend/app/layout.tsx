import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import { getShopSettings } from '@/lib/shop-server';
import { themeCss } from '@/lib/shop';
import { ShopProvider } from '@/components/ShopProvider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

// Titre, description et icône viennent des Paramètres de l'admin
export async function generateMetadata(): Promise<Metadata> {
  const shop = await getShopSettings();
  return {
    title: { default: shop.meta_title || shop.shop_name, template: `%s — ${shop.shop_name}` },
    description: shop.meta_description,
    icons: shop.logo_url ? { icon: shop.logo_url } : undefined,
  };
}

export async function generateViewport(): Promise<Viewport> {
  const shop = await getShopSettings();
  return { width: 'device-width', initialScale: 1, themeColor: shop.color_dark };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const shop = await getShopSettings();

  return (
    <html
      lang="fr"
      className={`${inter.variable} ${playfair.variable}`}
      suppressHydrationWarning
      data-scroll-behavior="smooth"
    >
      <body className="font-sans antialiased" suppressHydrationWarning>
        {/* Couleurs de la boutique choisies dans Admin > Paramètres > Apparence */}
        <style dangerouslySetInnerHTML={{ __html: themeCss(shop) }} />
        <ShopProvider settings={shop}>{children}</ShopProvider>
      </body>
    </html>
  );
}
