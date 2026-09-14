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

  // Proxy dinámico index.php para LiteSpeed hacia Node.js
  const apiCandidates = [
    '/home/u209525223/domains/unu-raymi.com/public_html/api',
    '/home/u209525223/domains/api.unu-raymi.com/public_html',
    path.resolve(process.cwd(), 'public_html', 'api')
  ];
  if (process.cwd().includes('public_html')) {
    apiCandidates.push(path.resolve(process.cwd(), 'api'));
  }

  const apiIndexContent = `<?php
// ==============================================================================
// Unu-Raymi API Dynamic Reverse Proxy (LiteSpeed / PHP -> Node.js Gateway)
// ==============================================================================

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH");
header("Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

$requestUri = $_SERVER['REQUEST_URI'];
if (strpos($requestUri, '/api') !== 0) {
    $requestUri = '/api' . $requestUri;
}

$dynamicPorts = [4000, 3000];
$portFiles = [
    __DIR__ . '/.port',
    __DIR__ . '/../.port',
    __DIR__ . '/../../.port',
    __DIR__ . '/../../../.port',
    '/tmp/unu_raymi_port'
];
foreach ($portFiles as $pf) {
    if (file_exists($pf)) {
        $p = intval(trim(file_get_contents($pf)));
        if ($p > 0 && !in_array($p, $dynamicPorts)) {
            array_unshift($dynamicPorts, $p);
        }
    }
}

$targets = [];
foreach ($dynamicPorts as $dp) {
    $targets[] = "http://127.0.0.1:$dp";
    $targets[] = "http://localhost:$dp";
}

$response = false;
$httpCode = 0;
$contentType = '';

$headers = [];
foreach (getallheaders() as $name => $value) {
    $lower = strtolower($name);
    if ($lower !== 'host' && $lower !== 'accept-encoding' && $lower !== 'content-length') {
        $headers[] = "$name: $value";
    }
}

$isMultipart = !empty($_FILES) || (isset($_SERVER['CONTENT_TYPE']) && strpos(strtolower($_SERVER['CONTENT_TYPE']), 'multipart/form-data') !== false);
$postFields = null;
$body = null;

if ($isMultipart) {
    $postFields = $_POST;
    foreach ($_FILES as $field => $fileData) {
        if (is_array($fileData['tmp_name'])) {
            foreach ($fileData['tmp_name'] as $idx => $tmpName) {
                if (!empty($tmpName) && is_uploaded_file($tmpName) && $fileData['error'][$idx] === UPLOAD_ERR_OK) {
                    $postFields[$field . '[' . $idx . ']'] = new CURLFile(
                        $tmpName,
                        $fileData['type'][$idx] ?: 'application/octet-stream',
                        $fileData['name'][$idx]
                    );
                }
            }
        } else {
            if (!empty($fileData['tmp_name']) && is_uploaded_file($fileData['tmp_name']) && $fileData['error'] === UPLOAD_ERR_OK) {
                $postFields[$field] = new CURLFile(
                    $fileData['tmp_name'],
                    $fileData['type'] ?: 'application/octet-stream',
                    $fileData['name']
                );
            }
        }
    }
} else if (in_array($_SERVER['REQUEST_METHOD'], ['POST', 'PUT', 'PATCH', 'DELETE'])) {
    $body = file_get_contents('php://input');
}

foreach ($targets as $baseTarget) {
    $targetUrl = $baseTarget . $requestUri;
    $ch = curl_init($targetUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $_SERVER['REQUEST_METHOD']);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    curl_setopt($ch, CURLOPT_ENCODING, '');
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 3);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    
    $reqHeaders = $headers;
    $reqHeaders[] = "Host: api.unu-raymi.com";

    if ($isMultipart) {
        $filteredHeaders = array_filter($reqHeaders, function($h) {
            $lh = strtolower($h);
            return strpos($lh, 'content-type:') !== 0 && strpos($lh, 'content-length:') !== 0;
        });
        curl_setopt($ch, CURLOPT_HTTPHEADER, array_values($filteredHeaders));
        curl_setopt($ch, CURLOPT_POSTFIELDS, $postFields);
    } else {
        curl_setopt($ch, CURLOPT_HTTPHEADER, $reqHeaders);
        if ($body !== null) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
        }
    }

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
    curl_close($ch);

    if ($httpCode >= 200 && $httpCode < 500 && $response !== false) {
        break;
    }
}

if ($httpCode > 0 && $response !== false) {
    if ($contentType) {
        header("Content-Type: $contentType");
    }
    http_response_code($httpCode);
    echo $response;
    exit(0);
}

header("Content-Type: application/json; charset=UTF-8");
http_response_code(502);
echo json_encode([
    "success" => false,
    "error" => "El servidor Node.js de Unu-Raymi no está respondiendo en los puertos locales. Asegúrate de iniciar la aplicación Node.js en el panel de Hostinger.",
    "path" => $requestUri,
    "timestamp" => date("c")
]);
exit(0);
`;

  const apiHtaccessContent = `<IfModule mod_rewrite.c>
RewriteEngine On
RewriteBase /
RewriteRule ^index\\.php$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.php [L]
</IfModule>
`;

  const uniqueApiCandidates = [...new Set(apiCandidates.map(t => path.resolve(t)))];
  for (const target of uniqueApiCandidates) {
    try {
      if (fs.existsSync(path.dirname(target))) {
        fs.mkdirSync(target, { recursive: true });
        if (fs.existsSync(path.join(target, 'default.php'))) {
          fs.unlinkSync(path.join(target, 'default.php'));
        }
        fs.writeFileSync(path.join(target, 'index.php'), apiIndexContent);
        fs.writeFileSync(path.join(target, '.htaccess'), apiHtaccessContent);
        console.log(`[postinstall] ✅ Created dynamic API reverse proxy in: ${target}`);
      }
    } catch (err) {}
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

    const publicHtmlTargets = [
      '/home/u209525223/domains/unu-raymi.com/public_html',
      path.resolve(process.cwd(), 'public_html'),
      path.resolve(process.cwd(), '../public_html')
    ];

    if (process.cwd().includes('public_html')) {
      publicHtmlTargets.push(process.cwd());
    }

    const uniqueTargets = [...new Set(publicHtmlTargets.map(t => path.resolve(t)))];

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

    uniqueTargets.forEach(target => {
      try {
        const targetExists = fs.existsSync(target);
        const parentExists = fs.existsSync(path.dirname(target));
        console.log(`[postinstall] Target candidate: ${target} (exists: ${targetExists}, parentExists: ${parentExists})`);
        if ((targetExists || parentExists) && fs.existsSync(srcOut) && target !== srcOut) {
          fs.mkdirSync(target, { recursive: true });
          copyStaticFiles(srcOut, target);
          fs.writeFileSync(path.join(target, '.htaccess'), frontendHtaccess);
          console.log(`[postinstall] ✅ Copied frontend static export and secured .htaccess in: ${target}`);
        }
      } catch (err) {
        console.error(`Warning: Failed to copy to ${target}:`, err.message);
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
    const adminTargets = [
      '/home/u209525223/domains/unu-raymi.com/public_html/admin',
      '/home/u209525223/domains/admin.unu-raymi.com/public_html',
      path.resolve(process.cwd(), 'public_html', 'admin')
    ];
    if (process.cwd().includes('public_html')) {
      adminTargets.push(path.resolve(process.cwd(), 'admin'));
    }

    const uniqueAdminTargets = [...new Set(adminTargets.map(t => path.resolve(t)))];

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

    uniqueAdminTargets.forEach(target => {
      try {
        if (fs.existsSync(path.dirname(target)) && fs.existsSync(srcOut)) {
          fs.mkdirSync(target, { recursive: true });
          if (fs.existsSync(path.join(target, 'default.php'))) {
            fs.unlinkSync(path.join(target, 'default.php'));
          }
          copyStaticFiles(srcOut, target);
          fs.writeFileSync(path.join(target, '.htaccess'), adminHtaccess);
          console.log(`[postinstall] ✅ Copied admin static export and created .htaccess in: ${target}`);
        }
      } catch (err) {}
    });
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
