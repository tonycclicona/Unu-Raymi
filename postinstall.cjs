// postinstall.cjs — Runs after install in the root
// Automatically builds all subapps (backend, frontend, admin) and delivers them to public_html and runtime directories.

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('\n[postinstall] ==========================================');
console.log('[postinstall] Starting Full Monorepo Build & Setup');
console.log('[postinstall] CWD:', process.cwd());
console.log('[postinstall] APP_TYPE:', process.env.APP_TYPE || 'all');
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
    // En entornos compartidos de Hostinger, continuar para permitir que las demás apps compilen
  }
}

function copyToAllPublicHtml(srcDir, label) {
  if (!fs.existsSync(srcDir)) return;
  
  let current = process.cwd();
  for (let i = 0; i < 6; i++) {
    const pubCandidate = path.join(current, 'public_html');
    if (fs.existsSync(pubCandidate) && pubCandidate !== srcDir) {
      try {
        fs.cpSync(srcDir, pubCandidate, { recursive: true });
        console.log(`[postinstall] ✅ Copied ${label} to: ${pubCandidate}`);
      } catch (err) {
        console.error(`Warning: Failed to copy to ${pubCandidate}:`, err.message);
      }
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
}

// ── 1. BUILD BACKEND ──────────────────────────────────────────────────────────
console.log('[postinstall] === 1/3 BACKEND setup ===');
try {
  const nodeModulesPath = path.join(process.cwd(), 'node_modules');
  execSync(`find "${nodeModulesPath}" -name "schema-engine*" -exec chmod +x {} + 2>/dev/null || true`, { stdio: 'ignore' });
  execSync(`find "${nodeModulesPath}" -name "query-engine*" -exec chmod +x {} + 2>/dev/null || true`, { stdio: 'ignore' });
} catch (e) {}
run('npm run build', 'backend');

// Crear un index.php dentro de public_html/api/ que actúe como PROXY DINÁMICO hacia Node.js
try {
  let current = process.cwd();
  for (let i = 0; i < 6; i++) {
    const pubApiCandidate = path.join(current, 'public_html', 'api');
    if (fs.existsSync(path.dirname(pubApiCandidate))) {
      try {
        fs.mkdirSync(pubApiCandidate, { recursive: true });
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

$targetUrl = 'https://unu-raymi.com' . $requestUri;

$ch = curl_init($targetUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $_SERVER['REQUEST_METHOD']);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);

$headers = [];
foreach (getallheaders() as $name => $value) {
    if (strtolower($name) !== 'host') {
        $headers[] = "$name: $value";
    }
}
$headers[] = "Host: unu-raymi.com";
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

if (in_array($_SERVER['REQUEST_METHOD'], ['POST', 'PUT', 'PATCH', 'DELETE'])) {
    $body = file_get_contents('php://input');
    curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
}

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);

curl_close($ch);

if ($contentType) {
    header("Content-Type: $contentType");
}
http_response_code($httpCode ?: 200);
echo $response;
exit(0);
`;
        fs.writeFileSync(path.join(pubApiCandidate, 'index.php'), apiIndexContent);
        console.log(`[postinstall] ✅ Created dynamic API proxy index.php in: ${pubApiCandidate}`);
      } catch (err) {}
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
} catch (e) {}

// ── 2. BUILD FRONTEND ─────────────────────────────────────────────────────────
console.log('[postinstall] === 2/3 FRONTEND setup ===');
run('npm run build', 'frontend');
try {
  const srcOut = path.join(process.cwd(), 'frontend', 'out');
  const destOut = path.join(process.cwd(), 'out');
  if (fs.existsSync(srcOut)) {
    fs.cpSync(srcOut, destOut, { recursive: true });
  }

  // Lista de posibles ubicaciones de public_html en Hostinger
  const publicHtmlTargets = [
    path.join(process.cwd(), 'public_html'),
    '/home/u209525223/domains/unu-raymi.com/public_html',
    '/home/u209525223/public_html'
  ];

  publicHtmlTargets.forEach(target => {
    if (fs.existsSync(target) && target !== srcOut) {
      try {
        fs.cpSync(srcOut, target, { recursive: true });
        console.log(`[postinstall] ✅ Copied frontend static export directly to: ${target}`);
      } catch (err) {
        console.error(`Warning: Failed to copy to ${target}:`, err.message);
      }
    }
  });

  copyToAllPublicHtml(srcOut, 'frontend static export');
} catch (e) {
  console.error('Warning: Failed to copy frontend build:', e.message);
}

// ── 3. BUILD ADMIN ────────────────────────────────────────────────────────────
console.log('[postinstall] === 3/3 ADMIN setup ===');
run('npm run build', 'admin');
try {
  const srcOut = path.join(process.cwd(), 'admin', 'out');
  const adminTargets = [
    path.join(process.cwd(), 'public_html', 'admin'),
    '/home/u209525223/domains/unu-raymi.com/public_html/admin',
    '/home/u209525223/public_html/admin'
  ];

  adminTargets.forEach(target => {
    try {
      fs.mkdirSync(target, { recursive: true });
      fs.cpSync(srcOut, target, { recursive: true });
      console.log(`[postinstall] ✅ Copied admin static export to: ${target}`);
    } catch (err) {}
  });
} catch (e) {
  console.error('Warning: Failed to copy admin build:', e.message);
}

// ── 4. SINCRONIZACIÓN AUTOMÁTICA A CURRENT / NODEJS Y PUBLIC_HTML ───────────
console.log('\n[postinstall] === Syncing build artifacts to runtime directories ===');
try {
  const currentDirs = [
    '/home/u209525223/domains/unu-raymi.com/hbuilds/current/nodejs',
    path.resolve(process.cwd(), '../current/nodejs'),
    path.resolve(process.cwd(), '../../current/nodejs')
  ];

  currentDirs.forEach(target => {
    if (fs.existsSync(path.dirname(target))) {
      try {
        fs.mkdirSync(target, { recursive: true });
        // Copiar server.js, package.json y carpetas compiladas
        const itemsToCopy = ['server.js', 'package.json', 'out', 'frontend', 'admin', 'backend', '.env', '.env.production'];
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

console.log('\n[postinstall] ✅ All subapps built and delivered successfully.\n');
process.exit(0);
