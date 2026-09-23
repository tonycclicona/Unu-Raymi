// ==============================================================================
// server.js — Unu-Raymi Single Web App Engine
// ==============================================================================

'use strict';

const fs = require('fs');
const path = require('path');
const express = require('express');
const compression = require('compression');

const app = express();
app.disable('x-powered-by');
app.use(compression({ threshold: 1024 }));

// Cargar variables de entorno
function loadEnv(file) {
  if (fs.existsSync(file)) {
    try {
      const lines = fs.readFileSync(file, 'utf8').split('\n');
      lines.forEach(function(l) {
        const t = l.trim();
        if (t && !t.startsWith('#')) {
          const eq = t.indexOf('=');
          if (eq !== -1) {
            const k = t.substring(0, eq).trim();
            let v = t.substring(eq + 1).trim();
            if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
              v = v.substring(1, v.length - 1);
            }
            if (k === 'PORT' && process.env.PORT) return;
            if (!process.env[k]) process.env[k] = v;
          }
        }
      });
    } catch (e) {}
  }
}

loadEnv(path.resolve(__dirname, '.env.production'));
loadEnv(path.resolve(__dirname, '.env'));
loadEnv(path.resolve(__dirname, 'backend/.env.production'));
loadEnv(path.resolve(__dirname, 'backend/.env'));

// Directorios de compilación
const frontendDir = fs.existsSync(path.resolve(__dirname, 'frontend/out'))
  ? path.resolve(__dirname, 'frontend/out')
  : path.resolve(__dirname, 'out');

const adminDir = path.resolve(__dirname, 'admin/out');

console.log('> [Server] Frontend dir:', frontendDir);
console.log('> [Server] Admin dir:', adminDir);

function copyStaticFiles(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) return;
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  const items = fs.readdirSync(srcDir);
  for (const item of items) {
    if (item === 'uploads' && fs.existsSync(path.join(destDir, 'uploads'))) {
      continue;
    }
    const srcItem = path.join(srcDir, item);
    const destItem = path.join(destDir, item);
    try {
      fs.cpSync(srcItem, destItem, { recursive: true, force: true });
    } catch (e) {}
  }
}

// Rutas de uploads canónicas y de compatibilidad pública
const hostingerBase = '/home/u209525223/domains/unu-raymi.com/public_html';
const pubDir = fs.existsSync(hostingerBase) ? hostingerBase : path.resolve(__dirname, 'public_html');
const adminDest = path.join(pubDir, 'admin');
const apiDest = path.join(pubDir, 'api');
const canonicalHostingerApiUploads = '/home/u209525223/domains/unu-raymi.com/public_html/api/uploads';
const apiUploadsDest = fs.existsSync('/home/u209525223/domains/unu-raymi.com/public_html/api')
  ? canonicalHostingerApiUploads
  : path.join(apiDest, 'uploads');
const publicUploadsDest = path.join(pubDir, 'uploads');

