# Walkthrough — Implementación de Internacionalización (Alternativa 1)

Se ha completado e integrado con éxito la **Alternativa 1** para el soporte bilingüe (Español <-> Inglés) en **Unu-Raymi**:
- **0 ms de latencia** en el cambio de idioma en el Frontend (cambio instantáneo sin recargas ni llamadas extra).
- **$0 costo** en traducción de contenido dinámico.
- **Protección estricta de términos culturales y quechuas** mediante enmascaramiento con tokens antes de traducir.
- **Detección automática del idioma** de origen en el backend sin requerir campos duplicados en el panel administrativo.

---

## 1. Arquitectura Implementada

```mermaid
flowchart TD
    Admin[Panel Admin / CMS] -->|Guarda tour o punto GIS| Backend[Backend Express API]
    Backend -->|detectLanguage + Token Masking| TransService[translationService.js]
    TransService -->|Traduce solo texto editable| Engine[Endpoint Libre Google Translate]
    TransService -->|Desenmascara Quechua/Nombres propios| TransService
    TransService -->|Retorna { es, en }| Backend
    Backend -->|Almacena en Columna traducciones| DB[(MySQL)]
    
    DB -->|API /tours y /v1/attractions| Frontend[Frontend Next.js]
    Navbar[Boton Idioma ES / EN] -->|setLanguage| LangContext[LanguageContext.jsx]
    LangContext -->|React State Instantaneo 0ms| Cards[TourCard / TourDetails / Mapa GIS]
```

---

## 2. Cambios Realizados

### Backend
1. **[translationService.js](file:///c:/Users/Tony/Documents/Trabajo%20Websites/Unuraymi/Unu-Raymi/backend/src/services/translationService.js)**:
   - Detección heurística de idioma (`es` vs `en`) sin costo analizando frecuencias de palabras funcionales (*stopwords*).
   - Lista de protección de términos intocables (`UNTOUCHABLE_TERMS`): *Machu Picchu, Sacsayhuamán, Ollantaytambo, Qorikancha, Humantay, Vinicunca, Inti Raymi, Unu-Raymi, Ausangate, Choquequirao, etc.*
   - Enmascaramiento mediante tokens (`__UNUTERM_i__`) antes del envío y restauración exacta tras la traducción.
   - Generación paralela de campos bilingües (`generateBilingualTour`, `generateBilingualAttraction`).
2. **Base de Datos & Prisma**:
   - [schema.prisma](file:///c:/Users/Tony/Documents/Trabajo%20Websites/Unuraymi/Unu-Raymi/backend/prisma/schema.prisma): Agregada columna `traducciones String? @db.LongText` a los modelos `Tour` y `Attraction`.
   - [initDb.js](file:///c:/Users/Tony/Documents/Trabajo%20Websites/Unuraymi/Unu-Raymi/backend/src/lib/initDb.js): Migración segura automática `addColumnSafe` al iniciar el servidor.
3. **Controladores**:
   - [tourController.js](file:///c:/Users/Tony/Documents/Trabajo%20Websites/Unuraymi/Unu-Raymi/backend/src/controllers/tourController.js):
     - `crearTour` y `actualizarTour` generan `traducciones` de forma automática.
     - `formatearTour` deserializa `traducciones` y garantiza el objeto bilingüe `{ es: {...}, en: {...} }` incluso para registros históricos.
   - [attractionsController.js](file:///c:/Users/Tony/Documents/Trabajo%20Websites/Unuraymi/Unu-Raymi/backend/src/controllers/attractionsController.js):
     - `createAttractionAdmin` y `updateAttractionAdmin` generan `traducciones` de forma automática.
     - `getAttractionsPublic`, `getAttractionByIdAdmin` y `getAttractionsAdmin` retornan atracciones con `traducciones` formateadas.

### Frontend
1. **[TourCard.jsx](file:///c:/Users/Tony/Documents/Trabajo%20Websites/Unuraymi/Unu-Raymi/frontend/src/components/TourCard.jsx)**:
   - Muestra `tour.traducciones?.[language]?.nombre || tour.nombre` y descripción de forma reactiva al idioma activo.
2. **[TourDetailsOverlay.jsx](file:///c:/Users/Tony/Documents/Trabajo%20Websites/Unuraymi/Unu-Raymi/frontend/src/components/TourDetailsOverlay.jsx)**:
   - Localiza nombre, descripción, itinerario por días, inclusiones clasificadas por categorías 3D, exclusiones y qué llevar.
3. **[MapaSudamericaGIS.jsx](file:///c:/Users/Tony/Documents/Trabajo%20Websites/Unuraymi/Unu-Raymi/frontend/src/components/MapaSudamericaGIS.jsx)**:
   - Muestra el nombre y descripción del punto GIS en el idioma seleccionado, así como el nombre del tour asociado en las rutas y popups.
4. **[CheckoutOverlay.jsx](file:///c:/Users/Tony/Documents/Trabajo%20Websites/Unuraymi/Unu-Raymi/frontend/src/components/CheckoutOverlay.jsx)**:
   - Localiza el nombre del tour en el resumen de reserva y en la confirmación de pago.
5. **[page.js](file:///c:/Users/Tony/Documents/Trabajo%20Websites/Unuraymi/Unu-Raymi/frontend/src/app/page.js)**:
   - El buscador en tiempo real del catálogo filtra buscando coincidencias tanto en el idioma activo como en el idioma base.

---

## 3. Pruebas y Validación

1. **Compilación en Local y CI/CD**:
   - `npm --workspace=frontend run build`: Compilación y exportación estática completada en 2.1s con 0 errores.
   - `npm --workspace=admin run build`: Compilación y exportación estática completada en 2.5s con 0 errores.
   - GitHub Actions Workflow `CI/CD Production Deploy to Hostinger` finalizado con éxito (`status: completed`, `conclusion: success`).
2. **Verificación en Producción**:
   - `https://unu-raymi.com/`: HTTP 200 OK.
   - `https://admin.unu-raymi.com/login/`: HTTP 200 OK.
   - `https://api.unu-raymi.com/health`: HTTP 200 OK (`database.initialized = true`).
   - `https://api.unu-raymi.com/api/tours`: Devuelve estructura `{ es: {...}, en: {...} }` en `traducciones`.
   - `https://api.unu-raymi.com/api/v1/attractions`: Devuelve estructura `{ es: {...}, en: {...} }` en `traducciones`.
