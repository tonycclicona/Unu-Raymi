// ============================================================
// server.js — Entry Point del Servidor Express
// Unu-Raymi Backend API
// ============================================================

import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

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
import errorHandler from "./middlewares/errorHandler.js";
import { ensureTablesExist } from "./lib/initDb.js";

const app = express();
const PORT = process.env.PORT || 4000;
const isProduction = process.env.NODE_ENV === "production";

let dbInitialized = false;
let dbInitPromise = ensureTablesExist()
  .then(() => {
    dbInitialized = true;
    console.log("✅ [initDb] Esquema MySQL sincronizado al 100%.");
  })
  .catch((err) => {
    console.error("⚠️ [initDb] Error inicializando tablas:", err.message);
  });

// Middleware para asegurar que la inicialización de tablas termine antes de procesar mutaciones
app.use(async (req, res, next) => {
  if (!dbInitialized) {
    try {
      await dbInitPromise;
    } catch (e) {}
  }
  next();
});

// ── Middlewares Globales ─────────────────────────────────────

// CORS: permitir solicitudes desde los distintos orígenes del frontend y panel de administración
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : [
      process.env.FRONTEND_URL || "http://localhost:3000",
      "http://localhost:3001", // Puerto alternativo de desarrollo
    ];

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Trust proxy: necesario detrás del reverse proxy de Hostinger (LiteSpeed)
if (isProduction) {
  app.set("trust proxy", 1);
}

// Logger de peticiones HTTP
app.use(morgan(isProduction ? "combined" : "dev"));

// ── Headers de Seguridad ─────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

// ── WEBHOOK (ANTES de express.json) ─────────────────────────
// CRÍTICO: Stripe necesita el body crudo (Buffer) para verificar
// la firma HMAC-SHA256. Si express.json() parsea el body primero,
// la firma no coincidirá y todos los webhooks serán rechazados.
// rawBodyParser está aplicado a nivel de ruta dentro de webhookRoutes.
app.use("/api/webhooks", webhookRoutes);

// Parser de JSON con límite de tamaño razonable
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Servir carpeta de subidas estáticamente (ruta absoluta para producción)
const uploadsPath = process.env.UPLOADS_PATH
  ? resolve(process.env.UPLOADS_PATH)
  : resolve(__dirname, "../storage/uploads");

app.use("/uploads", express.static(uploadsPath, {
  maxAge: isProduction ? "7d" : 0, // Cache de 7 días en producción
}));

// ── Health & Root Check ───────────────────────────────────────
app.get(["/", "/api"], (req, res) => {
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

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Unu-Raymi API está funcionando correctamente.",
    environment: process.env.NODE_ENV || "production",
    timestamp: new Date().toISOString(),
  });
});

// Endpoint público para forzar sincronización / reparación de esquema MySQL
app.get("/api/db-sync", async (req, res) => {
  try {
    await ensureTablesExist();
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

// ── Rutas de la API ──────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/tours", tourRoutes);
app.use("/api/reservas", reservaRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/guias", guiaRoutes);
app.use("/api/garantias", garantiaRoutes);
app.use("/api/form-engine", formEngineRoutes);
app.use("/api/gis", gisRoutes);
app.use("/api", attractionsRoutes);
// Nota: /api/webhooks ya está montado antes de express.json()

// ── Ruta 404 para endpoints no existentes ────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Ruta ${req.method} ${req.path} no encontrada en la API.`,
  });
});

// ── Manejador Global de Errores (DEBE ir al final) ───────────
app.use(errorHandler);

// ── Iniciar servidor ─────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Unu-Raymi API corriendo en http://localhost:${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌍 Entorno: ${process.env.NODE_ENV || "development"}\n`);
});

export default app;
