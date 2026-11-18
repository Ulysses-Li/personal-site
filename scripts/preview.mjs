// ═══════════════════════════════════════════════════════════
// 本機預覽伺服器｜只服務本專案的 dist 資料夾
// 啟動：node scripts/preview.mjs；結束：在終端機按 Ctrl+C。
// ═══════════════════════════════════════════════════════════

// ── 01｜載入 Node.js 內建模組；不需要另外安裝套件。 ──
import { createServer } from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// ── 02｜設定網站根目錄與各類檔案的回應格式。 ──
const root = await realpath(
  fileURLToPath(new URL('../dist', import.meta.url))
);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpeg': 'image/jpeg'
};

// ── 03｜接收本機瀏覽器的請求；根網址對應到 index.html。 ──
const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    const filename = path.resolve(
      root,
      '.' + decodeURIComponent(
        url.pathname === '/' ? '/index.html' : url.pathname
      )
    );

    // ── 04｜路徑保護：禁止讀取根目錄以外或以句點開頭的檔案。 ──
    const relative = path.relative(root, filename);
    if (
      relative.startsWith('..') ||
      path.isAbsolute(relative) ||
      relative.split(path.sep).some((part) => part.startsWith('.'))
    ) {
      throw new Error('不允許的檔案路徑');
    }

    // 解析實際路徑後再次確認範圍，避免符號連結指向其他資料夾。
    const target = await realpath(filename);
    const targetRelative = path.relative(root, target);
    if (
      targetRelative.startsWith('..') ||
      path.isAbsolute(targetRelative) ||
      !(await stat(target)).isFile()
    ) {
      throw new Error('不允許的檔案目標');
    }

    // ── 05｜回傳檔案；關閉快取，重新整理即可看見本機修改。 ──
    const body = await readFile(target);
    response.writeHead(200, {
      'Content-Type': types[path.extname(target)] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    response.end(body);
  } catch {
    response.writeHead(404);
    response.end('Not found');
  }
});

// ── 06｜啟動預覽：只綁定本機位址，不開放區域網路連線。 ──
server.listen(5503, '127.0.0.1', () => {
  console.log('本機預覽：http://127.0.0.1:5503');
});
