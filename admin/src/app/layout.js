import LayoutContent from '@/components/LayoutContent';
import '@/app/globals.css';

export const metadata = {
  title: 'Unu-Raymi — Panel de Control',
  description: 'Panel de Administración para la gestión de tours y reservas de Unu-Raymi',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="bg-[#0f0f1a] text-gray-100 antialiased overflow-hidden">
        <LayoutContent>{children}</LayoutContent>
      </body>
    </html>
  );
}
