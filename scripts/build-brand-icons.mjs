/**
 * 品牌圖示維護｜node scripts/build-brand-icons.mjs
 * SVG → PNG → Apple 根目錄相容圖示／ICO／網站 Manifest。
 * 一般編輯網站不必執行；只有調整標誌、姓名或安裝名稱時重新匯出。
 */
import { readFile, writeFile, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const dist = new URL('dist/', root);
if (process.platform !== 'win32') throw new Error('PNG 匯出使用 Windows System.Drawing；請於 Windows 執行此維護腳本。');
const exported = spawnSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', fileURLToPath(new URL('scripts/export-brand-icons.ps1', root)), '-ProjectRoot', fileURLToPath(root)], { stdio: 'inherit', windowsHide: true });
if (exported.error) throw exported.error;
if (exported.status !== 0) throw new Error('PNG 匯出失敗，尚未更新 Manifest。');

// 安裝名稱取自同一份基本資料，不手動複製第二份個人姓名。
const context = vm.createContext({ window: {} });
vm.runInContext(await readFile(new URL('data/site.js', dist), 'utf8'), context);
const settings = context.window.SITE_SETTINGS;
const svg = await readFile(new URL('assets/brand/louis-li-mark.svg', dist), 'utf8');
const backgroundColor = svg.match(/<rect\b[^>]*fill="(#[0-9a-f]{6})"/i)?.[1];
if (!backgroundColor) throw new Error('SVG 需提供六位數十六進位滿版底色。');
const manifest = {
  id: './',
  name: `${settings.profile.name}｜${settings.siteName}`,
  short_name: settings.profile.name,
  description: '個人作品、工程技術筆記與日常小工具。',
  lang: 'zh-Hant',
  start_url: './index.html#home',
  scope: './',
  display: 'standalone',
  background_color: '#eef8ff',
  theme_color: backgroundColor,
  icons: [
    { src: 'assets/brand/louis-li-icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: 'assets/brand/louis-li-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: 'assets/brand/louis-li-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
  ]
};
await writeFile(new URL('site.webmanifest', dist), JSON.stringify(manifest, null, 2) + '\n');
await copyFile(new URL('assets/brand/louis-li-icon-180.png', dist), new URL('apple-touch-icon.png', dist));
await copyFile(new URL('assets/brand/louis-li-mark.svg', dist), new URL('assets/mark.svg', dist));

// ICO 使用原 PNG 編碼；Windows Vista 以後可直接解碼此類圖示。
const png = await readFile(new URL('assets/brand/louis-li-icon-32.png', dist));
const ico = Buffer.alloc(22);
ico.writeUInt16LE(1, 2); ico.writeUInt16LE(1, 4);
ico[6] = 32; ico[7] = 32;
ico.writeUInt16LE(1, 10); ico.writeUInt16LE(32, 12);
ico.writeUInt32LE(png.length, 14); ico.writeUInt32LE(22, 18);
await writeFile(new URL('favicon.ico', dist), Buffer.concat([ico, png]));

const htmlPath = new URL('index.html', dist);
const html = await readFile(htmlPath, 'utf8');
const title = settings.profile.name.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
if (!html.includes('name="apple-mobile-web-app-title"')) throw new Error('index.html 缺少 Apple 安裝名稱欄位。');
await writeFile(htmlPath, html.replace(/(<meta name="apple-mobile-web-app-title" content=")[^"]*(">)/, (_match, start, end) => start + title + end));
console.log('已同步 SVG、PNG、Apple 圖示、ICO 與安裝名稱。');
