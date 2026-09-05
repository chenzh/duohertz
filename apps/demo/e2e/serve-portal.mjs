// Local preview of the static package, including its Pages headers and 404.
import { createServer } from 'node:http';
import { readFileSync, statSync } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../dist-portal', import.meta.url));
const rules = [];
for (const line of readFileSync(resolve(root, '_headers'), 'utf8').split('\n')) {
  if (line.startsWith('/')) rules.push({ path: line.trim(), headers: {} });
  else if (line.trim() && rules.length) {
    const split = line.indexOf(':');
    if (split > 0) rules.at(-1).headers[line.slice(0, split).trim()] = line.slice(split + 1).trim();
  }
}
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.wav': 'audio/wav', '.json': 'application/json', '.txt': 'text/plain', '.xml': 'application/xml' };
createServer((req, res) => {
  if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405); res.end(); return; }
  let path;
  try { path = decodeURIComponent(new URL(req.url, 'http://preview').pathname); } catch { res.writeHead(400); res.end(); return; }
  let file = resolve(root, '.' + (path === '/' ? '/index.html' : path));
  if (!file.startsWith(root + sep) || path.split('/').some((part) => part.startsWith('.'))) { res.writeHead(404); res.end(); return; }
  let status = 200;
  try { if (!statSync(file).isFile()) throw new Error('not a file'); } catch { file = resolve(root, '404.html'); status = 404; }
  const headers = {};
  for (const rule of rules) if (rule.path.endsWith('*') ? path.startsWith(rule.path.slice(0, -1)) : path === rule.path) {
    // Pages combines duplicate headers from all matching rules.
    for (const [name, value] of Object.entries(rule.headers)) headers[name] = headers[name] ? `${headers[name]}, ${value}` : value;
  }
  headers['Content-Type'] = mime[extname(file)] ?? 'application/octet-stream';
  const bytes = readFileSync(file);
  headers['Accept-Ranges'] = 'bytes';
  const range = /^bytes=(\d+)-(\d*)$/.exec(req.headers.range ?? '');
  if (range && status === 200) {
    const start = Number(range[1]), end = Math.min(Number(range[2] || bytes.length - 1), bytes.length - 1);
    if (start > end) { res.writeHead(416, { 'Content-Range': `bytes */${bytes.length}` }); res.end(); return; }
    res.writeHead(206, { ...headers, 'Content-Range': `bytes ${start}-${end}/${bytes.length}`, 'Content-Length': end - start + 1 });
    res.end(req.method === 'HEAD' ? undefined : bytes.subarray(start, end + 1));
  } else { res.writeHead(status, { ...headers, 'Content-Length': bytes.length }); res.end(req.method === 'HEAD' ? undefined : bytes); }
}).listen(4180, '127.0.0.1', () => process.stdout.write('Portal preview: http://127.0.0.1:4180\n'));
