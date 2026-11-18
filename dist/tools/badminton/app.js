/**
 * 羽球工具畫面互動｜個人網站複本
 *
 * 本檔使用 engine.js 的 Badminton 引擎，管理名單、設定、畫面與操作事件。
 * 進度僅寫入瀏覽器的獨立儲存鍵 cwli-badminton-courts-v1，不讀取原工具進度。
 * 所有動態姓名先經 esc() 跳脫後再放入 HTML；原有文字與比賽行為保持不變。
 * 日常配色修改請使用 theme.css；HTML 元素 ID 與 data-* 屬性需和本檔保持一致。
 */
(() => {
  'use strict';
  // ── 01｜資料與儲存：取得引擎、定義獨立儲存鍵，並驗證既有進度。 ──
  const B = Badminton, $ = id => document.getElementById(id), KEY = 'cwli-badminton-courts-v1';
  // 圖示來自本機官方 Bootstrap Icons 白名單；姓名等資料仍使用 esc()。
  const icon = name => globalThis.BadmintonIcons?.svg(name) || '';
  const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let state = B.initial(), toastTimer, confirmResolve, storageError = false, loadWarning = '';
  try { const raw = localStorage.getItem(KEY); if (raw) { const saved = JSON.parse(raw); if (B.validate(saved)) state = saved; else loadWarning = '已略過無法讀取的舊進度，請重新建立活動。'; } } catch { loadWarning = '無法讀取本機進度；你仍可使用工具並匯出紀錄。'; storageError = true; }
  const name = id => state.players.find(p => p.id === id)?.name || '球友';
  const teamName = (m, t) => m.teams[t].map(name).join(' / ');
  const allMatches = () => [...state.archive, ...state.matches];

  // ── 02｜共用提示與確認：顯示儲存狀態、訊息及需要確認的操作。 ──
  function toast(message) { $('toast').textContent = message; $('toast').hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').hidden = true, 4500); }
  function save() {
    const wasFailed = storageError;
    try { localStorage.setItem(KEY, JSON.stringify(state)); storageError = false; } catch { storageError = true; }
    $('save-status').classList.toggle('failed', storageError);
    $('save-status').innerHTML = `<span class="save-dot"></span>${storageError ? '儲存失敗，請匯出紀錄' : '已自動儲存於此瀏覽器'}`;
    // 手機頁首用色點節省空間；第一次儲存失敗時另顯示可讀訊息。
    if (storageError && !wasFailed) toast('進度儲存失敗，請至「紀錄」匯出備份。');
  }
  function ask(message, title = '確認操作') {
    $('confirm-title').textContent = title; $('confirm-text').textContent = message; $('confirm-dialog').showModal(); $('confirm-no').focus(); return new Promise(resolve => confirmResolve = resolve);
  }
  function closeConfirm(value) { $('confirm-dialog').close(); confirmResolve?.(value); confirmResolve = null; }
  $('confirm-no').onclick = () => closeConfirm(false); $('confirm-yes').onclick = () => closeConfirm(true); $('confirm-dialog').addEventListener('cancel', e => { e.preventDefault(); closeConfirm(false); });

  // ── 03｜玩法設定：同步欄位、檢查輸入；設定變更供下一輪使用。 ──
  function writeSettings() { const s = state.settings; $('mode').value = s.mode; $('court-count').value = s.courts; $('target').value = s.target; $('target-preset').value = [11, 15, 21].includes(s.target) ? String(s.target) : 'custom'; $('target').disabled = $('target-preset').value !== 'custom'; $('cap').value = s.cap; $('deuce').checked = s.deuce; ruleSummary(); }
  function readSettings() {
    for (const id of ['court-count', 'target', 'cap']) if (!$(id).checkValidity()) { globalThis.BadmintonMobile?.show('settings', { validate: false, focus: false, scroll: false }); $('settings-details').open = true; $(id).reportValidity(); $(id).focus(); return false; }
    const target = Number($('target').value);
    let cap = Number($('cap').value);
    // 不延長時封頂欄位不適用；修正其無效暫存值，避免鎖住手機分頁。
    if (!$('deuce').checked && (!Number.isInteger(cap) || cap < target || cap > 199)) {
      cap = target;
      $('cap').value = cap;
    }
    if (cap < target) { globalThis.BadmintonMobile?.show('settings', { validate: false, focus: false, scroll: false }); $('settings-details').open = true; toast('最高分不能低於目標分數。'); $('cap').focus(); return false; }
    state.settings = { mode: $('mode').value, courts: Number($('court-count').value), target, cap, deuce: $('deuce').checked }; return true;
  }
  function ruleSummary() { const d = $('deuce').checked; $('cap').disabled = !d; $('cap').min = $('target').value; $('rule-summary').textContent = d ? `領先 2 分勝出，最高 ${$('cap').value} 分。` : `先到 ${$('target').value} 分就贏，不延長。`; }
  for (const id of ['mode', 'court-count', 'target', 'cap', 'deuce', 'target-preset']) $(id).addEventListener('change', () => {
    if (id === 'target-preset') { const preset = $('target-preset').value; $('target').disabled = preset !== 'custom'; if (preset !== 'custom') { $('target').value = preset; $('cap').value = ({ '11': 15, '15': 21, '21': 30 })[preset]; } }
    if (id === 'target' && Number($('cap').value) < Number($('target').value)) $('cap').value = $('target').value;
    ruleSummary(); if (readSettings()) { save(); renderOverview(); }
  });

  // ── 04｜畫面渲染：名單、活動概況、比分、發接球站位與歷史紀錄。 ──
  function renderRoster() { const busy = B.busy(state); $('roster-count').textContent = `${state.players.length} 人`; $('player-list').innerHTML = state.players.length ? state.players.map(p => `<div class="player-row"><label><input class="form-check-input mt-0 flex-shrink-0" type="checkbox" data-attend="${esc(p.id)}" ${p.active ? 'checked' : ''} aria-label="${esc(p.name)}可上場"><span class="player-name">${esc(p.name)}</span></label><span class="player-count">${busy.has(p.id) ? '場上 · ' : ''}${p.games} 次</span><button class="remove-player" data-remove="${esc(p.id)}" aria-label="移除${esc(p.name)}" ${allMatches().some(m => m.teams.flat().includes(p.id)) ? 'disabled title="已有出賽紀錄，請取消勾選改為暫休"' : ''}>${icon('x-lg')}</button></div>`).join('') : '<p class="hint py-3 mb-0">先加入名字，或輸入人數開始。</p>'; }
  function renderOverview() {
    const busy = B.busy(state), ready = B.ready(state), waiting = ready.filter(p => !busy.has(p.id)), running = state.matches.some(m => !B.finished(m)), done = allMatches().filter(m => m.winner !== null).length;
    $('stat-ready').textContent = ready.length; $('stat-playing').textContent = busy.size; $('stat-waiting').textContent = waiting.length; $('stat-done').textContent = done;
    $('waiting-count').textContent = `${waiting.length} 人`; $('waiting').innerHTML = waiting.length ? waiting.map(p => `<span class="wait-chip">${esc(p.name)} <small>${p.games} 次</small></span>`).join('') : '<span class="hint">目前沒有候補球友。</span>';
    $('round-heading').textContent = state.matches.length ? `第 ${state.round} 輪${running ? ' · 比賽中' : ' · 已結束'}` : '準備上場';
    const n = state.settings.mode === 'doubles' ? 4 : 2, count = Math.min(state.settings.courts, Math.floor(ready.length / n));
    $('next-round').disabled = running || !count; $('next-round').innerHTML = `${icon(running ? 'grid-1x2' : 'shuffle')}<span class="action-label">${running ? '本輪比賽中' : state.round ? '安排下一輪' : '安排第一輪'}</span>`;
    $('cancel-round').hidden = !B.canCancel(state);
    $('arrange-hint').textContent = running ? '點得分方的「＋1 分」，系統會同步更新發球與接球位置。' : count ? `下一輪可安排 ${count} 面球場、${count * n} 人上場，${ready.length - count * n} 人候補。` : `${state.settings.mode === 'doubles' ? '雙打' : '單打'}至少需要 ${n} 位可上場球友，目前 ${ready.length} 位。`;
  }
  function slot(m, team, side) {
    const srv = B.service(m), id = m.positions[team][m.mode === 'singles' ? 0 : side], isServer = team === srv.team && side === srv.side, isReceiver = team !== srv.team && side === srv.side;
    if (m.mode === 'singles' && side !== srv.side) return `<div class="court-slot"><span class="position-label">${side ? '左' : '右'}區</span></div>`;
    const show = !B.finished(m); return `<div class="court-slot"><span class="position-label">${team ? 'B' : 'A'} 方${side ? '左' : '右'}區</span><div class="player-token ${show && isServer ? 'serving' : show && isReceiver ? 'receiving' : ''}">${show && isServer ? '<span class="role-label">● 發球</span>' : show && isReceiver ? '<span class="role-label">接球</span>' : ''}${esc(name(id))}</div></div>`;
  }
  function courtMap(m) {
    const rotation = state.viewRotation || 0, top = m.flipped ? 0 : 1, sideways = rotation % 180 !== 0;
    // 先由換邊決定兩方場地，再依觀察角度重排顯示。90° 為右側看場。
    const layouts = { 0: [[top, [0, 1]], [1 - top, [1, 0]]], 90: [[top, [1, 0]], [1 - top, [0, 1]]], 180: [[1 - top, [0, 1]], [top, [1, 0]]], 270: [[1 - top, [1, 0]], [top, [0, 1]]] };
    const layout = layouts[rotation], viewLabels = { 0: '底線看場 · 0°', 90: '右側看場 · 90°', 180: '對面底線 · 180°', 270: '左側看場 · 270°' };
    const description = `${sideways ? '左' : '上'}方${layout[0][0] ? 'B' : 'A'}方，${sideways ? '右' : '下'}方${layout[1][0] ? 'B' : 'A'}方。${B.finished(m) ? '此場已結束' : `${name(B.service(m).server)}由自身${B.service(m).side ? '左' : '右'}區發球，${name(B.service(m).receiver)}接球。`}`;
    const half = (i) => `<div class="court-half ${sideways ? (i ? 'side-right' : 'side-left') : (i ? 'bottom' : '')}">${layout[i][1].map(side => slot(m, layout[i][0], side)).join('')}</div>`;
    return `<div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2"><span class="court-view-label">${viewLabels[rotation]}</span><button class="btn btn-outline-secondary court-view-button" data-action="rotate" data-match="${esc(m.id)}" title="切換所有球場的看場角度，計分與發球權不變">${icon('arrow-clockwise')}<span class="action-label">旋轉 90°</span></button></div><div class="court-map ${sideways ? 'sideways' : ''}" data-rotation="${rotation}" role="img" aria-label="${esc(description)}"><div class="court-lines"></div>${half(0)}<div class="court-net"><span>NET</span></div>${half(1)}<div class="court-caption">左右以球員面向球網為準</div></div>`;
  }
  function renderCourts() {
    const focused = document.activeElement?.dataset, focusMatch = focused?.match, focusAction = focused?.action;
    if (!state.matches.length) { $('courts').innerHTML = `<div class="col-12"><div class="surface empty-state"><div><div class="empty-court" aria-hidden="true"></div><h3 class="h4 fw-bold mb-2">球場準備好了。</h3><p class="hint mb-0">先確認球友名單與玩法，<br>就能安排分組、開始計分。</p><button type="button" class="btn btn-primary empty-action mobile-only" data-mobile-go="players">${icon('person-plus')}<span>建立球友名單</span></button><div class="d-flex gap-2 justify-content-center mt-4"><span class="wait-chip">公平輪替</span><span class="wait-chip">自動換發球</span></div></div></div></div>`; return; }
    const html = state.matches.map(m => {
      const f = B.finished(m), srv = B.service(m), started = m.score.some(Boolean), rules = m.rules.deuce ? `${m.rules.target} 分 / 領先 2 分 / ${m.rules.cap} 封頂` : `${m.rules.target} 分 / 不延長`, banner = m.winner !== null ? `<strong>${m.winner ? 'B' : 'A'} 方獲勝！</strong> ${esc(teamName(m, m.winner))}` : m.ended ? '此場已提前結束，不列入勝負。' : `<strong>${esc(name(srv.server))}</strong> 從<strong>${srv.side ? '左' : '右'}區</strong>發球 → <strong>${esc(name(srv.receiver))}</strong> 接球`;
      const action = (a, label, extra = '') => `<button class="btn btn-outline-secondary small-action" data-action="${a}" data-match="${esc(m.id)}" ${extra}>${icon(({ undo: 'arrow-counterclockwise', flip: 'arrow-left-right', stop: 'stop-circle' })[a])}<span class="action-label">${label}</span></button>`;
      return `<div class="col-12 court-column"><article class="surface court-card h-100" id="court-${esc(m.id)}"><div class="court-head p-3 d-flex align-items-center justify-content-between gap-2"><div><h3 class="mb-1">COURT ${String(m.court).padStart(2, '0')} <span class="hint ms-1">${m.mode === 'doubles' ? '雙打' : '單打'}</span></h3><div class="court-rule">${rules}</div></div><div class="court-tools d-flex gap-1"><span class="status-pill ${f ? 'wait' : ''}">${f ? '已結束' : '進行中'}</span><button class="btn btn-outline-secondary" data-action="fullscreen" data-match="${esc(m.id)}" aria-label="放大第${m.court}場地">${icon('fullscreen')}</button></div></div><div class="court-body px-3 pb-3"><div class="scoreboard">${[0, 1].map(t => `${t ? '<div class="score-divider">:</div>' : ''}<div class="team-score team-${t ? 'b' : 'a'}"><div class="team-label mb-1">TEAM ${t ? 'B' : 'A'}</div><div class="team-names">${esc(teamName(m, t))}</div><div class="score-number">${m.score[t]}</div><button class="btn score-button" data-action="point-${t}" data-match="${esc(m.id)}" ${f ? 'disabled' : ''} aria-label="${t ? 'B' : 'A'}方得一分">${icon('plus-lg')}<span>1 分</span></button></div>`).join('')}</div><div class="serve-banner mb-3 ${f ? 'finished' : ''}">${banner}</div>${courtMap(m)}<div class="d-flex justify-content-between align-items-center mt-2 mb-3 legend"><span><span class="legend-dot"></span>發球 <span class="legend-dot receiver ms-2"></span>接球</span><span>發球前位置提示</span></div>
  ${!started && !f ? `<details class="mb-3"><summary class="hint small-action d-flex align-items-center" style="cursor:pointer">開局設定：先發球 / 右區球員 ▾</summary><div class="row g-2 mt-1"><div class="col-12"><label class="form-label" for="serve-${esc(m.id)}">先發球方</label><select class="form-select" id="serve-${esc(m.id)}" data-opening="serve" data-match="${esc(m.id)}"><option value="0" ${m.serving === 0 ? 'selected' : ''}>A 方先發</option><option value="1" ${m.serving === 1 ? 'selected' : ''}>B 方先發</option></select></div>${m.mode === 'doubles' ? [0, 1].map(t => `<div class="col-6"><label class="form-label" for="right-${t}-${esc(m.id)}">${t ? 'B' : 'A'} 方右區</label><select class="form-select" id="right-${t}-${esc(m.id)}" data-opening="right-${t}" data-match="${esc(m.id)}">${m.teams[t].map(id => `<option value="${esc(id)}" ${m.positions[t][0] === id ? 'selected' : ''}>${esc(name(id))}</option>`).join('')}</select></div>`).join('') : ''}</div></details>` : ''}
  <div class="d-flex flex-wrap gap-2 match-actions">${action('undo', '上一步', !m.undo.length ? 'disabled' : '')}${action('flip', '交換場地', f ? 'disabled' : '')}${action('stop', '提前結束', f ? 'disabled' : '')}</div></div></article></div>`;
    }).join('');
    // 全螢幕中保留 article 本身，只更新其內容，計分時不會跳出全螢幕。
    if (document.querySelector('.court-card.is-focused')) {
      const template = document.createElement('div'); template.innerHTML = html;
      for (const m of state.matches) { const id = `court-${m.id}`, existing = $(id), replacement = template.querySelector(`#${CSS.escape(id)}`); if (existing && replacement) { existing.innerHTML = replacement.innerHTML; if (existing.classList.contains('is-focused')) { const exit = existing.querySelector('[data-action="fullscreen"]'); exit.innerHTML = icon('fullscreen-exit'); exit.setAttribute('aria-label', '退出放大'); } } }
    } else $('courts').innerHTML = html;
    if (focusMatch && focusAction) { const el = document.querySelector(`[data-match="${CSS.escape(focusMatch)}"][data-action="${CSS.escape(focusAction)}"]`); if (el && !el.disabled) el.focus({ preventScroll: true }); }
  }
  function renderHistory() { const matches = allMatches().filter(B.finished).reverse(); $('history-count').textContent = `${matches.length} 場`; $('history').innerHTML = matches.length ? matches.map(m => `<div class="activity-row"><span class="activity-score">${m.score.join(' : ')}</span><div class="flex-grow-1"><div class="activity-title">${esc(teamName(m, 0))} <span class="hint">vs</span> ${esc(teamName(m, 1))}</div><div class="hint" style="font-size:12px">第 ${m.round} 輪 · 場地 ${m.court} · ${m.mode === 'doubles' ? '雙打' : '單打'} · ${m.winner !== null ? `${m.winner ? 'B' : 'A'} 方勝` : '提前結束'}</div></div></div>`).join('') : '<p class="hint py-3 mb-0">第一場比賽結束後，比分會出現在這裡。</p>'; }
  function render() { renderRoster(); renderOverview(); renderCourts(); renderHistory(); document.dispatchEvent(new Event('badminton:render')); }

  // ── 05｜球友名單：加入、補齊人數、暫休、移除與更名。 ──
  function addNames(names) { const clean = names.map(s => s.trim()).filter(Boolean); if (!clean.length) { toast('請先輸入球友名字。'); return; } if (clean.some(n => n.length > 30)) { toast('每個名字最多 30 個字。'); return; } const seen = new Set(state.players.map(p => p.name)), fresh = clean.filter(n => { if (seen.has(n)) return false; seen.add(n); return true; }); if (state.players.length + fresh.length > 200) { toast('這份名單最多可加入 200 人。'); return; } const baseline = state.players.length ? Math.min(...(state.players.some(p => p.active) ? state.players.filter(p => p.active) : state.players).map(p => p.games)) : 0; state.players.push(...fresh.map(n => B.player(n, baseline))); $('names').value = ''; save(); render(); toast(`已加入 ${fresh.length} 人${fresh.length < clean.length ? '，重複名字已略過；同名球友請加編號' : ''}。`); }
  $('add-names').onclick = () => addNames($('names').value.split(/[\n,，、;；]+/));
  $('quick-add').onclick = () => { if (!$('quick-count').reportValidity()) return; const count = Number($('quick-count').value), need = count - state.players.length; if (need <= 0) { toast(`目前已有 ${state.players.length} 人；少人時取消勾選即可。`); return; } const names = [], seen = new Set(state.players.map(p => p.name)); for (let i = 1; names.length < need; i++) { const n = `球友 ${String(i).padStart(2, '0')}`; if (!seen.has(n)) names.push(n); } addNames(names); };
  $('player-list').addEventListener('change', e => { const id = e.target.dataset.attend; if (!id) return; const p = state.players.find(p => p.id === id); p.active = e.target.checked; save(); renderOverview(); });
  $('player-list').addEventListener('click', async e => { const b = e.target.closest('[data-remove]'); if (!b || b.disabled) return; const p = state.players.find(p => p.id === b.dataset.remove); if (p && await ask(`移除 ${p.name}？`)) { state.players = state.players.filter(x => x.id !== p.id); save(); render(); } });
  $('rename').onclick = () => { if (!state.players.length) { toast('請先建立球友名單。'); return; } $('rename-player').innerHTML = state.players.map(p => `<option value="${esc(p.id)}">${esc(p.name)}</option>`).join(''); $('rename-name').value = name($('rename-player').value); $('rename-dialog').showModal(); $('rename-name').focus(); $('rename-name').select(); };
  $('rename-player').onchange = () => { $('rename-name').value = name($('rename-player').value); }; $('rename-no').onclick = () => $('rename-dialog').close();
  $('rename-save').onclick = () => { const p = state.players.find(p => p.id === $('rename-player').value), n = $('rename-name').value.trim(); if (!n) { toast('名字不能空白。'); return; } if (state.players.some(x => x.id !== p.id && x.name === n)) { toast('名字重複，請加上編號。'); return; } p.name = n; $('rename-dialog').close(); save(); render(); };

  // ── 06｜比賽操作：安排與取消輪次、開局設定、計分、看場角度及放大。 ──
  $('next-round').onclick = () => { if (!readSettings()) return; try { const count = B.arrange(state); save(); render(); if (matchMedia('(max-width: 991.98px)').matches) { $('roster-details').open = false; $('settings-details').open = false; } globalThis.BadmintonMobile?.show('court', { validate: false, focus: false }); $('live').textContent = `第 ${state.round} 輪已安排，${count} 場比賽。`; $('round-heading').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' }); } catch (e) { toast(e.message); } };
  $('cancel-round').onclick = async () => { if (!B.canCancel(state)) return; if (await ask('取消尚未開始的本輪分組？會還原本輪上場次數，可重新安排。')) { B.cancel(state); save(); render(); } };
  $('courts').addEventListener('change', e => { const { opening, match } = e.target.dataset; if (!opening) return; const m = state.matches.find(m => m.id === match); if (!m || m.score.some(Boolean) || B.finished(m)) return; if (opening === 'serve') m.serving = Number(e.target.value); else { const t = Number(opening.slice(-1)); if (m.positions[t][0] !== e.target.value) m.positions[t].reverse(); } save(); renderCourts(); });
  $('courts').addEventListener('click', async e => {
    const button = e.target.closest('[data-action]'); if (!button || button.disabled) return; const { action, match } = button.dataset, m = state.matches.find(m => m.id === match); if (!m) return;
    if (action === 'rotate') { state.viewRotation = ((state.viewRotation || 0) + 90) % 360; save(); renderCourts(); $('live').textContent = `所有球場已切換為${({ 0: '底線看場', 90: '右側看場', 180: '對面底線看場', 270: '左側看場' })[state.viewRotation]}，比分與發球權不變。`; return; }
    if (action === 'fullscreen') { const card = $(`court-${m.id}`), entering = !card.classList.contains('is-focused'); card.classList.toggle('is-focused', entering); document.body.style.overflow = entering ? 'hidden' : ''; button.setAttribute('aria-label', entering ? '退出放大' : `放大第${m.court}場地`); button.innerHTML = icon(entering ? 'fullscreen-exit' : 'fullscreen'); document.body.classList.toggle('has-focused-court', entering); button.focus(); return; }
    if (action.startsWith('point-')) B.point(m, Number(action.slice(-1))); else if (action === 'undo') B.undo(m); else if (action === 'flip') B.flip(m); else if (action === 'stop') { if (!await ask('提前結束此場？會保留比分與上場次數，不列入勝負；可用「上一步」復原。')) return; B.stop(m); }
    save(); render(); const srv = B.service(m); $('live').textContent = `場地 ${m.court}，A 方 ${m.score[0]} 比 B 方 ${m.score[1]}。${m.winner !== null ? `${m.winner ? 'B' : 'A'}方獲勝。` : m.ended ? '提前結束。' : `${name(srv.server)}${srv.side ? '左' : '右'}區發球，${name(srv.receiver)}接球。`}`;
  });
  document.addEventListener('keydown', e => { const card = document.querySelector('.court-card.is-focused'); if (!card || document.querySelector('dialog[open]')) return; if (e.key === 'Escape') { card.classList.remove('is-focused'); document.body.classList.remove('has-focused-court'); document.body.style.overflow = ''; renderCourts(); } else if (e.key === 'Tab') { const controls = [...card.querySelectorAll('button:not(:disabled),select,input,summary')].filter(el => el.getClientRects().length), first = controls[0], last = controls.at(-1); if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); } } });
  // 新活動保留球友名單與玩法；只有本工具的比分、分組及出賽次數會重設。
  $('reset').onclick = async () => { if (!await ask('開始新活動會清除這個工具儲存的比分、分組與上場次數。\n會保留球友名單及玩法設定；需要紀錄請先按「匯出紀錄」。', '開始新活動')) return; state.matches = []; state.archive = []; state.round = 0; state.players.forEach(p => { p.games = 0; p.lastRound = 0; }); save(); render(); toast('新活動已準備好，球友名單已保留。'); };

  // ── 07｜匯出紀錄：產生含 UTF-8 標記的 CSV，保留原有欄位與儲存方式。 ──
  $('export').onclick = () => { const matches = allMatches(); if (!matches.length) { toast('還沒有對戰紀錄可匯出。'); return; } const cell = value => '"' + String(value).replace(/^[=+@\-\t\r]/, "'$&").replace(/"/g, '""') + '"'; const rows = [['輪次', '場地', '方式', 'A方', 'B方', 'A分數', 'B分數', '結果', '目標', '最高分', '領先兩分'], ...matches.map(m => [m.round, m.court, m.mode === 'doubles' ? '雙打' : '單打', teamName(m, 0), teamName(m, 1), ...m.score, m.winner !== null ? `${m.winner ? 'B' : 'A'}方勝` : m.ended ? '提前結束' : '進行中', m.rules.target, m.rules.deuce ? m.rules.cap : m.rules.target, m.rules.deuce ? '是' : '否'])]; const blob = new Blob(['\ufeff' + rows.map(row => row.map(cell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' }), url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = `羽球對戰紀錄-${new Date().toLocaleDateString('sv-SE')}.csv`; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000); };

  // ── 08｜說明與啟動：展開使用說明，套用設定、渲染並回報讀取狀態。 ──
  $('rules-shortcut').onclick = () => { globalThis.BadmintonMobile?.show('settings', { validate: false, focus: false }); $('rules-details').open = true; $('rules').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); };
  // ── 09｜手機操作層橋接：只公開設定提交與退出放大，不公開比賽資料。 ──
  globalThis.BadmintonUI = {
    commitSettings() {
      if (!readSettings()) return false;
      save(); renderOverview();
      return true;
    },
    closeFocusedCourt() {
      const card = document.querySelector('.court-card.is-focused');
      if (card) card.classList.remove('is-focused');
      document.body.classList.remove('has-focused-court');
      document.body.style.overflow = '';
      if (card) renderCourts();
    }
  };
  writeSettings(); render(); if (loadWarning) toast(loadWarning); else if (!storageError) save();
})();
