// ==============================================================================
// server.js — Unu-Raymi Central Web & API Gateway Engine (Node.js)
// ==============================================================================
// Optimizado para Hostinger Web Business (LiteSpeed + Phusion Passenger).
// Brinda servicio unificado a:
//   - api.unu-raymi.com  -> Backend API Express y Media (/uploads)
//   - unu-raymi.com/api  -> Backend API Express
//   - unu-raymi.com/admin-> Panel de Administración estático (Next.js)
//   - unu-raymi.com/     -> Frontend principal estático (Next.js)
//   - /uploads/*         -> Almacenamiento centralizado único de media
// ==============================================================================

'use strict';

const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const express = require('express');
const compression = require('compression');

const app = express();
app.disable('x-powered-by');

// ── 1. Compresión GZIP / Brotli para todas las respuestas ──────────────────────
app.use(compression());

// ── 2. Cargar variables de entorno ─────────────────────────────────────────────
function loadEnvFile(filePath) {
  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      content.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx !== -1) {
            const key = trimmed.substring(0, eqIdx).trim();
            let val = trimmed.substring(eqIdx + 1).trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.substring(1, val.length - 1);
            }
            if (key === 'PORT' && process.env.PORT) return;
            if (!process.env[key]) process.env[key] = val;
          }
        }
      });
    } catch (e) {}
  }
}

loadEnvFile(path.resolve(__dirname, '.env.production'));
loadEnvFile(path.resolve(__dirname, '.env'));
loadEnvFile(path.resolve(__dirname, 'backend/.env.production'));
loadEnvFile(path.resolve(__dirname, 'backend/.env'));

// ── 3. Directorios canónicos de despliegue en Hostinger ────────────────────────
const isHostingerLinux = process.platform !== 'win32' && fs.existsSync('/home/u209525223');
const hostingerPublicHtml = '/home/u209525223/domains/unu-raymi.com/public_html';

const publicHtmlDir = (isHostingerLinux && fs.existsSync(hostingerPublicHtml))
  ? hostingerPublicHtml
  : path.resolve(__dirname, 'public_html');

const uploadsDir = path.join(publicHtmlDir, 'uploads');
const adminDir = path.join(publicHtmlDir, 'admin');
const frontendDir = publicHtmlDir;

console.log('> [Server] Directorio public_html raíz:', publicHtmlDir);
console.log('> [Server] Directorio uploads centralizado:', uploadsDir);

// ── 4. Servir Media Centralizada (/uploads y /api/uploads) ────────────────────
if (fs.existsSync(uploadsDir)) {
  const uploadStaticOptions = { maxAge: '7d', immutable: true };
  app.use('/uploads', express.static(uploadsDir, uploadStaticOptions));
  app.use('/api/uploads', express.static(uploadsDir, uploadStaticOptions));
}

// ── 5. Cargar Backend API Express (Asíncrono con pathToFileURL) ────────────────
process.env.__ROOT_SERVER_RUNNING = 'true';
let backendApp = null;
let backendError = null;

const resolvedBackendPath = path.resolve(__dirname, 'backend/src/server.js');

const backendPromise = import(pathToFileURL(resolvedBackendPath).href)
  .then(module => {
    backendApp = module.default || module.app || module;
    console.log('> [Server] Backend API montado exitosamente desde:', resolvedBackendPath);
    return backendApp;
  })
  .catch(err => {
    backendError = err;
    console.error('> [Server] Error cargando backend API:', err.message);
    return null;
  });

// ── 6. Ruteo de API (Subdominio api.unu-raymi.com y rutas /api/*) ──────────────
// Orígenes permitidos: se leen de la variable de entorno ALLOWED_ORIGINS o se
// usan los dominios de producción conocidos como fallback.
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://unu-raymi.com,https://www.unu-raymi.com,https://admin.unu-raymi.com')
  .split(',').map(o => o.trim()).filter(Boolean);

