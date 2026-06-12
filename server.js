// ==============================================================================
// server.js — Unified Entry Point for Hostinger Node.js deployments
// ==============================================================================
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';

import { readFileSync, existsSync } from 'fs';

const appType = process.env.APP_TYPE || 'backend';

console.log(`> Launching app: [${appType.toUpperCase()}] from root server.js...`);

if (appType === 'backend') {
  // Load environment variables manually from backend/.env if it exists
  const envPath = './backend/.env';
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
            if (val.startsWith('"') && val.endsWith('"')) {
              val = val.substring(1, val.length - 1);
            } else if (val.startsWith("'") && val.endsWith("'")) {
              val = val.substring(1, val.length - 1);
            }
            process.env[key] = val;
          }
        }
      });
      console.log('> Loaded environment variables from backend/.env');
    } catch (err) {
      console.error('Failed to load backend/.env file:', err);
    }
  }

  // Boot the Express Backend API
  await import('./backend/src/server.js');
} else {
  // Boot Next.js programmatically for Frontend or Admin
  const dir = appType === 'admin' ? './admin' : './frontend';
  const dev = process.env.NODE_ENV !== 'production';
  const port = process.env.PORT || 3000;

  const app = next({ dev, dir, port });
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
      console.log(`> Next.js [${appType.toUpperCase()}] running on port ${port}`);
    });
  });
}