// ── Sincronizar frontend, admin y api en tiempo de ejecución ───────────────
try {
  // 1. Frontend
  if (fs.existsSync(frontendDir) && pubDir !== frontendDir) {
    fs.mkdirSync(pubDir, { recursive: true });
    copyStaticFiles(frontendDir, pubDir);
    console.log('> [Server] Synchronized frontend to:', pubDir);
  }

  // 1.1 Sincronizar .htaccess principal
  const rootHtaccess = path.resolve(__dirname, '.htaccess');
  if (fs.existsSync(rootHtaccess) && pubDir !== __dirname) {
    try {
      fs.copyFileSync(rootHtaccess, path.join(pubDir, '.htaccess'));
      console.log('> [Server] Synchronized root .htaccess to:', pubDir);
    } catch (e) {}
  }

  // 2. Admin
  if (fs.existsSync(adminDir)) {
    fs.mkdirSync(adminDest, { recursive: true });
    copyStaticFiles(adminDir, adminDest);
    console.log('> [Server] Synchronized admin to:', adminDest);
  }

  // 3. API Reverse Proxy
  const proxySource = fs.existsSync(path.resolve(__dirname, 'proxy-api.php'))
    ? path.resolve(__dirname, 'proxy-api.php')
    : path.resolve(__dirname, 'api/index.php');
  if (fs.existsSync(proxySource)) {
    fs.mkdirSync(apiDest, { recursive: true });
    fs.copyFileSync(proxySource, path.join(apiDest, 'index.php'));
    const htaccessSource = path.resolve(__dirname, 'api/.htaccess');
    if (fs.existsSync(htaccessSource)) {
      fs.copyFileSync(htaccessSource, path.join(apiDest, '.htaccess'));
    }
    console.log('> [Server] Synchronized API proxy to:', apiDest);
  }

  // 4. Centralizar y asegurar carpeta de Uploads en public_html/api/uploads
  fs.mkdirSync(apiUploadsDest, { recursive: true });
  fs.mkdirSync(publicUploadsDest, { recursive: true });

  // Sincronizar uploads existentes de las fuentes locales al destino canónico
  const seedUploadSources = [
    path.resolve(__dirname, 'backend/storage/uploads'),
    path.resolve(__dirname, 'storage/uploads'),
    path.resolve(__dirname, 'frontend/public/uploads')
  ];

  seedUploadSources.forEach(function(srcDir) {
    if (fs.existsSync(srcDir)) {
      try {
        const files = fs.readdirSync(srcDir);
        files.forEach(function(f) {
          const s = path.join(srcDir, f);
          const dApi = path.join(apiUploadsDest, f);
          const dPub = path.join(publicUploadsDest, f);
          if (!fs.existsSync(dApi)) {
            try { fs.copyFileSync(s, dApi); } catch (e) {}
          }
          if (!fs.existsSync(dPub)) {
            try { fs.copyFileSync(s, dPub); } catch (e) {}
          }
        });
      } catch (e) {}
    }
  });

  // Asegurar paridad bidireccional inmediata entre public_html/api/uploads y public_html/uploads
  if (fs.existsSync(apiUploadsDest) && fs.existsSync(publicUploadsDest) && apiUploadsDest !== publicUploadsDest) {
    try {
      const apiFiles = fs.readdirSync(apiUploadsDest);
      apiFiles.forEach(function(f) {
        const s = path.join(apiUploadsDest, f);
        const d = path.join(publicUploadsDest, f);
        if (!fs.existsSync(d)) {
          try { fs.copyFileSync(s, d); } catch (e) {}
        }
      });
      const pubFiles = fs.readdirSync(publicUploadsDest);
      pubFiles.forEach(function(f) {
        const s = path.join(publicUploadsDest, f);
        const d = path.join(apiUploadsDest, f);
        if (!fs.existsSync(d)) {
          try { fs.copyFileSync(s, d); } catch (e) {}
        }
      });
    } catch (e) {}
  }
} catch (e) {
  console.error('> [Server] Warning syncing web targets:', e.message);
}

// ── 1. CARGAR BACKEND API (ASÍNCRONO CON PATH TO FILE URL) ────────────────────
const { pathToFileURL } = require('url');
let backendApp = null;
let backendError = null;
const resolvedBackendPath = fs.existsSync(path.resolve(__dirname, 'backend/src/server.js'))
  ? path.resolve(__dirname, 'backend/src/server.js')
  : path.resolve(__dirname, 'backend/dist/server.js');

const backendPromise = import(pathToFileURL(resolvedBackendPath).href)
  .then(function(m) {
    backendApp = m.default || m.app || m;
    console.log('> [Server] Backend API montado exitosamente desde:', resolvedBackendPath);
    return backendApp;
  })
  .catch(function(err) {
    backendError = err;
    console.error('> [Server] Error cargando backend API:', err.message);
    return null;
  });

