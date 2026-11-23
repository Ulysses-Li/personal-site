/**
 * 國際公差資料與查詢核心的獨立檢查器。
 * 執行：node scripts/check-iso-tolerance.mjs
 * 只讀本機檔案；不連網、不修改資料、不依公式補出原表空白。
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const directory = new URL('../dist/tools/machining-calculator/', import.meta.url);
const names = ['iso-hole-data.js', 'iso-shaft-data.js', 'iso-it-data.js', 'tolerance-engine.js'];
const [holeData, shaftData, itData, IsoToleranceMath] = names.map(name => require(fileURLToPath(new URL(name, directory))));
const api = IsoToleranceMath.create({ holeData, shaftData, itData });
const results = [];
const counters = { boundaryRows: 0, widthRows: 0, widthSegments: 0, missingIntervals: 0 };
const almost = (actual, expected, message) => assert.ok(Math.abs(actual - expected) <= 1e-9, `${message}：實際 ${actual}，預期 ${expected}`);
const identity = row => `${row.zone ?? 'IT'}${row.grade} (${row.minMm}, ${row.maxMm}]`;

// 01｜每組各自回報，前一組失敗仍繼續蒐集其他真實問題。
function check(name, operation) {
  try {
    operation();
    results.push({ name, passed: true });
  } catch (error) {
    results.push({ name, passed: false, message: error?.message || String(error) });
  }
}

function noIssues(issues) {
  assert.equal(issues.length, 0, `${issues.length} 個問題：\n${issues.slice(0, 20).join('\n')}${issues.length > 20 ? '\n（其餘略）' : ''}`);
}

function grouped(records, includeZone = true) {
  const groups = new Map();
  for (const row of records) {
    const key = includeZone ? `${row.zone}|${row.grade}` : row.grade;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  for (const rows of groups.values()) rows.sort((a, b) => a.minMm - b.minMm || a.maxMm - b.maxMm);
  return groups;
}

// 此比較器不使用 engine.contains，避免以受測方法替自己證明尺寸邊界。
function referenceContains(row, diameter) {
  return Number.isFinite(diameter) && diameter > 0 && diameter > row.minMm && diameter <= row.maxMm
    && (row.minimumNominalMm === undefined || (row.minimumNominalExclusive ? diameter > row.minimumNominalMm : diameter >= row.minimumNominalMm));
}

function lookup(member, zone, grade, nominalMm) {
  return api.lookup({ member, zone, grade, nominalMm });
}

function deviations(member, zone, grade, nominalMm, expectedLower, expectedUpper) {
  const row = lookup(member, zone, grade, nominalMm);
  assert.ok(row, `${member} ${zone}${grade}，D=${nominalMm} 應有原表資料`);
  almost(row.lowerUm, expectedLower, `${zone}${grade}下偏差`);
  almost(row.upperUm, expectedUpper, `${zone}${grade}上偏差`);
  return row;
}

// 02｜欄位、出處及公差帶大小寫；不將字串數字或空欄位視為有效數值。
for (const [member, data] of [['hole', holeData], ['shaft', shaftData], ['it', itData]]) {
  check(`${member}：資料與來源 schema`, () => {
    const issues = [];
    assert.ok(Array.isArray(data.sources) && data.sources.length > 0);
    assert.ok(Array.isArray(data.records) && data.records.length > 0);
    if (member !== 'it') assert.equal(data.member, member);
    const sourceIds = new Set();
    for (const source of data.sources) {
      if (sourceIds.has(source.id)) issues.push(`來源ID重複：${source.id}`);
      sourceIds.add(source.id);
      for (const field of ['id', 'title', 'url', 'version', 'page', 'scope']) {
        if (typeof source[field] !== 'string' || !source[field].trim()) issues.push(`來源缺少 ${field}：${source.id}`);
      }
      try {
        if (!['https:', 'http:'].includes(new URL(source.url).protocol)) issues.push(`來源不是HTTP網址：${source.id}`);
      } catch {
        issues.push(`來源網址無效：${source.id}`);
      }
    }
    for (const row of data.records) {
      const label = identity(row);
      if (typeof row.grade !== 'string' || !/^(01|0|[1-9]|1[0-8])$/.test(row.grade)) issues.push(`${label}：grade須保留為字串`);
      if (![row.minMm, row.maxMm].every(Number.isFinite) || row.minMm < 0 || row.minMm >= row.maxMm || row.maxMm > 500) issues.push(`${label}：尺寸範圍不符本檔0–500 mm契約`);
      if (!sourceIds.has(row.sourceId) || typeof row.pageLabel !== 'string' || !row.pageLabel.trim()) issues.push(`${label}：來源或頁碼未能定位`);
      if (member === 'it') {
        if (!Number.isFinite(row.widthUm) || row.widthUm <= 0) issues.push(`${label}：IT寬度無效`);
      } else {
        if (typeof row.zone !== 'string' || !/^[A-Za-z]{1,2}$/.test(row.zone) || row.zone !== (member === 'hole' ? row.zone.toUpperCase() : row.zone.toLowerCase())) issues.push(`${label}：孔／軸公差帶大小寫錯誤`);
        if (![row.lowerUm, row.upperUm].every(Number.isFinite) || row.lowerUm >= row.upperUm) issues.push(`${label}：上下偏差無效或順序顛倒`);
      }
      if (row.minimumNominalMm !== undefined && (!Number.isFinite(row.minimumNominalMm) || row.minimumNominalMm < row.minMm || row.minimumNominalMm > row.maxMm)) issues.push(`${label}：表註最小尺寸無效`);
      if (row.minimumNominalExclusive !== undefined && (typeof row.minimumNominalExclusive !== 'boolean' || row.minimumNominalMm === undefined)) issues.push(`${label}：排除下界條件缺少尺寸`);
    }
    noIssues(issues);
  });

  check(`${member}：無重複、重疊區間`, () => {
    const issues = [];
    const seen = new Set();
    for (const row of data.records) {
      const key = `${row.zone ?? 'IT'}|${row.grade}|${row.minMm}|${row.maxMm}`;
      if (seen.has(key)) issues.push(`重複：${identity(row)}`);
      seen.add(key);
    }
    for (const rows of grouped(data.records, member !== 'it').values()) {
      for (let index = 1; index < rows.length; index++) {
        if (rows[index].minMm < rows[index - 1].maxMm) issues.push(`重疊：${identity(rows[index - 1])} 與 ${identity(rows[index])}`);
      }
    }
    noIssues(issues);
  });
}

// 03｜全部偏差寬度對照獨立IT資料；逐段覆蓋，避免只測中點漏掉跨段錯誤。
for (const [member, data] of [['hole', holeData], ['shaft', shaftData]]) {
  check(`${member}：所有偏差寬度符合IT原表`, () => {
    const issues = [];
    for (const row of data.records) {
      const matches = itData.records.filter(it => it.grade === row.grade && it.minMm < row.maxMm && it.maxMm > row.minMm).sort((a, b) => a.minMm - b.minMm);
      let coveredTo = row.minMm;
      for (const it of matches) {
        if (it.minMm > coveredTo) issues.push(`${identity(row)}：IT區間沒有連續覆蓋`);
        if (Math.abs((row.upperUm - row.lowerUm) - it.widthUm) > 1e-9) issues.push(`${identity(row)}：寬度 ${row.upperUm - row.lowerUm} μm ≠ IT${it.grade} ${it.widthUm} μm；${row.pageLabel}`);
        coveredTo = Math.max(coveredTo, it.maxMm);
        counters.widthSegments++;
      }
      if (coveredTo < row.maxMm) issues.push(`${identity(row)}：找不到完整IT對照`);
      counters.widthRows++;
    }
    noIssues(issues);
  });

  check(`${member}：每筆lookup與上下開閉邊界`, () => {
    const issues = [];
    for (const rows of grouped(data.records).values()) {
      for (const row of rows) {
        const start = Math.max(row.minMm, row.minimumNominalMm ?? row.minMm);
        const midpoint = (start + row.maxMm) / 2;
        if (lookup(member, row.zone, row.grade, midpoint) !== row) issues.push(`${identity(row)}：中間尺寸未回到該原表格`);
        for (const diameter of [row.minMm, row.maxMm]) {
          const expected = rows.find(candidate => referenceContains(candidate, diameter)) || null;
          if (lookup(member, row.zone, row.grade, diameter) !== expected) issues.push(`${identity(row)}：D=${diameter}的相鄰段選擇錯誤`);
          if (api.contains(row, diameter) !== referenceContains(row, diameter)) issues.push(`${identity(row)}：contains在D=${diameter}的開閉錯誤`);
        }
        counters.boundaryRows++;
      }
    }
    noIssues(issues);
  });

  check(`${member}：空白、區間外均不外推`, () => {
    const issues = [];
    for (const rows of grouped(data.records).values()) {
      const { zone, grade } = rows[0];
      const first = rows[0], last = rows.at(-1);
      const samples = [last.maxMm + 1];
      const usableStart = Math.max(first.minMm, first.minimumNominalMm ?? first.minMm);
      if (usableStart > 0) samples.push(usableStart / 2);
      for (let index = 1; index < rows.length; index++) {
        if (rows[index].minMm > rows[index - 1].maxMm) samples.push((rows[index].minMm + rows[index - 1].maxMm) / 2);
      }
      for (const nominalMm of samples) {
        if (lookup(member, zone, grade, nominalMm) !== null) issues.push(`${zone}${grade}在未收錄D=${nominalMm}出現外推值`);
        counters.missingIntervals++;
      }
    }
    noIssues(issues);
  });
}

// 04｜指定原表實例：A9/H7/g6與j/js/k不能以同一位置公式取代。
check('A9與H7：尺寸段端點', () => {
  deviations('hole', 'A', '9', 1, 270, 295);
  deviations('hole', 'A', '9', 3, 270, 295);
  deviations('hole', 'A', '9', 3.000001, 270, 300);
  deviations('hole', 'H', '7', 18, 0, 18);
  deviations('hole', 'H', '7', 18.000001, 0, 21);
  deviations('hole', 'H', '7', 30, 0, 21);
  deviations('hole', 'H', '7', 30.000001, 0, 25);
  deviations('hole', 'H', '7', 500, 0, 63);
});

check('g6/h6：18與30的上下開閉', () => {
  deviations('shaft', 'g', '6', 18, -17, -6);
  deviations('shaft', 'g', '6', 18.000001, -20, -7);
  deviations('shaft', 'g', '6', 30, -20, -7);
  deviations('shaft', 'g', '6', 30.000001, -25, -9);
  deviations('shaft', 'h', '6', 25, -13, 0);
});

check('j/js：半公差與較大直徑原表分段', () => {
  deviations('shaft', 'js', '6', 25, -6.5, 6.5);
  deviations('shaft', 'j', '6', 25, -4, 9);
  deviations('shaft', 'j', '5', 3, -2, 2);
  deviations('shaft', 'j', '5', 3.000001, -2, 3);
  deviations('shaft', 'j', '6', 250, -13, 16);
  deviations('shaft', 'j', '6', 250.000001, -16, 16);
  deviations('shaft', 'j', '7', 400, -28, 29);
  deviations('shaft', 'js', '7', 400, -28.5, 28.5);
});

check('k：等級差異與原表空欄', () => {
  deviations('shaft', 'k', '6', 25, 2, 15);
  deviations('shaft', 'k', '3', 4, 0, 2.5);
  deviations('shaft', 'k', '4', 4, 1, 5);
  deviations('shaft', 'k', '8', 4, 0, 18);
  assert.equal(lookup('shaft', 'k', '3', 50.000001), null);
});

check('1 mm表註：a/A/b/B含1，h/H/js/JS高等級不含1', () => {
  for (const [member, zone] of [['hole', 'A'], ['hole', 'B'], ['shaft', 'a'], ['shaft', 'b']]) {
    assert.equal(lookup(member, zone, '9', 0.999999), null);
    assert.ok(lookup(member, zone, '9', 1));
  }
  for (const [member, zone] of [['hole', 'H'], ['hole', 'JS'], ['shaft', 'h'], ['shaft', 'js']]) {
    for (const grade of ['14', '15', '16']) {
      assert.equal(lookup(member, zone, grade, 1), null);
      assert.ok(lookup(member, zone, grade, 1.000001));
    }
    for (const grade of ['17', '18']) assert.equal(lookup(member, zone, grade, 3), null);
  }
  for (const grade of ['9', '10', '11']) {
    assert.equal(lookup('hole', 'N', grade, 1), null);
    assert.ok(lookup('hole', 'N', grade, 1.000001));
  }
});

check('原表mm欄轉μm，仍保留原數值精度', () => {
  deviations('shaft', 'h', '12', 25, -210, 0);
  deviations('shaft', 'js', '12', 25, -105, 105);
  deviations('hole', 'H', '12', 25, 0, 210);
  deviations('hole', 'JS', '12', 25, -105, 105);
});

check('已知空白與疑誤格不得補值', () => {
  for (const [member, zone, grade, diameter] of [
    ['shaft', 't', '6', 24], ['shaft', 'v', '6', 14], ['shaft', 'y', '6', 18],
    ['shaft', 'cd', '6', 10.000001], ['shaft', 'g', '9', 60],
    ['shaft', 'za', '11', 240], ['hole', 'A', '9', 500.000001],
    ['hole', 'H', '01', 25], ['shaft', 'h', '0', 25],
    ['hole', 'ZZ', '6', 25], ['shaft', 'zz', '6', 25]
  ]) assert.equal(lookup(member, zone, grade, diameter), null, `${zone}${grade}，D=${diameter}`);
  assert.ok(shaftData.omissions.some(row => row.zone === 'za' && row.grade === '11' && row.minMm === 225 && row.maxMm === 250 && row.reason));
  assert.ok(lookup('shaft', 't', '6', 24.000001));
  assert.ok(lookup('shaft', 'v', '6', 14.000001));
  assert.ok(lookup('shaft', 'y', '6', 18.000001));
});

// 05｜尺寸與配合直接以μm計算，零間隙邊界不可被浮點誤差翻轉。
check('dimensions：μm轉mm與範圍拒絕', () => {
  const row = lookup('shaft', 'g', '6', 25);
  const sizes = api.dimensions(row, 25);
  almost(sizes.minimumMm, 24.98, 'g6最小實際尺寸');
  almost(sizes.maximumMm, 24.993, 'g6最大實際尺寸');
  almost(sizes.widthUm, 13, 'g6公差寬度');
  assert.throws(() => api.dimensions(row, 18), RangeError);
  assert.throws(() => api.dimensions(row, 30.000001), RangeError);
});

check('非正實際尺寸不能當成有效尺寸或配合', () => {
  const row = lookup('hole', 'ZC', '11', 0.01);
  assert.ok(row, '原表偏差仍可查到，不應改造原表');
  assert.throws(() => api.dimensions(row, 0.01), RangeError);
  assert.equal(api.fit(0.01, 'ZC11', 'h6'), null);
});

check('fit：間隙／過渡／過盈三類與確切範圍', () => {
  for (const [shaftClass, minimumUm, maximumUm, type] of [
    ['g6', 7, 41, '間隙配合'], ['k6', -15, 19, '過渡配合'], ['p6', -35, -1, '過盈配合']
  ]) {
    const fit = api.fit(25, 'H7', shaftClass);
    assert.ok(fit);
    assert.equal(fit.minimumUm, minimumUm);
    assert.equal(fit.maximumUm, maximumUm);
    assert.equal(fit.type, type);
    almost(fit.holeDimensions.minimumMm, 25, 'H7最小尺寸');
    almost(fit.holeDimensions.maximumMm, 25.021, 'H7最大尺寸');
  }
  const zeroMinimum = api.fit(25, 'H7', 'h6');
  assert.equal(zeroMinimum.minimumUm, 0);
  assert.equal(zeroMinimum.type, '間隙配合');
  const zeroMaximum = api.fit(2, 'H6', 'p6');
  assert.equal(zeroMaximum.maximumUm, 0);
  assert.equal(zeroMaximum.type, '過盈配合');
});

check('fit：順序、大小寫、缺項及尺寸無效時拒絕', () => {
  for (const [diameter, hole, shaft] of [[25, 'g6', 'H7'], [25, 'H7', 'G6'], [25, 'h7', 'g6'], [25, 'H01', 'g6'], [240, 'H7', 'za11'], [501, 'H7', 'g6'], [0, 'H7', 'g6']]) assert.equal(api.fit(diameter, hole, shaft), null);
});

check('浮點往返只吸收機器誤差，實際跨段仍切換', () => {
  const row = { minMm: 18, maxMm: 30 };
  assert.equal(api.contains(row, 30 + Number.EPSILON * 30), true);
  assert.equal(api.contains(row, 18 + Number.EPSILON * 18), false);
  assert.equal(api.contains(row, 30.000001), false);
  assert.equal(api.contains(row, 18.000001), true);
  for (const diameter of [3, 6, 10, 18, 30, 50, 80, 120, 180, 250, 315, 400, 500]) {
    const converted = diameter / 25.4 * 25.4;
    assert.equal(lookup('shaft', 'g', '6', converted), lookup('shaft', 'g', '6', diameter));
  }
});

check('lookup／contains：不接受NaN、Infinity、零、負數或數字字串', () => {
  const row = lookup('hole', 'H', '7', 25);
  for (const diameter of [NaN, Infinity, -Infinity, 0, -1, '25', null, undefined]) {
    assert.equal(api.contains(row, diameter), false);
    assert.equal(lookup('hole', 'H', '7', diameter), null);
  }
  assert.equal(lookup('shaft', 'G', '6', 25), null);
  assert.equal(lookup('hole', 'g', '6', 25), null);
});

// 06｜查詢語法以大小寫區分孔軸；01與0保留獨立等級，不自動轉Number。
check('parseClass：孔軸大小寫、01與0', () => {
  assert.deepEqual(api.parseClass('JS6'), { member: 'hole', zone: 'JS', grade: '6' });
  assert.deepEqual(api.parseClass('js6'), { member: 'shaft', zone: 'js', grade: '6' });
  assert.deepEqual(api.parseClass('H01'), { member: 'hole', zone: 'H', grade: '01' });
  assert.deepEqual(api.parseClass('h0'), { member: 'shaft', zone: 'h', grade: '0' });
  for (const text of ['Js6', 'jS6', 'H00', 'h001', 'H19', 'H-7', 'H7x']) assert.equal(api.parseClass(text), null);
  assert.equal(api.parseClass('H7', 'shaft'), null);
  assert.equal(api.parseClass('g6', 'hole'), null);
});

check('parseQuery：尺寸前後、直徑符號與配合', () => {
  const fit = { mode: 'fit', holeClass: 'H7', shaftClass: 'g6', nominalMm: 25 };
  for (const text of ['25 H7/g6', 'Ø25H7 / g6', '⌀25 H7 / g6', 'H7/g6 25']) assert.deepEqual(api.parseQuery(text), fit);
  assert.deepEqual(api.parseQuery('H7/g6'), { ...fit, nominalMm: null });
  assert.deepEqual(api.parseQuery('25 h6'), { mode: 'lookup', member: 'shaft', zone: 'h', grade: '6', nominalMm: 25 });
  assert.deepEqual(api.parseQuery('H7 0.5'), { mode: 'lookup', member: 'hole', zone: 'H', grade: '7', nominalMm: 0.5 });
  assert.deepEqual(api.parseQuery('JS6'), { mode: 'lookup', member: 'hole', zone: 'JS', grade: '6', nominalMm: null });
  for (const text of ['25 H7 26', 'g6/H7 25', 'H7/H6 25', 'h7/g6 25', '25 Js6', '25 H19', 'NaN H7', 'H7//g6', '']) assert.equal(api.parseQuery(text), null, text);
});

check('parseQuery與IT：01、0及排序互不混淆', () => {
  assert.deepEqual(api.parseQuery('H01 25'), { mode: 'lookup', member: 'hole', zone: 'H', grade: '01', nominalMm: 25 });
  assert.deepEqual(api.parseQuery('h0 25'), { mode: 'lookup', member: 'shaft', zone: 'h', grade: '0', nominalMm: 25 });
  assert.deepEqual(api.parseQuery('IT01 25'), { mode: 'it', grade: '01', nominalMm: 25 });
  assert.deepEqual(api.parseQuery('it 0 25'), { mode: 'it', grade: '0', nominalMm: 25 });
  assert.deepEqual(api.parseQuery('IT6'), { mode: 'it', grade: '6', nominalMm: null });
  assert.equal(api.parseQuery('IT19'), null);
  assert.equal(api.parseQuery('IT00'), null);
  assert.deepEqual(api.itGrades(), ['01', '0', ...Array.from({ length: 18 }, (_, index) => String(index + 1))]);
  assert.equal(api.itBands('01').find(row => referenceContains(row, 25)).widthUm, 0.6);
  assert.equal(api.itBands('0').find(row => referenceContains(row, 25)).widthUm, 1);
  for (const [diameter, widthUm] of [[18, 11], [18.000001, 13], [30, 13], [30.000001, 16]]) {
    assert.equal(api.itBands('6').find(row => api.contains(row, diameter)).widthUm, widthUm);
  }
  assert.equal(api.itBands('19').length, 0);
});

check('索引列出實際類別、等級與來源，無猜出的組合', () => {
  for (const [member, data] of [['hole', holeData], ['shaft', shaftData]]) {
    assert.deepEqual(new Set(api.classes(member)), new Set(data.records.map(row => row.zone + row.grade)));
    assert.deepEqual(new Set(api.zones(member)), new Set(data.records.map(row => row.zone)));
    for (const zone of api.zones(member)) {
      assert.deepEqual(new Set(api.grades(member, zone)), new Set(data.records.filter(row => row.zone === zone).map(row => row.grade)));
    }
    for (const className of api.classes(member)) assert.equal(api.parseClass(className)?.member, member);
  }
  assert.deepEqual(api.counts, { hole: holeData.records.length, shaft: shaftData.records.length, it: itData.records.length });
  assert.equal(new Set(api.sources.map(source => source.id)).size, api.sources.length);
});

// 07｜另外在隔離的傳統script環境載入，確保網頁不依賴CommonJS或網路。
try {
  const context = vm.createContext({ window: {} });
  for (const name of names) vm.runInContext(await readFile(new URL(name, directory), 'utf8'), context, { filename: name });
  check('傳統script與CommonJS匯出一致', () => {
    for (const [key, data] of [['ISO_HOLE_DATA', holeData], ['ISO_SHAFT_DATA', shaftData], ['ISO_IT_DATA', itData]]) {
      assert.equal(context[key].records.length, data.records.length);
      assert.equal(context.window[key], context[key]);
      assert.deepEqual(JSON.parse(JSON.stringify(context[key].records)), JSON.parse(JSON.stringify(data.records)));
    }
    const browserApi = context.window.IsoToleranceMath.create({ holeData: context.ISO_HOLE_DATA, shaftData: context.ISO_SHAFT_DATA, itData: context.ISO_IT_DATA });
    assert.deepEqual(JSON.parse(JSON.stringify(browserApi.fit(25, 'H7', 'g6'))), JSON.parse(JSON.stringify(api.fit(25, 'H7', 'g6'))));
  });
} catch (error) {
  results.push({ name: '傳統script環境載入', passed: false, message: error?.message || String(error) });
}

// 08｜以非零exit code回報失敗，方便作為本機維護檢查或CI的一環。
for (const result of results) {
  console.log(`${result.passed ? '通過' : '失敗'}｜${result.name}`);
  if (!result.passed) console.error(result.message);
}
const failures = results.filter(result => !result.passed);
console.log(`\n資料：孔 ${holeData.records.length} 筆／軸 ${shaftData.records.length} 筆／IT ${itData.records.length} 筆。`);
console.log(`逐筆檢查：偏差寬度 ${counters.widthRows} 筆、IT覆蓋 ${counters.widthSegments} 段、開閉邊界 ${counters.boundaryRows} 筆、缺項區間 ${counters.missingIntervals} 次。`);
console.log(`結果：${results.length - failures.length}／${results.length} 組通過，${failures.length} 組失敗。`);
if (failures.length) process.exitCode = 1;
