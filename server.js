// ==============================================================================
// server.js — Centralized Unified Entry Point (Virtual Host Engine)
// Handles: unu-raymi.com (Frontend), admin.unu-raymi.com (Admin), api.unu-raymi.com (Backend API)
// ==============================================================================

'use strict';

const fs = require('fs');
const path = require('path');
const express = require('express');

const app = express();
app.disable('x-powered-by');

// Capturar el puerto nativo inyectado por Hostinger
const hostingerPort = process.env.PORT;

function loadEnvFile(filePath) {
  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      content.split('\n').forEach(function(line) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const firstEqual = trimmed.indexOf('=');
          if (firstEqual !== -1) {
            const key = trimmed.substring(0, firstEqual).trim();
            let val = trimmed.substring(firstEqual + 1).trim();
            if ((val.startsWith('"') && val.endsWith('"')) ||
                (val.startsWith("'") && val.endsWith("'"))) {
              val = val.substring(1, val.length - 1);
            }
            if (key === 'PORT' && hostingerPort) return;
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        }
      });
    } catch (err) {}
  }
}

// Cargar variables de entorno
loadEnvFile(path.resolve(__dirname, '.env.production'));
loadEnvFile(path.resolve(__dirname, '.env'));
loadEnvFile(path.resolve(__dirname, 'backend/.env.production'));
loadEnvFile(path.resolve(__dirname, 'backend/.env'));

function resolvePort() {
  const p = hostingerPort || process.env.PORT;
  if (!p) return 3000;
  if (typeof p === 'string' && (p === 'passenger' || p.startsWith('/') || p.startsWith('\\\\') || p.includes('.sock'))) {
    return p;
  }
  const parsed = parseInt(p, 10);
  return isNaN(parsed) ? p : parsed;
}

const port = resolvePort();

// Resolver directorios compilados con fallbacks exhaustivos
function resolveOutDir(subapp) {
  const candidates = [
    path.resolve(__dirname, subapp, 'out'),
    path.resolve(process.cwd(), subapp, 'out'),
    path.resolve(__dirname, 'out'),
    path.resolve(process.cwd(), 'out'),
    path.resolve(__dirname, 'public_html', subapp),
    path.resolve(process.cwd(), 'public_html', subapp),
    path.resolve(__dirname, 'public_html'),
    path.resolve(process.cwd(), 'public_html'),
    '/home/u209525223/domains/unu-raymi.com/public_html/' + subapp,
    '/home/u209525223/domains/unu-raymi.com/public_html'
  ];
  for (const c of candidates) {
    if (fs.existsSync(path.join(c, 'index.html'))) {
      return c;
    }
  }
  return path.resolve(__dirname, subapp, 'out');
}

const frontendOut = resolveOutDir('frontend');
const adminOut = resolveOutDir('admin');

console.log('> [VHost] CWD:', process.cwd());
console.log('> [VHost] Frontend Out Dir:', frontendOut);
console.log('> [VHost] Admin Out Dir:', adminOut);

// ── 1. CARGAR BACKEND EXPRESS API ─────────────────────────────────────────────
let backendApp = null;
let backendInitError = null;

const backendPath = fs.existsSync(path.resolve(__dirname, 'backend/dist/server.js'))
  ? './backend/dist/server.js'
  : './backend/src/server.js';

const backendPromise = import(backendPath)
  .then(function(m) {
    backendApp = m.default || m;
    console.log('> [VHost] Backend Express API montado exitosamente.');
  })
  .catch(function(err) {
    backendInitError = err.message;
    console.error('> [VHost] Error cargando backend API:', err.message);
  });

// ── 2. MIDDLEWARE DE ENRUTAMIENTO VIRTUAL HOST ────────────────────────────────
app.use(async function(req, res, next) {
  const host = (req.headers.host || '').toLowerCase();
  const urlPath = req.url || '';

  // CASO A: API (Petición a api.unu-raymi.com O prefijo /api)
  if (host.startsWith('api.') || urlPath.startsWith('/api')) {
    if (!backendApp) {
      try {
        await backendPromise;
      } catch (e) {}
    }

    if (backendApp) {
      return backendApp(req, res, next);
    } else {
      return res.status(500).json({ 
        success: false, 
        error: 'Error iniciando API: ' + (backendInitError || 'Módulo no cargado') 
      });
    }
  }

  // CASO B: ADMIN (Petición a admin.unu-raymi.com O subcarpeta /admin)
  if (host.startsWith('admin.') || urlPath.startsWith('/admin')) {
    req.isVirtualAdmin = true;
    return next();
  }

  // CASO C: FRONTEND (unu-raymi.com o por defecto)
  req.isVirtualFrontend = true;
  return next();
});

