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

if (!appType || appType === 'backend') {
  const cwd = (process.cwd() || process.env.PWD || __dirname).toLowerCase();
  if (cwd.includes('admin')) {
    appType = 'admin';
  } else if (cwd.includes('api') || cwd.includes('backend')) {
    appType = 'backend';
  } else if (cwd.includes('unu-raymi.com') || cwd.includes('frontend')) {
    appType = 'frontend';
  } else {
    appType = process.env.APP_TYPE ? process.env.APP_TYPE.toLowerCase().trim() : 'backend';
  }
}

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
  const app = next({
    dev: dev,
    dir: targetDir,
    conf: {
      distDir: fs.existsSync(path.join(targetDir, '.next')) ? '.next' : undefined
    }
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
    if (!isPrepared) {
      preparePromise.then(function() {
        try {
          const parsedUrl = url.parse(req.url, true);
          handle(req, res, parsedUrl);
        } catch (err) {
          console.error('Error handling request:', req.url, err);
          res.statusCode = 500;
          res.end('Internal server error');
        }
      }).catch(function(err) {
        console.error('Error in prepare before handling request:', err);
        res.statusCode = 500;
        res.end('Next.js initialization error: ' + (err ? err.message : 'Unknown error'));
      });
      return;
    }

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
    if (err) {
      console.error('Server listen error:', err.message);
      return;
    }
    console.log('> Next.js [' + appType.toUpperCase() + '] listening on port/socket:', port);
  });

  module.exports = server;
}
