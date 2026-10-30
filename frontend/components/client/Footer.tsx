import Link from 'next/link';
import { Instagram, Facebook, Twitter, Youtube } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-dark text-white mt-12 sm:mt-16 relative overflow-hidden">
      {/* Texture subtile dorée en fond */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gold rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-gold-dark rounded-full blur-[96px]" />
      </div>
      
      <div className="container-app py-8 sm:py-12 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          <div>
            <h3 className="text-gold font-bold mb-3 sm:mb-4 text-sm sm:text-base tracking-wider uppercase">About us</h3>
            <ul className="space-y-2 text-xs sm:text-sm text-gray-400">
              <li><Link href="/" className="hover:text-gold transition-colors duration-300 hover:pl-1">Home</Link></li>
              <li><Link href="/" className="hover:text-gold transition-colors duration-300 hover:pl-1">Products</Link></li>
              <li><Link href="/" className="hover:text-gold transition-colors duration-300 hover:pl-1">FAQ</Link></li>
              <li><Link href="/" className="hover:text-gold transition-colors duration-300 hover:pl-1">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-gold font-bold mb-3 sm:mb-4 text-sm sm:text-base tracking-wider uppercase">Catégories</h3>
            <ul className="space-y-2 text-xs sm:text-sm text-gray-400">
              <li><Link href="/categorie/electronics" className="hover:text-gold transition-colors duration-300 hover:pl-1">Electronics</Link></li>
              <li><Link href="/categorie/home" className="hover:text-gold transition-colors duration-300 hover:pl-1">Home</Link></li>
              <li><Link href="/categorie/fashion" className="hover:text-gold transition-colors duration-300 hover:pl-1">Fashion</Link></li>
              <li><Link href="/categorie/beauty" className="hover:text-gold transition-colors duration-300 hover:pl-1">Beauty</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-gold font-bold mb-3 sm:mb-4 text-sm sm:text-base tracking-wider uppercase">Contact</h3>
            <ul className="space-y-2 text-xs sm:text-sm text-gray-400">
              <li className="break-all hover:text-gold transition-colors cursor-pointer">contact@globalluxe.com</li>
              <li className="hover:text-gold transition-colors cursor-pointer">Shipping info</li>
              <li className="hover:text-gold transition-colors cursor-pointer">Privacy policy</li>
            </ul>
          </div>
          <div>
            <h3 className="text-gold font-bold mb-3 sm:mb-4 text-sm sm:text-base tracking-wider uppercase">Suivez-nous</h3>
            <div className="flex gap-3">
              {[
                { Icon: Instagram, label: 'Instagram' },
                { Icon: Facebook, label: 'Facebook' },
                { Icon: Twitter, label: 'Twitter' },
                { Icon: Youtube, label: 'Youtube' }
              ].map(({ Icon, label }) => (
                <a 
                  key={label}
                  href="#" 
                  className="p-2.5 bg-dark-soft rounded-full hover:bg-gradient-to-br hover:from-gold hover:to-gold-dark hover:text-dark transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-gold/20 group"
                  aria-label={label}
                >
                  <Icon size={16} className="group-hover:scale-110 transition-transform" />
                </a>
              ))}
            </div>
          </div>
        </div>
        
        {/* Logo signature en bas */}
        <div className="mt-8 pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-serif text-2xl font-black tracking-wider bg-gradient-to-r from-gold/40 via-gold to-gold/40 bg-clip-text text-transparent">
            GLOBAL LUXE
          </span>
          <div className="text-center text-xs text-gray-500">
            © {new Date().getFullYear()} Global Luxe. Tous droits réservés.
          </div>
        </div>
      </div>
    </footer>
  );
}