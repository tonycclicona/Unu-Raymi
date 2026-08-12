# Plan de Integración: Módulo Administrador & MapaSudamerica

## 1. Integración en Módulo Administrador (`/admin`)

- **Navegación Sidebar**: Incorporación de la ruta `/mapa-sudamerica` en [Sidebar.jsx](file:///c:/Users/Tony/Documents/Trabajo%20Websites/Unuraymi/Unu-Raymi/admin/src/components/Sidebar.jsx).
- **Vistas del Administrador**:
  - `admin/src/app/mapa-sudamerica/page.js`: Dashboard visual con mapa de control, tabla de atractivos y rutas.
  - `admin/src/app/mapa-sudamerica/atractivos/page.js`: Formulario para crear/editar atractivos, buscador geográfico y mapa interactivo para ajustar marcador por clic/drag.
  - `admin/src/app/mapa-sudamerica/rutas/page.js`: Diseñador de rutas, creador de segmentos y parser para subir archivos GPX/GeoJSON.

---

## 2. Integración en Frontend Público (`/frontend`)

- **Componente `MapaSudamerica.jsx`**:
  - Integración en la página de inicio o sección de exploración.
  - Consumo directo de la API REST backend (`/api/gis/attractions`, `/api/gis/routes`, `/api/gis/nearby`).
  - Leyenda neomórfica 3D, filtros multicapa y paneles informativos desplegables.

---

## 3. APIs Backend Creadas (`/backend/src/routes/gisRoutes.js`)

- `GET /api/gis/schema-data`: Obtiene países, divisiones administrativas y atractivos activos.
- `GET /api/gis/attraction/:slug`: Retorna el detalle completo de un atractivo, jerarquía administrativa, rutas asociadas, segmentos y servicios cercanos.
- `GET /api/gis/nearby`: Consulta por Overpass/Nominatim con caché local de hospitales, restaurantes, alojamientos y puntos de agua a la redonda.
- `POST /api/gis/admin/attractions`: Crear/Editar atractivo y autoseleccionar jerarquía por coordenadas.
- `POST /api/gis/admin/routes/upload-gpx`: Subida y parser automático de archivos GPX/GeoJSON.
