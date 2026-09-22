import { Geist, Geist_Mono } from "next/font/google";

export async function generateStaticParams() {
  return [{ locale: 'es' }, { locale: 'en' }];
}

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const isEs = locale === 'es';

  return {
    title: isEs
      ? "Unu-Raymi — Tours de Aventura en Perú | Cusco, Machu Picchu y Más"
      : "Unu-Raymi — Adventure Tours in Peru | Cusco, Machu Picchu & More",
    description: isEs
      ? "Diseñamos expediciones únicas de trekking y exploración cultural por Perú, Colombia y Chile. Conéctate con los Andes y la naturaleza en su estado más puro."
      : "Discover authentic adventure tours in Peru with Unu-Raymi. Trekking, culture, and nature in Cusco, Machu Picchu, Sacred Valley, and unforgettable destinations.",
    keywords: isEs
      ? "Tours Perú, Cusco trekking, Machu Picchu viajes, aventura Perú, Unu-Raymi"
      : "Peru tours, Cusco trekking, Machu Picchu tours, Peru adventure, Unu-Raymi",
    alternates: {
      canonical: `/${locale}/`,
      languages: {
        'es-PE': '/es/',
        'es': '/es/',
        'en-US': '/en/',
        'en': '/en/',
      },
    },
    openGraph: {
      title: isEs ? "Unu-Raymi — Tours de Aventura en Perú" : "Unu-Raymi — Adventure Tours in Peru",
      description: isEs
        ? "Descubre auténticas aventuras en Cusco, Machu Picchu y más destinos de Sudamérica."
        : "Discover authentic adventure tours in Cusco, Machu Picchu and more destinations across South America.",
      type: "website",
      locale: isEs ? "es_PE" : "en_US",
      siteName: "Unu-Raymi",
    },
  };
}

export default async function LocaleLayout({ children, params }) {
  const { locale } = await params;

  return (
    <div data-locale={locale} className="w-full min-h-full flex flex-col">
      {children}
    </div>
  );
}
