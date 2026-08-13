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

function getAppTypeFromRequest(req) {
  if (process.env.APP_TYPE) return process.env.APP_TYPE.toLowerCase().trim();
  const host = (req.headers && req.headers.host) ? req.headers.host.toLowerCase() : '';
  if (host.includes('admin')) return 'admin';
  if (host.includes('api')) return 'backend';
  return 'frontend';
}

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

  console.log('> Starting Next.js [' + appType.toUpperCase() + '] from: ' + dir);

  let nextModule;
  try {
    const subappRequire = createRequire(path.join(dir, 'package.json'));
    nextModule = subappRequire('next');
  } catch (e) {
    try {
      nextModule = require('next');
    } catch (errRoot) {
      console.error('> ERROR: Could not load next from ' + dir + ' or root node_modules');
      console.error(e.message);
      process.exit(1);
    }
  }

  let chosenDir = dir;
  if (!fs.existsSync(path.join(chosenDir, 'package.json')) && fs.existsSync(path.join(__dirname, 'package.json'))) {
    chosenDir = __dirname;
  }

  const subappNext = path.join(chosenDir, '.next');
  const rootNext = path.join(__dirname, '.next');
  const targetDir = fs.existsSync(subappNext) ? chosenDir : (fs.existsSync(rootNext) ? __dirname : chosenDir);

  console.log('> Starting Next.js [' + appType.toUpperCase() + '] using directory: ' + targetDir);

  const next = nextModule.default || nextModule;
  const app = next({
    dev: dev,
    dir: targetDir
  });
  const handle = app.getRequestHandler();

  const http = require('http');
  const url = require('url');

  let isPrepared = false;
  const preparePromise = app.prepare()
    .then(function() {
      isPrepared = true;
      console.log('> Next.js [' + appType.toUpperCase() + '] app.prepare() completed successfully.');
    })
    .catch(function(err) {
      console.error('> Next.js failed to prepare:', err);
    });

  const server = http.createServer(function(req, res) {
    const parsedUrl = url.parse(req.url, true);
    let pathname = parsedUrl.pathname || '/';

    // 1. Servir archivos estáticos directamente desde .next/static o frontend/public con consumo mínimo de RAM
    if (pathname.startsWith('/_next/static/')) {
      const subpath = pathname.replace('/_next/static/', '');
      const candidates = [
        path.join(targetDir, '.next/static', subpath),
        path.join(__dirname, '.next/static', subpath),
        path.join(__dirname, 'frontend/.next/static', subpath),
        path.join(__dirname, 'admin/.next/static', subpath)
      ];
      for (const candidate of candidates) {
        if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
          const ext = path.extname(candidate).toLowerCase();
          const mimeTypes = {
            '.js': 'application/javascript; charset=utf-8',
            '.css': 'text/css; charset=utf-8',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.svg': 'image/svg+xml',
            '.woff2': 'font/woff2',
            '.webp': 'image/webp'
          };
          res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          fs.createReadStream(candidate).pipe(res);
          return;
        }
      }
    }

    // 2. Servir páginas pre-renderizadas HTML directamente desde .next/server/app o dist
    const htmlCandidates = [
      pathname === '/' ? path.join(targetDir, '.next/server/app/index.html') : path.join(targetDir, '.next/server/app', pathname.replace(/^\//, '') + '.html'),
      pathname === '/' ? path.join(__dirname, '.next/server/app/index.html') : path.join(__dirname, '.next/server/app', pathname.replace(/^\//, '') + '.html'),
      pathname === '/' ? path.join(__dirname, 'frontend/.next/server/app/index.html') : path.join(__dirname, 'frontend/.next/server/app', pathname.replace(/^\//, '') + '.html'),
      pathname === '/' ? path.join(__dirname, 'admin/.next/server/app/index.html') : path.join(__dirname, 'admin/.next/server/app', pathname.replace(/^\//, '') + '.html')
    ];

    for (const htmlCandidate of htmlCandidates) {
      if (fs.existsSync(htmlCandidate) && fs.statSync(htmlCandidate).isFile()) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        fs.createReadStream(htmlCandidate).pipe(res);
        return;
      }
    }

    // 3. Fallback dinámico a Next.js Handler si está preparado
    if (isPrepared) {
      try {
        handle(req, res, parsedUrl);
      } catch (err) {
        console.error('Error handling request:', req.url, err);
        res.statusCode = 500;
        res.end('Internal server error');
      }
      return;
    }

    // Si aún se está preparando, intentar esperar o servir index.html de respaldo
    preparePromise.then(function() {
      try {
        handle(req, res, parsedUrl);
      } catch (err) {
        console.error('Error handling request:', req.url, err);
        res.statusCode = 500;
        res.end('Internal server error');
      }
    }).catch(function(err) {
      console.error('Error in prepare before handling request:', err);
      res.statusCode = 500;
      res.end('Next.js initialization error');
    });
  });

  server.listen(port, function(err) {
    if (err) {
      console.error('Server listen error:', err);
      return;
    }
    console.log('> Next.js [' + appType.toUpperCase() + '] listening on port/socket:', port);
  });

  module.exports = server;
}
