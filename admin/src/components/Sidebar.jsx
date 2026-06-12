'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Compass, Receipt, LogOut, X } from 'lucide-react';

export default function Sidebar({ isOpen = false, onClose = () => {} }) {
  const pathname = usePathname();
  const router = useRouter();

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Tours', path: '/tours', icon: Compass },
    { name: 'Reservas', path: '/reservas', icon: Receipt },
  ];

  const handleLogout = () => {
    document.cookie = 'session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    router.push('/login');
    router.refresh();
  };

  const handleNavClick = () => {
    // Close drawer on mobile when a link is clicked
    onClose();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60  md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-[#dedbd2] border-r border-[#b0c4b1] flex flex-col h-screen
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Header */}
        <div className="p-5 border-b border-[#b0c4b1] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src="/logo.webp"
              alt="Unu-Raymi"
              className="h-9 w-auto object-contain"
            />
          </div>
          {/* Close button — mobile only */}
          <button
            onClick={onClose}
            className="md:hidden text-[#6c7a7c] hover:text-[#4a5759] p-1.5 rounded-lg hover:bg-[#dedbd2] transition-all"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));

            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={handleNavClick}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-[#4a5759] text-[#dbeafe] shadow-lg shadow-[#4a5759]/20 font-medium'
                    : 'text-[#6c7a7c] hover:bg-[#ffffff] hover:text-[#4a5759]'
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${
                  isActive ? 'text-[#4a5759]' : 'text-[#6c7a7c] group-hover:text-[#4a5759]'
                }`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#b0c4b1]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-[#6c7a7c] hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-all duration-200 group"
          >
            <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            Cerrar Sesión
          </button>
        </div>
      </aside>
    </>
  );
}
