/*
 * 主站共用外框離線檢查｜node scripts/check-site-shell.mjs
 * 使用 Node 內建模組讀取正式資料與元件，於 VM 中執行；不啟動瀏覽器或伺服器。
 * 精簡 DOM 僅支援本測試所需的結構、選取與監聽器登記。
 * 真實點擊、焦點、CSS 排版、完整 app.js 路由與列印畫面仍須由瀏覽器 QA 驗證。
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

// 01｜讀取正式資源；路徑以本腳本為準，從任意工作目錄執行皆可。
const root = new URL('../', import.meta.url);
const dist = new URL('dist/', root);
const html = await readFile(new URL('index.html', dist), 'utf8');
const requiredScripts = [
  'data/site.js', 'data/header.js', 'data/footer.js', 'data/version.js',
  'content.js', 'components/shared.js', 'components/header.js',
  'components/footer.js', 'components/site-shell.js', 'app.js'
];
const source = new Map(await Promise.all(requiredScripts.map(async path => [
  path, await readFile(new URL(path, dist), 'utf8')
])));

// 02｜記憶體 DOM：解析正式 HTML，不以另一套模板重建頁首頁尾。
function decode(value) {
  return value.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (entity, key) => {
    if (key[0] === '#') return String.fromCodePoint(parseInt(key.slice(key[1].toLowerCase() === 'x' ? 2 : 1), key[1].toLowerCase() === 'x' ? 16 : 10));
    return { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00a0' }[key.toLowerCase()] ?? entity;
  });
}

class Element {
  constructor(tagName, attributes = {}) {
    this.tagName = tagName.toLowerCase();
    this.attributes = new Map(Object.entries(attributes));
    this.childNodes = [];
    this.parentElement = null;
    this.listeners = new Map();
    this._dataset = null;
    this.classList = {
      contains: name => this.classes().includes(name),
      add: name => this.setAttribute('class', [...new Set([...this.classes(), name])].join(' ')),
      remove: name => this.setAttribute('class', this.classes().filter(item => item !== name).join(' ')),
      toggle: (name, force) => {
        const enabled = force ?? !this.classList.contains(name);
        this.classList[enabled ? 'add' : 'remove'](name);
        return enabled;
      }
    };
  }
  classes() { return (this.getAttribute('class') ?? '').split(/\s+/).filter(Boolean); }
  get children() { return this.childNodes.filter(child => child instanceof Element); }
  get textContent() { return this.childNodes.map(child => typeof child === 'string' ? child : child.textContent).join(''); }
  get dataset() {
    return this._dataset ??= Object.fromEntries([...this.attributes].filter(([key]) => key.startsWith('data-')).map(([key, value]) => [
      key.slice(5).replace(/-([a-z])/g, (_, char) => char.toUpperCase()), value
    ]));
  }
  get innerHTML() { return this._html ?? ''; }
  set innerHTML(value) {
    this._html = String(value);
    this.childNodes = parse(this._html).childNodes;
    for (const child of this.children) child.parentElement = this;
  }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  removeAttribute(name) { this.attributes.delete(name); }
  contains(node) { return node === this || this.children.some(child => child.contains(node)); }
  closest(selector) {
    for (let node = this; node; node = node.parentElement) if (matches(node, selector)) return node;
    return null;
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] ?? null; }
  querySelectorAll(selector) {
    const result = [];
    for (const child of this.children) {
      if (matches(child, selector)) result.push(child);
      result.push(...child.querySelectorAll(selector));
    }
    return result;
  }
  addEventListener(type, callback) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(callback);
  }
  removeEventListener(type, callback) { this.listeners.get(type)?.delete(callback); }
}

function matches(node, selector) {
  const parts = selector.trim().split(/\s+/);
  function simple(element, part) {
    const tag = part.match(/^[a-z][\w-]*/i)?.[0];
    if (tag && element.tagName !== tag.toLowerCase()) return false;
    const id = part.match(/#([\w-]+)/)?.[1];
    if (id && element.getAttribute('id') !== id) return false;
    for (const match of part.matchAll(/\.([\w-]+)/g)) if (!element.classes().includes(match[1])) return false;
    for (const match of part.matchAll(/\[([\w-]+)(?:(\^?=)["']?([^\]"']*)["']?)?\]/g)) {
      const actual = element.getAttribute(match[1]);
      if (actual === null) return false;
      if (match[2] === '=' && actual !== match[3]) return false;
      if (match[2] === '^=' && !actual.startsWith(match[3])) return false;
    }
    return true;
  }
  let cursor = node;
  if (!simple(cursor, parts.pop())) return false;
  while (parts.length) {
    const part = parts.pop();
    cursor = cursor.parentElement;
    while (cursor && !simple(cursor, part)) cursor = cursor.parentElement;
    if (!cursor) return false;
  }
  return true;
}

