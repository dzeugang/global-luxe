import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';

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

export const metadata: Metadata = {
  title: 'Global Luxe - Boutique de luxe en ligne',
  description: 'Découvrez notre sélection de produits high-tech et lifestyle',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0A0A0A',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="fr"
      className={`${inter.variable} ${playfair.variable}`}
      suppressHydrationWarning   /* ← AJOUTER CECI */
      data-scroll-behavior="smooth"   /* ← AJOUTER AUSSI CECI */
    >
      <body
        className="font-sans antialiased"
        suppressHydrationWarning   /* ← AJOUTER CECI */
      >
        {children}
      </body>
    </html>
  );
}