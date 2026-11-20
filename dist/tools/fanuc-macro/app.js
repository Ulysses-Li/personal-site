/**
 * FANUC 查找工具｜搜尋與畫面互動
 * 資料維護在 macro-data.js、command-data.js；本檔不解譯或執行 NC 程式。
 * 只將收藏 ID 儲存在本機，查找與語法範例均不需要連線。
 */
(() => {
  'use strict';

  // ── 01｜資料、字串與來源連結：動態內容一律跳脫，不執行資料中的程式碼。 ──
  const $ = id => document.getElementById(id);
  const entries = [...(window.FANUC_MACRO_ENTRIES || []), ...(window.FANUC_COMMAND_ENTRIES || [])];
  const sources = [...(window.FANUC_MACRO_SOURCES || []), ...(window.FANUC_COMMAND_SOURCES || [])];
  const sourceMap = new Map(sources.map(source => [source.id, source]));
  const byId = new Map(entries.map(entry => [entry.id, entry]));
  const argumentsList = window.FANUC_ARGUMENTS || [];
  const labels = { macro: 'Macro B', gcode: 'G 指令', mcode: 'M 指令' };
  const media = matchMedia('(max-width: 800px)');
  const KEY = 'cwli-fanuc-favorites-v1';
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const icon = name => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
  const normalize = value => String(value).normalize('NFKC').toLowerCase().replace(/\b([gm])0+(\d+)\b/g, '$1$2').replace(/[–—～~]/g, '-').trim();
  const codeTokens = entry => (entry.code.match(/[GM]\d+(?:\.\d+)?/gi) || []).map(normalize);
  const safeURL = value => { try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : ''; } catch { return ''; } };
  let mode = 'all', category = '全部', selected = null, filtered = [], toastTimer;
  let favorites = new Set();
  const copies = new Map();
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || '[]');
    if (Array.isArray(saved)) favorites = new Set(saved.filter(id => byId.has(id)));
  } catch { /* 儲存受限時仍可查找，收藏可在這次開啟期間使用。 */ }

  // ── 02｜搜尋索引：正規化 G01/G1、全形字元與變數範圍，所有關鍵字取交集。 ──
  const index = new Map(entries.map(entry => [entry.id, normalize([
    entry.code, entry.title, entry.summary, entry.category, labels[entry.type],
    entry.syntax, entry.example, ...(entry.tags || []), ...(entry.notes || [])
  ].join(' '))]));

  function rangeMatches(entry, term) {
    if (!/^#\d+$/.test(term)) return false;
    const value = Number(term.slice(1));
    const ranges = normalize(entry.code).matchAll(/#(\d+)\s*(?:-|至)\s*#?(\d+)/g);
    return [...ranges].some(match => value >= Number(match[1]) && value <= Number(match[2]));
  }

  function termMatches(entry, term) {
    const bank = index.get(entry.id);
    if (/^[gm]\d+(?:\.\d+)?$/.test(term)) return codeTokens(entry).includes(term) || new RegExp(`\\b${term.replace('.', '\\.')}\\b`).test(bank);
    if (/^#\d+$/.test(term)) return rangeMatches(entry, term) || new RegExp(`${term}(?!\\d)`).test(bank);
    return bank.includes(term);
  }

  function inMode(entry) {
    if (mode === 'all') return true;
    if (mode === 'favorites') return favorites.has(entry.id);
    if (mode === 'gcode') return entry.type === 'gcode' || (entry.type === 'macro' && codeTokens(entry).some(token => token.startsWith('g')));
    if (mode === 'mcode') return entry.type === 'mcode' || (entry.type === 'macro' && codeTokens(entry).some(token => token.startsWith('m')));
    return entry.type === mode;
  }

  function relevance(entry, query) {
    if (!query) {
      const common = ['macro-g65', 'cmd-g01', 'macro-if-goto', 'macro-while', 'macro-common-volatile'];
      const priority = common.indexOf(entry.id);
      return priority < 0 ? 0 : common.length - priority;
    }
    const code = normalize(entry.code);
    if (code === query || codeTokens(entry).includes(query)) return 100;
    if (rangeMatches(entry, query)) return 90;
    if (code.includes(query)) return 60;
    if (normalize(entry.title).includes(query)) return 40;
    return 0;
  }

  function applyFilters() {
    // 收藏移除最後一筆同類資料時，回到仍存在的分類，避免留下看不見的篩選。
    if (category !== '全部' && !entries.some(entry => inMode(entry) && entry.category === category)) category = '全部';
    const query = normalize($('search').value), terms = query.split(/\s+/).filter(Boolean);
    filtered = entries.filter(entry => inMode(entry) && (category === '全部' || entry.category === category) && terms.every(term => termMatches(entry, term)));
    filtered.sort((a, b) => relevance(b, query) - relevance(a, query));
    if (!filtered.some(entry => entry.id === selected)) selected = filtered[0]?.id || null;
    if (!selected) $('workspace').dataset.reading = 'false';
    render();
  }

  // ── 03｜來源與程式片段：複製內容保留原文，畫面顯示才做 HTML 跳脫。 ──
  function sourceLinks(ids) {
    return [...new Set(ids || [])].map(id => {
      const source = sourceMap.get(id), url = source && safeURL(source.url);
      return url ? `<a class="source-link" href="${escape(url)}" target="_blank" rel="noopener noreferrer">${escape(source.title)}<span>${escape(source.locator || '')}</span></a>` : '';
    }).join('');
  }

  function codeBlock(key, title, value, example = false) {
    copies.set(key, value);
    return `<section class="detail-section"><div class="section-head"><h3>${title}</h3><button class="plain-button copy-button" type="button" data-copy="${key}" aria-label="複製${title}">${icon('copy')}<span>複製</span></button></div><pre${example ? ' class="example-code"' : ''}><code>${escape(value)}</code></pre>${example ? '<p class="example-note">語法學習片段；&lt;…&gt; 為待填欄位，並非完整加工程式。</p>' : ''}</section>`;
  }

  function renderDetail() {
    copies.clear();
    const entry = byId.get(selected);
    if (!entry) {
      $('entry-detail').innerHTML = `<div class="empty-state">${icon('book')}<h2>從指令開始，找到用法。</h2><p>調整搜尋或分類，選一個條目即可查看語法與說明。</p></div>`;
      return;
    }
    const saved = favorites.has(entry.id);
    $('entry-detail').innerHTML = `<button class="plain-button mobile-detail-back" type="button" id="back-to-results">${icon('back')}<span>返回結果</span></button>
      <div class="detail-top"><div class="detail-title-group"><div class="detail-meta"><span>${escape(labels[entry.type] || '')}</span><span>${escape(entry.category)}</span></div><p class="detail-code">${escape(entry.code)}</p><h2>${escape(entry.title)}</h2></div><button class="icon-button favorite-button" type="button" data-favorite="${escape(entry.id)}" aria-label="${saved ? '取消收藏' : '收藏'} ${escape(entry.code)}" title="${saved ? '取消收藏' : '加入收藏'}" aria-pressed="${saved}">${icon('star')}</button></div>
      <p class="detail-summary">${escape(entry.summary)}</p>
      ${codeBlock('syntax', '語法', entry.syntax)}
      ${codeBlock('example', '範例', entry.example, true)}
      ${entry.notes?.length ? `<section class="detail-section"><h3>使用時留意</h3><ul class="notes-list">${entry.notes.map(note => `<li>${escape(note)}</li>`).join('')}</ul></section>` : ''}
      <div class="detail-tags">${(entry.tags || []).map(tag => `<span class="tag">${escape(tag)}</span>`).join('')}</div>
      <div class="entry-sources"><h3>條目來源</h3>${sourceLinks(entry.sourceIds)}</div>`;
  }

  function renderCategories() {
    const categories = ['全部', ...new Set(entries.filter(inMode).map(entry => entry.category))];
    $('category-filters').innerHTML = categories.map(item => `<button type="button" data-category="${escape(item)}" aria-pressed="${item === category}">${escape(item)}</button>`).join('');
    $('toggle-categories').textContent = category === '全部' ? '用途分類' : category;
  }

  function renderList() {
    $('results-count').textContent = `${filtered.length} / ${entries.filter(inMode).length} 筆`;
    if (!filtered.length) {
      const emptyFavorites = mode === 'favorites' && favorites.size === 0;
      $('entry-list').innerHTML = `<div class="empty-state">${icon(emptyFavorites ? 'star' : 'search')}<h3>${emptyFavorites ? '把常查的指令留下來。' : '目前沒有符合的指令。'}</h3><p>${emptyFavorites ? '打開指令後，按右上方星號即可收藏；收藏只存於此瀏覽器。' : '可以縮短關鍵字，或清除分類再試一次。'}</p><button class="empty-action" type="button" data-reset>${emptyFavorites ? '瀏覽全部指令' : '重設查找'}</button></div>`;
      return;
    }
    $('entry-list').innerHTML = filtered.map(entry => `<button class="result-item" type="button" data-entry="${escape(entry.id)}" aria-current="${entry.id === selected}"><span class="result-code">${escape(entry.code)}</span><span class="result-copy"><strong>${escape(entry.title)}</strong><small>${escape(entry.category)}</small></span>${favorites.has(entry.id) ? `<span aria-label="已收藏">${icon('star')}</span>` : ''}</button>`).join('');
  }

  // ── 04｜引數對照：僅呈現指定 I 的位址表，指定 II 另由條目解說。 ──
  function renderArguments() {
    const query = normalize($('search').value);
    const rows = argumentsList.filter(item => {
      if (!query) return true;
      if (/^#\d+$/.test(query)) return item.variable === Number(query.slice(1));
      if (/^[a-z]$/.test(query)) return normalize(item.address) === query;
      return normalize(`${item.address} #${item.variable}`).includes(query);
    });
    $('argument-panel').innerHTML = `<p class="eyebrow">G65 / ARGUMENT ASSIGNMENT I</p><h2 id="argument-title">位址，對到哪個局部變數？</h2><p>這張表對應「引數指定 I」。查位址 A、X、Z 或變數 #24；重複 I / J / K 的指定 II 請另查相關條目。</p>
      <div class="argument-example"><div><strong>呼叫端的位址</strong><code>G65 P&lt;程式號&gt; A10. B20. X5.</code></div><div><strong>巨集裡讀取的值</strong><code>#1 = 10.　#2 = 20.　#24 = 5.</code></div></div>
      <div class="table-scroll"><table class="argument-table"><thead><tr><th scope="col">呼叫位址</th><th scope="col">局部變數</th><th scope="col">對照</th></tr></thead><tbody>${rows.map(item => `<tr><td><code>${escape(item.address)}</code></td><td><code>#${escape(item.variable)}</code></td><td>${escape(item.address)} 的值傳入 #${escape(item.variable)}</td></tr>`).join('')}</tbody></table></div>
      ${rows.length ? '' : '<p class="notice">沒有符合的位址或變數，可清除搜尋再查看完整對照。</p>'}
      <section class="detail-section"><h3>先分清楚呼叫控制與傳入資料</h3><ul class="notes-list"><li>P 指定程式號，L 指定重複次數；G、L、N、O、P 不在這張傳值位址表內。</li><li>數值示例使用小數點；沒有小數點時的輸入解讀，需依控制器規格確認。</li><li>G65 與 M98 的局部變數層級行為不同，不把兩種呼叫方式混用理解。</li></ul></section><div class="entry-sources"><h3>對照表來源</h3>${sourceLinks(window.FANUC_ARGUMENT_SOURCE_IDS || [])}</div>`;
  }

  function renderSources() {
    $('sources-content').innerHTML = `<p>依下列原廠文件整理繁體中文短解說與自寫語法片段。部分連結為第三方保存的原廠手冊鏡像；請核對文件機型、版本與章節，不將某一型號的選配或機床廠定義視為所有機台一致。開啟來源文件需要網路。</p>${[...sourceMap.values()].map(source => `<section class="source-item"><h3><a href="${escape(safeURL(source.url))}" target="_blank" rel="noopener noreferrer">${escape(source.title)}</a></h3><p>${escape(source.kind)} · ${escape(source.locator || '')}</p><p>${escape(source.scope || '')}</p></section>`).join('')}`;
  }

  function render() {
    const argumentsMode = mode === 'arguments';
    $('workspace').hidden = argumentsMode;
    $('argument-panel').hidden = !argumentsMode;
    $('favorite-count').textContent = favorites.size;
    $('clear-search').hidden = !$('search').value;
    document.querySelectorAll('[data-mode]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mode === mode)));
    if (argumentsMode) renderArguments();
    else { renderCategories(); renderList(); renderDetail(); }
  }

  // ── 05｜選取與手機返回：使用同一份詳情，桌機維持並排。 ──
  function selectEntry(id, { focus = true, updateURL = true } = {}) {
    if (!byId.has(id)) return;
    selected = id;
    $('workspace').dataset.reading = 'true';
    renderList(); renderDetail();
    if (updateURL) { try { history.replaceState(null, '', '#' + encodeURIComponent(id)); } catch { /* 不支援時不影響查找。 */ } }
    if (media.matches && focus) {
      $('entry-detail').focus({ preventScroll: true });
      $('workspace').scrollIntoView({ block: 'start', behavior: 'instant' });
    }
  }

  function backToResults() {
    $('workspace').dataset.reading = 'false';
    const button = document.querySelector(`[data-entry="${CSS.escape(selected || '')}"]`);
    button?.focus({ preventScroll: true });
    button?.scrollIntoView({ block: 'nearest', behavior: 'instant' });
  }

  function setMode(value) {
    mode = value; category = '全部';
    $('workspace').dataset.reading = 'false';
    setCategoryVisibility(false);
    applyFilters();
  }

  // 手機先顯示搜尋結果，需要時再展開用途；桌機仍固定顯示所有分類。
  function setCategoryVisibility(open) {
    document.querySelector('.browser-pane').dataset.filtersOpen = String(open);
    $('toggle-categories').setAttribute('aria-expanded', String(open));
  }

  function reset() {
    $('search').value = ''; mode = 'all'; category = '全部';
    $('workspace').dataset.reading = 'false';
    applyFilters(); $('search').focus();
  }

  // ── 06｜收藏、複製與鍵盤：儲存失敗仍保留這次開啟期間的收藏。 ──
  function toast(message) {
    $('toast').textContent = message; $('toast').hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { $('toast').hidden = true; }, 3500);
  }

  function toggleFavorite(id) {
    if (!byId.has(id)) return;
    if (favorites.has(id)) favorites.delete(id); else favorites.add(id);
    try { localStorage.setItem(KEY, JSON.stringify([...favorites])); toast(favorites.has(id) ? '已加入收藏' : '已取消收藏'); }
    catch { toast('收藏暫存在這次開啟期間，瀏覽器未能儲存。'); }
    applyFilters();
    const button = document.querySelector(`[data-favorite="${CSS.escape(selected || '')}"]`) || document.querySelector('#entry-list .empty-action');
    button?.focus({ preventScroll: true });
  }

  async function copyText(key, button) {
    const value = copies.get(key);
    if (typeof value !== 'string') return;
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(value);
      else {
        const field = document.createElement('textarea'); field.value = value;
        field.readOnly = true; field.style.cssText = 'position:fixed;top:0;left:-9999px';
        document.body.append(field); field.select();
        const copied = document.execCommand('copy'); field.remove();
        if (!copied) throw new Error('Copy unavailable');
        button.focus({ preventScroll: true });
      }
      toast('已複製' + (key === 'syntax' ? '語法' : '範例'));
    } catch { toast('無法自動複製，可選取程式框內的文字複製。'); }
  }

  $('search').addEventListener('input', () => {
    $('workspace').dataset.reading = 'false';
    applyFilters();
  });
  $('clear-search').addEventListener('click', () => { $('search').value = ''; $('workspace').dataset.reading = 'false'; applyFilters(); $('search').focus(); });
  document.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (button?.dataset.mode) setMode(button.dataset.mode);
    else if (button?.dataset.category) { category = button.dataset.category; $('workspace').dataset.reading = 'false'; setCategoryVisibility(false); applyFilters(); if (media.matches) $('toggle-categories').focus({ preventScroll: true }); }
    else if (button?.dataset.entry) selectEntry(button.dataset.entry);
    else if (button?.dataset.favorite) toggleFavorite(button.dataset.favorite);
    else if (button?.dataset.copy) copyText(button.dataset.copy, button);
    else if (button?.hasAttribute('data-reset')) reset();
    else if (button?.id === 'back-to-results') backToResults();
    else if (button?.id === 'toggle-categories') setCategoryVisibility(button.getAttribute('aria-expanded') !== 'true');
    if (event.target.closest('.sources-link')) $('source-guide').open = true;
  });
  document.addEventListener('keydown', event => {
    const editing = event.target.matches('input,textarea,select,[contenteditable="true"]');
    if (event.key === '/' && !editing && !event.ctrlKey && !event.metaKey && !event.altKey) { event.preventDefault(); $('search').focus(); }
    if (event.key === 'Escape' && event.target === $('search') && $('search').value) { $('search').value = ''; $('workspace').dataset.reading = 'false'; applyFilters(); }
    else if (event.key === 'Escape' && media.matches && $('workspace').dataset.reading === 'true') backToResults();
  });

  // ── 07｜啟動與深連結：只接受資料檔中存在的 ID，不把 hash 當作 HTML。 ──
  function hashEntry() { try { return decodeURIComponent(location.hash.slice(1)); } catch { return ''; } }
  addEventListener('hashchange', () => {
    const id = hashEntry();
    if (byId.has(id)) { mode = 'all'; category = '全部'; $('search').value = ''; selected = id; applyFilters(); selectEntry(id, { updateURL: false }); }
  });
  const initial = hashEntry();
  selected = byId.has(initial) ? initial : entries.find(entry => codeTokens(entry).includes('g65'))?.id || entries[0]?.id || null;
  renderSources(); applyFilters();
  if (byId.has(initial)) selectEntry(initial, { focus: false, updateURL: false });
})();
