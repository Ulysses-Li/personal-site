/**
 * 螺紋資料查找｜查表、單位、內外牙與個人收藏。
 * 原始尺寸均為 mm；資料在 thread-data.js 與 thread-extra-data.js 維護。
 * 有公差等級的工件限界與基本牙型分開呈現，null 永不轉成零或估算尺寸。
 */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const unique = items => [...new Map(items.map(item => [item.id, item])).values()];
  const core = window.THREAD_DATA || {}, extra = window.THREAD_EXTRA_DATA || {};
  const records = unique([...(core.records || []), ...(extra.records || [])]);
  const families = unique([...(core.families || []), ...(extra.families || [])]);
  const sourceMap = new Map(unique([...(core.sources || []), ...(extra.sources || [])]).map(item => [item.id, item]));
  const recordMap = new Map(records.map(item => [item.id, item]));
  const familyMap = new Map(families.map(item => [item.id, item]));
  const KEY = 'cwli-thread-reference-v1';
  let selected = records.find(item => item.family === 'metric-coarse' && item.diameterMm === 10) || records[0];
  let family = selected?.family || 'all', member = 'internal', unit = 'metric', query = '';
  let favorites = new Set(), filtered = [], callbacks = {}, mounted = false;

  // ── 01｜搜尋正規化：支援全形、乘號、空白、分數與 BA 的兩種常見順序。 ──
  function normalize(value) {
    return String(value).normalize('NFKC').toUpperCase().replace(/[⁄∕]/g,'/').replace(/[″"′']/g,'').replace(/[×✕*]/g, 'X').replace(/[‐‑–—−]/g, '-').replace(/\s+/g, '');
  }
  function searchable(item) {
    const baNumber = item.family === 'ba' ? item.sizeLabel.match(/\d+/)?.[0] : null;
    return [item.designation, item.sizeLabel, ...(item.aliases || []), familyMap.get(item.family)?.label,
      item.family === 'g' ? item.designation.replace(/^G\s*/i, 'PF ') + ' BSPP' : '',
      baNumber !== null ? baNumber + 'BA' : '',
      item.family==='metric-fine'?item.designation.replace(/^M/i,'MF'):'',
      ...[item.internal?.className,item.external?.className].filter(Boolean).map(className=>`${item.designation}-${className}`), item.pitchMm].map(normalize);
  }
  function matches(item) {
    const compact=normalize(query);
    if (family!=='all'&&item.family!==family) return false;
    const ba=compact.match(/^(?:BA#?(\d+)|#?(\d+)BA)$/);
    if(ba) return item.family==='ba'&&Number(item.sizeLabel.match(/\d+/)?.[0])===Number(ba[1]??ba[2]);
    // 分數尺寸以完整公稱尺寸比對，避免 1/4 誤中 1 1/4 或 2 1/4。
    const fractionQuery=query.replace(/(\d)([¼½¾])/g,'$1 $2').normalize('NFKC').replace(/[⁄∕]/g,'/').replace(/[″"′']/g,'').replace(/[‐‑–—−]/g,'-').trim();
    const fraction=fractionQuery.match(/^(?:(G|PF|BSPP|BSW|BSF|UNC|UNF)\s*)?(\d+\s+\d+\/\d+|\d+\/\d+)(?:\s*(?:-\s*|\s+)(\d+(?:\.\d+)?))?\s*(G|PF|BSPP|BSW|BSF|UNC|UNF)?$/i);
    if(fraction){
      const familyCodes={G:'g',PF:'g',BSPP:'g',BSW:'bsw',BSF:'bsf',UNC:'unc',UNF:'unf'};
      const prefix=familyCodes[fraction[1]?.toUpperCase()],suffix=familyCodes[fraction[4]?.toUpperCase()];
      if(prefix&&suffix&&prefix!==suffix)return false;
      const requiredFamily=prefix||suffix;
      return (!requiredFamily||item.family===requiredFamily)&&normalize(item.sizeLabel).replace(/^G/,'')===normalize(fraction[2])&&(!fraction[3]||item.tpi===Number(fraction[3]));
    }
    const words = query.trim().split(/\s+/).map(normalize).filter(Boolean);
    const text = searchable(item);
    return words.every(word => text.some(field=>field.includes(word)));
  }
  const isNumber = value => typeof value === 'number' && Number.isFinite(value);
  const sizeUnit = () => unit === 'metric' ? 'mm' : 'in';
  function number(value, dimension = true) {
    if (!isNumber(value)) return '—';
    const converted = dimension && unit === 'imperial' ? value / 25.4 : value;
    return new Intl.NumberFormat('en-US', {useGrouping:false,minimumFractionDigits:dimension?3:0,maximumFractionDigits:dimension?(unit==='metric'?5:6):4}).format(converted);
  }
  function pitchText(item) {
    return `P ${number(item.pitchMm)} ${sizeUnit()} · ${isNumber(item.tpi)?'':'換算 '}${number(isNumber(item.tpi) ? item.tpi : 25.4 / item.pitchMm, false)} TPI`;
  }
  function notifyRoute() { callbacks.onRoute?.(getHash()); }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify({selected:selected?.id,member,favorites:[...favorites]})); }
    catch { callbacks.onToast?.('目前仍可查表；瀏覽器暫時無法儲存常用規格。'); }
  }

  // ── 02｜查找面板：完整下拉選單與最多八個快速結果共用同一份篩選。 ──
  function renderPicker() {
    filtered = records.filter(matches);
    if (!filtered.some(item => item.id === selected?.id)) selected = filtered[0] || null;
    $('thread-library').dataset.searching = String(Boolean(query.trim()));
    $('thread-library').dataset.matchCount = String(filtered.length);
    $('thread-search-clear').hidden = !query;
    $('thread-family-list').innerHTML = [{id:'all',label:'全部'},...families].map(item =>
      `<button type="button" data-thread-family="${esc(item.id)}" aria-pressed="${item.id===family}">${esc(item.label)}</button>`).join('');
    $('thread-size').disabled = !filtered.length;
    $('thread-size').innerHTML = filtered.length ? filtered.map(item => `<option value="${esc(item.id)}"${item.id===selected?.id?' selected':''}>${esc(item.designation)}</option>`).join('') : '<option>沒有符合的規格</option>';
    $('thread-result-count').textContent = `${filtered.length} 個符合規格 / 收錄 ${records.length} 個`;
    $('thread-empty').hidden = filtered.length > 0;
    $('thread-detail').hidden = !selected;
    let quick = filtered.slice(0,8);
    if (!query && selected && !quick.some(item => item.id===selected.id)) quick = [selected,...quick.slice(0,7)];
    $('thread-match-list').innerHTML = quick.map(item => `<button type="button" class="thread-match" data-thread-id="${esc(item.id)}" aria-pressed="${item.id===selected?.id}"><strong>${esc(item.designation)}</strong><small>${esc(pitchText(item))}</small></button>`).join('');
    renderDetail();
  }
  function choose(id, scroll = false) {
    const item = recordMap.get(id);
    if (!item) return;
    selected = item;
    if (family !== 'all' && family !== item.family) family = item.family;
    if (!matches(item)) { query=''; $('thread-search').value=''; }
    renderPicker(); save(); notifyRoute();
    if (scroll && matchMedia('(max-width: 900px)').matches) {
      $('thread-detail').scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
      $('thread-selected-title').focus({preventScroll:true});
    }
  }

  // ── 03｜尺寸：只顯示來源有收錄的界限，基本牙型以獨立的兩欄表呈現。 ──
  function rows() {
    const side = selected?.[member];
    const symbols = member === 'internal' ? ['D','D₂','D₁'] : ['d','d₂',selected?.family?.startsWith('metric')?'d₃':'d₁'];
    return ['major','pitch','minor'].map((key,index) => ({key,label:['大徑','節徑','小徑'][index],symbol:symbols[index],min:side?.[key]?.min,max:side?.[key]?.max,
      basic:selected?.basic?.[key==='minor'?(member==='internal'?'minorInternal':'minorExternal'):key]}));
  }
  function hasLimits() { return rows().some(row => isNumber(row.min) || isNumber(row.max)); }
  function renderDetail() {
    if (!selected) return;
    const type = familyMap.get(selected.family), side = selected[member], limits = hasLimits();
    $('thread-selected-kicker').textContent = type?.label || '';
    $('thread-selected-title').textContent = selected.designation;
    $('thread-selected-title').tabIndex = -1;
    $('thread-selected-summary').textContent = `${member==='internal'?'內牙':'外牙'} · ${pitchText(selected)}`;
    $('thread-major-fact').textContent = `${number(selected.diameterMm)} ${sizeUnit()}`;
    $('thread-pitch-fact').textContent = `${number(selected.pitchMm)} ${sizeUnit()} / ${number(isNumber(selected.tpi)?selected.tpi:25.4/selected.pitchMm,false)}`;
    $('thread-angle-fact').textContent = `${number(type?.angleDeg,false)}°`;
    $('thread-class').textContent = side?.className || '基本牙型・未指定公差';
    $('thread-dimensions-title').textContent = `${limits?'尺寸限界':'基本牙型尺寸'}（${sizeUnit()}）`;
    $('thread-table-caption').textContent = `${selected.designation} ${member==='internal'?'內牙':'外牙'} ${limits?side?.className||'':'基本牙型'}，單位 ${sizeUnit()}`;
    $('thread-dimension-head').innerHTML = limits ? '<tr><th scope="col">尺寸項目</th><th scope="col">最小</th><th scope="col">最大</th></tr>' : '<tr><th scope="col">尺寸項目</th><th scope="col" colspan="2">基本值</th></tr>';
    $('thread-dimensions').innerHTML = rows().map(row => `<tr><th scope="row">${row.label}<small>${row.symbol}</small></th>${limits?`<td>${number(row.min)}</td><td>${number(row.max)}</td>`:`<td colspan="2">${number(row.basic)}</td>`}</tr>`).join('');
    $('thread-dimension-note').textContent = limits
      ? `「—」表示來源未列該界限，不以基本尺寸或底孔估算補入。${side?.scope || ''} 顯示單位換算可能四捨五入，原始資料單位為 mm。`
      : '本列為基本牙型資料，沒有指定配合等級的最小／最大尺寸；不可當作製造公差上下限。';
    document.querySelectorAll('[data-thread-member]').forEach(button => button.setAttribute('aria-pressed',String(button.dataset.threadMember===member)));
    $('thread-save').setAttribute('aria-pressed',String(favorites.has(selected.id)));
    $('thread-save').setAttribute('aria-label',`${favorites.has(selected.id)?'取消收藏':'收藏'} ${selected.designation}`);
    $('thread-open-converter').hidden = !['metric-coarse','metric-fine'].includes(selected.family);
    const ids = [...new Set([...(selected.sourceIds||[]),side?.sourceId].filter(Boolean))];
    $('thread-source-links').innerHTML = ids.map(id => sourceMap.get(id)).filter(Boolean).map(source => {
      const url = /^https:\/\//i.test(source.url)?source.url:'';
      const page = side?.sourceId===source.id ? side.pageLabel || (side.page?`PDF 第 ${side.page} 頁`:'') : source.pageLabel || source.page || '';
      return `<p><a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(source.title)}</a>${page?`<small>${esc(page)}</small>`:''}</p>`;
    }).join('');
    $('thread-scope').textContent = [selected.scope,side?.scope].filter(Boolean).join(' ');
    renderProfile(type); renderSaved();
  }
  function renderProfile(type) {
    // 圖只說明直徑位置；角度以數字標註，不暗示為精確比例的牙型工程圖。
    const outer = member === 'external';
    const minorSymbol=selected.family.startsWith('metric')?'d₃':'d₁';
    $('thread-profile-note').textContent=outer?'外牙大徑位於牙頂，節徑位於牙形中間，小徑位於牙底。示意圖不依數值比例繪製。':'內牙大徑位於牙底，節徑位於牙形中間，小徑位於牙頂。示意圖不依數值比例繪製。';
    const tooth = 'M22 84H46L60 46H74L88 84H110L124 46H138L152 84H174L188 46H202L216 84H242';
    $('thread-profile').innerHTML = `<title>外牙大徑、節徑與小徑位置示意</title><path d="${tooth}V112H22Z" fill="#dcebf5" stroke="#245674" stroke-width="2" stroke-linejoin="round"/><path d="M14 46H254M14 65H254M14 84H254" stroke="#6ba6c8" stroke-width="1" stroke-dasharray="4 4"/><g fill="#245674" font-family="sans-serif" font-size="13"><text x="260" y="50">d</text><text x="260" y="69">d₂</text><text x="260" y="88">${minorSymbol}</text><text x="28" y="132">${number(type?.angleDeg,false)}° · 外牙位置示意</text></g>`;
    // 對內牙將材料放在牙型上方，大徑、小徑方向也隨內外牙對調。
    if (!outer) $('thread-profile').innerHTML = `<title>內牙大徑、節徑與小徑位置示意</title><path d="M22 18H242V46H216L202 84H188L174 46H152L138 84H124L110 46H88L74 84H60L46 46H22Z" fill="#dcebf5" stroke="#245674" stroke-width="2" stroke-linejoin="round"/><path d="M14 46H254M14 65H254M14 84H254" stroke="#6ba6c8" stroke-width="1" stroke-dasharray="4 4"/><g fill="#245674" font-family="sans-serif" font-size="13"><text x="260" y="50">D</text><text x="260" y="69">D₂</text><text x="260" y="88">D₁</text><text x="28" y="132">${number(type?.angleDeg,false)}° · 內牙位置示意</text></g>`;
  }
  function renderSaved() {
    $('thread-saved-list').innerHTML = favorites.size ? [...favorites].map(id => recordMap.get(id)).filter(Boolean).map(item => `<button type="button" data-thread-saved="${esc(item.id)}">${esc(item.designation)}</button>`).join('') : '<p>按規格右上角星號，把常查尺寸留在這裡。</p>';
    $('thread-global-saved').hidden=!favorites.size;
    $('thread-global-list').innerHTML=[...favorites].map(id=>recordMap.get(id)).filter(Boolean).map(item=>`<a href="#thread/${esc(item.id)}/${member}">${esc(item.designation)}</a>`).join('');
  }

  // ── 04｜網址、單位與複製：只儲存規格偏好，不變更標準資料。 ──
  function getHash() { return selected ? `thread/${selected.id}/${member}` : 'thread'; }
  function open(hash='') {
    let parts=[]; try { parts=decodeURIComponent(hash.replace(/^#/, '')).split('/'); } catch { /* 保留目前選擇。 */ }
    if (recordMap.has(parts[1])) { selected=recordMap.get(parts[1]);family=selected.family;query='';$('thread-search').value=''; }
    if (['internal','external'].includes(parts[2])) member=parts[2];
    renderPicker();
  }
  async function copy() {
    if (!selected) return;
    const side=selected[member],limits=hasLimits();
    const lines=[`${selected.designation}｜${member==='internal'?'內牙':'外牙'}`,side?.className||'基本牙型（未指定公差）',pitchText(selected),`尺寸單位：${sizeUnit()}`];
    rows().forEach(row => lines.push(limits?`${row.label} ${row.symbol}：最小 ${number(row.min)} / 最大 ${number(row.max)}`:`${row.label} ${row.symbol}：基本值 ${number(row.basic)}`));
    lines.push(limits?'— 代表來源未收錄該界限。':'基本尺寸不是製造公差上下限。',selected.scope||'');
    const ids=[...new Set([...(selected.sourceIds||[]),side?.sourceId].filter(Boolean))];
    ids.forEach(id=>{const source=sourceMap.get(id);if(source)lines.push(`${source.title}：${source.url}`);});
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(lines.join('\n'));
      else {const node=document.createElement('textarea');node.value=lines.join('\n');node.readOnly=true;node.style.cssText='position:fixed;left:-9999px';document.body.append(node);node.select();const ok=document.execCommand('copy');node.remove();$('thread-copy').focus();if(!ok)throw new Error('copy');}
      callbacks.onToast?.('已複製規格、單位與來源。');
    } catch { callbacks.onToast?.('無法自動複製，可選取表格文字複製。'); }
  }
  function mount(options={}) {
    callbacks=options;
    if(mounted)return;
    mounted=true;
    try {const saved=JSON.parse(localStorage.getItem(KEY)||'{}');if(recordMap.has(saved.selected))selected=recordMap.get(saved.selected);if(['internal','external'].includes(saved.member))member=saved.member;if(Array.isArray(saved.favorites))favorites=new Set(saved.favorites.filter(id=>recordMap.has(id)));family=selected?.family||'all';} catch {/* 無法讀取偏好時仍可查表。 */}
    $('thread-search').addEventListener('input',()=>{query=$('thread-search').value;family='all';renderPicker();notifyRoute();});
    $('thread-size').addEventListener('change',()=>choose($('thread-size').value,true));
    $('thread-library').addEventListener('click',event=>{
      const button=event.target.closest('button');if(!button)return;
      if(button.dataset.threadFamily){family=button.dataset.threadFamily;query='';$('thread-search').value='';renderPicker();save();notifyRoute();}
      else if(button.dataset.threadId)choose(button.dataset.threadId,true);
      else if(button.dataset.threadSaved)choose(button.dataset.threadSaved,true);
      else if(button.dataset.threadMember){member=button.dataset.threadMember;renderDetail();save();notifyRoute();}
      else if(button.id==='thread-search-clear'){query='';$('thread-search').value='';renderPicker();notifyRoute();$('thread-search').focus();}
      else if(button.id==='thread-reset'){family='all';query='';$('thread-search').value='';renderPicker();notifyRoute();$('thread-search').focus();}
      else if(button.id==='thread-save'&&selected){if(favorites.has(selected.id))favorites.delete(selected.id);else favorites.add(selected.id);save();renderDetail();}
      else if(button.id==='thread-copy')copy();
      else if(button.id==='thread-open-converter'&&selected)callbacks.onConverter?.(selected);
    });
    renderPicker();
  }
  window.ThreadLibrary={mount,open,getHash,setUnit(value){unit=value==='imperial'?'imperial':'metric';if(mounted){renderPicker();}},getSources(){return [...sourceMap.values()];}};
})();
