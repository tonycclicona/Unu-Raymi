'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import '@/app/globals.css';

export default function LayoutContent({ children }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-[#f7e1d7] text-[#4a5759] antialiased overflow-hidden w-full">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-[#dedbd2] border-b border-[#b0c4b1] shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-[#6c7a7c] hover:text-[#4a5759] hover:bg-[#dedbd2] rounded-xl transition-all"
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>
          <img
              src="/logo.webp"
              alt="Unu-Raymi"
              className="h-7 w-auto object-contain"
            />
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#4a5759]/10 rounded-full filter blur-[120px] pointer-events-none -z-10"></div>
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-500/5 rounded-full filter blur-[100px] pointer-events-none -z-10"></div>
          {children}
        </main>
      </div>
    </div>
  );
}
