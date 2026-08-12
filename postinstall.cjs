// postinstall.cjs — Runs after install in the root
// Automatically builds the correct subapp based on the APP_TYPE environment variable in Hostinger.

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const appType = (process.env.APP_TYPE || '').toLowerCase().trim();

console.log(`\n[postinstall] APP_TYPE="${appType || '(none - skipping subapp setup)'}"\n`);

// Skip if no APP_TYPE (local dev environment)
if (!appType) {
  console.log('[postinstall] No APP_TYPE set - skipping subapp build (local dev mode).');
  process.exit(0);
}

function getPackageManager() {
  try {
    execSync('pnpm --version', { stdio: 'ignore' });
    return 'pnpm';
  } catch (e) {
    try {
      execSync('npx pnpm --version', { stdio: 'ignore' });
      return 'npx pnpm';
    } catch (err) {
      return 'npm';
    }
  }
}

const pm = getPackageManager();
console.log(`[postinstall] Configured package manager: "${pm}"`);

function run(cmd, subdir) {
  const cwd = path.join(process.cwd(), subdir);
  let finalCmd = cmd;
  if (pm === 'npx pnpm') {
    finalCmd = cmd.replace(/^pnpm\s+/, 'npx pnpm ');
  } else if (pm === 'npm') {
    if (cmd.startsWith('pnpm install')) {
      finalCmd = 'npm install --legacy-peer-deps';
    } else if (cmd.startsWith('pnpm run ')) {
      finalCmd = cmd.replace(/^pnpm run\s+/, 'npm run ');
    }
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

// ── BACKEND ───────────────────────────────────────────────────────────────────
if (appType === 'backend') {
  console.log('[postinstall] === BACKEND setup ===');
  run('pnpm run build', 'backend'); // copies .env, prisma generate, db push
}

// ── FRONTEND ──────────────────────────────────────────────────────────────────
else if (appType === 'frontend') {
  console.log('[postinstall] === FRONTEND setup ===');
  run('pnpm run build', 'frontend'); // Next.js build
}

// ── ADMIN ─────────────────────────────────────────────────────────────────────
else if (appType === 'admin') {
  console.log('[postinstall] === ADMIN setup ===');
  run('pnpm run build', 'admin'); // Next.js build
}

else {
  console.log(`[postinstall] Unknown APP_TYPE: "${appType}" - nothing to do.`);
}

console.log('\n[postinstall] ✅ Done.\n');
