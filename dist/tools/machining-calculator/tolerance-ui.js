/**
 * ISO 公差查表｜操作介面
 * 01 狀態與單位　02 原表與尺寸結果　03 查詢／收藏　04 外部導覽
 * 畫面模組與資料、查表核心分開；新增原表時不必改動版面。
 */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const icon = name => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
  const KEY = 'cwli-iso-tolerance-v1';
  const core = window.IsoToleranceMath.create({ holeData: window.ISO_HOLE_DATA, shaftData: window.ISO_SHAFT_DATA, itData: window.ISO_IT_DATA });
  let unit = 'metric', callbacks = {}, host, saved = [];
  let state = { mode: 'lookup', member: 'hole', zone: 'H', grade: '7', nominalMm: 25, bandKey: '', holeClass: 'H7', shaftClass: 'g6', itGrade: '7' };
  let invalidNominal = false, routeError = '';
  const unitLabel = () => unit === 'metric' ? 'mm' : 'in';
  const display = mm => unit === 'metric' ? mm : mm / 25.4;
  const number = (value, signed = false, minDigits = 0) => {
    const zero = Math.abs(value) < 1e-12 ? 0 : value;
    return (signed && zero > 0 ? '+' : '') + new Intl.NumberFormat('zh-TW', { minimumFractionDigits: minDigits, maximumFractionDigits: unit === 'metric' ? 6 : 8, useGrouping: false }).format(zero);
  };
  const deviation = um => number(display(um / 1000), true, 3);
  const dimension = mm => number(display(mm), false, 3);
  const bandKey = row => `${row.minMm}/${row.maxMm}`;
  function bandLabel(row) {
    const minimum = row.minimumNominalMm;
    if (minimum !== undefined && minimum > row.minMm) return `${minimum} ${row.minimumNominalExclusive ? '<' : '≤'} D ≤ ${row.maxMm} mm`;
    return `${row.minMm} < D ≤ ${row.maxMm} mm`;
  }
  function rows() { return state.mode === 'it' ? core.itBands(state.itGrade) : core.bands(state.member, state.zone, state.grade); }
  function selectedRow() {
    if (invalidNominal) return null;
    if (state.nominalMm !== null) return rows().find(row => core.contains(row, state.nominalMm)) || null;
    return rows().find(row => bandKey(row) === state.bandKey) || null;
  }
  function chooseBand() {
    const available = rows(), match = state.nominalMm !== null && available.find(row => core.contains(row, state.nominalMm));
    if (match) state.bandKey = bandKey(match);
    else if (!available.some(row => bandKey(row) === state.bandKey)) state.bandKey = available[0] ? bandKey(available[0]) : '';
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify({ state, saved })); }
    catch { callbacks.onToast?.('查表仍可使用；這個瀏覽器暫時無法儲存收藏。'); }
  }
  function option(value, label, selected) { return `<option value="${esc(value)}"${value === selected ? ' selected' : ''}>${esc(label)}</option>`; }
  function select(name, label, options, current) { return `<label class="iso-field">${label}<select data-iso="${name}" id="iso-${name}">${options.map(item => option(item, item, current)).join('')}</select></label>`; }
  function nominalField() {
    const value = state.nominalMm === null ? '' : Number(display(state.nominalMm).toPrecision(15));
    return `<label class="iso-field iso-nominal">基本尺寸 D <span class="iso-input-unit">${unitLabel()}</span><input id="iso-nominal" data-iso="nominal" type="number" inputmode="decimal" min="0" step="any" value="${value}" placeholder="輸入尺寸，如 ${unit === 'metric' ? '25' : '1'}" aria-describedby="iso-range-note" autocomplete="off"></label>`;
  }
  function renderControls() {
    let form = '';
    if (state.mode === 'lookup') {
      form = `<div class="iso-member-switch" role="group" aria-label="查詢孔或軸">${['hole', 'shaft'].map(member => `<button type="button" data-iso-member="${member}" aria-pressed="${state.member === member}"><span class="iso-member-icon ${member}" aria-hidden="true"></span>${member === 'hole' ? '孔 HOLE' : '軸 SHAFT'}</button>`).join('')}</div><div class="iso-control-pair">${select('zone', '公差帶', core.zones(state.member), state.zone)}${select('grade', 'IT 等級', core.grades(state.member, state.zone), state.grade)}</div>`;
    } else if (state.mode === 'fit') {
      form = `<p class="iso-control-intro">同一基本尺寸，比較孔與軸的實際尺寸範圍。</p><div class="iso-control-pair">${select('holeClass', '孔公差', core.classes('hole'), state.holeClass)}${select('shaftClass', '軸公差', core.classes('shaft'), state.shaftClass)}</div>`;
    } else {
      form = `<p class="iso-control-intro">IT 等級表示公差寬度；孔／軸公差帶決定寬度相對零線的位置。</p>${select('itGrade', '標準公差等級', core.itGrades(), state.itGrade)}`;
    }
    const bandSelect = state.mode !== 'fit' ? `<label class="iso-field">尺寸範圍 <small>原表單位 mm</small><select id="iso-band" data-iso="band">${rows().map(row => option(bandKey(row), bandLabel(row), state.bandKey)).join('')}</select></label>` : '';
    $('iso-controls').innerHTML = form + nominalField() + bandSelect + `<p id="iso-range-note" class="iso-help"></p>`;
    $('iso-presets').hidden = state.mode === 'it';
    $('iso-presets').innerHTML = (state.mode === 'fit' ? ['H7/g6', 'H7/h6', 'H7/k6', 'H7/p6'] : ['H7', 'h6', 'g6', 'A9']).map(preset => `<button type="button" data-iso-preset="${preset}" class="iso-chip">${preset}</button>`).join('');
  }

  // ── 02｜結果：偏差和實際尺寸分開；選尺寸段不假設基本尺寸。 ──
  function sourceBlock(records) {
    const unique = records.filter((record, index) => records.findIndex(other => other.sourceId === record.sourceId && other.pageLabel === record.pageLabel) === index);
    return `<details class="iso-source"><summary>原表來源與標準版本</summary>${unique.map(row => {
      const source = core.sources.find(item => item.id === row.sourceId);
      if (!source) return '';
      const url = /^https:\/\//.test(source.url) ? source.url : '';
      return `<p><a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(source.title)}</a><br>${esc(source.version)}<br>${esc(row.pageLabel)}<br>${esc(source.scope)}</p>`;
    }).join('')}<p>表格空白與來源疑誤格未收錄；不同版本或未收錄的組合不以公式補值。</p></details>`;
  }
  function diagram(items) {
    const low = Math.min(0, ...items.map(item => item.row.lowerUm)), high = Math.max(0, ...items.map(item => item.row.upperUm));
    const pad = Math.max((high - low) * 0.22, 3), y = value => 135 - (value - low + pad) / (high - low + 2 * pad) * 105;
    return `<div class="iso-diagram"><svg viewBox="0 0 420 170" role="img" aria-label="公差帶相對基本尺寸零線的偏差示意，單位微米"><path d="M25 ${y(0)}H395" class="iso-zero"/><text x="25" y="${y(0) - 8}">零線 · 基本尺寸</text>${items.map((item, i) => {
      const x = items.length === 1 ? 185 : 145 + i * 140, top = y(item.row.upperUm), bottom = y(item.row.lowerUm);
      return `<rect class="iso-zone-${item.member}" x="${x}" y="${top}" width="66" height="${Math.max(1, bottom - top)}" rx="4"/><text x="${x + 33}" y="${Math.max(15, top - 8)}" text-anchor="middle">${esc(item.label)} · ${number(item.row.upperUm, true)} μm</text><text x="${x + 33}" y="${bottom + 18}" text-anchor="middle">${number(item.row.lowerUm, true)} μm</text>`;
    }).join('')}</svg><p>公差帶位置示意 · 偏差單位 μm</p></div>`;
  }
  function stat(label, value, sub, kind = '') { return `<div class="iso-stat ${kind}"><dt>${label}</dt><dd>${value}<small>${sub}</small></dd></div>`; }
  function limits(row, nominal, member) {
    const data = nominal === null ? null : core.dimensions(row, nominal);
    return `<div class="iso-dimension-table"><h4>${member === 'hole' ? '孔' : '軸'}實際尺寸 <span>${unitLabel()}</span></h4><dl>${stat('最大尺寸', data ? dimension(data.maximumMm) : '—', data ? '基本尺寸 ＋ 上偏差' : '輸入基本尺寸後顯示')}${stat('最小尺寸', data ? dimension(data.minimumMm) : '—', data ? '基本尺寸 ＋ 下偏差' : '輸入基本尺寸後顯示')}</dl></div>`;
  }
  function renderResult() {
    let result = '', title = '', kicker = '', copy = [], records = [], valid = false, mobileStats = '', mobileCaption = '';
    let row = routeError ? null : selectedRow();
    const physicalError = row && state.mode === 'lookup' && state.nominalMm !== null && state.nominalMm + row.lowerUm / 1000 <= 0;
    if (physicalError) row = null;
    if (state.mode === 'fit') {
      const fit = !routeError && !invalidNominal && state.nominalMm !== null && core.fit(state.nominalMm, state.holeClass, state.shaftClass);
      title = `${state.holeClass} / ${state.shaftClass}`; kicker = 'HOLE & SHAFT · 孔軸配合';
      if (fit) {
        valid = true; records = [fit.hole, fit.shaft];
        mobileCaption = `${fit.type} · D ${dimension(state.nominalMm)} ${unitLabel()}`;
        mobileStats = stat('最大間隙', deviation(fit.maximumUm), unitLabel(), 'iso-upper') + stat('最小間隙', deviation(fit.minimumUm), unitLabel(), 'iso-lower');
        result = `<div class="iso-fit-type">${fit.type}<span>正值為間隙，負值為過盈</span></div><dl class="iso-deviation-grid">${stat('最大間隙', deviation(fit.maximumUm), `${unitLabel()} · ${number(fit.maximumUm, true)} μm`, 'iso-upper')}${stat('最小間隙', deviation(fit.minimumUm), `${unitLabel()} · ${number(fit.minimumUm, true)} μm`, 'iso-lower')}</dl>${diagram([{ member: 'hole', label: state.holeClass, row: fit.hole }, { member: 'shaft', label: state.shaftClass, row: fit.shaft }])}<div class="iso-fit-limits">${limits(fit.hole, state.nominalMm, 'hole')}${limits(fit.shaft, state.nominalMm, 'shaft')}</div>`;
        copy = [`${title}｜D ${dimension(state.nominalMm)} ${unitLabel()}｜${fit.type}`, `最大間隙 ${deviation(fit.maximumUm)} ${unitLabel()}；最小間隙 ${deviation(fit.minimumUm)} ${unitLabel()}`, `孔 ${dimension(fit.holeDimensions.minimumMm)}–${dimension(fit.holeDimensions.maximumMm)} ${unitLabel()}`, `軸 ${dimension(fit.shaftDimensions.minimumMm)}–${dimension(fit.shaftDimensions.maximumMm)} ${unitLabel()}`];
      }
    } else if (state.mode === 'it') {
      title = `IT${state.itGrade}`; kicker = 'STANDARD TOLERANCE · 標準公差';
      if (row) {
        valid = true; records = [row];
        mobileCaption = bandLabel(row);
        mobileStats = stat('公差寬度', number(display(row.widthUm / 1000), false, 3), `${unitLabel()} · ${number(row.widthUm)} μm`, 'iso-upper');
        result = `<p class="iso-band-caption">${bandLabel(row)}</p><dl class="iso-deviation-grid iso-it-width">${stat('公差寬度', number(display(row.widthUm / 1000), false, 3), `${unitLabel()} · ${number(row.widthUm)} μm`, 'iso-upper')}</dl><div class="iso-explanation"><h4>IT 等級 = 公差帶的寬度</h4><p>選 IT 等級只能查寬度。要知道上、下偏差，請切到「公差查表」，再選 H、g 等公差帶。</p></div>`;
        copy = [`IT${state.itGrade}｜${bandLabel(row)}`, `公差寬度 ${number(display(row.widthUm / 1000), false, 3)} ${unitLabel()} (${number(row.widthUm)} μm)`];
      }
    } else {
      title = state.zone + state.grade; kicker = state.member === 'hole' ? 'HOLE · 孔公差' : 'SHAFT · 軸公差';
      if (row) {
        valid = true; records = [row];
        mobileCaption = bandLabel(row);
        mobileStats = stat('上偏差', deviation(row.upperUm), unitLabel(), 'iso-upper') + stat('下偏差', deviation(row.lowerUm), unitLabel(), 'iso-lower');
        result = `<p class="iso-band-caption">${bandLabel(row)}${state.nominalMm !== null ? ` <span>· D ${dimension(state.nominalMm)} ${unitLabel()}</span>` : ''}</p><dl class="iso-deviation-grid">${stat(`上偏差 <span>${state.member === 'hole' ? 'ES' : 'es'}</span>`, deviation(row.upperUm), `${unitLabel()} · ${number(row.upperUm, true)} μm`, 'iso-upper')}${stat(`下偏差 <span>${state.member === 'hole' ? 'EI' : 'ei'}</span>`, deviation(row.lowerUm), `${unitLabel()} · ${number(row.lowerUm, true)} μm`, 'iso-lower')}</dl>${limits(row, state.nominalMm, state.member)}<p class="iso-width-note">公差寬度 <strong>${number(row.upperUm - row.lowerUm)} μm</strong><span>＝ 上偏差 − 下偏差</span></p>${diagram([{ member: state.member, label: title, row }])}`;
        copy = [`${title}｜${state.member === 'hole' ? '孔' : '軸'}｜${bandLabel(row)}`, `上偏差 ${deviation(row.upperUm)} ${unitLabel()}；下偏差 ${deviation(row.lowerUm)} ${unitLabel()}`];
        if (state.nominalMm !== null) { const d = core.dimensions(row, state.nominalMm); copy.push(`D ${dimension(state.nominalMm)} ${unitLabel()}；尺寸 ${dimension(d.minimumMm)}–${dimension(d.maximumMm)} ${unitLabel()}`); }
      }
    }
    $('iso-result-kicker').textContent = kicker; $('iso-result-title').textContent = title;
    if (!valid) result = `<div class="iso-no-result" role="status">${icon('info')}<h4>${routeError ? esc(routeError) : physicalError ? '這組條件會產生非正的實際尺寸' : invalidNominal ? '請輸入有效的正尺寸' : state.nominalMm === null ? '輸入基本尺寸，查看配合' : '這個尺寸尚無對應原表資料'}</h4><p>${state.mode === 'fit' ? '孔與軸都須有對應原表及有效的實際尺寸。輸入大於 0、且在收錄範圍內的基本尺寸。' : '請確認所選公差等級與尺寸範圍。A／B 等公差帶另有最小適用尺寸，不外推空白或未收錄格。'}</p></div>`;
    $('iso-result-content').innerHTML = result + (valid ? `<p class="iso-version">${state.mode === 'it' ? 'ISO 286-1:2010 · Schaeffler 2025 原表' : 'GB/T 1800.2—2020 · ISO 286-2:2010（MOD）原表'}</p>` + sourceBlock(records) : '');
    $('iso-mobile-preview').innerHTML = `<div class="iso-mini-heading"><strong>${esc(title)}</strong><span>${esc(mobileCaption || '請確認查詢條件')}</span></div>${valid ? `<dl class="iso-deviation-grid${state.mode === 'it' ? ' iso-it-width' : ''}">${mobileStats}</dl>` : '<p class="iso-help">目前沒有有效結果，請調整下方條件。</p>'}`;
    $('iso-copy').disabled = !valid; $('iso-save').disabled = !valid;
    const hash = getHash();
    $('iso-save').setAttribute('aria-pressed', String(saved.some(item => item.hash === hash)));
    $('iso-save').setAttribute('aria-label', saved.some(item => item.hash === hash) ? '取消收藏這筆公差' : '收藏這筆公差');
    $('iso-range-note').textContent = state.mode === 'fit' ? '基本尺寸以目前顯示單位輸入。' : row ? `適用：${bandLabel(row)}。${state.nominalMm === null ? '目前僅查偏差；輸入尺寸即可顯示尺寸上下限。' : '依尺寸段標示，自動查找邊界值對應的原表。'}` : '輸入尺寸後，自動尋找適用的尺寸段；超出資料範圍時不顯示舊結果。';
    if ($('iso-band')) { $('iso-band').value = row ? bandKey(row) : ''; }
    host.dataset.copyText = [...copy, ...records.map(record => { const source = core.sources.find(item => item.id === record.sourceId); return `${source?.version || ''}｜${record.pageLabel}`; })].join('\n');
  }
  function renderSaved() {
    const html = saved.map(item => `<div class="iso-saved-row"><a href="#${esc(item.hash)}"><strong>${esc(item.title)}</strong><span>${esc(item.subtitle)}</span></a><button type="button" class="icon-button" data-iso-remove="${esc(item.hash)}" aria-label="移除收藏 ${esc(item.title)}">×</button></div>`).join('');
    $('iso-saved-list').innerHTML = html || '<p class="iso-help">按結果右上角星號，留下常查的規格。</p>';
    $('iso-global-saved').hidden = !saved.length || document.body.dataset.screen !== 'favorites';
    $('iso-global-list').innerHTML = html;
  }
  function render() {
    host.querySelectorAll('[data-iso-mode]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.isoMode === state.mode)));
    chooseBand(); renderControls(); renderResult(); renderSaved();
    $('iso-coverage').textContent = `孔 ${core.zones('hole').length} 帶 · 軸 ${core.zones('shaft').length} 帶 · IT01–IT18 · 收錄尺寸至 500 mm`;
  }
  function changed({ controls = true } = {}) {
    routeError = '';
    chooseBand(); if (controls) renderControls(); renderResult(); renderSaved(); if (!invalidNominal) { save(); callbacks.onRoute?.(getHash()); }
  }

  // ── 03｜搜尋與收藏：大小寫有意義；H 為孔，h 為軸。 ──
  function applyQuery(query, { notifyRoute = true } = {}) {
    const parsed = core.parseQuery(query);
    if (!parsed) { routeError = '無法辨識這個公差查詢'; renderResult(); callbacks.onToast?.('可輸入 25 H7、h6、25 H7/g6 或 IT7；尺寸固定以 mm 解析。'); return false; }
    if (parsed.mode === 'lookup' && !core.bands(parsed.member, parsed.zone, parsed.grade).length || parsed.mode === 'fit' && (!core.classes('hole').includes(parsed.holeClass) || !core.classes('shaft').includes(parsed.shaftClass)) || parsed.mode === 'it' && !core.itGrades().includes(parsed.grade)) {
      routeError = '這個公差組合尚未收錄'; renderResult(); callbacks.onToast?.('這個公差組合未收錄於目前原表；請改用選單查找。'); return false;
    }
    state.mode = parsed.mode;
    if (parsed.mode === 'lookup') Object.assign(state, { member: parsed.member, zone: parsed.zone, grade: parsed.grade });
    else if (parsed.mode === 'fit') Object.assign(state, { holeClass: parsed.holeClass, shaftClass: parsed.shaftClass });
    else state.itGrade = parsed.grade;
    if (parsed.nominalMm !== null) state.nominalMm = parsed.nominalMm;
    routeError = ''; invalidNominal = false; chooseBand(); render(); save(); if (notifyRoute) callbacks.onRoute?.(getHash()); return true;
  }
  async function copyResult() {
    if ($('iso-copy').disabled) return;
    try {
      const text = host.dataset.copyText;
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
      else { const node = document.createElement('textarea'); node.value = text; node.style.cssText = 'position:fixed;left:-9999px'; document.body.append(node); node.select(); const copied = document.execCommand('copy'); node.remove(); $('iso-copy').focus(); if (!copied) throw new Error('copy'); }
      callbacks.onToast?.('已複製公差、單位與原表版本。');
    } catch { callbacks.onToast?.('無法自動複製，可直接選取結果文字。'); }
  }
  function getHash() {
    const d = state.nominalMm !== null && !invalidNominal ? String(Number(state.nominalMm.toPrecision(15))) : null;
    if (state.mode === 'fit') return d ? `tolerance/fit/${state.holeClass}/${state.shaftClass}/${d}` : 'tolerance';
    if (state.mode === 'it') return d ? `tolerance/it/${state.itGrade}/${d}` : `tolerance/it/${state.itGrade}/band/${state.bandKey}`;
    return d ? `tolerance/${state.member}/${state.zone}${state.grade}/${d}` : `tolerance/${state.member}/${state.zone}${state.grade}/band/${state.bandKey}`;
  }
  function open(hash = '') {
    const parts = String(hash).replace(/^#/, '').split('/');
    routeError = '';
    if (parts[0] === 'tolerance' && parts.length > 1) {
      const numeric = text => /^\d+(?:\.\d+)?$/.test(text || '') && Number.isFinite(Number(text)) && Number(text) > 0;
      const isBand = parts[3] === 'band' && parts.length === 6;
      let query = '', available = [];
      if (parts[1] === 'fit' && parts.length === 5 && numeric(parts[4])) query = `${parts[4]} ${parts[2]}/${parts[3]}`;
      else if (parts[1] === 'it' && core.itGrades().includes(parts[2]) && (isBand || parts.length === 4 && numeric(parts[3]))) { query = `IT${parts[2]}${isBand ? '' : ' ' + parts[3]}`; available = core.itBands(parts[2]); }
      else if (['hole', 'shaft'].includes(parts[1]) && (isBand || parts.length === 4 && numeric(parts[3]))) { const spec = core.parseClass(parts[2], parts[1]); if (spec) { available = core.bands(spec.member, spec.zone, spec.grade); if (available.length) query = `${isBand ? '' : parts[3]} ${parts[2]}`; } }
      const rangeKey = `${parts[4]}/${parts[5]}`;
      if (!query || isBand && !available.some(row => bandKey(row) === rangeKey) || !applyQuery(query, { notifyRoute: false })) routeError = '連結沒有對應的公差資料';
      else if (isBand) { state.nominalMm = null; state.bandKey = rangeKey; }
    }
    invalidNominal = false; render(); if (!routeError) save();
  }
  function mount(options) {
    callbacks = options; host = $('tolerance-library');
    try {
      const data = JSON.parse(localStorage.getItem(KEY) || '{}');
      const s = data.state;
      if (s && ['lookup', 'fit', 'it'].includes(s.mode) && ['hole', 'shaft'].includes(s.member) && core.bands(s.member, s.zone, s.grade).length && core.classes('hole').includes(s.holeClass) && core.classes('shaft').includes(s.shaftClass) && core.itGrades().includes(s.itGrade) && (s.nominalMm === null || Number.isFinite(s.nominalMm) && s.nominalMm > 0)) state = { ...state, ...s };
      if (Array.isArray(data.saved)) saved = data.saved.filter(item => typeof item.hash === 'string' && /^tolerance\//.test(item.hash) && typeof item.title === 'string' && typeof item.subtitle === 'string').slice(0, 30);
    } catch { /* 偏好失效不影響查表。 */ }
    host.addEventListener('submit', event => { event.preventDefault(); applyQuery($('iso-search').value); });
    host.addEventListener('input', event => {
      if (event.target.dataset.iso !== 'nominal') return;
      const input = event.target, value = input.valueAsNumber;
      invalidNominal = input.validity.badInput || input.value !== '' && (!Number.isFinite(value) || value <= 0);
      state.nominalMm = Number.isFinite(value) && value > 0 ? (unit === 'metric' ? value : value * 25.4) : null;
      changed({ controls: false });
    });
    host.addEventListener('change', event => {
      const key = event.target.dataset.iso;
      if (!key || key === 'nominal') return;
      if (key === 'band') { state.bandKey = event.target.value; const row = rows().find(item => bandKey(item) === state.bandKey); if (row && !core.contains(row, state.nominalMm)) state.nominalMm = null; invalidNominal = false; }
      else { state[key] = event.target.value; if (key === 'zone' && !core.grades(state.member, state.zone).includes(state.grade)) state.grade = core.grades(state.member, state.zone)[0]; }
      changed();
    });
    document.addEventListener('click', event => {
      const button = event.target.closest('button'); if (!button || button.disabled) return;
      if (button.dataset.isoMode) { state.mode = button.dataset.isoMode; routeError = ''; invalidNominal = false; render(); save(); callbacks.onRoute?.(getHash()); }
      else if (button.dataset.isoMember) { state.member = button.dataset.isoMember; state.zone = state.member === 'hole' ? state.zone.toUpperCase() : state.zone.toLowerCase(); if (!core.zones(state.member).includes(state.zone)) state.zone = state.member === 'hole' ? 'H' : 'h'; if (!core.grades(state.member, state.zone).includes(state.grade)) state.grade = core.grades(state.member, state.zone)[0]; changed(); }
      else if (button.dataset.isoPreset) { applyQuery(button.dataset.isoPreset); }
      else if (button.dataset.isoRemove) { saved = saved.filter(item => item.hash !== button.dataset.isoRemove); save(); renderSaved(); if (host && !host.hidden) renderResult(); }
      else if (button.id === 'iso-manual') callbacks.onManual?.();
      else if (button.id === 'iso-copy') copyResult();
      else if (button.id === 'iso-save') {
        const hash = getHash(), exists = saved.some(item => item.hash === hash);
        if (exists) saved = saved.filter(item => item.hash !== hash);
        else { if (saved.length >= 30) { callbacks.onToast?.('已收藏 30 筆；請先移除較少使用的規格。'); return; } saved.push({ hash, title: $('iso-result-title').textContent, subtitle: state.nominalMm === null ? bandLabel(selectedRow()) : `D ${number(state.nominalMm)} mm` }); }
        save(); renderSaved(); renderResult(); callbacks.onToast?.(exists ? '已取消收藏公差。' : '已收藏這筆公差。');
      }
    });
    render();
  }
  window.IsoTolerance = { mount, open, getHash, getSources: () => core.sources, canSetUnit: () => !invalidNominal, setUnit: value => { unit = value; if (host) { host.dataset.unit = unit; renderControls(); renderResult(); } } };
})();
