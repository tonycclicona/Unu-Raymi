import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Unu-Raymi — Tours de Aventura en Perú | Cusco, Machu Picchu y más",
  description:
    "Descubre los mejores tours de aventura en Perú con Unu-Raymi. Trekking, cultura y naturaleza en Cusco, Machu Picchu, Valle Sagrado y más destinos inolvidables.",
  keywords: "tours Perú, trekking Cusco, Machu Picchu tours, aventura Perú, Unu-Raymi",
  openGraph: {
    title: "Unu-Raymi — Tours de Aventura en Perú",
    description: "Descubre los mejores tours de aventura en Cusco, Machu Picchu y más destinos del Perú.",
    type: "website",
    locale: "es_PE",
    siteName: "Unu-Raymi",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
