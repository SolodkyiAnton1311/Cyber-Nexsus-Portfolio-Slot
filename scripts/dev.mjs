import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const services = [
  { name: 'server', cwd: path.join(rootDir, 'server'), color: '\x1b[36m' },
  { name: 'client', cwd: path.join(rootDir, 'client'), color: '\x1b[35m' },
];

const reset = '\x1b[0m';
const children = [];

function prefixStream(stream, label, color, target) {
  let buffer = '';
  stream.on('data', (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (line.length > 0) {
        target.write(`${color}[${label}]${reset} ${line}\n`);
      }
    }
  });
}

for (const svc of services) {
  const child = spawn(npmCmd, ['run', 'dev'], {
    cwd: svc.cwd,
    shell: process.platform === 'win32',
    stdio: ['inherit', 'pipe', 'pipe'],
  });

  prefixStream(child.stdout, svc.name, svc.color, process.stdout);
  prefixStream(child.stderr, svc.name, svc.color, process.stderr);

  child.on('exit', (code) => {
    if (code !== null && code !== 0) {
      console.error(`${svc.color}[${svc.name}]${reset} exited with code ${code}`);
    }
  });

  children.push(child);
}

function shutdown() {
  for (const child of children) {
    if (!child.killed) {
      child.kill('SIGTERM');
    }
  }
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
