import LayoutContent from '@/components/LayoutContent';
import '@/app/globals.css';

export const metadata = {
  title: 'Unu-Raymi — Panel de Control',
  description: 'Panel de Administración para la gestión de tours y reservas de Unu-Raymi',
  icons: {
    icon: '/logo.webp',
    apple: '/logo.webp',
    shortcut: '/logo.webp',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="bg-[#f7e1d7] text-[#4a5759] antialiased overflow-hidden">
        <LayoutContent>{children}</LayoutContent>
      </body>
    </html>
  );
}
