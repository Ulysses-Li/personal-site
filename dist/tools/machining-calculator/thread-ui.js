/**
 * 螺紋資料查找｜查表、單位、內外牙與個人收藏。
 * 原始尺寸均為 mm；各牙系資料分檔維護，搜尋規則由 thread-search.js 提供。
 * 有公差等級的工件限界與基本牙型分開呈現，null 永不轉成零或估算尺寸。
 */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const unique = items => [...new Map(items.map(item => [item.id, item])).values()];
  const collections=[window.THREAD_DATA,window.THREAD_EXTRA_DATA,window.THREAD_BSP_DATA,window.THREAD_NPT_DATA,window.THREAD_EXTENDED_DATA].filter(Boolean);
  const records = unique(collections.flatMap(data=>data.records || []));
  const families = unique(collections.flatMap(data=>data.families || []));
  const sourceMap = new Map(unique(collections.flatMap(data=>data.sources || [])).map(item => [item.id, item]));
  const recordMap = new Map(records.map(item => [item.id, item]));
  const familyMap = new Map(families.map(item => [item.id, item]));
  const KEY = 'cwli-thread-reference-v1';
  let selected = records.find(item => item.family === 'metric-coarse' && item.diameterMm === 10) || records[0];
  let family = selected?.family || 'all', member = 'internal', unit = 'metric', query = '', kind='all';
  let favorites = new Set(), filtered = [], callbacks = {}, mounted = false;

  // ── 01｜用途分類與搜尋：別名查表和內／外牙選擇各自處理。 ──
  const searchMatches=window.THREAD_SEARCH.create(families);
  const kinds=[{id:'all',label:'全部'},{id:'general',label:'一般牙'},{id:'pipe',label:'管牙'},{id:'other',label:'其他'}];
  function familyKind(id) {
    if(['g','bspt','rp','npt','nptf','npsm','npsc','npsf'].includes(id))return 'pipe';
    return ['tr','pg'].includes(id)?'other':'general';
  }
  function matches(item) {return (family==='all'||item.family===family)&&(kind==='all'||familyKind(item.family)===kind)&&searchMatches(item,query);}
  function designation(item) {return item.memberDesignations?.[member] || item.designation;}
  function ensureMember() {if(selected?.supportedMembers&&!selected.supportedMembers.includes(member))member=selected.supportedMembers[0];}
  const isNumber = value => typeof value === 'number' && Number.isFinite(value);
  const sizeUnit = () => unit === 'metric' ? 'mm' : 'in';
  function number(value, dimension = true) {
    if (!isNumber(value)) return '—';
    const converted = dimension && unit === 'imperial' ? value / 25.4 : value;
    return new Intl.NumberFormat('en-US', {useGrouping:false,minimumFractionDigits:dimension?3:0,maximumFractionDigits:dimension?(unit==='metric'?5:6):4}).format(converted);
  }
  // 計算牙型採較少顯示位數並加約等號，不暗示實際工件具有此量測精度。
  function referenceNumber(value) {
    if(!isNumber(value))return '—';
    const digits=unit==='metric'?3:5;
    return '≈'+new Intl.NumberFormat('en-US',{useGrouping:false,minimumFractionDigits:digits,maximumFractionDigits:digits})
      .format(unit==='metric'?value:value/25.4);
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
    ensureMember();
    $('thread-library').dataset.searching = String(Boolean(query.trim()));
    $('thread-library').dataset.matchCount = String(filtered.length);
    $('thread-search-clear').hidden = !query;
    $('thread-kind-list').innerHTML=kinds.map(item=>`<button type="button" data-thread-kind="${item.id}" aria-pressed="${item.id===kind}">${item.label}</button>`).join('');
    $('thread-family-list').innerHTML = [{id:'all',label:'全部牙系'},...families.filter(item=>kind==='all'||familyKind(item.id)===kind)].map(item =>
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
    ensureMember();
    if(kind!=='all'&&familyKind(item.family)!==kind)kind=familyKind(item.family);
    if (family !== 'all' && family !== item.family) family = item.family;
    if (!matches(item)) { query=''; $('thread-search').value=''; }
    renderPicker(); save(); notifyRoute();
    if (scroll && matchMedia('(max-width: 900px)').matches) {
      $('thread-detail').scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
      $('thread-selected-title').focus({preventScroll:true});
    }
  }

  // ── 03｜尺寸分層：工件限界、表列基本值與有模型標記的計算參考。 ──
  function rows() {
    const side = selected?.[member];
    const symbols = member === 'internal' ? ['D','D₂','D₁'] : ['d','d₂',selected?.family?.startsWith('metric')?'d₃':'d₁'];
    return ['major','pitch','minor'].map((key,index) => {
      const basic=selected?.basic?.[key==='minor'?(member==='internal'?'minorInternal':'minorExternal'):key];
      const reference=!isNumber(basic)?selected?.profileReference?.[key==='major'?'majorMm':key==='minor'?'minorMm':'']:null;
      return {key,label:['大徑','節徑','小徑'][index],symbol:selected?.symbols?.[key] || symbols[index],
        min:side?.[key]?.min,max:side?.[key]?.max,basic,reference};
    });
  }
  function hasLimits() { return rows().some(row => isNumber(row.min) || isNumber(row.max)); }
  function renderDetail() {
    if (!selected) return;
    const type = familyMap.get(selected.family), side = selected[member], limits = hasLimits();
    const hasReference=!limits&&rows().some(row=>isNumber(row.reference));
    $('thread-selected-kicker').textContent = type?.label || '';
    $('thread-selected-title').textContent = designation(selected);
    $('thread-selected-title').tabIndex = -1;
    $('thread-selected-summary').textContent = `${member==='internal'?'內牙':'外牙'} · ${pitchText(selected)}`;
    $('thread-major-label').textContent = selected.taper?'基準節徑':selected.diameterLabel || (selected.nominalOnly?'公稱直徑':'基本大徑');
    $('thread-major-fact').textContent = `${number(selected.taper?selected.basic?.pitch:selected.diameterMm)} ${sizeUnit()}`;
    $('thread-pitch-fact').textContent = `${number(selected.pitchMm)} ${sizeUnit()} / ${number(isNumber(selected.tpi)?selected.tpi:25.4/selected.pitchMm,false)}`;
    $('thread-angle-fact').textContent = `${number(type?.angleDeg,false)}°`;
    $('thread-class').textContent = side?.className || (selected.nominalOnly?'僅公稱規格':hasReference?'含牙型計算參考':'基本值・未指定公差');
    // 只有公稱資料的牙系不堆出三列空白尺寸；保留上方規格與明確範圍說明。
    document.querySelector('.thread-limits-heading').hidden=Boolean(selected.nominalOnly);
    document.querySelector('.thread-table-wrap').hidden=Boolean(selected.nominalOnly);
    document.querySelector('.thread-profile').hidden=Boolean(selected.nominalOnly);
    $('thread-dimensions-title').textContent = `${limits?'尺寸限界':hasReference?'基準平面尺寸':selected.referenceLabel || (selected.taper?'基準平面基本尺寸':'基本牙型尺寸')}（${sizeUnit()}）`;
    $('thread-table-caption').textContent = `${designation(selected)}${selected.memberDesignations?'':member==='internal'?' 內牙':' 外牙'} ${limits?side?.className||'':hasReference?'基本尺寸與牙型計算參考':'基本尺寸'}，單位 ${sizeUnit()}`;
    $('thread-dimension-head').innerHTML = limits ? '<tr><th scope="col">尺寸項目</th><th scope="col">最小</th><th scope="col">最大</th></tr>' : `<tr><th scope="col">尺寸項目</th><th scope="col" colspan="2">${hasReference?'基本／參考值':'基本值'}</th></tr>`;
    $('thread-dimensions').innerHTML = rows().map(row => {
      const reference=isNumber(row.reference)&&!limits;
      const value=reference?`<span class="thread-reference-value">${referenceNumber(row.reference)}</span><small class="thread-reference-kind">牙型計算參考</small>`:number(row.basic);
      return `<tr><th scope="row">${row.label}${reference?'參考':''}<small>${row.symbol}</small></th>${limits?`<td>${number(row.min)}</td><td>${number(row.max)}</td>`:`<td colspan="2">${value}</td>`}</tr>`;
    }).join('');
    $('thread-dimension-note').textContent = limits
      ? `「—」表示來源未列該界限，不以基本尺寸或底孔估算補入。${side?.scope || ''} 顯示單位換算可能四捨五入，原始資料單位為 mm。`
      : hasReference?`E₁ 為來源基本節徑。「牙型計算參考」依 ${selected.profileReference.formula} 計算。${selected.profileReference.scope}`
      : selected.nominalOnly?'此批只收錄公稱規格與牙距，實際內外牙尺寸未收錄；「—」不是零。':`${selected.taper?'本列為指定基準平面的基本尺寸，離開該平面時直徑會隨軸向位置改變。':'本列為基本牙型資料。'}沒有指定配合等級的最小／最大尺寸，不可當作製造公差上下限。「—」表示未收錄。`;
    document.querySelectorAll('[data-thread-member]').forEach(button => {const supported=!selected.supportedMembers||selected.supportedMembers.includes(button.dataset.threadMember);button.disabled=!supported;button.setAttribute('aria-pressed',String(button.dataset.threadMember===member));button.textContent=button.dataset.threadMember==='internal'?(selected.family==='bspt'?'內牙 Rc':'內牙'):(selected.family==='bspt'?'外牙 R':'外牙');});
    $('thread-save').setAttribute('aria-pressed',String(favorites.has(selected.id)));
    $('thread-save').setAttribute('aria-label',`${favorites.has(selected.id)?'取消收藏':'收藏'} ${designation(selected)}`);
    $('thread-open-converter').hidden = !['metric-coarse','metric-fine'].includes(selected.family);
    const ids = [...new Set([...(selected.sourceIds||[]),side?.sourceId].filter(Boolean))];
    $('thread-source-links').innerHTML = ids.map(id => sourceMap.get(id)).filter(Boolean).map(source => {
      const url = /^https:\/\//i.test(source.url)?source.url:'';
      const page = side?.sourceId===source.id ? side.pageLabel || (side.page?`PDF 第 ${side.page} 頁`:'') : source.pageLabel || source.page || '';
      return `<p><a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(source.title)}</a>${page?`<small>${esc(page)}</small>`:''}</p>`;
    }).join('');
    $('thread-scope').textContent = [selected.scope,side?.scope].filter(Boolean).join(' ');
    renderReference(); renderProfile(type); renderSaved();
  }
  // 錐牙直徑必須連同基準平面理解；a／L1 只在來源適用的內／外牙顯示。
  function referencePlane(item=selected) {return item.taper?.memberReferencePlanes?.[member] || item.taper?.referencePlane || item.referenceNote || '';}
  function referenceLengthVisible(item=selected) {return isNumber(item.taper?.referenceLengthMm)&&(!item.taper.referenceLengthMembers||item.taper.referenceLengthMembers.includes(member));}
  function renderReference() {
    const taper=selected.taper;
    $('thread-reference').hidden=!taper&&!selected.referenceNote;
    if($('thread-reference').hidden)return;
    const ratio=taper?.diameterRatio;
    const details=[];
    if(referenceLengthVisible())details.push(
      `<p><b>${esc(taper.referenceLengthLabel || '基準距離')}：</b><span class="thread-reference-number">${number(taper.referenceLengthMm)} ${sizeUnit()}</span></p>`
    );
    // 管材外徑只用於辨識，不能塞進螺紋尺寸表的大徑欄。
    if(isNumber(selected.pipeOutsideDiameterMm))details.push(
      `<p><b>管材外徑 D：</b>${number(selected.pipeOutsideDiameterMm)} ${sizeUnit()}（非基準面螺紋大徑）</p>`
    );
    if(taper?.note)details.push(`<p>${esc(taper.note)}</p>`);
    if(ratio)details.push(
      `<small>錐度半角 ${number(Math.atan(1/(2*ratio))*180/Math.PI,false)}°；直徑每軸向 ${esc(ratio)} 單位改變 1 單位。</small>`
    );
    $('thread-reference').innerHTML=[
      `<div class="thread-reference-head"><strong>${ratio?`直徑錐度 1:${esc(ratio)}`:'平行管螺紋'}</strong>${selected.referenceEdition?`<span>${esc(selected.referenceEdition)}</span>`:''}</div>`,
      `<p>${esc(referencePlane())}</p>`,
      taper?`<details><summary>基準距離與牙型說明</summary>${details.join('')}</details>`:''
    ].join('');
  }
  function renderProfile(type) {
    // 圖只說明直徑位置；角度以數字標註，不暗示為精確比例的牙型工程圖。
    const outer = member === 'external';
    if(selected.taper){
      $('thread-profile').innerHTML=`<title>錐管螺紋與基準平面位置示意</title><path d="M25 57L272 29V115L25 87Z" fill="#dcebf5" stroke="#245674" stroke-width="2"/><path d="M18 72H288" stroke="#6ba6c8" stroke-dasharray="5 4"/><path d="M168 14V128" stroke="#0078ad" stroke-width="2" stroke-dasharray="4 3"/><g fill="#245674" font-family="sans-serif" font-size="13"><text x="178" y="21">基準平面</text><text x="29" y="126">直徑錐度 1:${esc(selected.taper.diameterRatio)}</text><text x="29" y="47">小端</text><text x="240" y="22">大端</text></g>`;
      $('thread-profile-note').textContent=`錐度為軸向位置與直徑的關係，圖不依比例繪製；基準面以本規格文字定義為準。${type?.angleDeg}° 為牙型角，不是錐度角。`;
      return;
    }
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
    if (recordMap.has(parts[1])) { selected=recordMap.get(parts[1]);family=selected.family;kind=familyKind(family);query='';$('thread-search').value=''; }
    if (['internal','external'].includes(parts[2])) member=parts[2];
    renderPicker();
  }
  async function copy() {
    if (!selected) return;
    const side=selected[member],limits=hasLimits();
    const lines=[`${designation(selected)}｜${member==='internal'?'內牙':'外牙'}`,side?.className||'基本資料（未指定公差）',pitchText(selected),`尺寸單位：${sizeUnit()}`];
    if(selected.taper){lines.push(`直徑錐度 1:${selected.taper.diameterRatio}`,referencePlane());if(referenceLengthVisible())lines.push(`${selected.taper.referenceLengthLabel}：${number(selected.taper.referenceLengthMm)} ${sizeUnit()}`);if(selected.taper.note)lines.push(selected.taper.note);}
    if(isNumber(selected.pipeOutsideDiameterMm))lines.push(`管材外徑 D：${number(selected.pipeOutsideDiameterMm)} ${sizeUnit()}（非基準面螺紋大徑）`);
    rows().forEach(row => lines.push(limits?`${row.label} ${row.symbol}：最小 ${number(row.min)} / 最大 ${number(row.max)}`:isNumber(row.reference)?`${row.label} ${row.symbol}：牙型計算參考 ${referenceNumber(row.reference)}`:`${row.label} ${row.symbol}：基本值 ${number(row.basic)}`));
    if(selected.profileReference)lines.push(selected.profileReference.formula,selected.profileReference.scope);
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
    kind=familyKind(family);
    $('thread-search').addEventListener('input',()=>{query=$('thread-search').value;family='all';kind='all';const code=window.THREAD_SEARCH.parse(query).code;if(code==='R')member='external';else if(['RC','RP','PS'].includes(code))member='internal';renderPicker();notifyRoute();});
    $('thread-size').addEventListener('change',()=>choose($('thread-size').value,true));
    $('thread-library').addEventListener('click',event=>{
      const button=event.target.closest('button');if(!button)return;
      if(button.dataset.threadKind){kind=button.dataset.threadKind;family='all';query='';$('thread-search').value='';renderPicker();save();notifyRoute();}
      else if(button.dataset.threadFamily){family=button.dataset.threadFamily;query='';$('thread-search').value='';renderPicker();save();notifyRoute();}
      else if(button.dataset.threadId)choose(button.dataset.threadId,true);
      else if(button.dataset.threadSaved)choose(button.dataset.threadSaved,true);
      else if(button.dataset.threadMember){member=button.dataset.threadMember;renderDetail();save();notifyRoute();}
      else if(button.id==='thread-search-clear'){query='';$('thread-search').value='';renderPicker();notifyRoute();$('thread-search').focus();}
      else if(button.id==='thread-reset'){family='all';kind='all';query='';$('thread-search').value='';renderPicker();notifyRoute();$('thread-search').focus();}
      else if(button.id==='thread-save'&&selected){if(favorites.has(selected.id))favorites.delete(selected.id);else favorites.add(selected.id);save();renderDetail();}
      else if(button.id==='thread-copy')copy();
      else if(button.id==='thread-open-converter'&&selected)callbacks.onConverter?.(selected);
    });
    renderPicker();
  }
  window.ThreadLibrary={mount,open,getHash,setUnit(value){unit=value==='imperial'?'imperial':'metric';if(mounted){renderPicker();}},getSources(){return [...sourceMap.values()];}};
})();
