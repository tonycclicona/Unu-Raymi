# 🛠️ SISTEMA DE RESERVAS DE TOURS - DIRECTRICES DE DESARROLLO Y OPTIMIZACIÓN DE TOKENS

Este documento define las habilidades, estándares de diseño y reglas de eficiencia que los agentes de IA deben seguir estrictamente en este espacio de trabajo. El objetivo es maximizar la precisión técnica, evitar la duplicación de código y optimizar el consumo de tokens.

---

## 💡 1. SKILL GENERAL DEL TRABAJO (EFICIENCIA DE CONTEXTO)
* **Principio de "Single Source of Truth":** Antes de generar cualquier componente o ruta de la API, inspecciona los archivos existentes en el directorio del proyecto para reutilizar funciones utilitarias, interfaces o estilos de Tailwind CSS.
* **Optimización de Tokens (Token Thrift):** * No generes explicaciones conversacionales largas en el chat a menos que se te solicite explícitamente.
  * Entrega código final directamente. Evita reescribir archivos enteros si solo se requiere una modificación; en su lugar, indica los bloques exactos a reemplazar o inyectar.
* **Metodología Iterativa:** Construye de forma modular. Valida que el backend y los modelos de datos respondan correctamente antes de proceder con el diseño del frontend.

---

## 🏛️ 2. ARCHITECTURE SKILLS (ARQUITECTURA DE SOFTWARE)
* **Patrón Arquitectónico:** Arquitectura desacoplada basada en servicios (Next.js para el Frontend de cliente/administración y Node.js/Express para la API Core de backend).
* **Manejo de Estados en el Cliente:** Utiliza estados locales de React (`useState`, `useContext`) bien segmentados para controlar los Overlays (`TourDetailsOverlay` y el formulario de checkout) de forma que no existan re-renderizados masivos que degraden la experiencia visual (*Dynamic Reveal*).
* **Flujo Post-Pago (Event-Driven):** El sistema debe depender estrictamente de eventos asíncronos distribuidos. El Webhook de pagos es la única entidad autorizada para marcar una reserva como pagada (`PAID`) y disparar en segundo plano la cola de generación de PDFs y envío de correos.

---

## 🎨 3. CODE-STYLE SKILLS (ESTILO DE CÓDIGO)
* **Componentes Limpios y Legibles:** Escribe código puramente declarativo y funcional con TypeScript/JavaScript moderno (ES6+).
* **Estilizado UI:** Todo el diseño visual debe resolverse mediante clases nativas de **Tailwind CSS**. Queda prohibida la creación de archivos CSS externos redundantes (con excepción de los estilos globales indispensables).
* **Modularidad:** Si un componente de la interfaz (como el bloque de servicios por categoría o las tarjetas de guías) excede las 150 líneas de código, subdivídelo de inmediato en sub-componentes atómicos dentro de la carpeta `/components`.

---

## ⚙️ 4. BACKEND SKILLS (LÓGICA DEL SERVIDOR)
* **Validación de Datos en el Entry Point:** Toda petición entrante de la API (`POST`, `PUT`) debe pasar de forma obligatoria por un middleware de validación estructural con la librería **Zod** antes de tocar los controladores.
* **Control de Costos Matemáticos:** El cálculo del precio total de una reserva debe realizarse **estrictamente en el Backend** extrayendo los valores reales de la base de datos MySQL. Nunca confíes en los montos económicos calculados o enviados por el Frontend (Cliente).
* **Manejo de Errores Robustos:** Implementa bloques `try/catch` globales con respuestas HTTP estandarizadas en formato JSON: `{ success: false, error: "Mensaje descriptivo y técnico" }`.

---

## 🗄️ 5. DATABASE SKILLS (GESTIÓN DE BASE DE DATOS - MYSQL)
* **Acceso y Abstracción:** Toda interacción con el servidor MySQL local de Hostinger debe gestionarse mediante **Prisma Client**. No ejecutes queries SQL nativas en crudo a menos que sea indispensable por rendimiento.
* **Manejo de Tipos Complejos:** Las taxonomías y listas de servicios incluidos de los tours deben almacenarse como tipos primitivos soportados de forma eficiente (arreglos de texto `String[]` nativos en MySQL mediante Prisma).
* **Integridad Relacional:** Asegura el uso de políticas de borrado en cascada (`onDelete: Cascade`) en los modelos dependientes (`Imagen` y `Pasajero`) para evitar registros huérfanos que corrompan la integridad de los datos financieros.

---

## 💻 6. FRONTEND SKILLS (INTERFAZ DE USUARIO E INTERACTIVIDAD)
* **Diseño Inmersivo y Responsivo:** La interfaz de pantalla dividida (*Split-Screen*) inspirada en la navegación de mapas debe ser fluida. Utiliza técnicas CSS modernas (`h-screen`, `overflow-hidden` y `scrollable containers`) para emular el comportamiento de una Aplicación de Escritorio nativa.
* **Manejo de Tooltips Eficientes:** Los tooltips flotantes que muestran las listas de servicios por categoría en el `TourDetailsOverlay` deben ser ligeros, renderizándose condicionalmente bajo el evento `onMouseEnter` y destruyéndose en `onMouseLeave` para no sobrecargar el árbol del DOM de la Landing Page.
* **Optimización de Medios:** Las imágenes cargadas deben consumirse exclusivamente mediante componentes que respeten el formato `.webp` optimizado y procesado por el backend con la librería `Sharp`.

---

## 🔒 7. SECURITY SKILLS (SEGURIDAD Y PROTECCIÓN DE DATOS)
* **Inyección y Sanitización:** Sanitiza los textos e itinerarios HTML generados en el editor enriquecido del panel de administración antes de renderizarlos en la web pública para mitigar ataques de inyección de scripts (XSS).
* **Firmas de Webhooks:** El endpoint de recepción de notificaciones de la pasarela de pagos (`/api/webhooks/pago`) debe verificar estrictamente la firma digital del proveedor (Stripe/Mercado Pago Signature Verification) con la clave secreta del entorno antes de procesar el Invoice.
* **Tokens de Acceso a Documentos Privados:** La descarga o visualización del PDF del Invoice de pago no debe requerir un login completo del usuario común, pero debe estar protegida de forma segura mediante un hash aleatorio criptográfico (`tokenSeguridad`) único por reserva en la URL, previniendo la enumeración de archivos de forma maliciosa.

---

## 🧪 8. TESTING SKILLS (PRUEBAS Y CONTROL DE CALIDAD)
* **Prueba de Lógica Financiera:** Antes de desplegar en producción a Hostinger, se deben realizar pruebas de validación con inputs extremos en las cantidades de pasajeros (ej. enviar `0` adultos y `5` niños, o cantidades negativas) para verificar que el backend responda con errores de validación HTTP 400 controlados.
* **Simulación de Webhooks locales:** Utiliza herramientas de túnel seguro como *ngrok* o la interfaz de desarrollo de Antigravity para emular peticiones del webhook en el entorno local antes de la integración final con los servidores reales de la pasarela de pagos.