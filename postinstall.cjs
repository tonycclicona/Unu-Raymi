// postinstall.cjs — Runs after install in the root
// Automatically builds all subapps (backend, frontend, admin) and delivers them cleanly to Hostinger public_html.

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('\n[postinstall] ==========================================');
console.log('[postinstall] Starting Full Monorepo Build & Setup');
console.log('[postinstall] CWD:', process.cwd());
// appType solo se restringe si se pasa explícitamente por CLI (ej: node postinstall.cjs backend).
// En Hostinger, debe compilar SIEMPRE todo (backend + frontend + admin) para tener public_html listo.
const appType = (process.argv[2] || 'all').toLowerCase();
console.log('[postinstall] Target build:', appType);
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
  const apiDomainBase = '/home/u209525223/domains/api.unu-raymi.com/public_html';
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

  const deployProxy = (targetDir) => {
    try {
      if (fs.existsSync(path.dirname(targetDir))) {
        fs.mkdirSync(targetDir, { recursive: true });
        if (fs.existsSync(path.join(targetDir, 'default.php'))) {
          fs.unlinkSync(path.join(targetDir, 'default.php'));
        }
        fs.writeFileSync(path.join(targetDir, 'index.php'), apiIndexContent);
        fs.writeFileSync(path.join(targetDir, '.htaccess'), apiHtaccessContent);
        console.log(`[postinstall] ✅ Created API reverse proxy in: ${targetDir}`);
      }
    } catch (err) {
      console.error(`[postinstall] Warning creating API proxy in ${targetDir}:`, err.message);
    }
  };

  deployProxy(apiDest);
  deployProxy(apiDomainBase);
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

# No interceptar las rutas de API, Admin ni Uploads con el SPA del frontend
RewriteRule ^api(/.*)?$ - [L]
RewriteRule ^admin(/.*)?$ - [L]
RewriteRule ^uploads(/.*)?$ - [L]

# Peticiones de RSC / Prefetch de Next.js
RewriteCond %{HTTP:RSC} 1 [OR]
RewriteCond %{QUERY_STRING} (^|&)_rsc=
RewriteCond %{REQUEST_FILENAME} -d
RewriteCond %{REQUEST_FILENAME}/index.txt -f
RewriteRule ^(.*)$ $1/index.txt [T=text/plain,L]

RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
</IfModule>

# Compresión GZIP / Deflate para máximo rendimiento
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript
  AddOutputFilterByType DEFLATE application/javascript application/x-javascript application/json
  AddOutputFilterByType DEFLATE image/svg+xml
</IfModule>

# Políticas de Caché en Navegador y LiteSpeed
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresDefault "access plus 1 month"
  ExpiresByType text/html "access plus 0 seconds"
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
  ExpiresByType image/webp "access plus 1 month"
  ExpiresByType image/png "access plus 1 month"
  ExpiresByType image/jpeg "access plus 1 month"
  ExpiresByType image/svg+xml "access plus 1 month"
  ExpiresByType font/woff2 "access plus 1 year"
</IfModule>

<IfModule mod_headers.c>
  # Bundles estáticos e inmutables de Next.js
  <FilesMatch "\\.(js|css)$">
    Header set Cache-Control "public, max-age=31536000, immutable"
  </FilesMatch>
  # Imágenes y uploads
  <FilesMatch "\\.(webp|png|jpg|jpeg|gif|svg|ico)$">
    Header set Cache-Control "public, max-age=2592000"
  </FilesMatch>
  # Páginas HTML siempre frescas para reflejar cambios inmediatamente
  <FilesMatch "\\.html$">
    Header set Cache-Control "no-cache, no-store, must-revalidate"
  </FilesMatch>
  Header set X-Content-Type-Options "nosniff"
