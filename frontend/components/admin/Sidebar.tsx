'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Package, FolderTree, ShoppingBag, Users,
  MessageSquare, Image as ImageIcon, Truck, Settings, LogOut, X,
  Sparkles,
} from 'lucide-react';
import Cookies from 'js-cookie';

const MENU = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Products', href: '/admin/produits', icon: Package },
  { label: 'Categories', href: '/admin/categories', icon: FolderTree },
  { label: 'Orders', href: '/admin/commandes', icon: ShoppingBag },
  { label: 'Customers', href: '/admin/clients', icon: Users },
  { label: 'Messages', href: '/admin/messages', icon: MessageSquare, badge: 3 },
  { label: 'Media Library', href: '/admin/media', icon: ImageIcon },
  { label: 'Shipping', href: '/admin/livraison', icon: Truck },
  { label: 'Settings', href: '/admin/parametres', icon: Settings },
];

interface Props {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = false, onClose = () => {} }: Props) {
  const path = usePathname();
  const router = useRouter();

  const logout = () => {
    Cookies.remove('admin_token');
    Cookies.remove('admin_refresh');
    router.push('/admin/login');
  };

  return (
    <>
      {/* Overlay mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* ✅ SIDEBAR FIXE (toujours visible sur desktop) */}
      <aside className={`
        fixed top-0 left-0 bottom-0 z-50
        w-64 bg-white border-r border-gray-200
        flex flex-col
        transform transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <Link href="/admin/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center shadow-md">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <p className="font-serif text-lg font-black leading-tight">GLOBAL LUXE</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Admin Panel</p>
            </div>
          </Link>
          <button onClick={onClose} className="lg:hidden p-1 hover:bg-gray-100 rounded">
            <X size={20} />
          </button>
        </div>

        {/* Profil */}
        <div className="p-4">
          <div className="bg-gradient-to-br from-gold/10 to-gold-light/10 border border-gold/20 rounded-xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center font-bold text-white">
              A
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500">Welcome,</p>
              <p className="font-bold text-sm truncate">Admin</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-1">
          {MENU.map((m) => {
            const Icon = m.icon;
            const active = path === m.href || path?.startsWith(m.href + '/');
            return (
              <Link
                key={m.href}
                href={m.href}
                onClick={onClose}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative
                  ${active
                    ? 'bg-gradient-to-r from-gold/15 to-gold/5 text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
              >
                {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gold rounded-r-full" />}
                <Icon size={18} className={active ? 'text-gold' : ''} />
                <span className="flex-1">{m.label}</span>
                {m.badge && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                    {m.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer sidebar : Logout */}
        <div className="p-3 border-t border-gray-100">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-xl text-sm font-medium transition"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>
    </>
  );
}