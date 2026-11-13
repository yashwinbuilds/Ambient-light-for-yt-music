const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootDir = path.resolve(__dirname, '..');
const extDir = path.join(rootDir, 'ytmusic-ambient-light');
const distDir = path.join(rootDir, 'dist');
const zipPath = path.join(distDir, 'ytmusic-ambient-light-v1.0.0.zip');

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

if (fs.existsSync(zipPath)) {
  fs.unlinkSync(zipPath);
}

console.log(`Packaging extension from ${extDir} into ${zipPath}...`);

// Use PowerShell Compress-Archive on Windows
const cmd = `powershell -Command "Compress-Archive -Path '${extDir}\\*' -DestinationPath '${zipPath}' -Force"`;
execSync(cmd, { stdio: 'inherit' });

console.log(`Package created successfully: ${zipPath} (${(fs.statSync(zipPath).size / 1024).toFixed(1)} KB)`);
