import Link from 'next/link';
import { Instagram, Facebook, Music2 } from 'lucide-react';
import { getShopSettings } from '@/lib/shop-server';
import FooterCategories from './FooterCategories';

const linkClass = 'hover:text-gold transition-colors duration-300 hover:pl-1';

export default async function Footer() {
  const shop = await getShopSettings();
  const socials = [
    { Icon: Instagram, label: 'Instagram', href: shop.social_instagram },
    { Icon: Facebook, label: 'Facebook', href: shop.social_facebook },
    { Icon: Music2, label: 'TikTok', href: shop.social_tiktok },
  ].filter((s) => s.href);

  return (
    <footer className="bg-dark text-white mt-12 sm:mt-16 relative overflow-hidden">
      {/* Halo décoratif dans la couleur de la marque */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gold rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-gold-dark rounded-full blur-[96px]" />
      </div>

      <div className="container-app py-8 sm:py-12 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          <div>
            <h3 className="text-gold font-bold mb-3 sm:mb-4 text-sm sm:text-base tracking-wider uppercase">Boutique</h3>
            <ul className="space-y-2 text-xs sm:text-sm text-gray-400">
              <FooterCategories linkClass={linkClass} />
            </ul>
          </div>
          <div>
            <h3 className="text-gold font-bold mb-3 sm:mb-4 text-sm sm:text-base tracking-wider uppercase">Aide</h3>
            <ul className="space-y-2 text-xs sm:text-sm text-gray-400">
              <li><Link href="/suivi" className={linkClass}>Suivre ma commande</Link></li>
              <li><Link href="/livraison" className={linkClass}>Livraison et retours</Link></li>
              <li><Link href="/faq" className={linkClass}>FAQ</Link></li>
              <li><Link href="/contact" className={linkClass}>Contact</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-gold font-bold mb-3 sm:mb-4 text-sm sm:text-base tracking-wider uppercase">Informations</h3>
            <ul className="space-y-2 text-xs sm:text-sm text-gray-400">
              <li><Link href="/cgv" className={linkClass}>Conditions générales de vente</Link></li>
              <li><Link href="/confidentialite" className={linkClass}>Confidentialité</Link></li>
              <li><Link href="/mentions-legales" className={linkClass}>Mentions légales</Link></li>
              <li><a href={`mailto:${shop.contact_email}`} className={`${linkClass} break-all`}>{shop.contact_email}</a></li>
            </ul>
          </div>
          {socials.length > 0 && (
            <div>
              <h3 className="text-gold font-bold mb-3 sm:mb-4 text-sm sm:text-base tracking-wider uppercase">Suivez-nous</h3>
              <div className="flex gap-3">
                {socials.map(({ Icon, label, href }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 bg-dark-soft rounded-full hover:bg-gradient-to-br hover:from-gold hover:to-gold-dark hover:text-dark transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-gold/20 group"
                    aria-label={label}
                  >
                    <Icon size={16} className="group-hover:scale-110 transition-transform" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Signature en bas */}
        <div className="mt-8 pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
          {shop.logo_url ? (
            <img src={shop.logo_url} alt={shop.shop_name} className="h-10 w-auto" />
          ) : (
            <span className="font-serif text-2xl font-black tracking-wider uppercase bg-gradient-to-r from-gold/40 via-gold to-gold/40 bg-clip-text text-transparent">
              {shop.shop_name}
            </span>
          )}
          <div className="text-center text-xs text-gray-500">
            © {new Date().getFullYear()} {shop.shop_name}. Tous droits réservés.
          </div>
        </div>
      </div>
    </footer>
  );
}
