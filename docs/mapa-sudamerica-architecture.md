# Documento de Arquitectura Técnica: Módulo MapaSudamerica

## 1. Análisis del Proyecto Actual

El sistema **Unu-Raymi** es una plataforma de reservas turísticas y gestión de trekkings/expediciones en Sudamérica.

### Stack Tecnológico Existente:
- **Monorepo / Workspace**: Administrado con `pnpm` workspaces (`/frontend`, `/admin`, `/backend`).
- **Frontend**: Next.js 16 (React 19, Tailwind CSS, Lucide React).
- **Admin**: Next.js 16 (React 19, Tailwind CSS, Lucide React, proxy de middleware).
- **Backend**: Node.js + Express (ES Modules) con ORM **Prisma 5.22.0**.
- **Base de Datos**: MySQL (Producción Hostinger) / SQLite (`dev.db` en Desarrollo).
- **Autenticación**: JWT (`session_token` en cookies HTTP-only para el panel de administración).

---

## 2. Arquitectura Propuesta para MapaSudamerica

El módulo **MapaSudamerica** se diseña como una arquitectura desacoplada y centralizada:

1. **Capa de Datos (Backend / Prisma)**:
   - Extensión del esquema de base de datos MySQL/SQLite mediante nuevas entidades en `prisma/schema.prisma`.
   - Soporte para GeoJSON/WKT (coordenadas, puntos, líneas de ruta y polígonos administrativos).

2. **Capa API (Express)**:
   - Controlador GIS centralizado (`backend/src/controllers/gisController.js`).
   - Rutas API públicas (`/api/gis/...`) para consumo en el MapaSudamerica público.
   - Rutas API administrativas protegidas (`/api/gis/admin/...`) para edición, subida GPX/GeoJSON y gestión de verificación.

3. **Capa Visual Pública (Frontend)**:
   - Componente interactivo y didáctico `MapaSudamerica.jsx` utilizando **Leaflet / React-Leaflet** o SVG/GeoJSON acelerado por GPU con control de capas, leyenda 3D neomórfica, filtros por país/dificultad/servicios, y paneles laterales flotantes.

4. **Capa de Gestión (Admin)**:
   - Nueva sección `/mapa-sudamerica` en el Panel Administrador con vista general, gestor de Atractivos, gestor de Rutas & Segmentos, Jerarquía Administrativa y Visor de Puntos Operativos/Emergencia.

---

## 3. Estrategia GIS y Fuentes Externas

- **Mapas Base y Layers**: OpenStreetMap Tile Layer + Esri World Imagery (satelital opcional).
- **Geocodificación & Jerarquía**: Integración con **Nominatim / Overpass API** con almacenamiento en caché backend (`gis_cache`) para evitar sobrecargar servicios públicos y garantizar respuestas < 50ms.
- **Importación de Rutas**: Parser GPX/GeoJSON en backend que calcula automáticamente distancia total, elevación máxima/mínima y desnivel acumulado.

---

## 4. Matriz de Permisos & Seguridad

- **Público (Anon)**: Lectura de atractivos y rutas en estado `active` y `verified`.
- **Operador / Guía**: Acceso a puntos operativos, zonas de riesgo y advertencias en tiempo real.
- **Administrador**: Control total (Crear, Editar, Archivar, Subir GPX/GeoJSON, Validar Jerarquías).
