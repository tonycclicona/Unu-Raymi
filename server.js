// ==============================================================================
// server.js — Unified Entry Point for Hostinger Node.js deployments
// Reads APP_TYPE env var to decide which app to start:
//   APP_TYPE=backend  → Express API (backend/src/server.js)
//   APP_TYPE=frontend → Next.js Landing Page (frontend/)
//   APP_TYPE=admin    → Next.js Admin Panel (admin/)
// ==============================================================================

import { readFileSync, existsSync } from 'fs';
import { createRequire } from 'module';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { parse } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const appType = (process.env.APP_TYPE || 'backend').toLowerCase().trim();

console.log(`> Launching app: [${appType.toUpperCase()}] from root server.js...`);

// ── BACKEND ─────────────────────────────────────────────────────────────────
if (appType === 'backend') {
  // Load environment variables from backend/.env if present (CWD may differ from repo root)
  const envPath = resolve(__dirname, 'backend/.env');
  if (existsSync(envPath)) {
    try {
      const envContent = readFileSync(envPath, 'utf8');
      envContent.split('\n').forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const firstEqual = trimmed.indexOf('=');
          if (firstEqual !== -1) {
            const key = trimmed.substring(0, firstEqual).trim();
            let val = trimmed.substring(firstEqual + 1).trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
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
      console.error('Warning: Failed to load backend/.env file:', err.message);
    }
  }

  // Boot the Express Backend API
  await import('./backend/src/server.js');

// ── FRONTEND / ADMIN (Next.js) ───────────────────────────────────────────────
} else {
  const dir = resolve(__dirname, appType === 'admin' ? 'admin' : 'frontend');
  const dev = process.env.NODE_ENV !== 'production';
  const port = parseInt(process.env.PORT || '3000', 10);

  // Load Next.js from the subapp's own node_modules to avoid resolution issues
  const subappRequire = createRequire(resolve(dir, 'package.json'));
  let nextModule;
  try {
    nextModule = subappRequire('next');
  } catch (e) {
    console.error(`> ERROR: Could not load 'next' from ${dir}/node_modules/next`);
    console.error('> Make sure dependencies are installed in the subapp directory.');
    process.exit(1);
  }

  const next = nextModule.default || nextModule;

  console.log(`> Starting Next.js [${appType.toUpperCase()}] from: ${dir}`);
  console.log(`> Production mode: ${!dev}`);

  const app = next({ dev, dir });
  const handle = app.getRequestHandler();

  app.prepare().then(() => {
    createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error('Error occurred handling Next.js request:', req.url, err);
        res.statusCode = 500;
        res.end('Internal server error');
      }
    }).listen(port, (err) => {
      if (err) throw err;
      console.log(`> Next.js [${appType.toUpperCase()}] running on http://localhost:${port}`);
    });
  }).catch((err) => {
    console.error(`> Next.js [${appType.toUpperCase()}] failed to start:`, err);
    process.exit(1);
  });
}
