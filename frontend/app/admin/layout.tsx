'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import Sidebar from '@/components/admin/Sidebar';
import TopBar from '@/components/admin/TopBar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (path === '/admin/login') return;
    // Le token d'accès expire vite : le refresh suffit, l'API le renouvellera
    const token = Cookies.get('admin_token') || Cookies.get('admin_refresh');
    if (!token) router.push('/admin/login');
  }, [path, router]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [path]);

  if (path === '/admin/login') return <>{children}</>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ✅ SIDEBAR FIXE */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Contenu décalé pour laisser place à la sidebar */}
      <div className="lg:ml-64 flex flex-col min-h-screen">
        {/* ✅ TOPBAR FIXE */}
        <TopBar onMenuClick={() => setSidebarOpen(true)} />

        {/* Contenu principal */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}