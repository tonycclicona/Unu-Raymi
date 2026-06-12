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

// ── BACKEND ───────────────────────────────────────────────────────────────────
if (appType === 'backend') {

  // Load backend .env manually (CWD may differ from repo root on Hostinger)
  const envPath = path.resolve(__dirname, 'backend/.env');
  if (fs.existsSync(envPath)) {
    try {
      const envContent = fs.readFileSync(envPath, 'utf8');
      envContent.split('\n').forEach(function(line) {
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
      console.log('> Loaded environment variables from backend/.env');
    } catch (err) {
      console.error('Warning: Failed to load backend/.env:', err.message);
    }
  }

  // Use dynamic import() inside an async wrapper (avoids top-level await)
  (async function() {
    try {
      await import('./backend/src/server.js');
    } catch (err) {
      console.error('> FATAL: Failed to start backend:', err);
      process.exit(1);
    }
  })();

// ── FRONTEND / ADMIN (Next.js) ────────────────────────────────────────────────
} else {
  const dir = path.resolve(__dirname, appType === 'admin' ? 'admin' : 'frontend');
  const port = parseInt(process.env.PORT || '3000', 10);
  const dev = process.env.NODE_ENV === 'development';

  console.log('> Starting Next.js [' + appType.toUpperCase() + '] from: ' + dir);

  // Load Next.js from the subapp's own node_modules
  let nextModule;
  try {
    const subappRequire = createRequire(path.join(dir, 'package.json'));
    nextModule = subappRequire('next');
  } catch (e) {
    console.error('> ERROR: Could not load next from ' + dir + '/node_modules');
    console.error('> Ensure npm install ran in the subapp directory.');
    console.error(e.message);
    process.exit(1);
  }

  const next = nextModule.default || nextModule;
  const app = next({ dev: dev, dir: dir });
  const handle = app.getRequestHandler();

  app.prepare()
    .then(function() {
      const http = require('http');
      const url = require('url');

      http.createServer(function(req, res) {
        try {
          const parsedUrl = url.parse(req.url, true);
          handle(req, res, parsedUrl);
        } catch (err) {
          console.error('Error handling request:', req.url, err);
          res.statusCode = 500;
          res.end('Internal server error');
        }
      }).listen(port, function(err) {
        if (err) throw err;
        console.log('> Next.js [' + appType.toUpperCase() + '] running on port ' + port);
      });
    })
    .catch(function(err) {
      console.error('> Next.js failed to start:', err);
      process.exit(1);
    });
}
