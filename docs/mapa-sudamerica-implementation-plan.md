# Plan de Implementación por Fases: MapaSudamerica

## FASE 1: Estructura Base y Ejemplo Laguna Humantay (Frontend & Backend Core)
- [x] Creación de la documentación de arquitectura, modelo de datos e integración.
- [ ] Creación de las migraciones/modelos Prisma GIS (`GisCountry`, `GisAdministrativeArea`, `TouristAttraction`, `GisRoute`, `GisRouteSegment`, `GisPointOfInterest`).
- [ ] Script de datos iniciales (`seedGisData.js`) con el **ejemplo completo funcional de la Laguna Humantay**:
  - País: Perú.
  - Región: Cusco | Provincia: Anta | Distrito: Mollepata | Localidad: Soraypampa.
  - Coordenadas: `-13.3644, -72.5714` | Altitud: `4,200 msnm`.
  - 5 Segmentos de Ruta:
    1. Cusco → Mollepata (Bus/Transporte)
    2. Mollepata → Soraypampa (Bus/Transporte)
    3. Soraypampa → Laguna Humantay (Trekking subida)
    4. Laguna Humantay → Soraypampa (Trekking bajada)
    5. Soraypampa → Cusco (Retorno)
  - Puntos de interés cercanos: Puesto de salud Mollepata, Hospedajes Soraypampa, Puntos de agua y Miradores.
- [ ] Desarrollo de las APIs públicas REST en Express para el consumo del mapa.

---

## FASE 2: Integración en Panel Administrador (`/admin/mapa-sudamerica`)
- [ ] Añadir entrada **MapaSudamerica** en el Sidebar del Administrador.
- [ ] Módulo CRUD de Atractivos Turísticos con selector de posición en mapa y sugerencia automática de jerarquía administrativa por coordenadas.
- [ ] Selector visual de capas y estados de verificación (`verified`, `pending_review`).

---

## FASE 3: Gestión de Rutas y Parser GPX/GeoJSON
- [ ] Módulo CRUD de Rutas y Segmentos en el Admin.
- [ ] Creador/Lector de archivos `.gpx` y `.geojson` para trazar líneas de rutas de trekking y transporte.
- [ ] Cálculo automático de desnivel acumulado, perfil de altitud y distancia total.

---

## FASE 4: Servicios Cercanos y Conexión GIS Externa
- [ ] Servicio backend `gisServices.js` con caché en base de datos para la Overpass API / Nominatim.
- [ ] Capas interactivas en el mapa público (Hospitales, Farmacias, Restaurantes, Alojamientos, Puntos de Agua, Miradores).

---

## FASE 5: Seguridad, Permisos y Auditoría
- [ ] Control de visibilidad de coordenadas sensibles (Pública / Visible sólo para Operadores / Privada).
- [ ] Registro de la fuente del dato y fecha de última verificación.

---

## FASE 6: Optimización, Responsive y Verificación Final
- [ ] Adaptación total del mapa didáctico en vista móvil y escritorio.
- [ ] Pruebas unitarias de endpoints API y validación de TypeScript/Lint.
