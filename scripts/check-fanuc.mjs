/** FANUC 資料完整性檢查｜修改資料後執行 node scripts/check-fanuc.mjs。 */
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';

// 01｜只在獨立環境讀取本機資料，沒有瀏覽器、機台連線或檔案寫入。
const context = vm.createContext({ window: {} });
for (const filename of ['macro-data.js', 'command-data.js']) {
  const url = new URL('../dist/tools/fanuc-macro/' + filename, import.meta.url);
  vm.runInContext(await readFile(url, 'utf8'), context, { filename });
}
const data = context.window;
const entries = [...data.FANUC_MACRO_ENTRIES, ...data.FANUC_COMMAND_ENTRIES];
const sources = [...data.FANUC_MACRO_SOURCES, ...data.FANUC_COMMAND_SOURCES];
assert.equal(new Set(entries.map(item => item.id)).size, entries.length, '條目 ID 重複');
assert.equal(new Set(sources.map(item => item.id)).size, sources.length, '來源 ID 重複');
const sourceIds = new Set(sources.map(item => item.id));

// 02｜每筆內容必須可閱讀、可定位來源，並具有可供搜尋的分類與標籤。
for (const source of sources) {
  for (const key of ['id', 'title', 'url', 'kind', 'locator', 'scope']) assert.ok(typeof source[key] === 'string' && source[key].trim(), `來源缺少 ${key}`);
  assert.equal(new URL(source.url).protocol, 'https:', `來源需使用 HTTPS：${source.id}`);
}
for (const entry of entries) {
  assert.match(entry.id, /^[a-z][a-z0-9-]*$/, '條目 ID 需為穩定的英文識別碼');
  assert.ok(['macro', 'gcode', 'mcode'].includes(entry.type), `未知類型：${entry.id}`);
  for (const key of ['category', 'code', 'title', 'summary', 'syntax', 'example']) assert.ok(typeof entry[key] === 'string' && entry[key].trim(), `${entry.id} 缺少 ${key}`);
  assert.ok(Array.isArray(entry.notes), `${entry.id} 的 notes 需為陣列`);
  for (const key of ['tags', 'sourceIds']) assert.ok(Array.isArray(entry[key]) && entry[key].length, `${entry.id} 缺少 ${key}`);
  for (const sourceId of entry.sourceIds) assert.ok(sourceIds.has(sourceId), `${entry.id} 的來源不存在：${sourceId}`);
  assert.ok(!/#0\s*=/.test(entry.example), `${entry.id} 不可示範寫入唯讀 #0`);
}

// 03｜指定 I 的位址對照是固定規格，不混入指定 II 的重複 I/J/K。
const expectedArguments = { A: 1, B: 2, C: 3, I: 4, J: 5, K: 6, D: 7, E: 8, F: 9, H: 11, M: 13, Q: 17, R: 18, S: 19, T: 20, U: 21, V: 22, W: 23, X: 24, Y: 25, Z: 26 };
assert.deepEqual(Object.fromEntries(data.FANUC_ARGUMENTS.map(item => [item.address, item.variable])), expectedArguments);
assert.equal(data.FANUC_ARGUMENTS.length, 21, '引數表應有 21 個唯一位址');
for (const id of data.FANUC_ARGUMENT_SOURCE_IDS) assert.ok(sourceIds.has(id), `引數來源不存在：${id}`);
console.log(`通過：${entries.length} 筆條目、${sources.length} 個來源定位、21 個引數對照。`);
