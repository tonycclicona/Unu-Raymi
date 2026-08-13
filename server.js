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

const appType = (process.env.APP_TYPE || 'backend').toLowerCase().trim();

console.log('> Launching app: [' + appType.toUpperCase() + '] from root server.js...');

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
  const p = process.env.PORT;
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

  const subappNext = path.join(dir, '.next');
  const rootNext = path.join(__dirname, '.next');
  const targetDir = fs.existsSync(subappNext) ? dir : (fs.existsSync(rootNext) ? __dirname : dir);

  console.log('> Starting Next.js [' + appType.toUpperCase() + '] using directory: ' + targetDir);

  const next = nextModule.default || nextModule;
  const app = next({ dev: dev, dir: targetDir });
  const handle = app.getRequestHandler();

  const serverPromise = app.prepare()
    .then(function() {
      const http = require('http');
      const url = require('url');

      const server = http.createServer(function(req, res) {
        try {
          const parsedUrl = url.parse(req.url, true);
          handle(req, res, parsedUrl);
        } catch (err) {
          console.error('Error handling request:', req.url, err);
          res.statusCode = 500;
          res.end('Internal server error');
        }
      });

      server.listen(port, function(err) {
        if (err) throw err;
        console.log('> Next.js [' + appType.toUpperCase() + '] running on port/socket:', port);
      });

      return server;
    })
    .catch(function(err) {
      console.error('> Next.js failed to start:', err);
      process.exit(1);
    });

  module.exports = serverPromise;
}
