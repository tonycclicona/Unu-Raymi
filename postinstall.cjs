// postinstall.cjs — Runs after install in the root
// Automatically builds all subapps (backend, frontend, admin) and delivers them cleanly to Hostinger public_html.

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('\n[postinstall] ==========================================');
console.log('[postinstall] Starting Full Monorepo Build & Setup');
console.log('[postinstall] CWD:', process.cwd());
const appType = (process.argv[2] || process.env.APP_TYPE || 'all').toLowerCase();
console.log('[postinstall] APP_TYPE:', appType);
console.log('[postinstall] ==========================================\n');

function run(cmd, subdir) {
  const cwd = path.join(process.cwd(), subdir);
  if (!fs.existsSync(cwd)) {
    console.log(`[postinstall] Skipping ${subdir} (directory does not exist)`);
    return;
  }
  console.log(`[postinstall] Running: "${cmd}" in: ${cwd}`);
  try {
    execSync(cmd, { cwd, stdio: 'inherit', env: process.env });
    console.log(`[postinstall] ✅ Finished: "${cmd}" in: ${subdir}`);
  } catch (err) {
    console.error(`[postinstall] ❌ ERROR running "${cmd}" in ${subdir}:`, err.message);
  }
}

function copyStaticFiles(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) return;
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  const items = fs.readdirSync(srcDir);
  for (const item of items) {
    // Si ya existe uploads en destino, no sobreescribir las fotos del usuario
    if (item === 'uploads' && fs.existsSync(path.join(destDir, 'uploads'))) {
      continue;
    }
    const srcItem = path.join(srcDir, item);
    const destItem = path.join(destDir, item);
    try {
      fs.cpSync(srcItem, destItem, { recursive: true, force: true });
    } catch (e) {
      console.warn(`[postinstall] Warning copying ${item} to ${destItem}:`, e.message);
    }
  }
}

// ── 0. LIMPIEZA DE CARPETAS ERRÓNEAS ──────────────────────────────────────────
try {
  const wrongRootPub = '/home/u209525223/public_html';
  if (fs.existsSync(wrongRootPub) && !wrongRootPub.includes('domains')) {
    fs.rmSync(wrongRootPub, { recursive: true, force: true });
    console.log(`[postinstall] 🧹 Erroneous root directory cleaned up: ${wrongRootPub}`);
  }
} catch (e) {}

// ── 1. BUILD BACKEND ──────────────────────────────────────────────────────────
if (appType === 'all' || appType === 'backend') {
  console.log('[postinstall] === 1/3 BACKEND setup ===');
  try {
    const nodeModulesPath = path.join(process.cwd(), 'node_modules');
    execSync(`find "${nodeModulesPath}" -name "schema-engine*" -exec chmod +x {} + 2>/dev/null || true`, { stdio: 'ignore' });
    execSync(`find "${nodeModulesPath}" -name "query-engine*" -exec chmod +x {} + 2>/dev/null || true`, { stdio: 'ignore' });
  } catch (e) {}
  run('npm run build', 'backend');

  // ── Rutas canónicas ────────────────────────────────────────────────────────
  const hostingerBase = '/home/u209525223/domains/unu-raymi.com/public_html';
  const pubDir = fs.existsSync(hostingerBase) ? hostingerBase : path.resolve(process.cwd(), 'public_html');
  const apiDest = path.join(pubDir, 'api');

  // Proxy dinámico index.php para LiteSpeed hacia Node.js
  const proxySourcePath = path.resolve(process.cwd(), 'proxy-api.php');
  const apiIndexContent = fs.existsSync(proxySourcePath)
    ? fs.readFileSync(proxySourcePath, 'utf8')
    : `<?php header("Access-Control-Allow-Origin: *"); http_response_code(502); echo json_encode(["error" => "Proxy file missing"]); ?>`;

  const apiHtaccessContent = `<IfModule mod_rewrite.c>
RewriteEngine On
RewriteRule ^index\\.php$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.php [QSA,L]
</IfModule>
`;

  try {
    fs.mkdirSync(apiDest, { recursive: true });
    if (fs.existsSync(path.join(apiDest, 'default.php'))) {
      fs.unlinkSync(path.join(apiDest, 'default.php'));
    }
    fs.writeFileSync(path.join(apiDest, 'index.php'), apiIndexContent);
    fs.writeFileSync(path.join(apiDest, '.htaccess'), apiHtaccessContent);
    console.log(`[postinstall] ✅ Created API reverse proxy in: ${apiDest}`);
  } catch (err) {
    console.error(`[postinstall] Warning creating API proxy:`, err.message);
  }
}

