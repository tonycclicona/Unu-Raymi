'use client';

import Sidebar from '@/components/Sidebar';
import { usePathname } from 'next/navigation';
import '@/app/globals.css';

export default function LayoutContent({ children }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-[#0f0f1a] text-gray-100 antialiased overflow-hidden w-full">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8 relative">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#e94560]/10 rounded-full filter blur-[120px] pointer-events-none -z-10"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-500/5 rounded-full filter blur-[100px] pointer-events-none -z-10"></div>
        {children}
      </main>
    </div>
  );
}
