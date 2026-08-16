import fs from 'fs';

if (fs.existsSync('.env.production') && !fs.existsSync('.env')) {
  fs.copyFileSync('.env.production', '.env');
}
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist', { recursive: true });
}
fs.cpSync('src', 'dist/src', { recursive: true });
fs.writeFileSync('dist/server.js', "export { default } from './src/server.js';\nexport * from './src/server.js';\n");
