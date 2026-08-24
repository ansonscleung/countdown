import { createServer } from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('./', import.meta.url));
const port = Number(process.env.PORT) || 3000;

try {
  const dotenv = await fs.readFile(path.join(root, '.env'), 'utf8');
  for (const line of dotenv.split(/\r?\n/)) {
    const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(line);
    if (match && !(match[1] in process.env)) process.env[match[1]] = match[2];
  }
} catch {}

const envTarget = process.env.COUNTDOWN_TARGET;
let countdownTarget = null;
if (envTarget) {
  if (!Number.isNaN(new Date(envTarget).getTime())) {
    countdownTarget = envTarget;
  } else {
    console.warn(`Ignoring invalid COUNTDOWN_TARGET "${envTarget}" (not a parseable date)`);
  }
}

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    let pathname = decodeURIComponent(url.pathname);
    if (pathname.endsWith('/')) pathname += 'index.html';
    const filePath = path.normalize(path.join(root, pathname));
    if (!filePath.startsWith(root)) {
      res.writeHead(403, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('Forbidden');
      return;
    }
    const data = await fs.readFile(filePath);
    const type = mimeTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    let body = data;
    if (countdownTarget && type.startsWith('text/html')) {
      const snippet = `<script>window.COUNTDOWN_CONFIG = { target: ${JSON.stringify(countdownTarget)} };</script>`;
      body = Buffer.from(data.toString('utf8').replace('</head>', `${snippet}</head>`));
    }
    res.writeHead(200, { 'content-type': type, 'cache-control': 'no-cache' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
});

server.listen(port, () => {
  console.log(`Moominland Midwinter countdown running at http://localhost:${port}`);
});
