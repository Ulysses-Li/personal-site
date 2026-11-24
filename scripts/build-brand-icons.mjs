/**
 * 品牌圖示維護｜node scripts/build-brand-icons.mjs
 * SVG → PNG → Apple 根目錄相容圖示／ICO／網站 Manifest。
 * 一般編輯網站不必執行；只有調整標誌、姓名或安裝名稱時重新匯出。
 * 發布檔名取自 data/header.js 的 brandImage，避免沿用舊圖示快取。
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
vm.runInContext(await readFile(new URL('data/header.js', dist), 'utf8'), context);
const settings = context.window.SITE_SETTINGS;
const brandPath = context.window.SITE_HEADER.brandImage;
if (!/^assets\/brand\/[a-z0-9][a-z0-9-]*\.svg$/.test(brandPath)) throw new Error('brandImage 必須是 assets/brand/ 下的 SVG 檔名。');
const brandStem = brandPath.slice(0, -4);
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
    { src: `${brandStem}-192.png`, sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: `${brandStem}-512.png`, sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: `${brandStem}-512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' }
  ]
};
await writeFile(new URL('site.webmanifest', dist), JSON.stringify(manifest, null, 2) + '\n');
await copyFile(new URL('assets/brand/louis-li-icon-180.png', dist), new URL('apple-touch-icon.png', dist));
await copyFile(new URL('assets/brand/louis-li-mark.svg', dist), new URL('assets/mark.svg', dist));

// 02｜保留穩定原稿路徑；另匯出帶版本檔名的正式資源，供頁首及安裝使用。
if (brandPath !== 'assets/brand/louis-li-mark.svg') {
  await copyFile(new URL('assets/brand/louis-li-mark.svg', dist), new URL(brandPath, dist));
}
for (const size of [16, 32, 180, 192, 512, 1024]) {
  await copyFile(new URL(`assets/brand/louis-li-icon-${size}.png`, dist), new URL(`${brandStem}-${size}.png`, dist));
}

// ICO 使用原 PNG 編碼；Windows Vista 以後可直接解碼此類圖示。
const png = await readFile(new URL('assets/brand/louis-li-icon-32.png', dist));
const ico = Buffer.alloc(22);
ico.writeUInt16LE(1, 2); ico.writeUInt16LE(1, 4);
ico[6] = 32; ico[7] = 32;
ico.writeUInt16LE(1, 10); ico.writeUInt16LE(32, 12);
ico.writeUInt32LE(png.length, 14); ico.writeUInt32LE(22, 18);
await writeFile(new URL('favicon.ico', dist), Buffer.concat([ico, png]));
await copyFile(new URL('favicon.ico', dist), new URL(`${brandStem}.ico`, dist));

const htmlPath = new URL('index.html', dist);
const html = await readFile(htmlPath, 'utf8');
const title = settings.profile.name.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
if (!html.includes('name="apple-mobile-web-app-title"')) throw new Error('index.html 缺少 Apple 安裝名稱欄位。');
let updatedHtml = html.replace(/(<meta name="apple-mobile-web-app-title" content=")[^"]*(">)/, (_match, start, end) => start + title + end);
for (const [pattern, href] of [
  [/<link rel="icon" href="[^"]*" sizes="32x32">/, `${brandStem}.ico`],
  [/<link rel="icon" href="[^"]*" type="image\/svg\+xml" sizes="any">/, brandPath],
  [/<link rel="apple-touch-icon" href="[^"]*" sizes="180x180">/, `${brandStem}-180.png`]
]) {
  if (!pattern.test(updatedHtml)) throw new Error('index.html 圖示欄位格式不符，請檢查資源設定。');
  updatedHtml = updatedHtml.replace(pattern, tag => tag.replace(/href="[^"]*"/, `href="${href}"`));
}
await writeFile(htmlPath, updatedHtml);
console.log(`已同步 SVG、PNG、Apple 圖示、ICO 與安裝名稱；正式資源：${brandStem}。`);
