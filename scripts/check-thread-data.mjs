/** 螺紋工件資料檢查｜node scripts/check-thread-data.mjs；離線執行，不改寫檔案。 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const data = require('../dist/tools/machining-calculator/thread-data.js');
const familyIds = new Set(data.families.map(item => item.id));
const sourceIds = new Set(data.sources.map(item => item.id));
let checks = 0;
const check = (title, callback) => { callback(); checks += 1; };
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-10, `${actual} ≠ ${expected}`);
const positive = value => assert.ok(typeof value === 'number' && Number.isFinite(value) && value > 0);

// ── 01｜classic script 與 Node 共用同一套資料，不必依賴伺服器或 fetch。 ──
const browser = vm.createContext({ window: {} });
vm.runInContext(await readFile(new URL('../dist/tools/machining-calculator/thread-data.js', import.meta.url), 'utf8'), browser, { filename: 'thread-data.js' });
check('公開介面與單位', () => {
  assert.equal(data.units, 'mm');
  assert.equal(globalThis.THREAD_DATA, data);
  assert.equal(browser.window.THREAD_DATA, browser.THREAD_DATA);
  assert.equal(JSON.stringify(browser.THREAD_DATA), JSON.stringify(data));
});

// ── 02｜資料身份與追溯：來源必須存在，頁碼一律為 PDF 頁碼。 ──
check('種類與 ID 唯一', () => {
  assert.equal(familyIds.size, data.families.length);
  assert.deepEqual([...familyIds], ['metric-coarse', 'metric-fine', 'unc', 'unf']);
  assert.equal(new Set(data.records.map(item => item.id)).size, data.records.length);
  assert.equal(data.records.length, 36);
  assert.deepEqual(Object.fromEntries(data.families.map(family => [family.id, data.records.filter(record => record.family === family.id).length])), { 'metric-coarse': 10, 'metric-fine': 6, unc: 10, unf: 10 });
  for (const family of data.families) assert.equal(family.angleDeg, 60);
});
check('官方來源與說明', () => {
  assert.equal(sourceIds.size, data.sources.length);
  for (const source of data.sources) {
    for (const key of ['id', 'title', 'url', 'scope']) assert.ok(typeof source[key] === 'string' && source[key].trim());
    const url = new URL(source.url);
    assert.equal(url.protocol, 'https:');
    assert.ok(url.hostname === 'www.osg.co.jp' || (url.hostname === 'res.cloudinary.com' && url.pathname.startsWith('/osg-usa-inc/')));
  }
});
check('每筆欄位完整可定位', () => {
  for (const record of data.records) {
    assert.match(record.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(familyIds.has(record.family));
    for (const key of ['sizeLabel', 'designation', 'scope']) assert.ok(typeof record[key] === 'string' && record[key].trim());
    positive(record.diameterMm); positive(record.pitchMm);
    assert.ok(record.sourceIds.length);
    for (const id of record.sourceIds) assert.ok(sourceIds.has(id));
    for (const side of ['internal', 'external']) {
      const limits = record[side];
      assert.ok(typeof limits.className === 'string' && limits.className);
      assert.ok(sourceIds.has(limits.sourceId));
      assert.ok(record.sourceIds.includes(limits.sourceId));
      assert.ok(Number.isSafeInteger(limits.page) && limits.page > 0);
      assert.ok(limits.pageLabel && limits.scope);
    }
  }
});

// ── 03｜限界檢查：允許缺值，拒絕 NaN、Infinity、顛倒上下限或錯置尺寸欄。 ──
check('所有限界有限且排序正確', () => {
  for (const record of data.records) {
    for (const side of ['internal', 'external']) {
      for (const kind of ['major', 'pitch', 'minor']) {
        const bounds = record[side][kind];
        assert.ok(bounds && Object.hasOwn(bounds, 'min') && Object.hasOwn(bounds, 'max'));
        for (const value of [bounds.min, bounds.max]) if (value !== null) positive(value);
        if (bounds.min !== null && bounds.max !== null) assert.ok(bounds.min <= bounds.max, `${record.id}/${side}/${kind}`);
      }
    }
    assert.ok(record.external.pitch.max < record.external.major.min, record.id);
    assert.ok(record.internal.minor.max < record.internal.pitch.min, record.id);
    assert.ok(record.external.pitch.max <= record.internal.pitch.min, record.id);
  }
});
check('原表缺限界一律保持 null', () => {
  for (const record of data.records) {
    assert.deepEqual(record.internal.major, { min: null, max: null });
    assert.deepEqual(record.external.minor, { min: null, max: null });
    assert.equal(record.basic.minorExternal, null);
    assert.ok(!Object.hasOwn(record, 'tapDrill'));
  }
});
check('基本尺寸與限界分開', () => {
  for (const record of data.records) {
    assert.equal(record.basic.major, record.diameterMm);
    assert.equal(record.basic.pitch, record.internal.pitch.min);
    for (const kind of ['major', 'pitch', 'minorInternal', 'minorExternal']) if (record.basic[kind] !== null) positive(record.basic[kind]);
    if (record.family.startsWith('metric-')) assert.equal(record.basic.minorInternal, record.internal.minor.min);
    else assert.equal(record.basic.minorInternal, null);
  }
});

// ── 04｜公制獨立基準：不是把直徑減牙距作小徑限界。 ──
check('M10 × 1.5 6H／6g 工件值', () => {
  const record = data.records.find(item => item.family === 'metric-coarse' && item.diameterMm === 10 && item.pitchMm === 1.5);
  assert.ok(record);
  assert.equal(record.internal.className, '6H'); assert.equal(record.external.className, '6g');
  assert.deepEqual(record.internal.pitch, { min: 9.026, max: 9.206 });
  assert.deepEqual(record.internal.minor, { min: 8.376, max: 8.676 });
  assert.deepEqual(record.external.major, { min: 9.732, max: 9.968 });
  assert.deepEqual(record.external.pitch, { min: 8.862, max: 8.994 });
  assert.notEqual(record.internal.minor.min, record.diameterMm - record.pitchMm);
  assert.equal(record.internal.page, 102);
});
check('公制細牙與同徑粗牙獨立', () => {
  const fine = data.records.find(item => item.family === 'metric-fine' && item.diameterMm === 10 && item.pitchMm === 1.25);
  assert.deepEqual(fine.internal.pitch, { min: 9.188, max: 9.348 });
  assert.deepEqual(fine.external.major, { min: 9.760, max: 9.972 });
  for (const record of data.records.filter(item => item.family.startsWith('metric-'))) assert.equal(record.tpi, null);
});

// ── 05｜統一牙獨立基準及英制原值往返：只作單位換算，不改公差。 ──
check('1/4-20 UNC 2B／2A 工件值', () => {
  const record = data.records.find(item => item.designation === '1/4-20 UNC');
  assert.ok(record);
  near(record.diameterMm, 6.35); near(record.pitchMm, 1.27); assert.equal(record.tpi, 20);
  assert.equal(record.internal.className, '2B'); assert.equal(record.external.className, '2A');
  assert.deepEqual(record.internal.pitch, { min: 5.5245, max: 5.64896 });
  assert.deepEqual(record.internal.minor, { min: 4.9784, max: 5.2578 });
  assert.deepEqual(record.external.major, { min: 6.11632, max: 6.32206 });
  assert.deepEqual(record.external.pitch, { min: 5.40258, max: 5.49656 });
  assert.deepEqual(record.internal.dimensionPages, { major: null, pitch: 2, minor: 1 });
});
check('所有統一牙限界與英制原值一致', () => {
  for (const record of data.records.filter(item => ['unc', 'unf'].includes(item.family))) {
    positive(record.tpi); assert.ok(Number.isSafeInteger(record.tpi));
    near(record.pitchMm * record.tpi, 25.4);
    for (const side of ['internal', 'external']) {
      for (const kind of ['major', 'pitch', 'minor']) {
        for (const edge of ['min', 'max']) {
          const inch = record.sourceInches[side][kind][edge];
          if (inch === null) assert.equal(record[side][kind][edge], null);
          else { near(record[side][kind][edge], inch * 25.4); near(record[side][kind][edge] / 25.4, inch); }
        }
      }
    }
  }
});

// ── 06｜補充牙系：只讀載入基本牙型資料，不能覆寫核心或偽造限界。 ──
const coreBeforeExtra = JSON.stringify(data);
const extra = require('../dist/tools/machining-calculator/thread-extra-data.js');
vm.runInContext(await readFile(new URL('../dist/tools/machining-calculator/thread-extra-data.js', import.meta.url), 'utf8'), browser, { filename: 'thread-extra-data.js' });
const mergedRecords = [...data.records, ...extra.records];
const mergedFamilies = [...data.families, ...extra.families];
const mergedSources = [...data.sources, ...extra.sources];
const mergedSourceIds = new Set(mergedSources.map(item => item.id));
const extraFamilyIds = new Set(extra.families.map(item => item.id));

check('補充資料 classic script 與 CommonJS 匯出一致', () => {
  assert.equal(globalThis.THREAD_EXTRA_DATA, extra);
  assert.equal(browser.window.THREAD_EXTRA_DATA, browser.THREAD_EXTRA_DATA);
  assert.equal(JSON.stringify(browser.THREAD_EXTRA_DATA), JSON.stringify(extra));
  assert.equal(JSON.stringify(data), coreBeforeExtra, '補充檔不可改寫 Node 核心資料');
  assert.equal(JSON.stringify(browser.THREAD_DATA), coreBeforeExtra, '補充檔不可改寫瀏覽器核心資料');
});
check('補充資料 66 筆與四個牙系', () => {
  assert.equal(extra.records.length, 66);
  assert.equal(extraFamilyIds.size, 4);
  assert.deepEqual([...extraFamilyIds], ['ba', 'bsw', 'bsf', 'g']);
  assert.deepEqual(Object.fromEntries(extra.families.map(family => [family.id, extra.records.filter(record => record.family === family.id).length])), { ba: 17, bsw: 22, bsf: 9, g: 18 });
  for (const family of extra.families) assert.equal(family.angleDeg, family.id === 'ba' ? 47.5 : 55);
});
check('合併 102 筆的 ID、牙系與來源映射唯一', () => {
  assert.equal(mergedRecords.length, 102);
  assert.equal(new Set(mergedRecords.map(item => item.id)).size, 102);
  assert.equal(new Set(mergedFamilies.map(item => item.id)).size, 8);
  assert.equal(mergedSourceIds.size, mergedSources.length);
  assert.equal(mergedSources.length, 6);
  for (const source of extra.sources) {
    for (const key of ['id', 'title', 'url', 'page', 'scope']) assert.ok(typeof source[key] === 'string' && source[key].trim());
    assert.equal(new URL(source.url).protocol, 'https:');
  }
  for (const record of mergedRecords) {
    for (const id of record.sourceIds) assert.ok(mergedSourceIds.has(id), `${record.id} 的來源不存在：${id}`);
  }
});

function validateExtraRecord(record) {
  assert.match(record.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  assert.ok(extraFamilyIds.has(record.family));
  for (const key of ['sizeLabel', 'designation', 'scope']) assert.ok(typeof record[key] === 'string' && record[key].trim());
  positive(record.diameterMm); positive(record.pitchMm);
  assert.ok(record.sourceIds.length);
  for (const id of record.sourceIds) assert.ok(mergedSourceIds.has(id));
  assert.equal(record.internal, null, `${record.id} 不可把基本值填成內牙限界`);
  assert.equal(record.external, null, `${record.id} 不可把基本值填成外牙限界`);
  assert.ok(!Object.hasOwn(record, 'tapDrill'));
  for (const kind of ['major', 'pitch', 'minorInternal', 'minorExternal']) positive(record.basic[kind]);
  assert.equal(record.basic.major, record.diameterMm);
  assert.ok(record.basic.pitch < record.basic.major);
  assert.ok(record.basic.minorInternal < record.basic.pitch);
  assert.ok(record.basic.minorExternal < record.basic.pitch);
  // 內外小徑是獨立欄位，不要求數值相同，也不回填至任何限界欄。
  if (record.tpi !== null) {
    positive(record.tpi);
    assert.ok(Math.abs(record.pitchMm - 25.4 / record.tpi) <= 0.0000005 + 1e-12, `${record.id} 的六位小數牙距換算不一致`);
  }
}
check('補充資料只有基本尺寸且保留獨立內外小徑', () => {
  for (const record of extra.records) validateExtraRecord(record);
  const base = extra.records.find(item => item.id === 'ba-0');
  // 只在記憶體建立不同內外小徑的驗證樣本；不改原資料，也不宣稱它是 BA 0 的表值。
  const independentMinors = { ...base, basic: { ...base.basic, minorInternal: 4.8, minorExternal: 4.7 } };
  validateExtraRecord(independentMinors);
  assert.notEqual(independentMinors.basic.minorInternal, independentMinors.basic.minorExternal);
  assert.equal(base.basic.minorExternal, 4.8, '驗證樣本不可改寫原始資料');
});
check('BA 0 基本值為 6／5.4／4.8 mm', () => {
  const record = extra.records.find(item => item.id === 'ba-0');
  assert.ok(record);
  assert.equal(record.diameterMm, 6); assert.equal(record.pitchMm, 1); assert.equal(record.tpi, null);
  assert.deepEqual(record.basic, { major: 6, pitch: 5.4, minorInternal: 4.8, minorExternal: 4.8 });
  assert.equal(record.internal, null); assert.equal(record.external, null);
});
check('G 1/2 管牙外徑使用表值，不把公稱尺寸當外徑', () => {
  const record = extra.records.find(item => item.id === 'g-1-2');
  assert.ok(record);
  assert.equal(record.diameterMm, 20.955);
  assert.equal(record.basic.major, 20.955);
  assert.notEqual(record.diameterMm, 12.7);
  assert.equal(record.tpi, 14);
  assert.equal(record.internal, null); assert.equal(record.external, null);
});
check('BSF 1/4 為 26 TPI，不混用 UNC／BSW', () => {
  const record = extra.records.find(item => item.id === 'bsf-1-4');
  assert.ok(record);
  assert.equal(record.diameterMm, 6.35); assert.equal(record.tpi, 26);
  assert.equal(record.pitchMm, 0.976923);
  assert.equal(extra.records.find(item => item.id === 'bsw-1-4').tpi, 20);
  assert.equal(record.internal, null); assert.equal(record.external, null);
});

console.log(`通過：${checks} 組螺紋資料檢查、${data.records.length} 筆工件限界、${extra.records.length} 筆基本牙型，合併 ${mergedRecords.length} 筆／${mergedFamilies.length} 牙系／${mergedSources.length} 個來源。`);
