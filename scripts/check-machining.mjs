/** 加工計算核心回歸｜執行 node scripts/check-machining.mjs，不使用網路或改寫檔案。 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

// ── 01｜載入本機模組，並確認 classic script 在瀏覽器環境可提供相同介面。 ──
const require = createRequire(import.meta.url);
const math = require('../dist/tools/machining-calculator/engine.js');
const catalog = require('../dist/tools/machining-calculator/catalog.js');
let checks = 0;
function check(title, callback) {
  callback();
  checks += 1;
}
function close(actual, expected, label = '數值') {
  assert.ok(Number.isFinite(actual), `${label}必須有限`);
  assert.ok(Math.abs(actual - expected) <= Math.max(1e-12, Math.abs(expected) * 1e-12), `${label}：${actual} ≠ ${expected}`);
}
function rangeError(callback) {
  assert.throws(callback, RangeError);
}

const browser = vm.createContext({ window: {} });
for (const filename of ['engine.js', 'catalog.js']) {
  const url = new URL('../dist/tools/machining-calculator/' + filename, import.meta.url);
  vm.runInContext(await readFile(url, 'utf8'), browser, { filename });
}
check('瀏覽器與 Node 介面一致', () => {
  assert.equal(browser.window.MachiningMath, browser.MachiningMath);
  assert.equal(browser.window.MACHINING_CATALOG, browser.MACHINING_CATALOG);
  assert.deepEqual(Object.keys(browser.MachiningMath).sort(), Object.keys(math).sort());
  close(browser.MachiningMath.milling({ diameter: 12, cuttingSpeed: 120, teeth: 4, feedPerTooth: 0.05 }).feedRate, 636.6197723675814);
});

// ── 02｜公式硬值與單位往返：預期值獨立固定，避免只複製實作公式。 ──
check('銑削 12 mm／120 m/min／4 刃／0.05 mm/tooth', () => {
  const value = math.milling({ diameter: 12, cuttingSpeed: 120, teeth: 4, feedPerTooth: 0.05 });
  close(value.rpm, 3183.098861837907, '銑削轉速');
  close(value.feedRate, 636.6197723675814, '銑削進給');
});
check('鑽削與車削每轉進給', () => {
  for (const method of ['drilling', 'turning']) {
    const value = math[method]({ diameter: 20, cuttingSpeed: 100, feedPerRev: 0.2 });
    close(value.rpm, 1591.5494309189535, `${method} 轉速`);
    close(value.feedRate, 318.3098861837907, `${method} 進給`);
  }
});
check('螺距與 TPI 換算', () => {
  close(math.tpiToPitch(20), 1.27);
  close(math.pitchToTpi(1.27), 20);
  close(math.tpiToPitch(math.pitchToTpi(1.5)), 1.5);
  assert.deepEqual(math.thread({ majorDiameter: 10, pitch: 1.5 }), { pitch: 1.5, tpi: 25.4 / 1.5, tapDrill: 8.5 });
});
check('公釐與英吋含偏差正負號往返', () => {
  close(math.mmToInch(25.4), 1);
  close(math.inchToMm(1), 25.4);
  for (const value of [0, 0.001, 12, 1000, -0.025]) close(math.inchToMm(math.mmToInch(value)), value);
});

// ── 03｜圖面上下限與配合：包含間隙、過盈、過渡及零邊界。 ──
check('偏差可以為零或負數', () => {
  assert.deepEqual(math.limits(20, 0.021, 0), { min: 20, max: 20.021 });
  assert.deepEqual(math.limits(20, -0.007, -0.020), { min: 19.98, max: 19.993 });
});
check('已知間隙配合', () => {
  const value = math.fit(20, 20.021, 19.98, 19.993);
  close(value.minClearance, 0.007);
  close(value.maxClearance, 0.041);
  assert.equal(value.type, 'clearance');
});
check('已知過盈與過渡配合', () => {
  let value = math.fit(20, 20.01, 20.02, 20.03);
  close(value.minClearance, -0.03);
  close(value.maxClearance, -0.01);
  assert.equal(value.type, 'interference');
  value = math.fit(20, 20.02, 20.01, 20.03);
  close(value.minClearance, -0.03);
  close(value.maxClearance, 0.01);
  assert.equal(value.type, 'transition');
});
check('零間隙邊界', () => {
  assert.equal(math.fit(20, 20.01, 19.99, 20).type, 'clearance');
  assert.equal(math.fit(20, 20.01, 20.01, 20.02).type, 'interference');
  assert.deepEqual(math.fit(20, 20, 20, 20), { minClearance: 0, maxClearance: 0, type: 'clearance' });
});

// ── 04｜拒絕不合法數值：不默默轉字串、不接受非有限數字或反向尺寸範圍。 ──
check('每個切削輸入的零、負值、空值與非有限數字', () => {
  const cases = [
    ['milling', { diameter: 12, cuttingSpeed: 120, teeth: 4, feedPerTooth: 0.05 }],
    ['drilling', { diameter: 12, cuttingSpeed: 120, feedPerRev: 0.2 }],
    ['turning', { diameter: 12, cuttingSpeed: 120, feedPerRev: 0.2 }],
    ['thread', { majorDiameter: 10, pitch: 1.5 }]
  ];
  for (const [method, valid] of cases) {
    for (const key of Object.keys(valid)) {
      for (const invalid of [0, -1, NaN, Infinity, -Infinity, undefined, null, '', '12']) {
        rangeError(() => math[method]({ ...valid, [key]: invalid }));
      }
    }
    for (const invalid of [undefined, null, [], 12, '']) rangeError(() => math[method](invalid));
  }
});
check('刀刃必須為安全整數', () => {
  for (const teeth of [1.5, Number.MAX_SAFE_INTEGER + 1]) {
    rangeError(() => math.milling({ diameter: 12, cuttingSpeed: 120, teeth, feedPerTooth: 0.05 }));
  }
});
check('偏差與配合尺寸的有效範圍', () => {
  for (const args of [[0, 0, 0], [-1, 0, 0], [20, -0.02, 0], [20, 0, -20], [20, NaN, 0], [20, 0, Infinity], [20, '0', 0]]) rangeError(() => math.limits(...args));
  for (const args of [[20, 19, 19, 20], [20, 21, 21, 20], [0, 20, 19, 20], [20, 21, NaN, 20], [20, Infinity, 19, 20]]) rangeError(() => math.fit(...args));
  rangeError(() => math.thread({ majorDiameter: 1, pitch: 1 }));
  rangeError(() => math.thread({ majorDiameter: 1, pitch: 2 }));
  for (const value of [0, -1, NaN, Infinity, '20']) {
    rangeError(() => math.pitchToTpi(value));
    rangeError(() => math.tpiToPitch(value));
  }
  for (const value of [NaN, Infinity, undefined, '1']) {
    rangeError(() => math.mmToInch(value));
    rangeError(() => math.inchToMm(value));
  }
});
check('數字極值不能傳出 Infinity 或下溢零值', () => {
  rangeError(() => math.milling({ diameter: Number.MIN_VALUE, cuttingSpeed: 1, teeth: 4, feedPerTooth: 0.05 }));
  rangeError(() => math.drilling({ diameter: Number.MAX_VALUE, cuttingSpeed: Number.MIN_VALUE, feedPerRev: 0.2 }));
  rangeError(() => math.turning({ diameter: 1, cuttingSpeed: 1, feedPerRev: Number.MAX_VALUE }));
  rangeError(() => math.limits(Number.MAX_VALUE, Number.MAX_VALUE, 0));
  rangeError(() => math.pitchToTpi(Number.MIN_VALUE));
  rangeError(() => math.tpiToPitch(Number.MIN_VALUE));
  rangeError(() => math.inchToMm(Number.MAX_VALUE));
  rangeError(() => math.mmToInch(Number.MIN_VALUE));
  assert.ok(Number.isFinite(math.mmToInch(Number.MAX_VALUE)));
});

// ── 05｜目錄與來源：分類穩定、方法存在、所有外部來源皆為 Sandvik 官方。 ──
check('目錄方法與來源相符', () => {
  assert.deepEqual(catalog.categories.map(item => item.id), ['milling', 'drilling', 'turning', 'thread', 'tolerance']);
  const ids = new Set(catalog.sources.map(item => item.id));
  assert.equal(ids.size, catalog.sources.length);
  const toolIds = new Set();
  for (const source of catalog.sources) {
    for (const key of ['id', 'title', 'url', 'scope']) assert.ok(typeof source[key] === 'string' && source[key].trim());
    const url = new URL(source.url);
    assert.equal(url.protocol, 'https:');
    assert.ok(url.hostname === 'sandvik.coromant.com' || url.hostname.endsWith('.sandvik.coromant.com'));
  }
  for (const category of catalog.categories) {
    for (const key of ['id', 'title', 'english', 'description', 'icon', 'color']) assert.ok(typeof category[key] === 'string' && category[key].trim());
    assert.ok(category.tools.length);
    for (const tool of category.tools) {
      assert.ok(!toolIds.has(tool.id), `工具 ID 重複：${tool.id}`);
      toolIds.add(tool.id);
      assert.equal(typeof math[tool.method], 'function');
      assert.ok(tool.formula && tool.notes.length);
      for (const id of tool.sourceIds) assert.ok(ids.has(id), `來源不存在：${id}`);
    }
  }
});

console.log(`通過：${checks} 組加工計算回歸、${catalog.categories.length} 個分類、${catalog.sources.length} 個官方來源。`);