function parse(markup) {
  const document = new Element('#document');
  const stack = [document];
  const voidTags = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
  const tokens = markup.match(/<!--[\s\S]*?-->|<![^>]*>|<\/?[a-z](?:"[^"]*"|'[^']*'|[^'">])*>|[^<]+/gi) ?? [];
  for (const token of tokens) {
    if (token.startsWith('<!')) continue;
    if (token.startsWith('</')) {
      const tag = token.match(/^<\/([\w-]+)/)[1].toLowerCase();
      const index = stack.findLastIndex(node => node.tagName === tag);
      if (index > 0) stack.length = index;
    } else if (token.startsWith('<')) {
      const tag = token.match(/^<([\w-]+)/)[1];
      const attrs = {};
      const rest = token.slice(tag.length + 1).replace(/\/?\s*>$/, '');
      for (const match of rest.matchAll(/([^\s=<>/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) attrs[match[1]] = decode(match[2] ?? match[3] ?? match[4] ?? '');
      const element = new Element(tag, attrs);
      element.parentElement = stack.at(-1);
      stack.at(-1).childNodes.push(element);
      if (!voidTags.has(element.tagName) && !token.endsWith('/>')) stack.push(element);
    } else stack.at(-1).childNodes.push(decode(token));
  }
  document.documentElement = document.querySelector('html');
  document.body = document.querySelector('body');
  return document;
}

function boot({ hash = '#home', mount = false } = {}) {
  const document = parse(html);
  const context = vm.createContext({ URL, document, location: { hash } });
  context.window = context;
  for (const path of requiredScripts) {
    if (path === 'app.js' || (path === 'components/site-shell.js' && !mount)) continue;
    vm.runInContext(source.get(path), context, { filename: path, timeout: 1000 });
  }
  return context;
}

const ids = items => Array.from(items, item => item.id);
const linksByView = host => Object.fromEntries(host.querySelectorAll('a[data-view]').map(link => [link.dataset.view, link]));
const expectedViews = ['home', 'work', 'tools', 'notes', 'resume'];
const results = [];
async function check(label, operation) {
  try { await operation(); results.push({ label, passed: true }); console.log(`通過｜${label}`); }
  catch (error) { results.push({ label, passed: false }); console.error(`失敗｜${label}\n${String(error.stack ?? error).slice(0, 2200)}`); }
}

// 03｜HTML、資料與版次契約。
await check('本機 defer 依賴可讀，且資料／元件／主程式順序正確', async () => {
  const document = parse(html);
  const scripts = document.querySelectorAll('script');
  const paths = scripts.map(script => script.getAttribute('src'));
  assert.equal(new Set(paths).size, paths.length, '不可重複載入程式');
  for (const script of scripts) {
    const path = script.getAttribute('src');
    assert.ok(path && !/^(?:[a-z]+:|\/\/)/i.test(path), '程式必須來自本機檔案');
    assert.notEqual(script.getAttribute('defer'), null, `${path} 必須 defer`);
    assert.equal(script.getAttribute('async'), null, `${path} 不可 async`);
    assert.notEqual(script.getAttribute('type'), 'module', `${path} 須支援直接開檔`);
    const url = new URL(path, dist);
    assert.ok(url.href.startsWith(dist.href), `${path} 不可超出 dist`);
    await readFile(url);
  }
  for (const path of requiredScripts) assert.ok(paths.includes(path), `缺少 ${path}`);
  for (const [path, code] of source) {
    new vm.Script(code, { filename: path });
    assert.ok(!/\b(?:fetch|importScripts)\s*\(|\bnew\s+(?:XMLHttpRequest|WebSocket|Worker)\s*\(|\bimport\s*\(/.test(code), `${path} 不可新增開檔時的網路／動態模組依賴`);
  }
  const before = (first, second) => assert.ok(paths.indexOf(first) < paths.indexOf(second), `${first} 必須先於 ${second}`);
  before('data/site.js', 'content.js');
  for (const path of ['data/site.js', 'data/header.js', 'data/footer.js', 'data/version.js', 'content.js']) before(path, 'components/site-shell.js');
  before('components/shared.js', 'components/header.js');
  before('components/shared.js', 'components/footer.js');
  before('components/header.js', 'components/site-shell.js');
  before('components/footer.js', 'components/site-shell.js');
  before('components/site-shell.js', 'app.js');
  for (const link of document.querySelectorAll('link')) {
    const path = link.getAttribute('href');
    if (path && !/^(?:[a-z]+:|\/\/)/i.test(path)) await readFile(new URL(path, dist));
  }
});

await check('頁首／頁尾為 body 直屬空掛載點，沒有重複導覽', () => {
  const document = parse(html);
  for (const [selector, tag, className] of [['[data-site-header]', 'header', 'site-header'], ['[data-site-footer]', 'footer', 'site-footer']]) {
    const hosts = document.querySelectorAll(selector);
    assert.equal(hosts.length, 1);
    assert.equal(hosts[0].tagName, tag);
    assert.equal(hosts[0].parentElement, document.body);
    assert.ok(hosts[0].classList.contains(className));
    assert.equal(hosts[0].children.length, 0);
    assert.equal(hosts[0].textContent.trim(), '');
  }
  assert.equal(document.querySelectorAll('.site-nav').length, 0);
  assert.equal(document.querySelectorAll('.footer-inner').length, 0);
  const context = boot();
  assert.ok(!document.body.textContent.includes(context.SITE_FOOTER.tagline));
});

await check('五個原網址各對應唯一主要頁面與可朗讀標題', () => {
  const document = parse(html);
  const main = document.querySelector('main');
  assert.equal(main.getAttribute('id'), 'main-content');
  assert.equal(main.getAttribute('tabindex'), '-1');
  const views = main.children.filter(child => child.classList.contains('view'));
  const viewIds = views.map(view => view.dataset.view);
  assert.equal(new Set(viewIds).size, viewIds.length);
  for (const id of expectedViews) assert.ok(viewIds.includes(id), `必須保留原網址 #${id}`);
  assert.deepEqual([...viewIds].sort(), ids(boot().SITE_HEADER.navigation).sort(), '新增導覽也須有對應主要頁面');
  const allIds = document.querySelectorAll('[id]').map(element => element.getAttribute('id'));
  assert.equal(new Set(allIds).size, allIds.length, 'HTML id 不可重複');
  for (const view of views) {
    const title = document.querySelector('#' + view.getAttribute('aria-labelledby'));
    assert.ok(title && view.contains(title) && title.textContent.trim(), `${view.dataset.view} 缺少有效標題`);
  }
  assert.equal(document.querySelector('.skip-link').getAttribute('href'), '#main-content');
  assert.ok(document.querySelector('#detail-dialog'));
  assert.ok(document.querySelector('#print-resume'));
});

await check('資料 schema、profile 共用引用與作品／工具筆數保持', () => {
  const context = boot();
  const { SITE_SETTINGS: settings, SITE_HEADER: header, SITE_FOOTER: footer, SITE_VERSION: version, SITE_CONTENT: content } = context;
  for (const value of [settings, header, footer, version]) assert.equal(value.schemaVersion, 1);
  assert.ok(settings.siteName && settings.profile.name && settings.profile.role);
  for (const key of ['email', 'github', 'website', 'line']) assert.equal(typeof settings.profile[key], 'string');
  assert.equal(content.profile, settings.profile);
  const navigationIds = ids(header.navigation);
  assert.equal(new Set(navigationIds).size, navigationIds.length);
  for (const id of expectedViews) assert.ok(navigationIds.includes(id), `必須保留原網址 #${id}`);
  assert.ok(header.navigation.every(item => typeof item.label === 'string' && item.label));
  assert.equal(header.homeView, 'home');
  assert.ok(header.menu.expandLabel && header.menu.collapseLabel && header.navigationLabel);
  assert.equal(header.contact.profileKey, 'email');
  assert.ok(Array.isArray(footer.links) && footer.links.some(link => link.profileKey === 'github'));
  assert.equal(content.projects.length, 5);
  assert.equal(content.tools.length, 3);
  assert.equal(content.knowledge.length, 8);
  assert.deepEqual(ids(content.projects), ['support-center', 'engineering-notebook', 'personal-website', 'study', 'cnc-tools']);
  assert.deepEqual(ids(content.tools), ['badminton', 'fanuc-macro', 'machining-calculator']);
});

await check('版次為 SemVer、有效日期，並與 CHANGELOG 同步', async () => {
  const { SITE_VERSION: version } = boot();
  assert.match(version.version, /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[\da-z-]+(?:\.[\da-z-]+)*)?(?:\+[\da-z-]+(?:\.[\da-z-]+)*)?$/i);
  assert.match(version.updatedAt, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(new Date(version.updatedAt + 'T00:00:00Z').toISOString().slice(0, 10), version.updatedAt);
  assert.ok(typeof version.summary === 'string' && version.summary.trim());
  const changelog = await readFile(new URL('CHANGELOG.md', root), 'utf8');
  const heading = changelog.split(/\r?\n/).find(line => /^##\s/.test(line) && line.includes(version.version));
  assert.ok(heading && heading.includes(version.updatedAt), 'CHANGELOG 缺少對應版次及日期');
});

// 04｜執行正式 render／mount，驗證輸出與輔助工具的安全性。
await check('正式頁首輸出保留品牌、導覽及漢堡按鈕的可用性契約', () => {
  const context = boot({ mount: true });
  const host = context.document.querySelector('[data-site-header]');
  const button = host.querySelector('.menu-toggle');
  const nav = host.querySelector('#site-nav');
  assert.equal(button.tagName, 'button');
  assert.equal(button.getAttribute('type'), 'button');
  assert.equal(button.getAttribute('aria-controls'), nav.getAttribute('id'));
  assert.equal(button.getAttribute('aria-expanded'), 'false');
  assert.equal(button.getAttribute('aria-label'), context.SITE_HEADER.menu.expandLabel);
  assert.equal(nav.getAttribute('aria-label'), context.SITE_HEADER.navigationLabel);
  const links = linksByView(host);
  const visibleIds = ids(context.SITE_HEADER.navigation.filter(item => item.visible !== false));
  assert.deepEqual(Object.keys(links), visibleIds);
  for (const id of visibleIds) assert.equal(links[id].getAttribute('href'), '#' + id);
  assert.equal(host.querySelector('.brand').getAttribute('href'), '#home');
  assert.equal(host.querySelector('.nav-contact').getAttribute('href'), 'mailto:' + context.SITE_SETTINGS.profile.email);
  assert.equal(host.querySelectorAll('.menu-icon span').length, 3);
});

await check('真實外框初始化同步深鏈選取、版本 metadata，重新掛載不累加監聽器', () => {
  const context = boot({ hash: '#work/support-center', mount: true });
  const document = context.document;
  const header = document.querySelector('[data-site-header]');
  assert.equal(linksByView(header).work.getAttribute('aria-current'), 'page');
  assert.equal(header.querySelectorAll('[aria-current="page"]').length, 1);
  assert.equal(document.documentElement.dataset.siteVersion, context.SITE_VERSION.version);
  assert.equal(document.documentElement.dataset.siteSchemaVersion, '1');
  const oldButton = header.querySelector('.menu-toggle');
  context.SiteShell.mount();
  assert.equal(oldButton.listeners.get('click').size, 0);
  assert.equal(header.querySelector('.menu-toggle').listeners.get('click').size, 1);
  assert.equal(document.listeners.get('click').size, 1);
  assert.equal(document.listeners.get('keydown').size, 1);
  for (const id of expectedViews) {
    context.SiteShell.header.setActive(id);
    assert.equal(linksByView(header)[id].getAttribute('aria-current'), 'page');
    assert.equal(header.querySelectorAll('[aria-current="page"]').length, 1);
  }
});

await check('只改共用 profile 即同步品牌姓名／aria、頁尾姓名與 GitHub', () => {
  const context = boot({ mount: true });
  Object.assign(context.SITE_SETTINGS.profile, { name: '測試工程師 Lee', github: 'https://github.com/example?tab=repositories&sort=updated', email: 'test@example.com' });
  context.SiteShell.mount();
  const header = context.document.querySelector('[data-site-header]');
  const footer = context.document.querySelector('[data-site-footer]');
  assert.equal(context.SITE_CONTENT.profile, context.SITE_SETTINGS.profile);
  assert.equal(context.SITE_CONTENT.profile.name, '測試工程師 Lee');
  assert.equal(header.querySelector('.brand').getAttribute('aria-label'), '測試工程師 Lee 首頁');
  assert.equal(header.querySelector('.brand-copy strong').textContent, '測試工程師 LEE');
  assert.ok(footer.textContent.includes('測試工程師 LEE'));
  const github = footer.querySelector('[data-profile-link="github"]');
  assert.equal(github.getAttribute('href'), context.SITE_SETTINGS.profile.github);
  assert.equal(github.getAttribute('aria-label'), '測試工程師 Lee 的 GitHub');
  assert.equal(github.getAttribute('target'), '_blank');
  assert.ok(github.getAttribute('rel').split(/\s+/).includes('noopener'));
  assert.ok(github.getAttribute('rel').split(/\s+/).includes('noreferrer'));
  assert.equal(header.querySelector('.nav-contact').getAttribute('href'), 'mailto:test@example.com');
});

await check('正式 renderer 對文字與屬性跳脫，不產生注入元素或事件屬性', () => {
  const context = boot();
  const text = 'A & <img src=x onerror="alert(1)"> \' "';
  context.SITE_SETTINGS.profile.name = text;
  context.SITE_SETTINGS.siteName = text;
  context.SITE_HEADER.brandMark = text;
  context.SITE_HEADER.navigation[0].label = text;
  context.SITE_HEADER.navigationLabel = text;
  context.SITE_HEADER.menu.expandLabel = text;
  context.SITE_FOOTER.tagline = text;
  context.SITE_FOOTER.links[0].label = text;
  for (const markup of [context.SiteHeader.render(context.SITE_SETTINGS, context.SITE_HEADER), context.SiteFooter.render(context.SITE_SETTINGS, context.SITE_FOOTER, { year: 2026 })]) {
    const fragment = parse(markup);
    assert.equal(fragment.querySelectorAll('img').length, 0);
    assert.equal(fragment.querySelectorAll('script').length, 0);
    const elements = [];
    const walk = node => { for (const child of node.children) { elements.push(child); walk(child); } };
    walk(fragment);
    assert.ok(elements.every(node => [...node.attributes.keys()].every(name => !/^on/i.test(name))));
    assert.ok(fragment.textContent.includes(text));
  }
  const header = parse(context.SiteHeader.render(context.SITE_SETTINGS, context.SITE_HEADER));
  assert.equal(header.querySelector('.brand').getAttribute('aria-label'), text + ' 首頁');
  assert.equal(header.querySelector('.menu-toggle').getAttribute('aria-label'), text);
});

await check('實際 safeHref 與 renderer 拒絕危險網址，合法 HTTPS／mail／hash 可用', () => {
  const context = boot();
  const { safeHref, escape } = context.SiteComponentUtils;
  assert.equal(escape('&<>"\''), '&amp;&lt;&gt;&quot;&#39;');
  for (const value of ['javascript:alert(1)', 'data:text/html,x', 'file:///C:/x', 'http://example.com', '//example.com', 'https://example.com/\npath', ' https://example.com', null]) {
    assert.equal(safeHref(value), '', String(value));
    context.SITE_SETTINGS.profile.github = value;
    assert.equal(parse(context.SiteFooter.render(context.SITE_SETTINGS, context.SITE_FOOTER)).querySelectorAll('a').length, 0);
  }
  assert.equal(safeHref('https://example.com/a?b=1&c=2'), 'https://example.com/a?b=1&c=2');
  assert.equal(safeHref('#work/support-center'), '');
  assert.equal(safeHref('#work/support-center', { allowHash: true }), '#work/support-center');
  assert.equal(safeHref('mailto:test@example.com'), '');
  assert.equal(safeHref('mailto:test@example.com', { allowMail: true }), 'mailto:test@example.com');
  for (const email of ['', 'bad-address', 'x@example.com?subject=unsafe', 'x@example.com\n']) {
    context.SITE_SETTINGS.profile.email = email;
    assert.equal(parse(context.SiteHeader.render(context.SITE_SETTINGS, context.SITE_HEADER)).querySelectorAll('.nav-contact').length, 0);
  }
});

await check('頁尾 2026／2027 年份與 mount 保留外層結構', () => {
  const context = boot();
  const render = year => parse(context.SiteFooter.render(context.SITE_SETTINGS, context.SITE_FOOTER, { year })).textContent;
  assert.match(render(2026), /© 2026 /);
  assert.ok(!render(2026).includes('2026–2026'));
  assert.match(render(2027), /© 2026–2027 /);
  assert.match(render(2025), /© 2026 /);
  const host = new Element('footer', { class: 'site-footer', 'data-site-footer': '' });
  assert.equal(context.SiteFooter.mount(host, context.SITE_SETTINGS, context.SITE_FOOTER, { year: 2027 }), host);
  assert.ok(host.classList.contains('site-footer'));
  assert.equal(host.getAttribute('data-site-footer'), '');
  assert.equal(host.children.length, 1);
  assert.ok(host.children[0].classList.contains('footer-inner'));
  assert.equal(host.children[0].children.filter(child => child.tagName === 'span').length, 2);
  assert.equal(host.querySelectorAll('footer').length, 0);
  assert.throws(() => context.SiteFooter.render(context.SITE_SETTINGS, { ...context.SITE_FOOTER, copyright: { startYear: 0 } }), /startYear/);
});

await check('隱藏導覽只移除入口，原頁面及資料網址仍可保留', () => {
  const context = boot({ hash: '#notes', mount: true });
  const originalIds = ids(context.SITE_HEADER.navigation);
  const originalLabel = context.SITE_HEADER.navigation.find(item => item.id === 'notes').label;
  context.SITE_HEADER.navigation.find(item => item.id === 'notes').visible = false;
  context.SiteShell.mount();
  const header = context.document.querySelector('[data-site-header]');
  assert.equal(header.querySelectorAll('a[data-view="notes"]').length, 0);
  assert.deepEqual(ids(context.SITE_HEADER.navigation), originalIds);
  assert.equal(context.SITE_HEADER.navigation.find(item => item.id === 'notes').label, originalLabel);
  const view = context.document.querySelector('section[data-view="notes"]');
  assert.ok(view && view.parentElement.tagName === 'main');
  assert.equal(context.SiteComponentUtils.safeHref('#notes', { allowHash: true }), '#notes');
  assert.ok(context.SITE_CONTENT.knowledge.length > 0);
});

const failures = results.filter(result => !result.passed);
console.log(`\n主站外框：${results.length - failures.length}/${results.length} 組通過。`);
console.log('範圍：正式資料、DOM 結構、共用 helper、元件 render／mount 與外框初始化；不代替瀏覽器互動及列印 QA。');
if (failures.length) process.exitCode = 1;
