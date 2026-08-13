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
  if (process.env.PKG_MANAGER) {
    return process.env.PKG_MANAGER.toLowerCase().trim();
  }
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
    } else if (cmd.startsWith('pnpm ')) {
      finalCmd = cmd.replace(/^pnpm\s+/, 'npx pnpm ');
    }
  }

  console.log(`[postinstall] Running: ${finalCmd}`);
  console.log(`[postinstall]     in: ${cwd}`);
  try {
    execSync(finalCmd, { cwd, stdio: 'inherit', env: process.env });
  } catch (err) {
    // If pnpm was attempted directly and failed with command not found, retry via npx pnpm
    if (cmd.startsWith('pnpm') && pm === 'pnpm') {
      const fallbackCmd = cmd.replace(/^pnpm\s+/, 'npx --yes pnpm ');
      console.log(`[postinstall] Retrying with fallback: ${fallbackCmd}`);
      try {
        execSync(fallbackCmd, { cwd, stdio: 'inherit', env: process.env });
        return;
      } catch (retryErr) {
        console.error(`[postinstall] FAILED fallback: ${fallbackCmd}`);
      }
    }
    console.error(`[postinstall] FAILED: ${finalCmd}`);
    console.error(err.message);
    process.exit(1);
  }
}

// ── BACKEND ───────────────────────────────────────────────────────────────────
if (appType === 'backend') {
  console.log('[postinstall] === BACKEND setup ===');
  // Conceder permisos de ejecución a los binarios de Prisma Engine en servidores Linux
  try {
    const nodeModulesPath = path.join(process.cwd(), 'node_modules');
    execSync(`find "${nodeModulesPath}" -name "schema-engine*" -exec chmod +x {} + 2>/dev/null || true`, { stdio: 'ignore' });
    execSync(`find "${nodeModulesPath}" -name "query-engine*" -exec chmod +x {} + 2>/dev/null || true`, { stdio: 'ignore' });
  } catch (e) {
    // Ignorar si en Windows no aplica find/chmod
  }
  run('pnpm run build', 'backend');
}

// ── FRONTEND ──────────────────────────────────────────────────────────────────
else if (appType === 'frontend') {
  console.log('[postinstall] === FRONTEND setup ===');
  run('pnpm run build', 'frontend'); // Next.js build
  try {
    const srcNext = path.join(process.cwd(), 'frontend', '.next');
    const destNext = path.join(process.cwd(), '.next');
    if (fs.existsSync(srcNext)) {
      fs.cpSync(srcNext, destNext, { recursive: true });
      console.log('[postinstall] Copied frontend/.next to root .next');
    }
  } catch (e) {
    console.error('Warning: Failed to copy frontend/.next to root:', e.message);
  }
}

// ── ADMIN ─────────────────────────────────────────────────────────────────────
else if (appType === 'admin') {
  console.log('[postinstall] === ADMIN setup ===');
  run('pnpm run build', 'admin'); // Next.js build
  try {
    const srcNext = path.join(process.cwd(), 'admin', '.next');
    const destNext = path.join(process.cwd(), '.next');
    if (fs.existsSync(srcNext)) {
      fs.cpSync(srcNext, destNext, { recursive: true });
      console.log('[postinstall] Copied admin/.next to root .next');
    }
  } catch (e) {
    console.error('Warning: Failed to copy admin/.next to root:', e.message);
  }
}

else {
  console.log(`[postinstall] Unknown APP_TYPE: "${appType}" - nothing to do.`);
}

console.log('\n[postinstall] ✅ Done.\n');
