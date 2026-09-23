import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  poweredByHeader: false,
  images: {
    unoptimized: true,
    remotePatterns: [
      // Desarrollo local
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '4000',
        pathname: '/**',
      },
      // API subdominio (origen principal de assets en producción)
      {
        protocol: 'https',
        hostname: 'api.unu-raymi.com',
        pathname: '/**',
      },
      // Dominio principal (fallback de assets y proxy LiteSpeed)
      {
        protocol: 'https',
        hostname: 'unu-raymi.com',
        pathname: '/**',
      },
      // Imágenes externas (Unsplash fallback)
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

export default nextConfig;
