/**
 * 螺紋搜尋｜獨立的純函式，瀏覽器與離線檢查共用。
 * 先辨識牙系及完整公稱尺寸，再比對牙距／TPI；NPT 不會誤中 NPTF。
 * 公稱管徑只用來找規格，絕不拿來計算管牙外徑。
 */
(() => {
  'use strict';
  // ── 01｜查找代號：別名只導向資料，不表示製造公差或量規相同。 ──
  const codes = {
    M:['metric-coarse','metric-fine'], MF:['metric-fine'], UNC:['unc'], UNF:['unf'], UNEF:['unef'],
    BA:['ba'], BSW:['bsw'], BSF:['bsf'], G:['g'], PF:['g'], BSPP:['g'],
    PT:['bspt'], BSPT:['bspt'], RC:['bspt'], R:['bspt'], RP:['rp'], PS:['rp'],
    NPT:['npt'], NPTF:['nptf'], NPSM:['npsm'], NPSC:['npsc'], NPSF:['npsf'],
    TR:['tr'], PG:['pg']
  };
  const codeNames = Object.keys(codes).sort((a,b)=>b.length-a.length);
  const codePattern = codeNames.join('|');
  const normalize = value => String(value ?? '').normalize('NFKC').toUpperCase()
    .replace(/[⁄∕]/g,'/').replace(/[″"′']/g,'').replace(/[×✕*]/g,'X').replace(/[‐‑–—−]/g,'-').replace(/\s+/g,'');
  const readable = value => String(value ?? '').replace(/(\d)([¼½¾])/g,'$1 $2').normalize('NFKC').toUpperCase()
    .replace(/[⁄∕]/g,'/').replace(/[″"′']/g,'').replace(/[×✕*]/g,'X').replace(/[‐‑–—−]/g,'-').trim();
  function sizeNumber(text) {
    const value=readable(text).replace(/^(?:NO\.?\s*|#)/,'');
    const mixed=value.match(/^(?:(\d+)\s+)?(\d+)\/(\d+)$/);
    return mixed ? Number(mixed[1] || 0)+Number(mixed[2])/Number(mixed[3]) : /^\d+(?:\.\d+)?$/.test(value)?Number(value):null;
  }
  function nominal(item) {
    if (['metric-coarse','metric-fine','tr'].includes(item.family)) return item.diameterMm;
    let label=readable(item.sizeLabel).replace(new RegExp(`^(?:${codePattern})\\s*`),'');
    return sizeNumber(label.split(/[X-]/)[0]);
  }
  // ── 02｜完整規格：支援前／後置牙系、分數、混合分數與編號牙。 ──
  function parse(query) {
    let text=readable(query), families=null, code=null;
    const prefix=text.match(new RegExp(`^(${codePattern})(?=$|[^A-Z])\\s*`));
    if(prefix){code=prefix[1];families=codes[code];text=text.slice(prefix[0].length).trim();}
    const suffix=text.match(new RegExp(`(?:^|[^A-Z])(${codePattern})$`));
    if(suffix){const last=suffix[1];families=families?families.filter(id=>codes[last].includes(id)):codes[last];code=code||last;text=text.slice(0,text.length-last.length).trim();}
    // BA 0、0BA、BA#0 是號數，不能讓 BA 0 部分命中 BA 10。
    if(code==='BA') return {families,size:sizeNumber(text),numbered:true,pitch:null,code};
    text=text.replace(/[\s-]+(?:6H|6G|2A|2B|3A|3B)$/,'').trim();
    const match=text.match(/^(#?\d+(?:\.\d+)?(?:\s+\d+\/\d+|\/\d+)?)(?:\s*([X-]|\s)\s*(\d+(?:\.\d+)?))?$/);
    return {families,code,text,size:match?sizeNumber(match[1]):null,numbered:match?.[1].startsWith('#')||false,pitch:match?.[3]?Number(match[3]):null,separator:match?.[2]};
  }
  function create(families=[]) {
    const familyMap=new Map(families.map(item=>[item.id,item]));
    return function matches(item,query) {
      if(!String(query).trim())return true;
      const parsed=parse(query);
      if(parsed.families&&!parsed.families.includes(item.family))return false;
      if(parsed.code&&!parsed.text&&parsed.size===null)return true;
      if(parsed.size!==null){
        const value=nominal(item);
        if(value===null||Math.abs(value-parsed.size)>1e-9)return false;
        // 編號統一牙與英吋尺寸分開；BA 自身就是號數。
        if(parsed.numbered){
          if(item.family==='ba'&&parsed.code!=='BA')return false;
          if(item.family!=='ba'&&!/^(?:NO\.?\s*|#)/.test(readable(item.sizeLabel)))return false;
        }
        if(parsed.pitch!==null){
          const actual=parsed.separator==='X'||['metric-coarse','metric-fine','tr','pg'].includes(item.family)?item.pitchMm:item.tpi;
          return typeof actual==='number'&&Math.abs(actual-parsed.pitch)<1e-6;
        }
        return true;
      }
      const type=familyMap.get(item.family);
      const fields=[item.designation,item.sizeLabel,...(item.aliases||[]),...Object.values(item.memberDesignations||{}),type?.label,type?.description,
        ...[item.internal?.className,item.external?.className].filter(Boolean).map(level=>`${item.designation}-${level}`)].map(normalize);
      const words=(parsed.families?parsed.text:String(query)).split(/\s+/).map(normalize).filter(Boolean);
      return words.every(word=>fields.some(field=>field.includes(word)));
    };
  }
  const api={create,normalize,parse};
  if(typeof window!=='undefined')window.THREAD_SEARCH=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})();
