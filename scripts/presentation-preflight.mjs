import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

const root = process.cwd();
const checks = [];

const addCheck = (name, passed, detail) => {
  checks.push({ name, passed, detail });
};

const requiredFiles = [
  'index.html',
  'package.json',
  'src/App.jsx',
  'src/pages/LoginPage.jsx',
  'src/pages/Profile.jsx',
];

for (const file of requiredFiles) {
  const ok = existsSync(join(root, file));
  addCheck(`Required file: ${file}`, ok, ok ? 'Found' : 'Missing');
}

try {
  const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
  addCheck('Node.js available', true, nodeVersion);
} catch {
  addCheck('Node.js available', false, 'node command not found');
}

try {
  const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
  addCheck('npm available', true, npmVersion);
} catch {
  addCheck('npm available', false, 'npm command not found');
}

let buildOk = false;
let buildLog = '';
try {
  buildLog = execSync('npx.cmd vite build', { encoding: 'utf8', stdio: 'pipe' });
  buildOk = true;
} catch (error) {
  const out = typeof error?.stdout === 'string' ? error.stdout : '';
  const err = typeof error?.stderr === 'string' ? error.stderr : '';
  buildLog = `${out}\n${err}`.trim();
  buildOk = false;
}

const preflightDir = join(root, 'preflight');
if (!existsSync(preflightDir)) {
  mkdirSync(preflightDir, { recursive: true });
}

const buildLogPath = join(preflightDir, 'last-build.log');
writeFileSync(buildLogPath, buildLog || 'No build output captured.', 'utf8');

addCheck('Production build', buildOk, buildOk ? `Success (log: ${buildLogPath})` : `Failed (log: ${buildLogPath})`);

const distOk = existsSync(join(root, 'dist/index.html'));
addCheck('dist output exists', distOk, distOk ? 'dist/index.html found' : 'Missing dist/index.html');

const deployConfigOk = existsSync(join(root, 'vercel.json')) || existsSync(join(root, 'netlify.toml'));
addCheck('Deployment config', deployConfigOk, deployConfigOk ? 'Found vercel.json or netlify.toml' : 'No deployment config found');

const lines = [];
lines.push("Taylor's App Presentation Preflight Report");
lines.push(`Generated: ${new Date().toISOString()}`);
lines.push('');

for (const check of checks) {
  lines.push(`${check.passed ? 'PASS' : 'FAIL'} | ${check.name} | ${check.detail}`);
}

const reportPath = join(preflightDir, 'presentation-preflight-report.txt');
writeFileSync(reportPath, lines.join('\n'), 'utf8');

console.log("Taylor's App Presentation Preflight");
console.log('----------------------------------');
for (const check of checks) {
  console.log(`${check.passed ? 'PASS' : 'FAIL'} | ${check.name} | ${check.detail}`);
}
console.log('');
console.log(`Report saved to: ${reportPath}`);
console.log(`Build log saved to: ${buildLogPath}`);

const allPassed = checks.every((check) => check.passed);
if (!allPassed) {
  process.exit(1);
}
