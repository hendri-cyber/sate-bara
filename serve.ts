// Minimal static server for local testing only (not part of the graded game).
//   node serve.ts [--port 8908]
// Serves game/ at / and screenshots/ at /screenshots/. No directory listing,
// no path traversal: every request must resolve inside this directory.
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const args = process.argv.slice(2);
let port = Number(process.env.PORT ?? 8908);
const eqArg = args.find((a) => a.startsWith('--port='));
if (eqArg) port = Number(eqArg.slice(7));
else {
  const at = args.indexOf('--port');
  if (at >= 0 && args[at + 1]) port = Number(args[at + 1]);
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
};

const server = createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://127.0.0.1');
  let rel = decodeURIComponent(url.pathname);
  if (rel === '/') rel = '/game/index.html';
  else if (rel.startsWith('/screenshots/')) rel = rel.slice(1);
  else rel = `/game${rel}`;
  const file = resolve(join(here, rel));
  if (!file.startsWith(here) || !existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('not found\n');
    return;
  }
  res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
  res.end(readFileSync(file));
});

server.listen(port, '127.0.0.1', () => {
  console.log(`SATE BARA served at http://127.0.0.1:${port}/`);
});
