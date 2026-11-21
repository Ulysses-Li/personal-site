/**
 * 加工計算工具箱｜畫面、單位與偏好
 * 計算核心在 engine.js，分類及公式來源在 catalog.js。
 * 工作數值保留公制原值；切換顯示單位不會以四捨五入後的結果覆寫輸入。
 */
(() => {
  'use strict';
  const M = window.MachiningMath, catalog = window.MACHINING_CATALOG;
  const $ = id => document.getElementById(id);
  const categories = new Map(catalog.categories.map(item => [item.id, item]));
  const sources = new Map(catalog.sources.map(item => [item.id, item]));
  const KEY = 'cwli-machining-preferences-v1';
  const icon = name => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const safeURL = value => { try { const url = new URL(value); return url.protocol === 'https:' ? url.href : ''; } catch { return ''; } };

  // ── 01｜示範數值與狀態：數值不是材料／刀具的推薦加工條件。 ──
  const defaults = {
    milling: { diameter: 12, cuttingSpeed: 120, teeth: 4, feedPerTooth: 0.05 },
    drilling: { diameter: 10, cuttingSpeed: 30, feedPerRev: 0.15 },
    turning: { diameter: 40, cuttingSpeed: 150, feedPerRev: 0.2 },
    thread: { majorDiameter: 10, pitch: 1.5 },
    tolerance: { nominal: 20, upper: 0.02, lower: -0.01, holeUpper: 0.02, holeLower: 0, shaftUpper: -0.01, shaftLower: -0.03 }
  };
  const values = structuredClone(defaults);
  let screen = 'home', current = 'milling', unit = 'metric';
  let threadBasis = 'pitch', toleranceMode = 'limits';
  let favorites = new Set(), formDirty = false, lastResult = null, toastTimer, saveFailed = false, renderedCategory = null;
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
    if (['metric', 'imperial'].includes(saved?.unit)) unit = saved.unit;
    if (Array.isArray(saved?.favorites)) favorites = new Set(saved.favorites.filter(id => categories.has(id)));
  } catch { /* 無法讀取偏好時，仍可直接使用計算器。 */ }

  function savePreferences() {
    try { localStorage.setItem(KEY, JSON.stringify({ unit, favorites: [...favorites] })); saveFailed = false; }
    catch { if (!saveFailed) toast('目前仍可計算；瀏覽器暫時無法儲存偏好。'); saveFailed = true; }
  }

  // ── 02｜單位：長度 25.4 mm/in，速度 0.3048 m/ft；刀刃數與 TPI 不隨單位改變。 ──
  const lengthUnit = () => unit === 'metric' ? 'mm' : 'in';
  function unitFor(kind) {
    return ({ length: lengthUnit(), speed: unit === 'metric' ? 'm/min' : 'ft/min', tooth: lengthUnit() + '/tooth', revolution: lengthUnit() + '/rev', tpi: '牙/in', count: '刃' })[kind];
  }
  function fromMetric(value, kind, system = unit) {
    if (kind === 'tpi') return M.pitchToTpi(value);
    if (system === 'metric' || kind === 'count') return value;
    const converted = kind === 'speed' ? value / 0.3048 : M.mmToInch(value);
    if (!Number.isFinite(converted) || (value !== 0 && converted === 0)) throw new RangeError('數值超出這個顯示單位可表示的範圍。');
    return converted;
  }
  function toMetric(value, kind) {
    if (kind === 'tpi') return M.tpiToPitch(value);
    if (unit === 'metric' || kind === 'count') return value;
    return kind === 'speed' ? value * 0.3048 : M.inchToMm(value);
  }
  const inputNumber = value => String(Number(value.toPrecision(15)));
  function format(value, digits = 3) {
    if (!Number.isFinite(value)) return '—';
    if (value !== 0 && (Math.abs(value) < 10 ** -digits || Math.abs(value) >= 1e10)) return value.toExponential(4);
    return new Intl.NumberFormat('zh-TW', { maximumFractionDigits: digits }).format(Object.is(value, -0) ? 0 : value);
  }

  // ── 03｜欄位定義：偏差提供正負切換，方便手機輸入負值。 ──
  const field = (key, label, symbol, kind, help = '', signed = false) => ({ key, label, symbol, kind, help, signed });
  function fields() {
    if (current === 'milling') return [field('diameter', '有效切削直徑', 'D', 'length'), field('cuttingSpeed', '切削速度', 'Vc', 'speed'), field('teeth', '有效刀刃數', 'z', 'count', '輸入實際參與計算的刀刃數。'), field('feedPerTooth', '每齒進給', 'fz', 'tooth')];
    if (['drilling', 'turning'].includes(current)) return [field('diameter', current === 'drilling' ? '鑽頭直徑' : '工件加工直徑', 'D', 'length'), field('cuttingSpeed', '切削速度', 'Vc', 'speed'), field('feedPerRev', '每轉進給', 'fn', 'revolution')];
    if (current === 'thread') return [field('majorDiameter', '螺紋公稱直徑', 'D', 'length'), field('pitch', threadBasis === 'pitch' ? '螺距' : '每英吋牙數', threadBasis === 'pitch' ? 'P' : 'TPI', threadBasis === 'pitch' ? 'length' : 'tpi')];
    const nominal = field('nominal', '基本尺寸', 'D', 'length');
    if (toleranceMode === 'limits') return [nominal, field('upper', '上偏差', 'ES / es', 'length', '依圖面輸入，保留正負號。', true), field('lower', '下偏差', 'EI / ei', 'length', '下偏差不得大於上偏差。', true)];
    return [nominal, field('holeUpper', '孔上偏差', 'ES', 'length', '', true), field('holeLower', '孔下偏差', 'EI', 'length', '', true), field('shaftUpper', '軸上偏差', 'es', 'length', '', true), field('shaftLower', '軸下偏差', 'ei', 'length', '', true)];
  }
  function activeTool() {
    const list = categories.get(current).tools;
    return current === 'tolerance' ? list.find(item => item.method === toleranceMode) : list[0];
  }
  function renderForm() {
    const cat = categories.get(current), tool = activeTool();
    $('calculator-kicker').textContent = cat.english.toUpperCase();
    $('calculator-title').textContent = tool.title;
    $('form-fields').innerHTML = fields().map(item => `<div class="field"><label for="field-${item.key}">${esc(item.label)} <span>${esc(item.symbol)}</span><small>${esc(unitFor(item.kind))}</small></label><div class="input-wrap"><input id="field-${item.key}" data-field="${item.key}" type="number" inputmode="decimal" step="${item.kind === 'count' ? '1' : 'any'}" ${item.signed ? '' : 'min="0"'} required value="${esc(inputNumber(fromMetric(values[current][item.key], item.kind)))}" aria-describedby="help-${item.key}">${item.signed ? `<button class="sign-toggle" type="button" data-sign="${item.key}" aria-label="切換${esc(item.label)}正負號">±</button>` : ''}</div><small id="help-${item.key}">${esc(item.help)}</small></div>`).join('');
    $('form-note').textContent = current === 'tolerance' ? '依圖面輸入偏差，單位見各欄標示。此工具不代查 ISO 公差等級。' : current === 'thread' ? '預鑽為公制 60° 切削攻牙的 D−P 粗估；TPI 僅換算牙距，不代表已選定螺紋標準。' : 'Vc 與進給值請依刀具資料及加工條件輸入；預填值僅作計算示例。';
    const modes = current === 'thread' ? [['pitch', '依螺距'], ['tpi', '依 TPI']] : current === 'tolerance' ? [['limits', '尺寸上下限'], ['fit', '孔軸配合']] : [];
    $('submode-switch').hidden = modes.length === 0;
    $('submode-switch').innerHTML = modes.map(([id, label]) => `<button type="button" data-submode="${id}" aria-pressed="${id === (current === 'thread' ? threadBasis : toleranceMode)}">${label}</button>`).join('');
    formDirty = false;
    setError('');
    // 共用基本尺寸改變後，另一種公差模式的既存偏差也可能需要修正。
    try { renderResult(run(values[current])); }
    catch (error) { formDirty = true; setError(error.message); renderResult(null); }
    renderedCategory = current;
    syncFavorite();
  }

  // ── 04｜計算與錯誤：無效輸入不留下上一組結果，亦不轉存為有效數值。 ──
  function run(input) {
    if (['milling', 'drilling', 'turning', 'thread'].includes(current)) return M[current](input);
    if (toleranceMode === 'limits') return M.limits(input.nominal, input.upper, input.lower);
    const hole = M.limits(input.nominal, input.holeUpper, input.holeLower);
    const shaft = M.limits(input.nominal, input.shaftUpper, input.shaftLower);
    return { ...M.fit(hole.min, hole.max, shaft.min, shaft.max), hole, shaft };
  }
  function calculate() {
    const candidate = { ...values[current] };
    try {
      for (const item of fields()) {
        const input = $('field-' + item.key), number = input.valueAsNumber;
        const valid = input.checkValidity() && Number.isFinite(number) && (item.signed || number > 0) && (item.kind !== 'count' || Number.isSafeInteger(number));
        input.setAttribute('aria-invalid', String(!valid));
        if (!valid) throw new RangeError(`請確認「${item.label}」${item.signed ? '為有效數值' : item.kind === 'count' ? '為大於 0 的整數' : '大於 0'}。`);
        candidate[item.key] = toMetric(number, item.kind);
      }
      const result = run(candidate);
      values[current] = candidate;
      formDirty = false;
      setError(''); renderResult(result);
      return true;
    } catch (error) {
      formDirty = true;
      setError(error instanceof RangeError ? error.message : '請確認輸入的數值。');
      renderResult(null);
      return false;
    }
  }
  function setError(message) { $('form-error').textContent = message; $('form-error').hidden = !message; }

  function resultRows(result) {
    const size = value => value === undefined ? undefined : fromMetric(value, 'length');
    const dimensionalDigits = unit === 'metric' ? 6 : 7;
    if (['milling', 'drilling', 'turning'].includes(current)) return [['主軸轉速 n', result?.rpm, 'rpm', 2], ['每分鐘進給 vf', size(result?.feedRate), lengthUnit() + '/min', 3]];
    if (current === 'thread') return [['螺距 P', size(result?.pitch), lengthUnit(), dimensionalDigits], ['每英吋牙數', result?.tpi, 'TPI', 4], ['預鑽孔徑粗估', size(result?.tapDrill), lengthUnit(), dimensionalDigits]];
    if (toleranceMode === 'limits') return [['最大尺寸', size(result?.max), lengthUnit(), dimensionalDigits], ['最小尺寸', size(result?.min), lengthUnit(), dimensionalDigits], ['公差寬度', result ? size(result.max - result.min) : undefined, lengthUnit(), dimensionalDigits]];
    return [['最小間隙', size(result?.minClearance), lengthUnit(), dimensionalDigits], ['最大間隙', size(result?.maxClearance), lengthUnit(), dimensionalDigits]];
  }
  function renderResult(result) {
    lastResult = result;
    const rows = resultRows(result), tool = activeTool();
    $('result-grid').innerHTML = rows.map(([label, value, suffix, digits]) => `<div class="result-value"><small>${esc(label)}</small><strong>${value === undefined ? '—' : esc(format(value, digits))}</strong><span>${esc(suffix)}</span></div>`).join('');
    $('copy-result').disabled = !result;
    let context = result ? '依目前輸入條件計算' : '請修正輸入後查看結果';
    if (result && current === 'tolerance' && toleranceMode === 'fit') {
      const names = { clearance: '間隙配合', interference: '過盈配合', transition: '過渡配合' };
      const type = result.minClearance === 0 && result.maxClearance === 0 ? '零間隙' : names[result.type];
      context = type + `｜孔 ${format(fromMetric(result.hole.min, 'length'), 7)}–${format(fromMetric(result.hole.max, 'length'), 7)} ${lengthUnit()}；軸 ${format(fromMetric(result.shaft.min, 'length'), 7)}–${format(fromMetric(result.shaft.max, 'length'), 7)} ${lengthUnit()}`;
    }
    $('result-context').textContent = context;
    let formula = tool.formula;
    if (unit === 'imperial' && ['milling', 'drilling', 'turning'].includes(current)) formula = 'n = 12 × Vc ÷ (π × D)；vf = n × ' + (current === 'milling' ? 'z × fz' : 'fn');
    if (unit === 'imperial' && current === 'thread') formula = 'P(in) = 1 ÷ TPI；預鑽 d ≈ D − P';
    $('formula').textContent = formula;
    $('formula-note').textContent = ['milling', 'drilling', 'turning'].includes(current) ? `公式中的 D 為 ${lengthUnit()}，Vc 為 ${unit === 'metric' ? 'm/min' : 'ft/min'}。` : current === 'tolerance' ? '依使用者輸入的圖面上下限進行尺寸加減。' : '預鑽粗估與成形攻牙、實際選用孔徑分開確認。';
    $('result-notes').innerHTML = tool.notes.map(note => `<li>${esc(note)}</li>`).join('');
    $('formula-sources').innerHTML = tool.sourceIds.map(id => sources.get(id)).filter(Boolean).map(source => `<a href="${esc(safeURL(source.url))}" target="_blank" rel="noopener noreferrer">${esc(source.title)}</a>`).join('');
  }

  // ── 05｜分類、收藏與畫面導覽：五個工具都直接開啟可用表單。 ──
  function cards(items) {
    return items.map(item => `<button class="category-card" type="button" data-category="${item.id}"><span class="category-icon">${icon(item.icon)}</span><span class="english">${esc(item.english.toUpperCase())}</span><h2>${esc(item.title)}</h2><p>${esc(item.description)}</p><span class="card-action">開啟計算${favorites.has(item.id) ? ' · 已收藏' : ''}</span></button>`).join('');
  }
  function renderCards() {
    $('category-grid').innerHTML = cards(catalog.categories);
    const items = catalog.categories.filter(item => favorites.has(item.id));
    $('favorites-list').innerHTML = items.length ? cards(items) : `<div class="empty-state">${icon('star')}<h3>把常用計算留下來。</h3><p>進入計算頁，按右上角星號即可加入收藏。</p><button class="primary-button" type="button" data-screen="home">瀏覽分類</button></div>`;
    $('favorite-count').textContent = favorites.size;
    $('favorite-count').hidden = favorites.size === 0;
  }
  function syncFavorite() {
    $('favorite-tool').setAttribute('aria-pressed', String(favorites.has(current)));
    $('favorite-tool').setAttribute('aria-label', `${favorites.has(current) ? '取消收藏' : '收藏'}${categories.get(current).title}計算`);
  }
  function syncHeader() {
    $('screen-title').textContent = screen === 'calculator' ? categories.get(current).title + '計算' : { home: '加工計算工具箱', favorites: '我的收藏', sources: '公式與說明' }[screen];
    $('screen-back').hidden = screen !== 'calculator';
    document.querySelectorAll('[data-unit]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.unit === unit)));
    document.querySelectorAll('nav [data-screen]').forEach(button => {
      if (button.dataset.screen === screen) button.setAttribute('aria-current', 'page'); else button.removeAttribute('aria-current');
    });
  }
  function show(next, { updateURL = true } = {}) {
    if (!['home', 'calculator', 'favorites', 'sources'].includes(next)) return;
    if (next === 'calculator' && screen === next && renderedCategory === current) { window.scrollTo({ top: 0, behavior: 'instant' }); return; }
    screen = next;
    document.body.dataset.screen = screen;
    for (const name of ['home', 'calculator', 'favorites', 'sources']) $(name + '-screen').hidden = name !== screen;
    if (screen === 'calculator') renderForm();
    renderCards(); syncHeader();
    if (updateURL) { try { history.replaceState(null, '', screen === 'calculator' ? '#' + current : '#' + screen); } catch { /* 直接開檔不支援網址修改時仍可使用。 */ } }
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  function openCategory(id) { if (categories.has(id)) { current = id; show('calculator'); } }
  function renderSources() {
    $('sources-list').innerHTML = `<section class="source-card"><h3>公差與配合的範圍</h3><p>依圖面輸入基本尺寸和上下偏差，自行計算尺寸界限及孔軸間隙。未內建 ISO 公差等級或建議配合表。</p></section><section class="source-card"><h3>單位與收藏</h3><p>1 in = 25.4 mm；1 ft = 0.3048 m。切換 mm／in 會同步換算顯示數值。收藏與顯示單位只保存在這個網址的瀏覽器；計算數值留在目前開啟期間。</p></section>` + catalog.sources.map(source => `<section class="source-card"><h3><a href="${esc(safeURL(source.url))}" target="_blank" rel="noopener noreferrer">${esc(source.title)}</a></h3><p>${esc(source.scope)}</p></section>`).join('');
  }

  // ── 06｜即時輸入與顯示切換：無效草稿不會被靜默替換為範例值。 ──
  $('calculator-form').addEventListener('input', () => { formDirty = true; calculate(); });
  $('calculator-form').addEventListener('submit', event => { event.preventDefault(); calculate(); });
  document.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button || button.disabled) return;
    if (button.dataset.category) openCategory(button.dataset.category);
    else if (button.dataset.screen) show(button.dataset.screen);
    else if (button.id === 'screen-back') show('home');
    else if (button.dataset.unit) {
      if (unit === button.dataset.unit) return;
      if (screen === 'calculator' && formDirty && !calculate()) { toast('請先修正輸入，再切換單位。'); return; }
      try {
        for (const input of Object.values(values)) {
          for (const [key, value] of Object.entries(input)) fromMetric(value, key === 'teeth' ? 'count' : key === 'cuttingSpeed' ? 'speed' : 'length', button.dataset.unit);
        }
      } catch { toast('工作數值超出此單位的顯示範圍，請先調整數值。'); return; }
      unit = button.dataset.unit; savePreferences(); syncHeader();
      if (screen === 'calculator') renderForm();
    } else if (button.dataset.submode) {
      if (formDirty && !calculate()) { toast('請先修正目前輸入。'); return; }
      if (current === 'thread') threadBasis = button.dataset.submode;
      else toleranceMode = button.dataset.submode;
      renderForm();
    } else if (button.dataset.sign) {
      const input = $('field-' + button.dataset.sign);
      if (Number.isFinite(input.valueAsNumber)) { input.value = inputNumber(-input.valueAsNumber); formDirty = true; calculate(); }
    } else if (button.id === 'load-example') {
      values[current] = structuredClone(defaults[current]); renderForm(); toast('已載入計算範例。');
    } else if (button.id === 'favorite-tool') {
      if (favorites.has(current)) favorites.delete(current); else favorites.add(current);
      savePreferences(); syncFavorite(); renderCards();
      if (!saveFailed) toast(favorites.has(current) ? '已加入收藏' : '已取消收藏');
    } else if (button.id === 'copy-result') copyResult();
  });

  // ── 07｜結果複製與提示：複製的是附單位的數值說明，不產生機台程式。 ──
  function toast(message) { $('toast').textContent = message; $('toast').hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { $('toast').hidden = true; }, 3500); }
  async function copyResult() {
    if (!lastResult) return;
    const lines = [categories.get(current).title + '｜' + activeTool().title];
    fields().forEach(item => lines.push(`${item.label}：${$('field-' + item.key).value} ${unitFor(item.kind)}`));
    resultRows(lastResult).forEach(([label, value, suffix, digits]) => lines.push(`${label}：${format(value, digits)} ${suffix}`));
    lines.push($('result-context').textContent);
    try {
      const text = lines.join('\n');
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
      else { const node = document.createElement('textarea'); node.value = text; node.readOnly = true; node.style.cssText = 'position:fixed;left:-9999px;top:0'; document.body.append(node); node.select(); const copied = document.execCommand('copy'); node.remove(); $('copy-result').focus(); if (!copied) throw new Error('Copy unavailable'); }
      toast('已複製結果與單位。');
    } catch { toast('無法自動複製，可選取結果文字複製。'); }
  }
  function route() {
    let hash = ''; try { hash = decodeURIComponent(location.hash.slice(1)); } catch { /* 無效網址回到首頁。 */ }
    if (categories.has(hash)) { current = hash; show('calculator', { updateURL: false }); }
    else show(['favorites', 'sources'].includes(hash) ? hash : 'home', { updateURL: false });
  }
  addEventListener('hashchange', route);
  renderSources(); route();
})();
