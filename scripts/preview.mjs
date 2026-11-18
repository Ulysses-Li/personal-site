import { createServer } from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = await realpath(fileURLToPath(new URL('../dist', import.meta.url)));
const types = {'.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.svg':'image/svg+xml', '.jpeg':'image/jpeg'};
const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    const filename = path.resolve(root, '.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
    const relative = path.relative(root, filename);
    if (relative.startsWith('..') || path.isAbsolute(relative) || relative.split(path.sep).some((part) => part.startsWith('.'))) throw new Error('Invalid path');
    const target = await realpath(filename);
    const targetRelative = path.relative(root, target);
    if (targetRelative.startsWith('..') || path.isAbsolute(targetRelative) || !(await stat(target)).isFile()) throw new Error('Invalid target');
    const body = await readFile(target);
    response.writeHead(200, {'Content-Type': types[path.extname(target)] || 'application/octet-stream', 'Cache-Control':'no-store'});
    response.end(body);
  } catch { response.writeHead(404); response.end('Not found'); }
});
server.listen(5503, '127.0.0.1', () => console.log('Local: http://127.0.0.1:5503'));
