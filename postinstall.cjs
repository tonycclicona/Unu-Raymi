// postinstall.cjs — Runs after `pnpm install` in the root
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

function getPackageManager() {
  try {
    execSync('pnpm --version', { stdio: 'ignore' });
    return 'pnpm';
  } catch (e) {
    try {
      execSync('npx --version', { stdio: 'ignore' });
      return 'npx pnpm';
    } catch (err) {
      return 'npm';
    }
  }
}

const pm = getPackageManager();
console.log(`[postinstall] Using package runner: "${pm}"`);

function run(cmd, subdir) {
  const cwd = path.join(process.cwd(), subdir);
  // Reemplazar prefijo 'pnpm' por el gestor detectado si se requiere
  let finalCmd = cmd;
  if (cmd.startsWith('pnpm ')) {
    finalCmd = cmd.replace(/^pnpm\s+/, `${pm} `);
  }

  console.log(`[postinstall] Running: ${finalCmd}`);
  console.log(`[postinstall]     in: ${cwd}`);
  try {
    execSync(finalCmd, { cwd, stdio: 'inherit', env: process.env });
  } catch (err) {
    console.error(`[postinstall] FAILED: ${finalCmd}`);
    console.error(err.message);
    process.exit(1);
  }
}

function installDeps(subdir) {
  const lockFile = path.join(process.cwd(), subdir, 'pnpm-lock.yaml');
  if (pm.includes('pnpm')) {
    if (fs.existsSync(lockFile)) {
      run('pnpm install --frozen-lockfile', subdir);
    } else {
      run('pnpm install', subdir);
    }
  } else {
    run('npm install --legacy-peer-deps', subdir);
  }
}

// ── BACKEND ───────────────────────────────────────────────────────────────────
if (appType === 'backend') {
  console.log('[postinstall] === BACKEND setup ===');
  installDeps('backend');
  run('pnpm run build', 'backend'); // copies .env, prisma generate, db push
}

// ── FRONTEND ──────────────────────────────────────────────────────────────────
else if (appType === 'frontend') {
  console.log('[postinstall] === FRONTEND setup ===');
  installDeps('frontend');
  run('pnpm run build', 'frontend'); // Next.js build
}

// ── ADMIN ─────────────────────────────────────────────────────────────────────
else if (appType === 'admin') {
  console.log('[postinstall] === ADMIN setup ===');
  installDeps('admin');
  run('pnpm run build', 'admin'); // Next.js build
}

else {
  console.log(`[postinstall] Unknown APP_TYPE: "${appType}" - nothing to do.`);
}

console.log('\n[postinstall] ✅ Done.\n');
