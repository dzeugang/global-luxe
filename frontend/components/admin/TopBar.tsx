'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Menu, Bell, Search, ExternalLink, X, ChevronDown, User, LogOut, Settings as SettingsIcon } from 'lucide-react';
import { api } from '@/lib/api';
import Cookies from 'js-cookie';
import { useShop } from '@/components/ShopProvider';
import { useRouter } from 'next/navigation';

interface Notification {
  id: number;
  type: 'order' | 'message' | 'stock';
  title: string;
  description: string;
  time: string;
  read: boolean;
  href: string;
}

interface SearchResult {
  type: 'product' | 'order' | 'customer';
  id: number | string;
  title: string;
  subtitle?: string;
  href: string;
}

interface Props {
  onMenuClick: () => void;
}

export default function TopBar({ onMenuClick }: Props) {
  const shop = useShop();
  const router = useRouter();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchFocused, setSearchFocused] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Notifications calculées à partir des KPIs (rafraîchies chaque minute)
  useEffect(() => {
    const load = () => api.get('/orders/stats/').then((r) => {
      const st = r.data;
      const next: Notification[] = [];
      const pending = st.status_counts?.pending || 0;
      if (pending) next.push({
        id: 1, type: 'order', href: '/admin/commandes',
        title: `${pending} commande${pending > 1 ? 's' : ''} en attente`,
        description: 'À traiter ou à transmettre au fournisseur', time: 'Maintenant', read: false,
      });
      if (st.unread_messages) next.push({
        id: 2, type: 'message', href: '/admin/messages',
        title: `${st.unread_messages} message${st.unread_messages > 1 ? 's' : ''} non lu${st.unread_messages > 1 ? 's' : ''}`,
        description: 'Des clients attendent une réponse', time: 'Maintenant', read: false,
      });
      if (st.low_stock?.length) next.push({
        id: 3, type: 'stock', href: '/admin/produits',
        title: 'Stock faible',
        description: st.low_stock.map((p: { name: string }) => p.name).join(', '), time: 'Maintenant', read: false,
      });
      // Conserver l'état « lu » des notifications déjà vues
      setNotifications((prev) => next.map((n) => ({ ...n, read: prev.find((o) => o.id === n.id && o.title === n.title)?.read ?? false })));
    }).catch(() => {});
    load();
    const timer = setInterval(load, 60000);
    return () => clearInterval(timer);
  }, []);

  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Fermer les dropdowns au clic extérieur
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Recherche dynamique (debounced)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const [products, orders, customers] = await Promise.all([
          api.get(`/products/?search=${searchQuery}`).catch(() => ({ data: { results: [] } })),
          api.get(`/orders/?search=${searchQuery}`).catch(() => ({ data: { results: [] } })),
          api.get(`/customers/`).catch(() => ({ data: [] })),
        ]);

        const results: SearchResult[] = [];

        (products.data.results || []).slice(0, 3).forEach((p: { id: number; name: string; category_name?: string }) => {
          results.push({
            type: 'product', id: p.id, title: p.name,
            subtitle: p.category_name, href: `/admin/produits/${p.id}`,
          });
        });

        (orders.data.results || []).slice(0, 3).forEach((o: { id: number; customer_name: string; total: number }) => {
          results.push({
            type: 'order', id: o.id, title: `Commande #${o.id}`,
            subtitle: `${o.customer_name} — €${o.total}`, href: `/admin/commandes/${o.id}`,
          });
        });

        const filteredCustomers = (customers.data || []).filter((c: { customer_name: string; customer_email: string }) =>
          c.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.customer_email?.toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 3);

        filteredCustomers.forEach((c: { customer_email: string; customer_name: string }) => {
          results.push({
            type: 'customer', id: c.customer_email, title: c.customer_name,
            subtitle: c.customer_email, href: `/admin/clients/${encodeURIComponent(c.customer_email)}`,
          });
        });

        setSearchResults(results);
      } catch {}
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const markAsRead = (n: Notification) => {
    setNotifications(notifications.map(o => o.id === n.id ? { ...o, read: true } : o));
    setNotifOpen(false);
    router.push(n.href);
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const logout = () => {
    Cookies.remove('admin_token');
    Cookies.remove('admin_refresh');
    router.push('/admin/login');
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 gap-3">
        {/* Burger mobile */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-gray-100 rounded-lg flex-shrink-0"
          aria-label="Menu"
        >
          <Menu size={22} />
        </button>

        {/* ✅ RECHERCHE AMÉLIORÉE */}
        <div ref={searchRef} className="flex-1 max-w-2xl relative">
          <div className={`flex items-center bg-gray-50 border-2 rounded-xl px-4 py-2.5 transition-all ${
            searchFocused ? 'border-gold bg-white shadow-md' : 'border-gray-200 hover:border-gray-300'
          }`}>
            <Search size={18} className="text-gray-400 mr-3 flex-shrink-0" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              placeholder="Rechercher produits, commandes, clients..."
              className="bg-transparent border-0 outline-none text-sm w-full"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
            <kbd className="hidden md:inline-block ml-2 px-2 py-0.5 text-xs text-gray-400 bg-white border border-gray-200 rounded">⌘K</kbd>
          </div>

          {/* Dropdown résultats recherche */}
          {searchFocused && searchQuery && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-96 overflow-y-auto z-50">
              {searchResults.length === 0 ? (
                <div className="p-6 text-center text-gray-400 text-sm">
                  <Search size={32} className="mx-auto mb-2 opacity-50" />
                  Aucun résultat pour &quot;{searchQuery}&quot;
                </div>
              ) : (
                <div className="py-2">
                  {searchResults.map((r, i) => (
                    <Link
                      key={i}
                      href={r.href}
                      onClick={() => { setSearchQuery(''); setSearchFocused(false); }}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition"
                    >
                      <span className={`text-xs font-bold px-2 py-1 rounded uppercase tracking-wide ${
                        r.type === 'product' ? 'bg-blue-100 text-blue-700' :
                        r.type === 'order' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {r.type}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{r.title}</p>
                        {r.subtitle && <p className="text-xs text-gray-500 truncate">{r.subtitle}</p>}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* ✅ NOTIFICATIONS FONCTIONNELLES */}
          <div ref={notifRef} className="relative">
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg relative transition"
              aria-label="Notifications"
            >
              <Bell size={20} className="text-gray-700" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Dropdown notifications */}
            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden z-50">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gold/5 to-transparent">
                  <h3 className="font-bold">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-gold hover:underline font-semibold"
                    >
                      Tout marquer comme lu
                    </button>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                      <Bell size={32} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Aucune notification</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => markAsRead(n)}
                        className={`w-full text-left p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition flex gap-3 ${
                          !n.read ? 'bg-gold/5' : ''
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          n.type === 'order' ? 'bg-emerald-100 text-emerald-600' :
                          n.type === 'message' ? 'bg-blue-100 text-blue-600' :
                          'bg-amber-100 text-amber-600'
                        }`}>
                          {n.type === 'order' ? '🛒' : n.type === 'message' ? '✉️' : '⚠️'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-semibold text-sm truncate">{n.title}</p>
                            {!n.read && <span className="w-2 h-2 bg-gold rounded-full mt-1.5 flex-shrink-0" />}
                          </div>
                          <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{n.description}</p>
                          <p className="text-xs text-gray-400 mt-1">{n.time}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
                <div className="p-3 border-t border-gray-100 bg-gray-50">
                  <Link
                    href="/admin/dashboard"
                    onClick={() => setNotifOpen(false)}
                    className="block text-center text-sm font-semibold text-gold hover:text-gold-dark"
                  >
                    Voir le tableau de bord
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* ✅ VIEW STORE — Lien vers le site */}
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-semibold transition shadow-sm hover:shadow-md"
          >
            <ExternalLink size={14} />
            View Store
          </Link>

          {/* Profil */}
          <div ref={profileRef} className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 hover:bg-gray-100 rounded-lg p-1 pr-3 transition"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center font-bold text-white text-sm">
                A
              </div>
              <span className="hidden md:inline font-semibold text-sm">Admin</span>
              <ChevronDown size={14} className="hidden md:inline text-gray-400" />
            </button>

            {/* Dropdown profil */}
            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden z-50">
                <div className="p-4 border-b border-gray-100 bg-gradient-to-br from-gold/5 to-transparent">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center font-bold text-white">
                      A
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm">Admin</p>
                      <p className="text-xs text-gray-500 truncate">{shop.shop_name}</p>
                    </div>
                  </div>
                </div>
                <div className="py-2">
                  <Link href="/admin/parametres" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-sm">
                    <SettingsIcon size={16} className="text-gray-400" />
                    Paramètres
                  </Link>
                  <Link href="/" target="_blank" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-sm sm:hidden">
                    <ExternalLink size={16} className="text-gray-400" />
                    Voir le site
                  </Link>
                  <hr className="my-2 border-gray-100" />
                  <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-red-50 text-sm text-red-600">
                    <LogOut size={16} />
                    Déconnexion
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}