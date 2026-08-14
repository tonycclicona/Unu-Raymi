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

// ── 2. BUILD FRONTEND ─────────────────────────────────────────────────────────
console.log('[postinstall] === 2/3 FRONTEND setup ===');
run('npm run build', 'frontend');
try {
  const srcOut = path.join(process.cwd(), 'frontend', 'out');
  const destOut = path.join(process.cwd(), 'out');
  if (fs.existsSync(srcOut)) {
    fs.cpSync(srcOut, destOut, { recursive: true });
    console.log('[postinstall] Copied frontend/out to root out');
  }
  copyToAllPublicHtml(srcOut, 'frontend static export');
} catch (e) {
  console.error('Warning: Failed to copy frontend build:', e.message);
}

// ── 3. BUILD ADMIN ────────────────────────────────────────────────────────────
console.log('[postinstall] === 3/3 ADMIN setup ===');
run('npm run build', 'admin');
try {
  const srcOut = path.join(process.cwd(), 'admin', 'out');
  if (fs.existsSync(srcOut)) {
    copyToAllPublicHtml(srcOut, 'admin static export');
  }
} catch (e) {
  console.error('Warning: Failed to copy admin build:', e.message);
}

console.log('\n[postinstall] ✅ All subapps built and delivered successfully.\n');
process.exit(0);
