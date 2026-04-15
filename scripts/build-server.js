const fs = require('fs');
const path = require('path');
const pkgJson = require('../package.json');

console.log('🚀 Building Server Installer...');

const serverFiles = [
  'backend/**',
  'backend/db/**',
  '.env.example',
  'README-multi-machine.md',
  'scripts/install-server.bat'
];

const serverPkg = {
  name: 'miracle-pos-server',
  version: pkgJson.version,
  main: 'backend/server.js',
  bin: 'backend/server.js',
  scripts: {
    start: 'cd backend && node server.js',
    setup: 'backend/db/setup-remote-user.sql'
  },
  dependencies: pkgJson.devDependencies
};

fs.writeFileSync('server-package.json', JSON.stringify(serverPkg, null, 2));
console.log('✅ Server package ready: npm install -g server-package.json');

