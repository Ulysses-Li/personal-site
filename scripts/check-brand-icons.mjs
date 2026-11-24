/*
 * 個人品牌圖示檢查｜node scripts/check-brand-icons.mjs
 * 僅使用 Node 內建模組；讀取正式資源，不寫入網站、不連線、不啟動瀏覽器。
 * PNG 僅解出目前圖示使用的 8-bit RGB／RGBA 非交錯 alpha，不另造完整圖片編解碼器。
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { inflateSync } from 'node:zlib';
import vm from 'node:vm';

// 01｜資料與資源入口；從任意工作目錄執行皆可。
const dist = new URL('../dist/', import.meta.url);
const sizes = [16, 32, 180, 192, 512, 1024];
const iconPath = size => `assets/brand/louis-li-icon-${size}.png`;
const masterPath = 'assets/brand/louis-li-mark.svg';
const read = path => readFile(new URL(path, dist));
const html = (await read('index.html')).toString('utf8');
const master = await read(masterPath);
const manifest = JSON.parse((await read('site.webmanifest')).toString('utf8'));
const pngFiles = new Map(await Promise.all(sizes.map(async size => [size, await read(iconPath(size))])));
const context = vm.createContext({ URL });
context.window = context;
for (const path of ['data/site.js', 'data/header.js', 'components/shared.js', 'components/header.js']) {
  vm.runInContext((await read(path)).toString('utf8'), context, { filename: path, timeout: 1000 });
}
const settings = context.SITE_SETTINGS;
const header = context.SITE_HEADER;
const requiredViews = ['home', 'work', 'tools', 'notes', 'resume'];

function attributes(tag) {
  const result = {};
  for (const match of tag.replace(/^<\/?[\w:-]+/, '').matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) result[match[1]] = match[2] ?? match[3];
  return result;
}
function tags(markup, name) {
  return [...markup.matchAll(new RegExp(`<${name}\\b(?:"[^\"]*"|'[^']*'|[^'">])*>`, 'gi'))].map(match => attributes(match[0]));
}
function localAsset(path) {
  assert.equal(typeof path, 'string');
  assert.ok(path && !/^(?:[a-z][a-z\d+.-]*:|[\\/])/i.test(path), `必須使用本機相對路徑：${path}`);
  assert.ok(!/[?#\\]/.test(path), `圖示路徑不可含查詢、片段或反斜線：${path}`);
  const url = new URL(path, dist);
  assert.ok(url.href.startsWith(dist.href), `不可離開 dist：${path}`);
  return url;
}

// 02｜檔案簽名與 IHDR；驗證 chunk 邊界，避免只信任副檔名或宣告尺寸。
function pngInfo(buffer) {
  assert.ok(buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), '不是有效 PNG 簽名');
  const chunks = [];
  for (let cursor = 8; cursor < buffer.length;) {
    assert.ok(cursor + 12 <= buffer.length, 'PNG chunk 標頭不完整');
    const length = buffer.readUInt32BE(cursor);
    const type = buffer.toString('ascii', cursor + 4, cursor + 8);
    assert.ok(cursor + length + 12 <= buffer.length, `PNG ${type} 超出檔案長度`);
    chunks.push({ type, data: buffer.subarray(cursor + 8, cursor + 8 + length) });
    cursor += length + 12;
  }
  assert.equal(chunks[0]?.type, 'IHDR');
  assert.equal(chunks[0].data.length, 13);
  assert.equal(chunks.filter(chunk => chunk.type === 'IHDR').length, 1);
  assert.equal(chunks.at(-1)?.type, 'IEND');
  assert.equal(chunks.at(-1).data.length, 0);
  assert.ok(chunks.some(chunk => chunk.type === 'IDAT'));
  const data = chunks[0].data;
  return { width: data.readUInt32BE(0), height: data.readUInt32BE(4), depth: data[8], color: data[9], compression: data[10], filter: data[11], interlace: data[12], chunks };
}

function paeth(left, up, upperLeft) {
  const estimate = left + up - upperLeft;
  const distances = [Math.abs(estimate - left), Math.abs(estimate - up), Math.abs(estimate - upperLeft)];
  return distances[0] <= distances[1] && distances[0] <= distances[2] ? left : distances[1] <= distances[2] ? up : upperLeft;
}
function assertOpaque(info) {
  assert.equal(info.depth, 8, 'alpha 檢查僅支援 8-bit PNG');
  assert.ok(info.color === 2 || info.color === 6, 'alpha 檢查僅支援 RGB／RGBA');
  assert.equal(info.interlace, 0, 'alpha 檢查僅支援非交錯 PNG');
  assert.equal(info.compression, 0);
  assert.equal(info.filter, 0);
  assert.ok(!info.chunks.some(chunk => chunk.type === 'tRNS'), '不允許額外透明色');
  const channels = info.color === 6 ? 4 : 3;
  const stride = info.width * channels + 1;
  const expectedLength = stride * info.height;
  const raw = inflateSync(Buffer.concat(info.chunks.filter(chunk => chunk.type === 'IDAT').map(chunk => chunk.data)), { maxOutputLength: expectedLength });
  assert.equal(raw.length, expectedLength, 'PNG 解壓後像素列長度不符');
  let previous = new Uint8Array(info.width);
  for (let y = 0; y < info.height; y++) {
    const filter = raw[y * stride];
    assert.ok(filter <= 4, `未知 PNG filter：${filter}`);
    if (channels === 3) continue; // RGB 無 alpha，且上方已排除 tRNS。
    const current = new Uint8Array(info.width);
    for (let x = 0; x < info.width; x++) {
      const left = x ? current[x - 1] : 0;
      const up = previous[x];
      const upperLeft = x ? previous[x - 1] : 0;
      const predictor = [0, left, up, Math.floor((left + up) / 2), paeth(left, up, upperLeft)][filter];
      current[x] = (raw[y * stride + 1 + x * channels + 3] + predictor) & 255;
      assert.equal(current[x], 255, `像素 (${x}, ${y}) 並非完全不透明`);
    }
    previous = current;
  }
}

// 03｜分組執行；失敗仍繼續其他獨立檢查，方便一次看完結果。
const results = [];
async function check(label, operation) {
  try { await operation(); results.push(true); console.log(`通過｜${label}`); }
  catch (error) { results.push(false); console.error(`失敗｜${label}\n${String(error.stack ?? error).slice(0, 1800)}`); }
}

await check('512 SVG 幾何標誌全部位於 maskable 中央安全圓內', () => {
  const svg = master.toString('utf8');
  assert.deepEqual(tags(svg, 'svg')[0].viewBox.trim().split(/[\s,]+/).map(Number), [0, 0, 512, 512]);
  const polygons = tags(svg, 'polygon');
  assert.ok(polygons.length >= 2, '應保留雙 L 幾何標誌');
  for (const polygon of polygons) {
    const values = polygon.points.trim().split(/[\s,]+/).map(Number);
    assert.ok(values.length >= 6 && values.length % 2 === 0 && values.every(Number.isFinite));
    for (let index = 0; index < values.length; index += 2) {
      assert.ok(Math.hypot(values[index] - 256, values[index + 1] - 256) <= 512 * 0.4, `頂點 ${values[index]},${values[index + 1]} 超出安全圓`);
    }
  }
  const background = tags(svg, 'rect').find(rect => Number(rect.width) === 512 && Number(rect.height) === 512);
  assert.ok(background && /^#[\da-f]{6}$/i.test(background.fill), '需有不透明滿版底色');
});

await check('六個 PNG 具有真實 PNG 簽名及正確 IHDR 尺寸', () => {
  for (const size of sizes) {
    const info = pngInfo(pngFiles.get(size));
    assert.equal(info.width, size, `${size} PNG 寬度`);
    assert.equal(info.height, size, `${size} PNG 高度`);
  }
});

await check('六個 PNG 解出 alpha 後每個像素均完全不透明', () => {
  for (const size of sizes) assertOpaque(pngInfo(pngFiles.get(size)));
});

await check('根目錄 Apple 圖示及舊 SVG 路徑與正式主檔一致', async () => {
  assert.ok((await read('apple-touch-icon.png')).equals(pngFiles.get(180)));
  assert.ok((await read('assets/mark.svg')).equals(master));
});

await check('favicon.ico 包含與正式 32 PNG 相同的有效 PNG payload', async () => {
  const ico = await read('favicon.ico');
  assert.ok(ico.length >= 22);
  assert.equal(ico.readUInt16LE(0), 0);
  assert.equal(ico.readUInt16LE(2), 1);
  const count = ico.readUInt16LE(4);
  assert.ok(count >= 1 && 6 + count * 16 <= ico.length);
  let matched = false;
  for (let index = 0; index < count; index++) {
    const entry = 6 + index * 16;
    const length = ico.readUInt32LE(entry + 8);
    const offset = ico.readUInt32LE(entry + 12);
    assert.ok(offset >= 6 + count * 16 && offset + length <= ico.length);
    if (ico[entry] !== 32 || ico[entry + 1] !== 32) continue;
    const payload = ico.subarray(offset, offset + length);
    assert.equal(pngInfo(payload).width, 32);
    assert.equal(pngInfo(payload).height, 32);
    assert.ok(payload.equals(pngFiles.get(32)));
    matched = true;
  }
  assert.ok(matched, '未找到 32×32 PNG payload');
});

await check('Manifest 名稱與共用 profile／站名一致，基本安裝欄位有效', () => {
  assert.equal(manifest.name, `${settings.profile.name}｜${settings.siteName}`);
  assert.equal(manifest.short_name, settings.profile.name);
  assert.equal(manifest.lang, 'zh-Hant');
  assert.equal(manifest.display, 'standalone');
  assert.ok(manifest.description && manifest.description.trim());
  for (const key of ['background_color', 'theme_color']) assert.match(manifest[key], /^#[\da-f]{6}$/i);
});

await check('Manifest 圖示均為本機資源，宣告尺寸與真實 PNG 一致', async () => {
  assert.ok(Array.isArray(manifest.icons) && manifest.icons.length);
  for (const icon of manifest.icons) {
    const info = pngInfo(await readFile(localAsset(icon.src)));
    assert.equal(icon.sizes, `${info.width}x${info.height}`);
    assert.equal(icon.type, 'image/png');
    assert.ok(icon.purpose.split(/\s+/).every(purpose => ['any', 'maskable'].includes(purpose)));
  }
  for (const size of [192, 512]) assert.ok(manifest.icons.some(icon => icon.sizes === `${size}x${size}` && icon.purpose.split(/\s+/).includes('any')));
  assert.ok(manifest.icons.some(icon => icon.sizes === '512x512' && icon.purpose.split(/\s+/).includes('maskable')));
});

await check('Manifest scope／start_url／id 在網域根目錄及部署子目錄皆正確', () => {
  for (const base of ['https://example.invalid/', 'https://example.invalid/personal-site/']) {
    const manifestUrl = new URL('site.webmanifest', base);
    const scope = new URL(manifest.scope, manifestUrl);
    const start = new URL(manifest.start_url, manifestUrl);
    assert.equal(scope.href, base);
    assert.equal(new URL(manifest.id, manifestUrl).href, base);
    assert.equal(start.href, new URL('index.html#home', base).href);
    assert.ok(start.href.startsWith(scope.href));
    for (const icon of manifest.icons) assert.ok(new URL(icon.src, manifestUrl).href.startsWith(base));
  }
});

await check('HTML 的 Apple／Manifest／favicon 與 title、meta 指向一致', async () => {
  const links = tags(html, 'link');
  const oneLink = rel => {
    const matches = links.filter(link => link.rel === rel);
    assert.equal(matches.length, 1, `${rel} 不可缺少或重複`);
    return matches[0];
  };
  const apple = oneLink('apple-touch-icon');
  assert.equal(apple.sizes, '180x180');
  assert.ok((await readFile(localAsset(apple.href))).equals(pngFiles.get(180)));
  assert.equal(oneLink('manifest').href, 'site.webmanifest');
  for (const link of links.filter(link => link.rel === 'icon')) await readFile(localAsset(link.href));
  assert.ok(links.some(link => link.rel === 'icon' && link.type === 'image/svg+xml' && link.href === masterPath));
  assert.ok(links.some(link => link.rel === 'icon' && link.href === 'favicon.ico' && link.sizes === '32x32'));
  assert.equal(html.match(/<title>([^<]*)<\/title>/i)?.[1], manifest.name);
  const meta = Object.fromEntries(tags(html, 'meta').filter(item => item.name).map(item => [item.name, item.content]));
  assert.equal(meta['apple-mobile-web-app-title'], manifest.short_name);
  assert.equal(meta['apple-mobile-web-app-capable'], 'yes');
  assert.equal(meta['mobile-web-app-capable'], 'yes');
  assert.equal(meta['apple-mobile-web-app-status-bar-style'], 'default');
  assert.ok(meta.description.includes(settings.profile.name));
  assert.match(meta['theme-color'], /^#[\da-f]{6}$/i);
});

await check('頁首正式 render 使用本機品牌圖，保留名稱與原五個導覽網址', async () => {
  assert.ok((await readFile(localAsset(header.brandImage))).equals(master));
  const rendered = context.SiteHeader.render(settings, header);
  const brand = tags(rendered, 'a').find(link => link.class?.split(/\s+/).includes('brand'));
  const image = tags(rendered, 'img').find(img => img.src === header.brandImage);
  assert.ok(image);
  assert.equal(image.alt, '');
  assert.ok(Number(image.width) > 0 && Number(image.height) > 0);
  assert.equal(brand.href, '#home');
  assert.equal(brand['aria-label'], settings.profile.name + ' 首頁');
  const views = tags(html, 'section').filter(section => section.class?.split(/\s+/).includes('view'));
  const navigation = tags(rendered, 'a').filter(link => link['data-view']);
  for (const id of requiredViews) {
    assert.ok(header.navigation.some(item => item.id === id));
    assert.equal(views.filter(view => view['data-view'] === id).length, 1);
    assert.equal(navigation.find(link => link['data-view'] === id)?.href, '#' + id);
  }
  for (const path of ['https://example.invalid/logo.svg', 'javascript:alert(1)', '../logo.svg', '/logo.svg', 'data:image/svg+xml,x']) {
    assert.equal(context.SiteComponentUtils.safeAssetPath(path), '');
    assert.equal(tags(context.SiteHeader.render(settings, { ...header, brandImage: path }), 'img').length, 0);
  }
});

const passed = results.filter(Boolean).length;
console.log(`\n品牌圖示：${passed}/${results.length} 組通過。`);
console.log('範圍：本機檔案、幾何安全區、PNG alpha、ICO、Manifest 與正式頁首輸出；不代替實機安裝及系統遮罩測試。');
if (passed !== results.length) process.exitCode = 1;
