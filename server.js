// ==============================================================================
// server.js — Unu-Raymi Single Web App Engine
// ==============================================================================

'use strict';

const fs = require('fs');
const path = require('path');
const express = require('express');

const app = express();
app.disable('x-powered-by');

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

// ── Sincronizar frontend/out y admin/out en tiempo de ejecución ─────────────
try {
  const pubTargets = [
    '/home/u209525223/domains/unu-raymi.com/public_html',
    path.resolve(__dirname, 'public_html'),
    path.resolve(__dirname, '../public_html')
  ];
  if (__dirname.includes('public_html')) {
    pubTargets.push(__dirname);
  }
  const uniquePubTargets = [...new Set(pubTargets.map(t => path.resolve(t)))];
  uniquePubTargets.forEach(target => {
    if ((fs.existsSync(target) || fs.existsSync(path.dirname(target))) && fs.existsSync(frontendDir) && target !== frontendDir) {
      fs.mkdirSync(target, { recursive: true });
      copyStaticFiles(frontendDir, target);
      console.log('> [Server] Synchronized frontend files to:', target);
    }
  });

  const adminTargets = [
    '/home/u209525223/domains/unu-raymi.com/public_html/admin',
    '/home/u209525223/domains/admin.unu-raymi.com/public_html',
    path.resolve(__dirname, 'public_html/admin')
  ];
  if (__dirname.includes('public_html')) {
    adminTargets.push(path.resolve(__dirname, 'admin'));
  }
  const uniqueAdminTargets = [...new Set(adminTargets.map(t => path.resolve(t)))];
  uniqueAdminTargets.forEach(target => {
    if (fs.existsSync(adminDir) && fs.existsSync(path.dirname(target))) {
      copyStaticFiles(adminDir, target);
      console.log('> [Server] Synchronized admin files to:', target);
    }
  });

  const apiTargets = [
    '/home/u209525223/domains/unu-raymi.com/public_html/api',
    '/home/u209525223/domains/api.unu-raymi.com/public_html',
    path.resolve(__dirname, 'public_html/api'),
    path.resolve(__dirname, 'api')
  ];
  const uniqueApiTargets = [...new Set(apiTargets.map(t => path.resolve(t)))];
  const proxySource = fs.existsSync(path.resolve(__dirname, 'proxy-api.php'))
    ? fs.readFileSync(path.resolve(__dirname, 'proxy-api.php'), 'utf8')
    : null;
  const htaccessSource = fs.existsSync(path.resolve(__dirname, 'api/.htaccess'))
    ? fs.readFileSync(path.resolve(__dirname, 'api/.htaccess'), 'utf8')
    : null;

  if (proxySource) {
    uniqueApiTargets.forEach(target => {
      try {
        if (fs.existsSync(path.dirname(target))) {
          fs.mkdirSync(target, { recursive: true });
          fs.writeFileSync(path.join(target, 'index.php'), proxySource);
          if (htaccessSource) {
            fs.writeFileSync(path.join(target, '.htaccess'), htaccessSource);
          }
          console.log('> [Server] Synchronized API proxy to:', target);
        }
      } catch (e) {}
    });
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
  if (host.startsWith('api.') || req.url.startsWith('/api') || req.url.startsWith('/uploads')) {
    if (!backendApp && backendPromise) {
      try {
        await backendPromise;
      } catch (e) {}
    }
    if (typeof backendApp === 'function') {
      // Si la petición viene a api.unu-raymi.com/auth/login (sin prefijo /api y no es uploads), prefijarla para que Express la reconozca
      if (host.startsWith('api.') && !req.url.startsWith('/api') && !req.url.startsWith('/uploads')) {
        req.url = '/api' + req.url;
      }
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

// ── 3. RUTEO DE ADMIN ────────────────────────────────────────────────────────
app.use(function(req, res, next) {
  const host = (req.headers.host || '').toLowerCase();
  if (host.startsWith('admin.') || req.url.startsWith('/admin')) {
    if (fs.existsSync(adminDir)) {
      return express.static(adminDir, { extensions: ['html'] })(req, res, function() {
        const parsed = req.path.replace(/^\/+|\/+$/g, '').split('/');
        if (parsed.length >= 3 && parsed[2] === 'editar') {
          const editPage = path.join(adminDir, parsed[0], '1', 'editar', 'index.html');
          if (fs.existsSync(editPage)) return res.sendFile(editPage);
        }
        res.sendFile(path.join(adminDir, 'index.html'));
      });
    }
  }
  next();
});

// ── 4. RUTEO DE FRONTEND (DEFAULT) ───────────────────────────────────────────
if (fs.existsSync(frontendDir)) {
  app.use(express.static(frontendDir, { extensions: ['html'] }));
}

// Fallback SPA Frontend
app.use(function(req, res) {
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
  const targets = [
    path.resolve(__dirname, '.port'),
    path.resolve(__dirname, 'api/.port'),
    path.resolve(__dirname, 'backend/.port'),
    '/home/u209525223/domains/unu-raymi.com/public_html/.port',
    '/home/u209525223/domains/unu-raymi.com/public_html/api/.port',
    '/home/u209525223/domains/api.unu-raymi.com/public_html/.port',
    '/home/u209525223/.port'
  ];
  targets.forEach(function(target) {
    try {
      if (fs.existsSync(path.dirname(target))) {
        fs.writeFileSync(target, String(p));
      }
    } catch (e) {}
  });
  try {
    const os = require('os');
    fs.writeFileSync(path.join(os.tmpdir(), 'unu_raymi_port'), String(p));
  } catch (e) {}
}

// En entornos Hostinger LiteSpeed / Node.js
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
const server = app.listen(port, function() {
  console.log('> [Server] Unu-Raymi escuchando en puerto principal:', port);
  savePortFile(port);
});

server.on('error', function(err) {
  if (err.code !== 'EADDRINUSE') {
    console.error('> [Server Error]:', err.message);
  }
});

// Si Hostinger asignó un puerto dinámico diferente a 4000, levantar gateway interno en 4000
if (port !== 4000) {
  try {
    const internalServer = app.listen(4000, '127.0.0.1', function() {
      console.log('> [Server] Gateway interno de compatibilidad escuchando en http://127.0.0.1:4000');
    });
    internalServer.on('error', function(err) {
      if (err.code !== 'EADDRINUSE') {
        console.warn('> [Server Warning] Gateway interno 4000:', err.message);
      }
    });
  } catch (e) {}
}

module.exports = app;
