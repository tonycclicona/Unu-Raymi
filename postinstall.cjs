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

// Crear un index.php / .htaccess dentro de public_html/api/ para evitar el 403 Forbidden de directorio vacío en Apache
try {
  let current = process.cwd();
  for (let i = 0; i < 6; i++) {
    const pubApiCandidate = path.join(current, 'public_html', 'api');
    if (fs.existsSync(path.dirname(pubApiCandidate))) {
      try {
        fs.mkdirSync(pubApiCandidate, { recursive: true });
        const apiIndexContent = `<?php
// Proxy/Redirect de subdominio api hacia el motor Node.js
header('Content-Type: application/json; charset=utf-8');
echo json_encode([
    "success" => true,
    "service" => "Unu-Raymi API Gateway",
    "status" => "active",
    "version" => "1.0.0",
    "endpoints" => [
        "health" => "/api/health",
        "tours" => "/api/tours",
        "guias" => "/api/guias",
        "reservas" => "/api/reservas"
    ]
]);
`;
        fs.writeFileSync(path.join(pubApiCandidate, 'index.php'), apiIndexContent);
        console.log(`[postinstall] ✅ Created index.php gateway in: ${pubApiCandidate}`);
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

console.log('\n[postinstall] ✅ All subapps built and delivered successfully.\n');
process.exit(0);
