// ==============================================================================
// server.js — Unified Entry Point for Hostinger Node.js deployments
// ==============================================================================
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';

const appType = process.env.APP_TYPE || 'backend';

console.log(`> Launching app: [${appType.toUpperCase()}] from root server.js...`);

if (appType === 'backend') {
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
