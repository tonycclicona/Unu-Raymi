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

// ── FRONTEND / ADMIN / BACKEND ─────────────────────────────────────────────
const express = require('express');
const app = express();
app.disable('x-powered-by');

const port = resolvePort();

if (appType === 'backend') {
  loadEnvFile(path.resolve(__dirname, 'backend/.env'));
  const backendPath = fs.existsSync(path.resolve(__dirname, 'backend/dist/server.js'))
    ? './backend/dist/server.js'
    : './backend/src/server.js';

  console.log('> Loading backend entrypoint from: ' + backendPath);
  module.exports = import(backendPath).then(function(m) {
    console.log('> Backend Express app loaded successfully.');
    return m.default || m;
  });
} else {
  const subappDir = appType === 'admin' ? 'admin' : 'frontend';
  const dir = path.resolve(__dirname, subappDir);

  loadEnvFile(path.join(dir, '.env.production'));
  loadEnvFile(path.join(dir, '.env'));

  const outCandidates = [
    path.join(dir, 'out'),
    path.join(__dirname, 'out'),
    path.join(__dirname, subappDir, 'out')
  ];

  let outDir = null;
  for (const candidate of outCandidates) {
    if (fs.existsSync(candidate) && fs.existsSync(path.join(candidate, 'index.html'))) {
      outDir = candidate;
      break;
    }
  }

  if (outDir) {
    console.log('> [Express Static] Serving from:', outDir);
    app.use(express.static(outDir, { extensions: ['html'] }));
    app.use(function(req, res) {
      const indexPath = path.join(outDir, 'index.html');
      if (fs.existsSync(indexPath)) {
        return res.sendFile(indexPath);
      }
      res.status(404).sendFile(path.join(outDir, '404.html'));
    });
  } else {
    app.use(function(req, res) {
      res.status(200).send('<!DOCTYPE html><html><head><meta charset="utf-8"><title>Unu-Raymi</title></head><body><div id="root">Cargando Unu-Raymi...</div></body></html>');
    });
  }

  const serverInstance = app.listen(port, function() {
    console.log('> ==========================================');
    console.log('> Web App [' + appType.toUpperCase() + '] RUNNING on port:', port);
    console.log('> Out directory:', outDir);
    console.log('> ==========================================');
  });

  serverInstance.on('error', function(err) {
    console.error('> [Server Error] Failed to bind on port ' + port + ':', err.message);
  });

  module.exports = app;
}
