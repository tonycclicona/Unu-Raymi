'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Compass, Receipt, LogOut } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Tours', path: '/tours', icon: Compass },
    { name: 'Reservas', path: '/reservas', icon: Receipt },
  ];

  const handleLogout = () => {
    // Borrar la cookie de sesión
    document.cookie = 'session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    router.push('/login');
    router.refresh();
  };

  return (
    <aside className="w-64 bg-[#1a1a2e] border-r border-[#2b2b46] flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-[#2b2b46] flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#e94560] flex items-center justify-center font-bold text-white text-lg shadow-lg shadow-[#e94560]/30">
          U
        </div>
        <div>
          <h1 className="font-bold text-white text-lg leading-tight">Unu-Raymi</h1>
          <span className="text-xs text-gray-400">Panel de Control</span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
          
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? 'bg-[#e94560] text-white shadow-lg shadow-[#e94560]/20 font-medium' 
                  : 'text-gray-400 hover:bg-[#16162a] hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${
                isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'
              }`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[#2b2b46]">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-all duration-200 group"
        >
          <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
