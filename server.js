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

// Activar compresión gzip/brotli para todas las respuestas
app.use(compression());

// Cargar variables de entorno
function loadEnv(file) {
  if (fs.existsSync(file)) {
    try {
      const lines = fs.readFileSync(file, 'utf8').split('\n');
      lines.forEach(function (l) {
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
    } catch (e) { }
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
      // Solo copiar si no existe en destino para arranque instantáneo (menos de 50ms)
      if (!fs.existsSync(destItem)) {
        fs.cpSync(srcItem, destItem, { recursive: true, force: false });
      }
    } catch (e) { }
  }
}

// ── Sincronizar frontend, admin y api en tiempo de ejecución (Hostinger Linux) ──
try {
  const isHostingerLinux = process.platform !== 'win32' && fs.existsSync('/home/u209525223');
  const hostingerBase = '/home/u209525223/domains/unu-raymi.com/public_html';
  const apiDomainBase = '/home/u209525223/domains/unu-raymi.com/public_html/api';
  const adminDomainBase = '/home/u209525223/domains/unu-raymi.com/public_html/admin';
  const pubDir = isHostingerLinux && fs.existsSync(hostingerBase) ? hostingerBase : path.resolve(__dirname, 'public_html');
  const adminDest = path.join(pubDir, 'admin');
  const apiDest = path.join(pubDir, 'api');

  // 1. Frontend
  if (fs.existsSync(frontendDir) && pubDir !== frontendDir) {
    fs.mkdirSync(pubDir, { recursive: true });
    copyStaticFiles(frontendDir, pubDir);
    const frontendHtaccessContent = `<IfModule mod_rewrite.c>
RewriteEngine On
RewriteBase /

# No interceptar API, Admin ni Uploads
RewriteRule ^api(/.*)?$ - [L]
RewriteRule ^admin(/.*)?$ - [L]
RewriteRule ^uploads(/.*)?$ - [L]

# Peticiones de RSC / Prefetch Next.js
RewriteCond %{HTTP:RSC} 1 [OR]
RewriteCond %{QUERY_STRING} (^|&)_rsc=
RewriteCond %{REQUEST_FILENAME} -d
RewriteCond %{REQUEST_FILENAME}/index.txt -f
RewriteRule ^(.*)$ $1/index.txt [T=text/plain,L]

RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
</IfModule>
`;
    try {
      fs.writeFileSync(path.join(pubDir, '.htaccess'), frontendHtaccessContent);
    } catch (e) {}
    console.log('> [Server] Synchronized frontend to:', pubDir);
  }

  // 2. Admin (en public_html/admin y en admin.unu-raymi.com si existe)
  if (fs.existsSync(adminDir)) {
    fs.mkdirSync(adminDest, { recursive: true });
    copyStaticFiles(adminDir, adminDest);
    console.log('> [Server] Synchronized admin to:', adminDest);

    if (isHostingerLinux && fs.existsSync(path.dirname(adminDomainBase))) {
      fs.mkdirSync(adminDomainBase, { recursive: true });
      copyStaticFiles(adminDir, adminDomainBase);
      console.log('> [Server] Synchronized admin to domain root:', adminDomainBase);
    }
  }

  // 3. API Reverse Proxy (en public_html/api y en api.unu-raymi.com)
  const proxySource = fs.existsSync(path.resolve(__dirname, 'proxy-api.php'))
    ? path.resolve(__dirname, 'proxy-api.php')
    : path.resolve(__dirname, 'api/index.php');
  const htaccessSource = fs.existsSync(path.resolve(__dirname, 'api/.htaccess'))
    ? path.resolve(__dirname, 'api/.htaccess')
    : path.resolve(__dirname, '.htaccess');

  const syncProxyToDir = function (targetDir) {
    try {
      if (fs.existsSync(path.dirname(targetDir))) {
        fs.mkdirSync(targetDir, { recursive: true });
        if (fs.existsSync(path.join(targetDir, 'default.php'))) {
          try { fs.unlinkSync(path.join(targetDir, 'default.php')); } catch (e) {}
        }
        if (fs.existsSync(proxySource)) {
          fs.copyFileSync(proxySource, path.join(targetDir, 'index.php'));
        }
        if (fs.existsSync(htaccessSource)) {
          fs.copyFileSync(htaccessSource, path.join(targetDir, '.htaccess'));
        }
        console.log('> [Server] Synchronized API proxy to:', targetDir);
      }
    } catch (e) { }
  };

  syncProxyToDir(apiDest);
  syncProxyToDir(apiDomainBase);

  // 4. Sincronizar carpeta de Uploads bidireccionalmente
  const uploadSources = [
    process.env.UPLOADS_PATH,
    '/home/u209525223/domains/unu-raymi.com/storage/uploads',
    path.resolve(__dirname, 'backend/storage/uploads'),
    path.resolve(__dirname, 'storage/uploads'),
    path.resolve(__dirname, 'public_html/uploads')
  ].filter(Boolean);

  const uploadDestinations = [
    path.join(pubDir, 'uploads'),
    path.join(apiDest, 'uploads'),
    '/home/u209525223/domains/unu-raymi.com/storage/uploads'
  ];

  uploadDestinations.forEach(function (dest) {
    try {
      if (fs.existsSync(path.dirname(dest))) {
        fs.mkdirSync(dest, { recursive: true });
      }
    } catch (e) { }
  });

  uploadSources.forEach(function (srcDir) {
    if (fs.existsSync(srcDir)) {
      try {
        const files = fs.readdirSync(srcDir);
        files.forEach(function (f) {
          const s = path.join(srcDir, f);
          uploadDestinations.forEach(function (d) {
            if (fs.existsSync(d)) {
              const targetFile = path.join(d, f);
              if (!fs.existsSync(targetFile)) {
                try { fs.copyFileSync(s, targetFile); } catch (e) { }
              }
            }
          });
        });
      } catch (e) { }
    }
  });
} catch (e) {
  console.error('> [Server] Warning syncing web targets:', e.message);
}

// ── 1. CARGAR BACKEND API (ASÍNCRONO CON PATH TO FILE URL) ────────────────────
process.env.__ROOT_SERVER_RUNNING = 'true';
const { pathToFileURL } = require('url');
let backendApp = null;
let backendError = null;
const resolvedBackendPath = fs.existsSync(path.resolve(__dirname, 'backend/src/server.js'))
  ? path.resolve(__dirname, 'backend/src/server.js')
  : path.resolve(__dirname, 'backend/dist/server.js');

const backendPromise = import(pathToFileURL(resolvedBackendPath).href)
  .then(function (m) {
    backendApp = m.default || m.app || m;
    console.log('> [Server] Backend API montado exitosamente desde:', resolvedBackendPath);
    return backendApp;
  })
  .catch(function (err) {
    backendError = err;
    console.error('> [Server] Error cargando backend API:', err.message);
    return null;
  });

// ── 0. SERVIR UPLOADS DIRECTAMENTE (SIN DEPENDER DEL BACKEND) ────────────────
const uploadDirsToServe = [
  process.env.UPLOADS_PATH,
  '/home/u209525223/domains/unu-raymi.com/public_html/uploads',
  path.resolve(__dirname, 'backend/storage/uploads'),
  path.resolve(__dirname, 'public_html/uploads'),
  path.resolve(__dirname, 'storage/uploads'),
].filter(Boolean);

uploadDirsToServe.forEach(function (dir) {
  if (fs.existsSync(dir)) {
    app.use('/uploads', express.static(dir, { maxAge: '7d', immutable: true }));
    app.use('/api/uploads', express.static(dir, { maxAge: '7d', immutable: true }));
  }
});

// Detectar modo configurado en Hostinger (APP_TYPE=backend | admin | frontend | all)
const configuredAppType = (process.env.APP_TYPE || '').toLowerCase().trim();
console.log('> [Server] Modo APP_TYPE configurado:', configuredAppType || 'all (gateway)');

// ── Variables de servidores y bridges internos ───────────────────────────────
let internalTcpPort = 0;
let tcpBridgeServer = null;
let userSocketPath = null;
let userSocketServer = null;
let server = null;
let actualBoundPort = 0;

// ── 2. RUTEO DE API Y CABECERAS CORS ─────────────────────────────────────────
app.use(async function (req, res, next) {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  const host = (req.headers['x-forwarded-host'] || req.headers.host || '').toLowerCase();
  const isFromBridge = (internalTcpPort > 0 && req.socket && req.socket.localPort === internalTcpPort);
  const isApiRequest =
    isFromBridge ||
    configuredAppType === 'backend' ||
    host.startsWith('api.') ||
    host.includes('api.unu-raymi.com') ||
    req.url.startsWith('/api') ||
    req.url.startsWith('/uploads');

  if (isApiRequest) {
    if (!backendApp && backendPromise) {
      try {
        await backendPromise;
      } catch (e) { }
    }
    if (typeof backendApp === 'function') {
      // Normalizar rutas directas que lleguen al subdominio o bridge (ej: /health, /tours, /)
      if (!req.url.startsWith('/api') && !req.url.startsWith('/uploads')) {
        req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
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
app.use(function (req, res, next) {
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

      return express.static(adminDir, { extensions: ['html'] })(req, res, function () {
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

// ── 4. RUTEO DE FRONTEND (DEFAULT) ───────────────────────────────────────────
if (fs.existsSync(frontendDir)) {
  app.use(express.static(frontendDir, { extensions: ['html'] }));
}

// Fallback SPA Frontend
app.use(function (req, res) {
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

function savePortFile(p, meta = {}) {
  // Asegurar que si el puerto asignado es un socket privado de LiteSpeed (/usr/local/lsws/),
  // registremos el puerto TCP local de bridge en .port para que PHP pueda conectarse sin problemas de permisos de CageFS
  let portToSave = String(p).trim();
  if (portToSave.startsWith('/usr/local/lsws/')) {
    if (internalTcpPort > 0) {
      portToSave = String(internalTcpPort);
    } else if (userSocketPath) {
      portToSave = userSocketPath;
    }
  }

  const targets = [
    '/home/u209525223/domains/unu-raymi.com/public_html/api/.port',
    '/home/u209525223/domains/unu-raymi.com/public_html/.port',
    '/home/u209525223/domains/api.unu-raymi.com/public_html/.port',
    path.resolve(__dirname, 'api/.port'),
    path.resolve(__dirname, '.port')
  ];
  targets.forEach(function (target) {
    try {
      if (fs.existsSync(path.dirname(target))) {
        fs.writeFileSync(target, portToSave);
        const metaTarget = path.join(path.dirname(target), '.port_meta.json');
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
    } catch (e) { }
  });
}

function updatePortRegistry(extraMeta = {}) {
  const published = internalTcpPort > 0 ? internalTcpPort : (userSocketPath || actualBoundPort);
  savePortFile(published, extraMeta);
}

// ── 1. Iniciar Bridge TCP loopback interno en 127.0.0.1:0 (puerto dinámico del SO) ──
try {
  tcpBridgeServer = app.listen(0, '127.0.0.1', function () {
    const tcpAddr = tcpBridgeServer.address();
    internalTcpPort = (tcpAddr && typeof tcpAddr === 'object') ? tcpAddr.port : 0;
    console.log('> [Server] Bridge TCP local activo en puerto dinámico:', internalTcpPort);
    updatePortRegistry({ tcp_active: true });
  });
  tcpBridgeServer.on('error', function (err) {
    console.warn('> [Server Warning] Bridge TCP:', err.message);
  });
} catch (e) {
  console.warn('> [Server Warning] Error iniciando bridge TCP:', e.message);
}

// ── 2. Iniciar Socket Unix de usuario en espacio propio de Hostinger (permisos 0777) ──
if (process.platform !== 'win32') {
  const sockCandidates = [
    '/home/u209525223/domains/unu-raymi.com/public_html/api/node.sock',
    path.resolve(__dirname, 'api/node.sock'),
    path.resolve(__dirname, 'node.sock')
  ];
  for (const sc of sockCandidates) {
    if (fs.existsSync(path.dirname(sc))) {
      userSocketPath = sc;
      break;
    }
  }
  if (userSocketPath) {
    try {
      if (fs.existsSync(userSocketPath)) {
        try { fs.unlinkSync(userSocketPath); } catch (e) { }
      }
      userSocketServer = app.listen(userSocketPath, function () {
        try { fs.chmodSync(userSocketPath, 0o777); } catch (e) { }
        console.log('> [Server] Socket Unix de usuario activo en:', userSocketPath);
        updatePortRegistry({ user_socket_active: true });
      });
      userSocketServer.on('error', function (err) {
        console.warn('> [Server Warning] Socket Unix:', err.message);
      });
    } catch (e) {
      console.warn('> [Server Warning] Error iniciando socket Unix:', e.message);
    }
  }
}

// ── 3. Listener principal según entorno de Hostinger (LiteSpeed / Passenger / Dinámico) ──
const rawEnvPort = process.env.PORT || process.env.PASSENGER_PORT || process.env.APP_PORT || process.env.NODE_PORT;
const port = rawEnvPort ? (isNaN(rawEnvPort) ? rawEnvPort : parseInt(rawEnvPort, 10)) : 0;
console.log('> [Server] Puerto asignado por Hostinger / entorno:', rawEnvPort || '(asignación dinámica automática)');

actualBoundPort = port;
if (typeof PhusionPassenger !== 'undefined') {
  console.log('> [Server] Modo Phusion Passenger detectado. Vinculando a socket de Passenger...');
  server = app.listen('passenger', function () {
    const addr = server.address();
    actualBoundPort = (addr && typeof addr === 'object' && addr.port) ? addr.port : (addr || 'passenger');
    console.log('> [Server] Unu-Raymi escuchando en socket/puerto Passenger:', actualBoundPort);
    updatePortRegistry({ passenger: true, bound_address: addr });
  });
} else {
  server = app.listen(port, function () {
    const addr = server.address();
    actualBoundPort = (addr && typeof addr === 'object' && addr.port) ? addr.port : (addr || port);
    console.log('> [Server] Unu-Raymi escuchando en listener principal:', actualBoundPort);
    updatePortRegistry({ bound_address: addr });
  });
}

server.on('error', function (err) {
  if (err.code !== 'EADDRINUSE') {
    console.error('> [Server Error]:', err.message);
  }
});

module.exports = app;