// ── 2. RUTEO DE API Y CABECERAS CORS ─────────────────────────────────────────
app.use(async function(req, res, next) {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  const host = (req.headers.host || '').toLowerCase();
  const isApi = host.startsWith('api.') || req.url.startsWith('/api') || req.url.startsWith('/uploads');

  if (isApi) {
    if (!backendApp && backendPromise) {
      try {
        await backendPromise;
      } catch (e) {}
    }
    if (typeof backendApp === 'function') {
      // Si la petición viene a api.unu-raymi.com/ (o cualquier subruta sin prefijo /api y no es uploads), prefijarla para que Express backend la reconozca
      if (host.startsWith('api.') && !req.url.startsWith('/api') && !req.url.startsWith('/uploads')) {
        req.url = '/api' + (req.url.startsWith('/') ? '' : '/') + req.url;
      }
      return backendApp(req, res, function(err) {
        if (err) return next(err);
        // Si el backend no encontró la ruta para una petición de API, responder 404 JSON (no dejar caer a frontend)
        if (!res.headersSent) {
          res.status(404).json({
            success: false,
            error: 'Endpoint de API no encontrado: ' + req.originalUrl
          });
        }
      });
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

// ── 3. RUTEO DE ADMIN ────────────────────────────────────────────────────────
app.use(function(req, res, next) {
  const host = (req.headers.host || '').toLowerCase();
  if (host.startsWith('admin.') || req.url.startsWith('/admin')) {
    if (fs.existsSync(adminDir)) {
      const cleanPath = req.path.replace(/^\/+|\/+$/g, '');
      const isRsc = req.headers['rsc'] === '1' || req.query._rsc;

      // Servir RSC Flight payloads cuando Next.js navega internamente entre apartados
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

      return express.static(adminDir, { extensions: ['html'] })(req, res, function() {
        const parsed = cleanPath.split('/');
        if (parsed.length >= 3 && parsed[2] === 'editar') {
          const editPage = path.join(adminDir, parsed[0], '1', 'editar', 'index.html');
          if (fs.existsSync(editPage)) return res.sendFile(editPage);
        }
        const indexHtml = path.join(adminDir, cleanPath, 'index.html');
        if (fs.existsSync(indexHtml)) return res.sendFile(indexHtml);
        res.sendFile(path.join(adminDir, 'index.html'));
      });
    }
  }
  next();
});

// ── 4. RUTEO DE FRONTEND (DEFAULT) Y SERVICIO ESTÁTICO DE UPLOADS ────────────
app.use(['/uploads', '/api/uploads'], express.static(apiUploadsDest, {
  maxAge: '7d',
  immutable: true
}));

// Ruteo instantáneo para la raíz / (Cero rebote de cliente, 0ms TTFB)
app.get(['/', '/index.html'], function(req, res, next) {
  const acceptLang = (req.headers['accept-language'] || '').toLowerCase();
  const prefersEs = acceptLang.startsWith('es') || acceptLang.includes(',es') || acceptLang.includes('es-');
  const targetDir = prefersEs ? 'es' : 'en';

  const localizedIndex = path.join(frontendDir, targetDir, 'index.html');
  if (fs.existsSync(localizedIndex)) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.sendFile(localizedIndex);
  }
  next();
});

if (fs.existsSync(frontendDir)) {
  app.use(express.static(frontendDir, {
    extensions: ['html'],
    maxAge: '1d',
    setHeaders: function(res, filePath) {
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, must-revalidate');
      } else if (filePath.match(/\.(js|css|webp|png|jpg|jpeg|svg|woff2)$/)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    }
  }));
}

// Fallback SPA Frontend y Soporte de sub-rutas /[locale]
app.use(function(req, res) {
  const p = req.path || '';
  if (p.startsWith('/es') && fs.existsSync(path.join(frontendDir, 'es/index.html'))) {
    return res.sendFile(path.join(frontendDir, 'es/index.html'));
  }
  if (p.startsWith('/en') && fs.existsSync(path.join(frontendDir, 'en/index.html'))) {
    return res.sendFile(path.join(frontendDir, 'en/index.html'));
  }

  const acceptLang = (req.headers['accept-language'] || '').toLowerCase();
  const prefersEs = acceptLang.startsWith('es') || acceptLang.includes(',es') || acceptLang.includes('es-');
  const preferredIndex = prefersEs
    ? path.join(frontendDir, 'es/index.html')
    : path.join(frontendDir, 'en/index.html');

  if (fs.existsSync(preferredIndex)) {
    return res.sendFile(preferredIndex);
  }

  const candidates = [
    path.join(frontendDir, 'index.html'),
    path.resolve(__dirname, 'out/index.html'),
    path.resolve(__dirname, 'public_html/index.html')
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      return res.sendFile(c);
    }
  }
  res.status(200).send('<!DOCTYPE html><html><head><title>Unu-Raymi</title></head><body>Unu-Raymi</body></html>');
});

function savePortFile(p) {
  const possiblePortFiles = [
    '/home/u209525223/domains/unu-raymi.com/public_html/api/.port',
    '/home/u209525223/domains/unu-raymi.com/public_html/.port',
    path.resolve(__dirname, 'api/.port'),
    path.resolve(__dirname, 'public_html/api/.port')
  ];

  possiblePortFiles.forEach(function(target) {
    try {
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, String(p));
    } catch (e) {}
  });
}

// En entornos Hostinger LiteSpeed / Node.js
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
const server = app.listen(port, '0.0.0.0', function() {
  console.log('> [Server] Unu-Raymi escuchando en puerto principal:', port);
  savePortFile(port);
});

// Guardar periódicamente el archivo .port para asegurar sincronización constante con el proxy PHP
setInterval(function() {
  savePortFile(port);
}, 10000);

server.on('error', function(err) {
  if (err.code !== 'EADDRINUSE') {
    console.error('> [Server Error]:', err.message);
  }
});

// Si Hostinger asignó un puerto dinámico diferente a 4000, levantar gateway interno en 4000
if (port !== 4000) {
  try {
    const internalServer = app.listen(4000, '0.0.0.0', function() {
      console.log('> [Server] Gateway interno de compatibilidad escuchando en 0.0.0.0:4000');
    });
    internalServer.on('error', function(err) {
      if (err.code !== 'EADDRINUSE') {
        console.warn('> [Server Warning] Gateway interno 4000:', err.message);
      }
    });
  } catch (e) {}
}

module.exports = app;
