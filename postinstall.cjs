// postinstall.cjs — Runs after install in the root
// Automatically builds the correct subapp based on the APP_TYPE environment variable in Hostinger.

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

let appType = (process.env.APP_TYPE || '').toLowerCase().trim();

if (!appType) {
  const cwd = process.cwd().toLowerCase();
  if (cwd.includes('admin')) {
    appType = 'admin';
  } else if (cwd.includes('api') || cwd.includes('backend')) {
    appType = 'backend';
  } else if (cwd.includes('frontend') || cwd.includes('unu-raymi.com')) {
    appType = 'frontend';
  }
}

console.log(`\n[postinstall] APP_TYPE="${appType || '(none - skipping subapp setup)'}"\n`);

// Skip if no APP_TYPE (local dev environment)
if (!appType) {
  console.log('[postinstall] No APP_TYPE set - skipping subapp build (local dev mode).');
  process.exit(0);
}

function run(cmd, subdir) {
  const cwd = path.join(process.cwd(), subdir);
  console.log(`[postinstall] Running: ${cmd}`);
  console.log(`[postinstall]     in: ${cwd}`);
  try {
    execSync(cmd, { cwd, stdio: 'inherit', env: process.env });
  } catch (err) {
    console.error(`[postinstall] FAILED: ${cmd}`);
    console.error(err.message);
    process.exit(1);
  }
}

// ── BACKEND ───────────────────────────────────────────────────────────────────
if (appType === 'backend') {
  console.log('[postinstall] === BACKEND setup ===');
  try {
    const nodeModulesPath = path.join(process.cwd(), 'node_modules');
    execSync(`find "${nodeModulesPath}" -name "schema-engine*" -exec chmod +x {} + 2>/dev/null || true`, { stdio: 'ignore' });
    execSync(`find "${nodeModulesPath}" -name "query-engine*" -exec chmod +x {} + 2>/dev/null || true`, { stdio: 'ignore' });
  } catch (e) {
    // Ignorar en entornos donde no aplica find/chmod
  }
  run('npm run build', 'backend');
}

// ── FRONTEND ──────────────────────────────────────────────────────────────────
else if (appType === 'frontend') {
  console.log('[postinstall] === FRONTEND setup ===');
  run('npm run build', 'frontend');
  try {
    const srcOut = path.join(process.cwd(), 'frontend', 'out');
    const destOut = path.join(process.cwd(), 'out');
    if (fs.existsSync(srcOut)) {
      fs.cpSync(srcOut, destOut, { recursive: true });
      console.log('[postinstall] Copied frontend/out to root out');
    }
    const srcNext = path.join(process.cwd(), 'frontend', '.next');
    const destNext = path.join(process.cwd(), '.next');
    if (fs.existsSync(srcNext)) {
      fs.cpSync(srcNext, destNext, { recursive: true });
      console.log('[postinstall] Copied frontend/.next to root .next');
    }
  } catch (e) {
    console.error('Warning: Failed to copy frontend build output to root:', e.message);
  }
}

// ── ADMIN ─────────────────────────────────────────────────────────────────────
else if (appType === 'admin') {
  console.log('[postinstall] === ADMIN setup ===');
  run('npm run build', 'admin');
  try {
    const srcOut = path.join(process.cwd(), 'admin', 'out');
    const destOut = path.join(process.cwd(), 'out');
    if (fs.existsSync(srcOut)) {
      fs.cpSync(srcOut, destOut, { recursive: true });
      console.log('[postinstall] Copied admin/out to root out');
    }
    const srcNext = path.join(process.cwd(), 'admin', '.next');
    const destNext = path.join(process.cwd(), '.next');
    if (fs.existsSync(srcNext)) {
      fs.cpSync(srcNext, destNext, { recursive: true });
      console.log('[postinstall] Copied admin/.next to root .next');
    }
  } catch (e) {
    console.error('Warning: Failed to copy admin build output to root:', e.message);
  }
}

else {
  console.log(`[postinstall] Unknown APP_TYPE: "${appType}" - nothing to do.`);
}

console.log('\n[postinstall] ✅ Done.\n');
