// ==============================================================================
// postinstall.cjs — Build & Deployment Centralizado para Hostinger Web Business
// ==============================================================================
// Compila backend, frontend y admin y los ubica en una ÚNICA estructura canónica:
//   /home/u209525223/domains/unu-raymi.com/public_html/
//     ├── (Frontend estático Next.js)
//     ├── admin/   (Panel de Administración estático Next.js)
//     ├── api/     (Proxy inverso PHP para LiteSpeed hacia Node.js)
//     └── uploads/ (Almacenamiento centralizado y único de media)
// ==============================================================================

'use strict';

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('\n==========================================================');
console.log('🚀 [postinstall] Unu-Raymi Monorepo Build & Setup');
console.log('📍 [postinstall] CWD:', process.cwd());
const targetScope = (process.argv[2] || 'all').toLowerCase();
console.log('🎯 [postinstall] Alcance de compilación:', targetScope);
console.log('==========================================================\n');

function run(cmd, subdir) {
  const cwd = path.join(process.cwd(), subdir);
  if (!fs.existsSync(cwd)) {
    console.log(`[postinstall] Omitiendo ${subdir} (directorio no encontrado)`);
    return;
  }
  console.log(`[postinstall] Ejecutando: "${cmd}" en: ${subdir}`);
  try {
    execSync(cmd, { cwd, stdio: 'inherit', env: process.env });
    console.log(`[postinstall] ✅ Finalizado con éxito: "${cmd}" en ${subdir}\n`);
  } catch (err) {
    console.error(`[postinstall] ❌ Error en "${cmd}" en ${subdir}:`, err.message);
  }
}

function copyDirectoryContents(srcDir, destDir, options = {}) {
  if (!fs.existsSync(srcDir)) return;
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  const items = fs.readdirSync(srcDir);
  for (const item of items) {
    // Si la carpeta de destino ya tiene uploads, no sobreescribir los archivos del usuario
    if (item === 'uploads' && options.preserveUploads && fs.existsSync(path.join(destDir, 'uploads'))) {
      continue;
    }
    const srcItem = path.join(srcDir, item);
    const destItem = path.join(destDir, item);
    try {
      fs.cpSync(srcItem, destItem, { recursive: true, force: true });
    } catch (e) {
      console.warn(`[postinstall] Aviso copiando ${item}:`, e.message);
    }
  }
}

// ── Determinación de la ruta raíz canónica de Hostinger ───────────────────────
const hostingerDomainPub = '/home/u209525223/domains/unu-raymi.com/public_html';
const isHostingerLinux = process.platform !== 'win32' && fs.existsSync('/home/u209525223');
const targetPublicHtml = (isHostingerLinux && fs.existsSync(path.dirname(hostingerDomainPub)))
  ? hostingerDomainPub
  : path.resolve(process.cwd(), 'public_html');

console.log(`[postinstall] 📂 Carpeta raíz canónica de despliegue: ${targetPublicHtml}\n`);
fs.mkdirSync(targetPublicHtml, { recursive: true });

// ── 1. COMPILACIÓN DE BACKEND (Prisma Client) ─────────────────────────────────
if (targetScope === 'all' || targetScope === 'backend') {
  console.log('── [1/3] Preparando Backend API ──');
  run('npm run build', 'backend');
}

// ── 2. COMPILACIÓN Y DESPLIEGUE DEL FRONTEND ──────────────────────────────────
if (targetScope === 'all' || targetScope === 'frontend') {
  console.log('── [2/3] Compilando Frontend (Static Export) ──');
  run('npm run build', 'frontend');

  const frontendOut = path.join(process.cwd(), 'frontend', 'out');
  if (fs.existsSync(frontendOut)) {
    console.log(`[postinstall] 📦 Desplegando Frontend en: ${targetPublicHtml}`);
    copyDirectoryContents(frontendOut, targetPublicHtml, { preserveUploads: true });

    // .htaccess maestro para frontend, caché, compresión y exclusión de api/admin/uploads
    const frontendHtaccess = `<IfModule mod_rewrite.c>
RewriteEngine On
RewriteBase /

# No interceptar las rutas de API, Admin ni Uploads
RewriteRule ^api(/.*)?$ - [L]
RewriteRule ^admin(/.*)?$ - [L]
RewriteRule ^uploads(/.*)?$ - [L]

# Peticiones de RSC / Prefetch de Next.js
RewriteCond %{HTTP:RSC} 1 [OR]
RewriteCond %{QUERY_STRING} (^|&)_rsc=
RewriteCond %{REQUEST_FILENAME} -d
RewriteCond %{REQUEST_FILENAME}/index.txt -f
RewriteRule ^(.*)$ $1/index.txt [T=text/plain,L]

# Servir versión en español si el navegador lo solicita
RewriteCond %{REQUEST_URI} ^/?$
RewriteCond %{HTTP:Accept-Language} ^es [NC]
RewriteCond %{DOCUMENT_ROOT}/es/index.html -f
RewriteRule ^$ es/index.html [L]

# Servir versión en inglés si está disponible
RewriteCond %{REQUEST_URI} ^/?$
RewriteCond %{DOCUMENT_ROOT}/en/index.html -f
RewriteRule ^$ en/index.html [L]

# Fallback general SPA a index.html
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
  # Páginas HTML siempre frescas
  <FilesMatch "\\.html$">
    Header set Cache-Control "no-cache, no-store, must-revalidate"
  </FilesMatch>
  Header set X-Content-Type-Options "nosniff"
</IfModule>
`;
    fs.writeFileSync(path.join(targetPublicHtml, '.htaccess'), frontendHtaccess);
    console.log('[postinstall] ✅ Frontend y .htaccess maestro desplegados.');
  }
}

