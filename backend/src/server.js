// ============================================================
// server.js — Entry Point del Servidor Express
// Unu-Raymi Backend API
// ============================================================

import dotenv from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Cargar variables de entorno desde múltiples rutas posibles en Hostinger
dotenv.config();
dotenv.config({ path: resolve(__dirname, "../.env") });
dotenv.config({ path: resolve(process.cwd(), "backend/.env") });
dotenv.config({ path: resolve(process.cwd(), ".env") });

import express from "express";
import cors from "cors";
import morgan from "morgan";
import fs from "fs";
import os from "os";
import { createReadStream, statSync, existsSync } from "fs";

import tourRoutes from "./routes/tourRoutes.js";
import reservaRoutes from "./routes/reservaRoutes.js";
import webhookRoutes from "./routes/webhookRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import guiaRoutes from "./routes/guiaRoutes.js";
import garantiaRoutes from "./routes/garantiaRoutes.js";
import formEngineRoutes from "./routes/formEngineRoutes.js";
import gisRoutes from "./routes/gisRoutes.js";
import attractionsRoutes from "./routes/attractionsRoutes.js";
import reclamacionRoutes from "./routes/reclamacionRoutes.js";
import errorHandler from "./middlewares/errorHandler.js";
import { ensureTablesExist } from "./lib/initDb.js";

const app = express();
const PORT = process.env.PORT || 4000;
const isProduction = process.env.NODE_ENV === "production";

