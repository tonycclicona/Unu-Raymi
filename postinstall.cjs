// postinstall.cjs — Runs after `npm install` in the root
// Automatically installs deps AND builds the correct subapp
// based on the APP_TYPE environment variable set in Hostinger.
//
// APP_TYPE=backend  → installs backend, runs prisma generate + db push
// APP_TYPE=frontend → installs frontend, runs Next.js build
// APP_TYPE=admin    → installs admin, runs Next.js build
// (no APP_TYPE)     → skips (local dev handles its own installs)

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const appType = (process.env.APP_TYPE || '').toLowerCase().trim();

console.log(`\n[postinstall] APP_TYPE="${appType || '(none - skipping subapp setup)'}"\n`);

// Skip if no APP_TYPE (local dev environment)
if (!appType) {
  console.log('[postinstall] No APP_TYPE set - skipping subapp install/build (local dev mode).');
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

function installDeps(subdir) {
  const lockFile = path.join(process.cwd(), subdir, 'package-lock.json');
  if (fs.existsSync(lockFile)) {
    run('npm ci --prefer-offline', subdir);
  } else {
    run('npm install', subdir);
  }
}

// ── BACKEND ───────────────────────────────────────────────────────────────────
if (appType === 'backend') {
  console.log('[postinstall] === BACKEND setup ===');
  installDeps('backend');
  run('npm run build', 'backend'); // copies .env, prisma generate, db push
}

// ── FRONTEND ──────────────────────────────────────────────────────────────────
else if (appType === 'frontend') {
  console.log('[postinstall] === FRONTEND setup ===');
  installDeps('frontend');
  run('npm run build', 'frontend'); // Next.js build
}

// ── ADMIN ─────────────────────────────────────────────────────────────────────
else if (appType === 'admin') {
  console.log('[postinstall] === ADMIN setup ===');
  installDeps('admin');
  run('npm run build', 'admin'); // Next.js build
}

else {
  console.log(`[postinstall] Unknown APP_TYPE: "${appType}" - nothing to do.`);
}

console.log('\n[postinstall] ✅ Done.\n');
