/**
 * 羽球工具核心資料引擎｜個人網站複本
 *
 * 本檔只處理資料與比賽狀態，不操作畫面或 localStorage。
 * 球友以 ID 關聯；雙打站位陣列固定為 [自身右區, 自身左區]。
 * 請先載入 engine.js，再載入 app.js；對外介面為 globalThis.Badminton。
 * 調整品牌配色請修改 theme.css，不需變更這裡的分組、計分與站位邏輯。
 */
globalThis.Badminton = (() => {
  'use strict';
  // ── 01｜核心狀態：複製資料、建立識別碼、預設設定與球友名單。 ──
  const clone = value => JSON.parse(JSON.stringify(value));
  const uid = () => globalThis.crypto?.randomUUID?.() || `p${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
  const defaultSettings = () => ({ mode: 'doubles', courts: 1, target: 21, cap: 30, deuce: true });
  const player = (name, games = 0) => ({ id: uid(), name, active: true, games, lastRound: 0 });
  const initial = () => ({ version: 1, round: 0, viewRotation: 0, settings: defaultSettings(), players: [], matches: [], archive: [] });
  const shuffle = items => { const a = [...items]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; } return a; };

  // ── 02｜比賽狀態與服務站位：依發球方分數，取得發球與接球球員。 ──
  const finished = m => m.winner !== null || m.ended;
  const service = m => { const t = m.serving, side = m.score[t] % 2; return { team: t, side, server: m.positions[t][m.mode === 'singles' ? 0 : side], receiver: m.positions[1 - t][m.mode === 'singles' ? 0 : side] }; };

  // ── 03｜計分與復原：先保存快照，再處理得分、換邊或提前結束。 ──
  const snapshot = m => ({ score: [...m.score], positions: clone(m.positions), serving: m.serving, flipped: m.flipped, winner: m.winner, ended: m.ended });
  const remember = m => { m.undo.push(snapshot(m)); if (m.undo.length > 450) m.undo.shift(); };
  const wins = (score, t, s) => score[t] >= s.target && (!s.deuce || score[t] - score[1 - t] >= 2 || score[t] >= s.cap);
  function point(m, t) {
    if (finished(m) || ![0, 1].includes(t)) return false;
    remember(m);
    // 雙打：只有原發球方贏得此球時才交換該方站位；接發方得分不換位。
    if (m.mode === 'doubles' && t === m.serving) m.positions[t].reverse();
    m.score[t]++; m.serving = t;
    if (wins(m.score, t, m.rules)) m.winner = t;
    return true;
  }
  const undo = m => { if (!m.undo.length) return false; Object.assign(m, m.undo.pop()); return true; };
  const flip = m => { if (finished(m)) return false; remember(m); m.flipped = !m.flipped; return true; };
  const stop = m => { if (finished(m)) return false; remember(m); m.ended = true; return true; };

  // ── 04｜分組與輪替：依出賽次數選人，減少搭檔重複，支援取消未開始輪次。 ──
  const ready = s => s.players.filter(p => p.active);
  const busy = s => new Set(s.matches.filter(m => !finished(m)).flatMap(m => m.teams.flat()));
  const pairKey = (a, b) => [a, b].sort().join('|');
  function arrange(s) {
    if (s.matches.some(m => !finished(m))) throw Error('請先完成或提前結束目前所有場次。');
    const n = s.settings.mode === 'doubles' ? 4 : 2, available = shuffle(ready(s)).sort((a, b) => a.games - b.games || a.lastRound - b.lastRound);
    const count = Math.min(s.settings.courts, Math.floor(available.length / n));
    if (!count) throw Error(`至少需要 ${n} 位可上場球友，才能安排${n === 4 ? '雙' : '單'}打。`);
    const chosen = available.slice(0, count * n).map(p => p.id), partner = new Map(), opponent = new Map();
    const add = (map, key) => map.set(key, (map.get(key) || 0) + 1);
    const old = [...s.archive, ...s.matches];
    for (const m of old) { for (const team of m.teams) if (team.length === 2) add(partner, pairKey(...team)); for (const a of m.teams[0]) for (const b of m.teams[1]) add(opponent, pairKey(a, b)); }
    let best = chosen, bestCost = Infinity;
    // 只在公平選出的同一批人之間試排，降低重複搭檔與重複對手。
    for (let trial = 0; trial < 100; trial++) {
      const a = shuffle(chosen); let cost = 0;
      for (let i = 0; i < a.length; i += n) { const teams = [a.slice(i, i + n / 2), a.slice(i + n / 2, i + n)]; for (const t of teams) if (t.length === 2) cost += 12 * (partner.get(pairKey(...t)) || 0); for (const x of teams[0]) for (const y of teams[1]) cost += (opponent.get(pairKey(x, y)) || 0); }
      if (cost < bestCost) { bestCost = cost; best = a; }
    }
    s.archive.push(...s.matches.map(({ undo, ...m }) => ({ ...m, undo: [] }))); s.round++;
    s.matches = Array.from({ length: count }, (_, i) => { const teams = [best.slice(i * n, i * n + n / 2), best.slice(i * n + n / 2, (i + 1) * n)]; const previous = {}; for (const id of teams.flat()) { const p = s.players.find(p => p.id === id); previous[id] = p.lastRound; p.games++; p.lastRound = s.round; } return { id: uid(), round: s.round, court: i + 1, mode: s.settings.mode, rules: clone(s.settings), teams, positions: clone(teams), score: [0, 0], serving: 0, flipped: false, winner: null, ended: false, undo: [], previous }; });
    return count;
  }
  const canCancel = s => s.matches.length > 0 && s.matches.every(m => !m.score.some(Boolean) && !m.undo.length && !finished(m));
  function cancel(s) { if (!canCancel(s)) return false; for (const m of s.matches) for (const id of m.teams.flat()) { const p = s.players.find(p => p.id === id); p.games--; p.lastRound = m.previous[id]; } s.matches = []; s.round--; return true; }

  // ── 05｜資料驗證：讀回進度前，檢查設定範圍、球友關聯與比賽快照。 ──
  // 讀回前驗證資料關聯與範圍，避免損壞的瀏覽器儲存造成無法操作。
  function validate(s) {
    const integer = (v, min, max) => Number.isInteger(v) && v >= min && v <= max;
    const settings = x => x && ['singles', 'doubles'].includes(x.mode) && integer(x.courts, 1, 8) && integer(x.target, 1, 99) && integer(x.cap, x.target, 199) && typeof x.deuce === 'boolean';
    if (!s || s.version !== 1 || !integer(s.round, 0, 1e6) || !settings(s.settings) || !Array.isArray(s.players) || s.players.length > 200 || !Array.isArray(s.matches) || s.matches.length > 8 || !Array.isArray(s.archive) || s.archive.length > 50000) return false;
    if (s.viewRotation !== undefined && ![0, 90, 180, 270].includes(s.viewRotation)) return false;
    const ids = new Set(), names = new Set(); for (const p of s.players) { if (!p || typeof p.id !== 'string' || !p.id || p.id.length > 100 || ids.has(p.id) || typeof p.name !== 'string' || !p.name.trim() || p.name.length > 30 || names.has(p.name) || typeof p.active !== 'boolean' || !integer(p.games, 0, 1e6) || !integer(p.lastRound, 0, s.round)) return false; ids.add(p.id); names.add(p.name); }
    const matchIDs = new Set(), liveIDs = new Set();
    for (const m of [...s.archive, ...s.matches]) {
      if (!m || typeof m.id !== 'string' || m.id.length > 100 || matchIDs.has(m.id) || !settings(m.rules) || !['singles', 'doubles'].includes(m.mode) || !integer(m.round, 1, s.round) || !integer(m.court, 1, 8) || !Array.isArray(m.teams) || m.teams.length !== 2 || !Array.isArray(m.undo) || m.undo.length > 450) return false;
      matchIDs.add(m.id); const n = m.mode === 'doubles' ? 2 : 1;
      if (m.teams.some(t => !Array.isArray(t) || t.length !== n || t.some(id => !ids.has(id))) || new Set(m.teams.flat()).size !== 2 * n) return false;
      const validSnap = x => x && Array.isArray(x.score) && x.score.length === 2 && x.score.every(v => integer(v, 0, m.rules.cap)) && Array.isArray(x.positions) && x.positions.length === 2 && x.positions.every((t, i) => Array.isArray(t) && t.length === n && new Set(t).size === n && t.every(id => m.teams[i].includes(id))) && [0, 1].includes(x.serving) && typeof x.flipped === 'boolean' && [null, 0, 1].includes(x.winner) && typeof x.ended === 'boolean';
      if (!validSnap(m) || !m.undo.every(validSnap)) return false;
      if (s.matches.includes(m)) { if (!m.previous || m.teams.flat().some(id => !integer(m.previous[id], 0, s.round))) return false; for (const id of m.teams.flat()) { if (liveIDs.has(id)) return false; liveIDs.add(id); } }
      else if (!finished(m)) return false;
    }
    return true;
  }

  // ── 06｜公開介面：供 app.js 呼叫，不在此處綁定任何畫面事件。 ──
  return { clone, uid, initial, player, service, finished, point, undo, flip, stop, arrange, cancel, canCancel, ready, busy, validate };
})();