// ── 1. CORS Y PREFLIGHT OPTIONS EN PRIMERA PRIORIDAD ─────────────────────────
// Debe ser el PRIMER middleware para que ninguna petición sufra bloqueo CORS
app.use(
  cors({
    origin: function(origin, callback) {
      // Permitir peticiones sin origen (curl, scripts, apps móviles, server-to-server)
      if (!origin) return callback(null, true);
      // Permitir dominios de producción y desarrollo
      if (
        origin.includes('unu-raymi.com') ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1')
      ) {
        return callback(null, true);
      }
      return callback(null, true); // En producción permitir cualquier origen con credenciales
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
    credentials: true,
  })
);

// Responder de inmediato (204/200) a todas las peticiones preflight OPTIONS
app.options("*", cors());

// Trust proxy: necesario detrás del reverse proxy de Hostinger (LiteSpeed/Passenger)
if (isProduction) {
  app.set("trust proxy", 1);
}

// Logger de peticiones HTTP
app.use(morgan(isProduction ? "combined" : "dev"));

// ── 2. Headers de Seguridad ──────────────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

// ── 3. Inicialización MySQL Asíncrona (No Bloqueante) ─────────────────────────
// Se ejecuta en segundo plano sin congelar las peticiones HTTP entrantes
let dbInitialized = false;
let dbError = null;
ensureTablesExist()
  .then(() => {
    dbInitialized = true;
    dbError = null;
    console.log("✅ [initDb] Esquema MySQL sincronizado al 100%.");
  })
  .catch((err) => {
    dbError = err.message;
    console.error("⚠️ [initDb] Aviso: Inicialización de tablas en background:", err.message);
  });

// ── 4. WEBHOOKS (ANTES de express.json para validar firmas raw si aplica) ────
app.use(["/api/webhooks", "/webhooks"], webhookRoutes);

// Parser de JSON con límite de tamaño
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ── 5. Directorios de uploads en orden de prioridad ──────────────────────────
const uploadsPath = process.env.UPLOADS_PATH
  ? resolve(process.env.UPLOADS_PATH)
  : resolve(__dirname, "../storage/uploads");

const uploadSearchDirs = [
  uploadsPath,
  "/home/u209525223/domains/api.unu-raymi.com/storage/uploads",
  "/home/u209525223/domains/unu-raymi.com/public_html/uploads",
  "/home/u209525223/domains/unu-raymi.com/public_html/api/uploads",
  resolve(__dirname, "../storage/uploads"),
  resolve(__dirname, "../../public_html/uploads"),
].filter((d, i, arr) => arr.indexOf(d) === i);

function serveUploadFile(req, res, next) {
  const filename = req.params.filename || req.params[0];
  if (!filename || filename.includes('..')) return next();

  const MIME_TYPES = {
    webp: 'image/webp', jpg: 'image/jpeg', jpeg: 'image/jpeg',
    png: 'image/png', gif: 'image/gif', svg: 'image/svg+xml',
    pdf: 'application/pdf', ico: 'image/x-icon'
  };

  for (const dir of uploadSearchDirs) {
    const filePath = resolve(dir, filename);
    if (existsSync(filePath)) {
      try {
        const stat = statSync(filePath);
        const ext = filename.split('.').pop().toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Length', stat.size);
        res.setHeader('Cache-Control', isProduction ? 'public, max-age=604800, immutable' : 'no-cache');
        return createReadStream(filePath).pipe(res);
      } catch (e) { /* Intentar siguiente directorio */ }
    }
  }
  next();
}

app.use(["/uploads", "/api/uploads"], express.static(uploadsPath, { maxAge: isProduction ? '7d' : 0 }));
app.get(["/uploads/:filename", "/api/uploads/:filename"], serveUploadFile);

// ── 6. Health & Root Checks (Dual Route: "/" y "/api") ───────────────────────
const healthHandler = (req, res) => {
  res.status(200).json({
    success: true,
    message: "Unu-Raymi API está funcionando correctamente.",
    database: {
      initialized: dbInitialized,
      error: dbError || null
    },
    environment: process.env.NODE_ENV || "production",
    timestamp: new Date().toISOString(),
  });
};

app.get(["/health", "/api/health"], healthHandler);

app.get(["/", "/api", "/api/"], (req, res) => {
  res.status(200).json({
    success: true,
    name: "Unu-Raymi API Server",
    message: "La API de Unu-Raymi está operativa.",
    endpoints: {
      health: "/api/health",
      tours: "/api/tours",
      guias: "/api/guias",
      garantias: "/api/garantias",
      formEngine: "/api/form-engine/schema",
      gis: "/api/gis/countries",
      reservas: "/api/reservas"
    },
    environment: process.env.NODE_ENV || "production",
    timestamp: new Date().toISOString(),
  });
});

// Endpoint para sincronización / verificación bajo demanda de esquema MySQL
app.get(["/db-sync", "/api/db-sync"], async (req, res) => {
  try {
    await ensureTablesExist();
    dbInitialized = true;
    dbError = null;
    res.status(200).json({
      success: true,
      message: "Tablas y columnas de MySQL verificadas y sincronizadas exitosamente.",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

// ── 7. Rutas Principales de la API (Dual: con y sin prefijo /api) ─────────────
// Esto garantiza que https://api.unu-raymi.com/tours y https://api.unu-raymi.com/api/tours
// funcionen exactamente igual sin importar cómo las invoque el cliente o proxy
const mountDual = (prefix, router) => {
  app.use(prefix, router);
  app.use(`/api${prefix}`, router);
};

mountDual("/auth", authRoutes);
mountDual("/tours", tourRoutes);
mountDual("/reservas", reservaRoutes);
mountDual("/upload", uploadRoutes);
mountDual("/guias", guiaRoutes);
mountDual("/garantias", garantiaRoutes);
mountDual("/form-engine", formEngineRoutes);
mountDual("/gis", gisRoutes);
mountDual("/reclamaciones", reclamacionRoutes);
app.use(["/", "/api"], attractionsRoutes);

// ── 8. Ruta 404 para endpoints no existentes ─────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Ruta ${req.method} ${req.path} no encontrada en la API.`,
  });
});

// ── 9. Manejador Global de Errores (DEBE ir al final) ────────────────────────
app.use(errorHandler);

function savePortFile(p) {
  const hostingerPort = '/home/u209525223/domains/unu-raymi.com/public_html/api/.port';
  const apiSubdomainPort = '/home/u209525223/domains/api.unu-raymi.com/public_html/.port';
  const targets = [
    hostingerPort,
    apiSubdomainPort,
    resolve(__dirname, "../../api/.port"),
    resolve(__dirname, "../../.port")
  ];
  targets.forEach((t) => {
    try {
      if (fs.existsSync(dirname(t))) {
        fs.writeFileSync(t, String(p));
      }
    } catch (e) {}
  });
}

// ── 10. Iniciar servidor SOLO si se ejecuta directamente (no cuando lo importa server.js) ──
if (!process.env.__ROOT_SERVER_RUNNING) {
  const server = app.listen(PORT, () => {
    console.log(`\n🚀 Unu-Raymi API corriendo en http://localhost:${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🌍 Entorno: ${process.env.NODE_ENV || "development"}\n`);
    savePortFile(PORT);
  });

  server.on('error', (err) => {
    if (err.code !== 'EADDRINUSE') {
      console.error('⚠️ [Server Error]:', err.message);
    }
  });

  // Si se inició en un puerto asignado dinámico distinto a 4000, levantar gateway interno en 4000
  if (PORT !== 4000) {
    try {
      const internalServer = app.listen(4000, "127.0.0.1", () => {
        console.log(`📡 Gateway interno de compatibilidad escuchando en http://127.0.0.1:4000`);
      });
      internalServer.on("error", (err) => {
        if (err.code !== "EADDRINUSE") {
          console.warn("⚠️ [Server Warning] Gateway interno 4000:", err.message);
        }
      });
    } catch (e) {}
  }
}

export default app;