// ── 3. COMPILACIÓN Y DESPLIEGUE DEL ADMIN ─────────────────────────────────────
if (targetScope === 'all' || targetScope === 'admin') {
  console.log('── [3/3] Compilando Admin (Static Export) ──');
  run('npm run build', 'admin');

  const adminOut = path.join(process.cwd(), 'admin', 'out');
  const adminDest = path.join(targetPublicHtml, 'admin');

  if (fs.existsSync(adminOut)) {
    console.log(`[postinstall] 📦 Desplegando Admin en: ${adminDest}`);
    fs.mkdirSync(adminDest, { recursive: true });
    if (fs.existsSync(path.join(adminDest, 'default.php'))) {
      try { fs.unlinkSync(path.join(adminDest, 'default.php')); } catch (e) {}
    }
    copyDirectoryContents(adminOut, adminDest);

    const adminHtaccess = `<IfModule mod_rewrite.c>
RewriteEngine On
RewriteBase /

# 1. Peticiones de RSC / Prefetch de Next.js
RewriteCond %{HTTP:RSC} 1 [OR]
RewriteCond %{QUERY_STRING} (^|&)_rsc=
RewriteCond %{REQUEST_FILENAME} -d
RewriteCond %{REQUEST_FILENAME}/index.txt -f
RewriteRule ^(.*)$ $1/index.txt [T=text/plain,L]

RewriteCond %{HTTP:RSC} 1 [OR]
RewriteCond %{QUERY_STRING} (^|&)_rsc=
RewriteCond %{REQUEST_FILENAME}.txt -f
RewriteRule ^(.*)$ $1.txt [T=text/plain,L]

# 2. Archivos estáticos existentes
RewriteCond %{REQUEST_FILENAME} -f
RewriteRule ^ - [L]

# 3. Directorios con index.html
RewriteCond %{REQUEST_FILENAME} -d
RewriteCond %{REQUEST_FILENAME}/index.html -f
RewriteRule ^(.*)$ $1/index.html [L]

# 4. Archivos .html existentes
RewriteCond %{REQUEST_FILENAME}.html -f
RewriteRule ^(.*)$ $1.html [L]

# 5. Fallback general a index.html del Admin
RewriteRule ^ index.html [L]
</IfModule>

<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript
  AddOutputFilterByType DEFLATE application/javascript application/x-javascript application/json
  AddOutputFilterByType DEFLATE image/svg+xml
</IfModule>

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
    fs.writeFileSync(path.join(adminDest, '.htaccess'), adminHtaccess);
    console.log('[postinstall] ✅ Admin y .htaccess desplegados en public_html/admin.');
  }
}

// ── 4. DESPLIEGUE DEL PROXY INVERSO API (public_html/api) ─────────────────────
console.log('\n── Desplegando Proxy Inverso API en public_html/api ──');
const apiDest = path.join(targetPublicHtml, 'api');
fs.mkdirSync(apiDest, { recursive: true });

const apiPhpSource = path.resolve(process.cwd(), 'api/index.php');
const apiHtaccessSource = path.resolve(process.cwd(), 'api/.htaccess');

if (fs.existsSync(apiPhpSource)) {
  fs.copyFileSync(apiPhpSource, path.join(apiDest, 'index.php'));
}
if (fs.existsSync(apiHtaccessSource)) {
  fs.copyFileSync(apiHtaccessSource, path.join(apiDest, '.htaccess'));
}
if (fs.existsSync(path.join(apiDest, 'default.php'))) {
  try { fs.unlinkSync(path.join(apiDest, 'default.php')); } catch (e) {}
}
console.log(`[postinstall] ✅ Proxy API sincronizado en: ${apiDest}`);

// ── 5. PERSISTENCIA CENTRALIZADA DE MEDIA (public_html/uploads) ────────────────
console.log('\n── Verificando carpeta centralizada de media en public_html/uploads ──');
const centralizedUploads = path.join(targetPublicHtml, 'uploads');
fs.mkdirSync(centralizedUploads, { recursive: true });

// Sincronizar assets estáticos iniciales si existen en frontend/public/uploads
const initialAssetsDir = path.resolve(process.cwd(), 'frontend/public/uploads');
if (fs.existsSync(initialAssetsDir)) {
  try {
    const assets = fs.readdirSync(initialAssetsDir);
    assets.forEach(file => {
      const srcFile = path.join(initialAssetsDir, file);
      const destFile = path.join(centralizedUploads, file);
      if (!fs.existsSync(destFile)) {
        fs.copyFileSync(srcFile, destFile);
      }
    });
    console.log(`[postinstall] ✅ Assets multimedia verificados en: ${centralizedUploads}`);
  } catch (e) {
    console.warn('[postinstall] Aviso sincronizando assets iniciales:', e.message);
  }
}

// ── 6. DISPARAR REINICIO AUTOMÁTICO DE NODE.JS EN HOSTINGER ───────────────────
console.log('\n── Señalizando reinicio de Node.js a Hostinger / Passenger ──');
const restartPaths = [
  path.resolve(process.cwd(), 'tmp/restart.txt'),
  '/home/u209525223/domains/unu-raymi.com/tmp/restart.txt'
];

restartPaths.forEach(rf => {
  try {
    if (fs.existsSync(path.dirname(rf))) {
      fs.writeFileSync(rf, String(Date.now()));
      console.log(`[postinstall] 🔄 Reinicio disparado vía: ${rf}`);
    }
  } catch (e) {}
});

console.log('\n==========================================================');
console.log('🎉 [postinstall] Todos los componentes procesados exitosamente.');
console.log('📍 Destino unificado: ' + targetPublicHtml);
console.log('==========================================================\n');
process.exit(0);
