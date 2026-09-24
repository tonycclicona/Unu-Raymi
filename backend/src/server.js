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
import { getCentralizedUploadDir } from "./controllers/uploadController.js";
import { translateWithPreservation } from "./services/translationService.js";
import { translationLimiter } from "./middlewares/rateLimiter.js";
import { requireAuth } from "./middlewares/authMiddleware.js";

const app = express();
const PORT = process.env.PORT || 0;
const isProduction = process.env.NODE_ENV === "production";

// ── 1. CORS Y PREFLIGHT OPTIONS EN PRIMERA PRIORIDAD ─────────────────────────
// Debe ser el PRIMER middleware para que ninguna petición sufra bloqueo CORS
const allowedOriginsEnv = (process.env.ALLOWED_ORIGINS || 'https://unu-raymi.com,https://admin.unu-raymi.com')
  .split(',').map(o => o.trim()).filter(Boolean);

app.use(
  cors({
    origin: function(origin, callback) {
      // Permitir peticiones sin origen (curl, scripts, apps móviles, server-to-server)
      if (!origin) return callback(null, true);
      // Permitir dominios de desarrollo local siempre
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }
      // Validar contra la lista de orígenes permitidos de producción
      if (allowedOriginsEnv.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Origen no permitido por CORS: ' + origin));
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

// ── 5. Directorio centralizado de uploads ─────────────────────────────────────
const uploadsPath = getCentralizedUploadDir();
app.use(["/uploads", "/api/uploads"], express.static(uploadsPath, {
  maxAge: isProduction ? '7d' : 0,
  immutable: isProduction
}));

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

// Endpoint para sincronización / verificación bajo demanda de esquema MySQL (protegido con JWT)
app.get(["/db-sync", "/api/db-sync"], requireAuth, async (req, res) => {
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
app.use("/api", attractionsRoutes);
app.use("/", attractionsRoutes);

// ── Endpoint Libre de Traducción para el Panel Admin y Clientes ──────────────
const handleTranslate = async (req, res) => {
  try {
    const { text, texts, targetLang = 'en', sourceLang = null } = req.body;

    // Validación de seguridad para evitar DoS por payloads masivos
    if (text) {
      if (typeof text !== 'string' || text.length > 25000) {
        return res.status(400).json({ success: false, error: 'El texto excede el límite máximo permitido de 25,000 caracteres.' });
      }
      const translated = await translateWithPreservation(text, targetLang, sourceLang);
      return res.json({ success: true, data: translated });
    }
    if (Array.isArray(texts)) {
      if (texts.length > 50) {
        return res.status(400).json({ success: false, error: 'Máximo 50 elementos por lote de traducción.' });
      }
      const results = [];
      for (const item of texts) {
        if (typeof item === 'string' && item.length > 25000) {
          return res.status(400).json({ success: false, error: 'Uno de los elementos excede el límite de longitud.' });
        }
        results.push(await translateWithPreservation(item, targetLang, sourceLang));
      }
      return res.json({ success: true, data: results });
    }
    return res.status(400).json({ success: false, error: 'Debe enviar text o texts.' });
  } catch (err) {
    console.error('Error en /translate:', err);
    return res.status(500).json({ success: false, error: 'Error interno en el servicio de traducción.' });
  }
};
app.post("/translate", translationLimiter, handleTranslate);
app.post("/api/translate", translationLimiter, handleTranslate);

// ── 8. Ruta 404 para endpoints no existentes ─────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Ruta ${req.method} ${req.path} no encontrada en la API.`,
  });
});

// ── 9. Manejador Global de Errores (DEBE ir al final) ────────────────────────
app.use(errorHandler);

let internalTcpPort = 0;
let userSocketPath = null;
let actualBoundPort = PORT;

function savePortFile(p, meta = {}) {
  let portToSave = String(p).trim();
  if (portToSave.startsWith('/usr/local/lsws/')) {
    if (internalTcpPort > 0) {
      portToSave = String(internalTcpPort);
    } else if (userSocketPath) {
      portToSave = userSocketPath;
    }
  }

  const hostingerPort = '/home/u209525223/domains/unu-raymi.com/public_html/api/.port';
  const localPort = resolve(process.cwd(), 'public_html/api/.port');
  const target = (process.platform !== 'win32' && fs.existsSync(dirname(hostingerPort)))
    ? hostingerPort
    : localPort;

  try {
    if (fs.existsSync(dirname(target))) {
      fs.writeFileSync(target, portToSave);
      const metaTarget = resolve(dirname(target), '.port_meta.json');
      fs.writeFileSync(metaTarget, JSON.stringify({
        published_port: portToSave,
        actual_port: p,
        tcp_port: internalTcpPort,
        user_socket: userSocketPath,
        env_port: process.env.PORT || null,
        passenger: typeof PhusionPassenger !== 'undefined',
        date: new Date().toISOString(),
        ...meta
      }, null, 2));
    }
  } catch (e) {}
}

function updatePortRegistry(extraMeta = {}) {
  const published = internalTcpPort > 0 ? internalTcpPort : (userSocketPath || actualBoundPort);
  savePortFile(published, extraMeta);
}

// ── 10. Iniciar servidor SOLO si se ejecuta directamente (no cuando lo importa server.js) ──
if (!process.env.__ROOT_SERVER_RUNNING) {
  // Bridge TCP loopback interno en 127.0.0.1:0
  try {
    const tcpBridge = app.listen(0, '127.0.0.1', () => {
      const tcpAddr = tcpBridge.address();
      internalTcpPort = (tcpAddr && typeof tcpAddr === 'object') ? tcpAddr.port : 0;
      console.log(`📡 Bridge TCP local activo en puerto dinámico: ${internalTcpPort}`);
      updatePortRegistry({ tcp_active: true });
    });
    tcpBridge.on('error', (err) => {
      console.warn('⚠️ [Bridge Warning]:', err.message);
    });
  } catch (e) {}

  // Socket Unix de usuario (Linux)
  if (process.platform !== 'win32') {
    const sockCandidates = [
      '/home/u209525223/domains/unu-raymi.com/public_html/api/node.sock',
      resolve(__dirname, '../../api/node.sock'),
      resolve(__dirname, '../../node.sock')
    ];
    for (const sc of sockCandidates) {
      if (fs.existsSync(dirname(sc))) {
        userSocketPath = sc;
        break;
      }
    }
    if (userSocketPath) {
      try {
        if (fs.existsSync(userSocketPath)) {
          try { fs.unlinkSync(userSocketPath); } catch (e) {}
        }
        const unixServer = app.listen(userSocketPath, () => {
          try { fs.chmodSync(userSocketPath, 0o777); } catch (e) {}
          console.log(`🔌 Socket Unix de usuario activo en: ${userSocketPath}`);
          updatePortRegistry({ user_socket_active: true });
        });
        unixServer.on('error', (err) => {
          console.warn('⚠️ [Unix Socket Warning]:', err.message);
        });
      } catch (e) {}
    }
  }

  let server;
  if (typeof PhusionPassenger !== 'undefined') {
    server = app.listen('passenger', () => {
      const addr = server.address();
      actualBoundPort = (addr && typeof addr === 'object' && addr.port) ? addr.port : (addr || 'passenger');
      console.log(`\n🚀 Unu-Raymi API corriendo bajo Phusion Passenger en: ${actualBoundPort}`);
      updatePortRegistry({ passenger: true, bound_address: addr });
    });
  } else {
    server = app.listen(PORT, () => {
      const addr = server.address();
      actualBoundPort = (addr && typeof addr === 'object' && addr.port) ? addr.port : (addr || PORT);
      console.log(`\n🚀 Unu-Raymi API corriendo en puerto real: ${actualBoundPort}`);
      console.log(`📡 Health check: http://localhost:${actualBoundPort}/api/health`);
      console.log(`🌍 Entorno: ${process.env.NODE_ENV || "development"}\n`);
      updatePortRegistry({ bound_address: addr });
    });
  }

  server.on('error', (err) => {
    if (err.code !== 'EADDRINUSE') {
      console.error('⚠️ [Server Error]:', err.message);
    }
  });
}

export default app;