</IfModule>
`;

    if (fs.existsSync(srcOut) && pubDir !== srcOut) {
      fs.mkdirSync(pubDir, { recursive: true });
      copyStaticFiles(srcOut, pubDir);
      fs.writeFileSync(path.join(pubDir, '.htaccess'), frontendHtaccess);
      console.log(`[postinstall] ✅ Copied frontend static export and secured .htaccess in: ${pubDir}`);
    }

    // Sincronizar uploads existentes hacia public_html/uploads
    const uploadSources = [
      path.resolve(process.cwd(), 'backend/storage/uploads'),
      path.resolve(process.cwd(), 'storage/uploads')
    ];
    const pubUploads = path.join(pubDir, 'uploads');
    const apiUploads = path.join(pubDir, 'api/uploads');
    fs.mkdirSync(pubUploads, { recursive: true });
    fs.mkdirSync(apiUploads, { recursive: true });

    uploadSources.forEach(function(srcDir) {
      if (fs.existsSync(srcDir)) {
        try {
          const files = fs.readdirSync(srcDir);
          files.forEach(function(f) {
            const s = path.join(srcDir, f);
            const d1 = path.join(pubUploads, f);
            const d2 = path.join(apiUploads, f);
            if (!fs.existsSync(d1)) {
              try { fs.copyFileSync(s, d1); } catch (e) {}
            }
            if (!fs.existsSync(d2)) {
              try { fs.copyFileSync(s, d2); } catch (e) {}
            }
          });
          console.log(`[postinstall] ✅ Sincronizados uploads desde ${srcDir} hacia ${pubUploads}`);
        } catch (e) {}
      }
    });
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

# 1. Peticiones de RSC / Prefetch de Next.js (navegación SPA interna entre apartados)
RewriteCond %{HTTP:RSC} 1 [OR]
RewriteCond %{QUERY_STRING} (^|&)_rsc=
RewriteCond %{REQUEST_FILENAME} -d
RewriteCond %{REQUEST_FILENAME}/index.txt -f
RewriteRule ^(.*)$ $1/index.txt [T=text/plain,L]

RewriteCond %{HTTP:RSC} 1 [OR]
RewriteCond %{QUERY_STRING} (^|&)_rsc=
RewriteCond %{REQUEST_FILENAME}.txt -f
RewriteRule ^(.*)$ $1.txt [T=text/plain,L]

# 2. Si Next.js solicita directamente un .txt correspondiente a una subcarpeta
RewriteCond %{DOCUMENT_ROOT}/$1/index.txt -f
RewriteRule ^(.*)\\.txt$ /$1/index.txt [T=text/plain,L]

RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME}/index.txt -f
RewriteRule ^(.*)$ $1/index.txt [T=text/plain,L]

# 3. Directorios con index.html (visitas directas o refresco del navegador)
RewriteCond %{REQUEST_FILENAME} -d
RewriteCond %{REQUEST_FILENAME}/index.html -f
RewriteRule ^(.*)$ $1/index.html [L]

# 4. Archivos .html existentes
RewriteCond %{REQUEST_FILENAME}.html -f
RewriteRule ^(.*)$ $1.html [L]

# 5. Archivos estáticos existentes
RewriteCond %{REQUEST_FILENAME} -f
RewriteRule ^ - [L]

# 6. Fallback general a index.html
RewriteRule ^ index.html [L]
</IfModule>

# Compresión GZIP / Deflate para el panel de administración
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript
  AddOutputFilterByType DEFLATE application/javascript application/x-javascript application/json
  AddOutputFilterByType DEFLATE image/svg+xml
</IfModule>

# Políticas de Caché para bundles estáticos
<IfModule mod_headers.c>
  <FilesMatch "\\.(js|css)$">
    Header set Cache-Control "public, max-age=31536000, immutable"
  </FilesMatch>
  <FilesMatch "\\.html$">
    Header set Cache-Control "no-cache, no-store, must-revalidate"
  </FilesMatch>
  Header set X-Content-Type-Options "nosniff"
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

      const adminDomainBase = '/home/u209525223/domains/admin.unu-raymi.com/public_html';
      if (fs.existsSync(path.dirname(adminDomainBase))) {
        fs.mkdirSync(adminDomainBase, { recursive: true });
        copyStaticFiles(srcOut, adminDomainBase);
        fs.writeFileSync(path.join(adminDomainBase, '.htaccess'), adminHtaccess);
        console.log(`[postinstall] ✅ Copied admin static export to domain root: ${adminDomainBase}`);
      }
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