// ── 3. SERVIR ASSETS ESTÁTICOS ──────────────────────────────────────────────
// Servir assets estáticos de Admin cuando la petición es para admin
app.use(function(req, res, next) {
  if (req.isVirtualAdmin && fs.existsSync(adminOut)) {
    return express.static(adminOut, { extensions: ['html'] })(req, res, next);
  }
  next();
});

// Servir assets estáticos de Frontend desde frontendOut o public_html
app.use(express.static(frontendOut, { extensions: ['html'] }));
const rootOut = path.resolve(__dirname, 'out');
if (fs.existsSync(rootOut)) {
  app.use(express.static(rootOut, { extensions: ['html'] }));
}
const pubDir = path.resolve(__dirname, 'public_html');
if (fs.existsSync(pubDir)) {
  app.use(express.static(pubDir, { extensions: ['html'] }));
}

// ── 4. SPA FALLBACK HANDLER PARA ADMIN Y FRONTEND ─────────────────────────────
app.use(function(req, res) {
  const parsedPath = req.path.replace(/^\/+|\/+$/g, '');
  const segments = parsedPath.split('/');

  if (req.isVirtualAdmin && fs.existsSync(adminOut)) {
    if (segments.length >= 3 && segments[0] === 'tours' && segments[2] === 'editar') {
      const p1 = path.join(adminOut, 'tours', '1', 'editar', 'index.html');
      const p2 = path.join(adminOut, 'tours', '1', 'editar.html');
      if (fs.existsSync(p1)) return res.sendFile(p1);
      if (fs.existsSync(p2)) return res.sendFile(p2);
    }
    if (segments.length >= 3 && segments[0] === 'guias' && segments[2] === 'editar') {
      const p1 = path.join(adminOut, 'guias', '1', 'editar', 'index.html');
      const p2 = path.join(adminOut, 'guias', '1', 'editar.html');
      if (fs.existsSync(p1)) return res.sendFile(p1);
      if (fs.existsSync(p2)) return res.sendFile(p2);
    }
    if (segments.length >= 3 && segments[0] === 'garantias' && segments[2] === 'editar') {
      const p1 = path.join(adminOut, 'garantias', '1', 'editar', 'index.html');
      const p2 = path.join(adminOut, 'garantias', '1', 'editar.html');
      if (fs.existsSync(p1)) return res.sendFile(p1);
      if (fs.existsSync(p2)) return res.sendFile(p2);
    }

    if (segments[0]) {
      const sectionHtml = path.join(adminOut, `${segments[0]}.html`);
      if (fs.existsSync(sectionHtml)) return res.sendFile(sectionHtml);
    }

    const adminIndex = path.join(adminOut, 'index.html');
    if (fs.existsSync(adminIndex)) return res.sendFile(adminIndex);
  }

  // Frontend SPA Fallback - probar todas las ubicaciones posibles
  const candidatesIndex = [
    path.join(frontendOut, 'index.html'),
    path.join(rootOut, 'index.html'),
    path.join(pubDir, 'index.html'),
    path.resolve(process.cwd(), 'out', 'index.html'),
    path.resolve(process.cwd(), 'frontend', 'out', 'index.html'),
    '/home/u209525223/domains/unu-raymi.com/public_html/index.html'
  ];

  for (const idx of candidatesIndex) {
    if (fs.existsSync(idx)) {
      return res.sendFile(idx);
    }
  }

  return res.status(200).send('<!DOCTYPE html><html><head><meta charset="utf-8"><title>Unu-Raymi</title></head><body><div id="root">Unu-Raymi</div></body></html>');
});

// En Express / Passenger de Hostinger
const server = app.listen(port, function() {
  console.log('> [UNU-RAYMI CENTRAL ENGINE] Server running on port/socket:', port);
});

server.on('error', function(err) {
  if (err.code !== 'EADDRINUSE') {
    console.error('> [Server Error]:', err.message);
  }
});

module.exports = app;