// ── 2. BUILD FRONTEND ─────────────────────────────────────────────────────────
if (appType === 'all' || appType === 'frontend') {
  console.log('[postinstall] === 2/3 FRONTEND setup ===');
  run('npm run build', 'frontend');
  try {
    const srcOut = path.join(process.cwd(), 'frontend', 'out');
    const destOut = path.join(process.cwd(), 'out');
    if (fs.existsSync(srcOut)) {
      copyStaticFiles(srcOut, destOut);
    }

    const hostingerBase = '/home/u209525223/domains/unu-raymi.com/public_html';
    const pubDir = fs.existsSync(hostingerBase) ? hostingerBase : path.resolve(process.cwd(), 'public_html');

    const frontendHtaccess = `<IfModule mod_rewrite.c>
RewriteEngine On
RewriteBase /

# No interceptar las rutas de API ni Admin con el SPA del frontend
RewriteRule ^api(/.*)?$ - [L]
RewriteRule ^admin(/.*)?$ - [L]

RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
</IfModule>
`;

    if (fs.existsSync(srcOut) && pubDir !== srcOut) {
      fs.mkdirSync(pubDir, { recursive: true });
      copyStaticFiles(srcOut, pubDir);
      fs.writeFileSync(path.join(pubDir, '.htaccess'), frontendHtaccess);
      console.log(`[postinstall] ✅ Copied frontend static export and secured .htaccess in: ${pubDir}`);
    }
  } catch (e) {
    console.error('Warning: Failed to copy frontend build:', e.message);
  }
}

// ── 3. BUILD ADMIN ────────────────────────────────────────────────────────────
if (appType === 'all' || appType === 'admin') {
  console.log('[postinstall] === 3/3 ADMIN setup ===');
  run('npm run build', 'admin');
  try {
    const srcOut = path.join(process.cwd(), 'admin', 'out');
    const hostingerBase = '/home/u209525223/domains/unu-raymi.com/public_html';
    const pubDir = fs.existsSync(hostingerBase) ? hostingerBase : path.resolve(process.cwd(), 'public_html');
    const adminDest = path.join(pubDir, 'admin');

    const adminHtaccess = `<IfModule mod_rewrite.c>
RewriteEngine On
RewriteBase /

RewriteCond %{REQUEST_FILENAME} -d
RewriteCond %{REQUEST_FILENAME}/index.html -f
RewriteRule ^(.*)$ $1/index.html [L]

RewriteCond %{REQUEST_FILENAME}.html -f
RewriteRule ^(.*)$ $1.html [L]

RewriteCond %{REQUEST_FILENAME} -f
RewriteRule ^ - [L]

RewriteRule ^ index.html [L]
</IfModule>
`;

    if (fs.existsSync(srcOut)) {
      fs.mkdirSync(adminDest, { recursive: true });
      if (fs.existsSync(path.join(adminDest, 'default.php'))) {
        fs.unlinkSync(path.join(adminDest, 'default.php'));
      }
      copyStaticFiles(srcOut, adminDest);
      fs.writeFileSync(path.join(adminDest, '.htaccess'), adminHtaccess);
      console.log(`[postinstall] ✅ Copied admin static export and created .htaccess in: ${adminDest}`);
    }
  } catch (e) {
    console.error('Warning: Failed to copy admin build:', e.message);
  }
}

// ── 4. SINCRONIZACIÓN AUTOMÁTICA A RUNTIME DIRECTORIES ───────────────────────
console.log('\n[postinstall] === Syncing build artifacts to runtime directories ===');
try {
  const currentDirs = [
    '/home/u209525223/domains/unu-raymi.com/hbuilds/current/nodejs',
    path.resolve(process.cwd(), '../current/nodejs')
  ];

  currentDirs.forEach(target => {
    if (fs.existsSync(path.dirname(target))) {
      try {
        fs.mkdirSync(target, { recursive: true });
        const itemsToCopy = ['server.js', 'package.json', 'out', 'frontend', 'admin', 'backend', '.env', '.env.production', 'proxy-api.php'];
        itemsToCopy.forEach(item => {
          const itemSrc = path.join(process.cwd(), item);
          const itemDest = path.join(target, item);
          if (fs.existsSync(itemSrc)) {
            fs.cpSync(itemSrc, itemDest, { recursive: true });
          }
        });
        console.log(`[postinstall] ✅ Automatically synced app files to: ${target}`);
      } catch (err) {
        console.error(`Warning: Failed to sync to ${target}:`, err.message);
      }
    }
  });
} catch (e) {}

console.log('\n[postinstall] ✅ All subapps processed and delivered successfully.\n');
process.exit(0);
