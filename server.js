// ==============================================================================
// server.js — Unified Entry Point for Hostinger Node.js (LiteSpeed lsnode.js)
//
// IMPORTANT: Hostinger LiteSpeed loads this file via require(), NOT import().
// Therefore this file MUST be CommonJS-compatible:
//   - No top-level await
//   - No import statements
//   - Use require() and async function wrapper instead
// ==============================================================================

'use strict';

const fs = require('fs');
const path = require('path');
const { createRequire } = require('module');

let appType = (process.env.APP_TYPE || '').toLowerCase().trim();

if (!appType) {
  const cwd = (process.cwd() || process.env.PWD || __dirname).toLowerCase();
  if (cwd.includes('admin')) {
    appType = 'admin';
  } else if (cwd.includes('api') || cwd.includes('backend')) {
    appType = 'backend';
  } else {
    appType = 'frontend';
  }
}

console.log('> Initialized appType: [' + appType.toUpperCase() + '] in root server.js');

// Capturar el puerto nativo inyectado por Hostinger ANTES de cargar cualquier archivo .env
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
            // NO sobreescribir el PORT que Hostinger asignó al proceso
            if (key === 'PORT' && hostingerPort) {
              return;
            }
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        }
      });
      console.log('> Loaded environment variables from: ' + filePath);
    } catch (err) {
      console.error('Warning: Failed to load env file ' + filePath + ':', err.message);
    }
  }
}

function resolvePort() {
  const p = hostingerPort || process.env.PORT;
  if (!p) return 3000;
  if (typeof p === 'string' && (p === 'passenger' || p.startsWith('/') || p.startsWith('\\\\') || p.includes('.sock'))) {
    return p;
  }
  const parsed = parseInt(p, 10);
  return isNaN(parsed) ? p : parsed;
}

// ── BACKEND ───────────────────────────────────────────────────────────────────
if (appType === 'backend') {
  loadEnvFile(path.resolve(__dirname, 'backend/.env'));

  const backendPath = fs.existsSync(path.resolve(__dirname, 'backend/dist/server.js'))
    ? './backend/dist/server.js'
    : './backend/src/server.js';

  console.log('> Loading backend entrypoint from: ' + backendPath);

  const backendPromise = import(backendPath)
    .then(function(m) {
      console.log('> Backend Express app loaded successfully.');
      return m.default || m;
    })
    .catch(function(err) {
      console.error('> FATAL: Failed to start backend:', err);
      process.exit(1);
    });

  module.exports = backendPromise;

// ── FRONTEND / ADMIN (Next.js) ────────────────────────────────────────────────
} else {
  const subappDir = appType === 'admin' ? 'admin' : 'frontend';
  const dir = path.resolve(__dirname, subappDir);

  // Cargar variables de entorno del subapp (.env.production o .env)
  loadEnvFile(path.join(dir, '.env.production'));
  loadEnvFile(path.join(dir, '.env'));

  const port = resolvePort();
  const dev = process.env.NODE_ENV === 'development';

  let chosenDir = dir;
  if (!fs.existsSync(path.join(chosenDir, 'package.json')) && fs.existsSync(path.join(__dirname, 'package.json'))) {
    chosenDir = __dirname;
  }

  const subappNext = path.join(chosenDir, '.next');
  const rootNext = path.join(__dirname, '.next');
  const targetDir = fs.existsSync(subappNext) ? chosenDir : (fs.existsSync(rootNext) ? __dirname : chosenDir);

  const express = require('express');
  const app = express();

  // Deshabilitar header x-powered-by
  app.disable('x-powered-by');

  // 1. Servir carpeta de Exportación Estática (out) directamente si existe
  const outCandidates = [
    path.join(dir, 'out'),
    path.join(__dirname, 'out'),
    path.join(__dirname, 'frontend/out'),
    path.join(__dirname, 'admin/out')
  ];

  let outDir = null;
  for (const candidate of outCandidates) {
    if (fs.existsSync(candidate) && fs.existsSync(path.join(candidate, 'index.html'))) {
      outDir = candidate;
      break;
    }
  }

  if (outDir) {
    console.log('> Serving static export from:', outDir);

    // Sincronizar automáticamente hacia todas las posibles carpetas public_html en Hostinger
    try {
      let currentDir = __dirname;
      for (let i = 0; i < 6; i++) {
        const pubHtmlCandidate = path.join(currentDir, 'public_html');
        if (fs.existsSync(pubHtmlCandidate) && pubHtmlCandidate !== outDir) {
          fs.cpSync(outDir, pubHtmlCandidate, { recursive: true });
          console.log('> Synced static assets to public_html at:', pubHtmlCandidate);
        }
        const parentDir = path.dirname(currentDir);
        if (parentDir === currentDir) break;
        currentDir = parentDir;
      }
    } catch (syncErr) {
      console.warn('> Warning on public_html sync:', syncErr.message);
    }

    app.use(express.static(outDir, { extensions: ['html'] }));
    app.all('*', function(req, res) {
      const indexPath = path.join(outDir, 'index.html');
      if (fs.existsSync(indexPath)) {
        return res.sendFile(indexPath);
      }
      res.status(404).sendFile(path.join(outDir, '404.html'));
    });
  } else {
    // Fallback: Servir carpeta static y .next/server/app
    const staticCandidates = [
      path.join(targetDir, '.next/static'),
      path.join(__dirname, '.next/static'),
      path.join(__dirname, 'frontend/.next/static'),
      path.join(__dirname, 'admin/.next/static')
    ];
    for (const staticDir of staticCandidates) {
      if (fs.existsSync(staticDir)) {
        app.use('/_next/static', express.static(staticDir, { maxAge: '365d', immutable: true }));
        break;
      }
    }

    const publicDir = path.join(dir, 'public');
    if (fs.existsSync(publicDir)) {
      app.use(express.static(publicDir));
    }

    const serverAppCandidates = [
      path.join(targetDir, '.next/server/app'),
      path.join(__dirname, '.next/server/app'),
      path.join(__dirname, 'frontend/.next/server/app'),
      path.join(__dirname, 'admin/.next/server/app')
    ];

    let appHtmlDir = null;
    for (const candidate of serverAppCandidates) {
      if (fs.existsSync(candidate)) {
        appHtmlDir = candidate;
        break;
      }
    }

    if (appHtmlDir) {
      app.use(express.static(appHtmlDir, { extensions: ['html'] }));
    }

    app.all('*', function(req, res) {
      if (appHtmlDir && fs.existsSync(path.join(appHtmlDir, 'index.html'))) {
        return res.sendFile(path.join(appHtmlDir, 'index.html'));
      }
      const rootHtml = path.join(__dirname, '.next/server/app/index.html');
      if (fs.existsSync(rootHtml)) {
        return res.sendFile(rootHtml);
      }
      res.status(200).send('<!DOCTYPE html><html><head><meta charset="utf-8"><title>Unu-Raymi</title></head><body><div id="root">Cargando Unu-Raymi...</div></body></html>');
    });
  }

  // En Phusion Passenger / LiteSpeed: llamar app.listen siempre para enganchar socket/puerto
  app.listen(port, function(err) {
    if (err) {
      console.error('Server listen error:', err);
      return;
    }
    console.log('> Web App [' + appType.toUpperCase() + '] corriendo en el puerto/socket:', port);
  });

  module.exports = app;
}