app.use(async (req, res, next) => {
  // Cabeceras CORS restringidas a orígenes permitidos
  const requestOrigin = req.headers.origin;
  if (requestOrigin && (ALLOWED_ORIGINS.includes(requestOrigin) || requestOrigin.includes('localhost') || requestOrigin.includes('127.0.0.1'))) {
    res.header('Access-Control-Allow-Origin', requestOrigin);
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  const host = (req.headers['x-forwarded-host'] || req.headers.host || '').toLowerCase();
  const configuredAppType = (process.env.APP_TYPE || '').toLowerCase().trim();

  const isApiDomain = host.startsWith('api.') || host.includes('api.unu-raymi.com');
  const isApiPath = req.url.startsWith('/api') || req.url.startsWith('/uploads');
  const isApiRequest = isApiDomain || isApiPath || configuredAppType === 'backend';

  if (isApiRequest) {
    if (!backendApp && backendPromise) {
      try { await backendPromise; } catch (e) {}
    }

    if (typeof backendApp === 'function') {
      return backendApp(req, res, next);
    }

    if (backendError) {
      return res.status(503).json({
        success: false,
        error: 'Backend API error al iniciar: ' + backendError.message
      });
    }

    return res.status(503).json({
      success: false,
      error: 'Backend API inicializándose. Por favor intente en unos segundos.'
    });
  }

  next();
});

// ── 7. Ruteo del Panel de Administración (unu-raymi.com/admin) ─────────────────
app.use((req, res, next) => {
  const host = (req.headers.host || '').toLowerCase();
  const isAdminRequest = host.startsWith('admin.') || req.url.startsWith('/admin');

  if (isAdminRequest && fs.existsSync(adminDir)) {
    const cleanPath = req.path.replace(/^\/+admin\/?/i, '').replace(/^\/+|\/+$/g, '');
    const isRsc = req.headers['rsc'] === '1' || req.query._rsc;

    // Servir payloads RSC Flight de Next.js
    if (isRsc || cleanPath.endsWith('.txt')) {
      const pathNoTxt = cleanPath.replace(/\.txt$/, '');
      const rscCandidates = [
        path.join(adminDir, pathNoTxt, 'index.txt'),
        path.join(adminDir, cleanPath),
        path.join(adminDir, pathNoTxt, '__next._full.txt')
      ];
      for (const candidate of rscCandidates) {
        if (fs.existsSync(candidate)) {
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          return res.sendFile(candidate);
        }
      }
    }

    return express.static(adminDir, { extensions: ['html'] })(req, res, () => {
      const indexHtml = path.join(adminDir, cleanPath, 'index.html');
      if (fs.existsSync(indexHtml)) return res.sendFile(indexHtml);
      res.sendFile(path.join(adminDir, 'index.html'));
    });
  }

  next();
});

// ── 8. Ruteo de Frontend Principal (unu-raymi.com) ─────────────────────────────
if (fs.existsSync(frontendDir)) {
  app.use(express.static(frontendDir, { extensions: ['html'] }));
}

// Fallback general SPA para Frontend
app.use((req, res) => {
  const candidates = [
    path.join(frontendDir, 'index.html'),
    path.resolve(__dirname, 'frontend/out/index.html')
  ];

  for (const c of candidates) {
    if (fs.existsSync(c)) {
      return res.sendFile(c);
    }
  }

  res.status(200).send('<!DOCTYPE html><html><head><title>Unu-Raymi</title></head><body>Unu-Raymi</body></html>');
});

// ── 9. Registro de Puerto para el Proxy LiteSpeed (public_html/api/.port) ──────
function saveActivePort(p) {
  const portToSave = String(p).trim();
  const apiDir = path.join(publicHtmlDir, 'api');

  try {
    fs.mkdirSync(apiDir, { recursive: true });
    fs.writeFileSync(path.join(apiDir, '.port'), portToSave);
    fs.writeFileSync(path.join(apiDir, '.port_meta.json'), JSON.stringify({
      published_port: portToSave,
      passenger: typeof PhusionPassenger !== 'undefined',
      env_port: process.env.PORT || null,
      date: new Date().toISOString()
    }, null, 2));
    console.log('> [Server] Puerto registrado para proxy LiteSpeed en:', path.join(apiDir, '.port'), '=>', portToSave);
  } catch (e) {
    console.warn('> [Server] Aviso guardando archivo .port:', e.message);
  }
}

// ── 10. Listener HTTP Principal (Passenger / LiteSpeed / Standalone) ───────────
const rawEnvPort = process.env.PORT || process.env.PASSENGER_PORT || process.env.APP_PORT || process.env.NODE_PORT;
const port = rawEnvPort ? (isNaN(rawEnvPort) ? rawEnvPort : parseInt(rawEnvPort, 10)) : 0;

let server;

if (typeof PhusionPassenger !== 'undefined') {
  console.log('> [Server] Modo Phusion Passenger detectado.');
  server = app.listen('passenger', () => {
    const addr = server.address();
    const bound = (addr && typeof addr === 'object' && addr.port) ? addr.port : (addr || 'passenger');
    console.log('> [Server] Unu-Raymi escuchando en socket/puerto Passenger:', bound);
    saveActivePort(bound);
  });
} else {
  server = app.listen(port, () => {
    const addr = server.address();
    const bound = (addr && typeof addr === 'object' && addr.port) ? addr.port : (addr || port);
    console.log('> [Server] Unu-Raymi activo en puerto:', bound);
    saveActivePort(bound);
  });
}

server.on('error', err => {
  if (err.code !== 'EADDRINUSE') {
    console.error('> [Server Error]:', err.message);
  }
});

module.exports = app;
