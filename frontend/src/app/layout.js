import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import { CurrencyProvider } from "@/context/CurrencyContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Unu-Raymi — Adventure Tours in Peru | Cusco, Machu Picchu & More",
  description:
    "Discover authentic adventure tours in Peru with Unu-Raymi. Trekking, culture and nature in Cusco, Machu Picchu, Sacred Valley and unforgettable destinations.",
  keywords: "Peru tours, Cusco trekking, Machu Picchu tours, Peru adventure, Unu-Raymi",
  icons: {
    icon: '/uploads/logo.webp',
    apple: '/uploads/logo.webp',
    shortcut: '/uploads/logo.webp',
  },
  openGraph: {
    title: "Unu-Raymi — Adventure Tours in Peru",
    description: "Discover authentic adventure tours in Cusco, Machu Picchu and more destinations across South America.",
    type: "website",
    locale: "en_US",
    siteName: "Unu-Raymi",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const savedTheme = localStorage.getItem('theme');
                  if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <LanguageProvider>
          <CurrencyProvider>
            {children}
          </CurrencyProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}

