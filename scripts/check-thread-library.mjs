/** 擴充螺紋資料庫與搜尋回歸｜離線執行，不改檔、不連網。 */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const require=createRequire(import.meta.url);
const root='../dist/tools/machining-calculator/';
const datasets=[['thread-data.js','THREAD_DATA'],['thread-extra-data.js','THREAD_EXTRA_DATA'],['thread-bsp-data.js','THREAD_BSP_DATA'],['thread-npt-data.js','THREAD_NPT_DATA'],['thread-extended-data.js','THREAD_EXTENDED_DATA']];
const collections=datasets.map(([file])=>require(root+file));
const records=collections.flatMap(data=>data.records),families=collections.flatMap(data=>data.families),sources=collections.flatMap(data=>data.sources);
const byId=new Map(records.map(row=>[row.id,row]));
const search=require(root+'thread-search.js');
const matches=search.create(families), find=query=>records.filter(row=>matches(row,query));
const get=id=>{assert.ok(byId.has(id),id);return byId.get(id);};
let checks=0;
const check=(title,run)=>{try{run();checks++;}catch(error){error.message=title+': '+error.message;throw error;}};
const near=(actual,expected,precision=1e-8)=>assert.ok(Math.abs(actual-expected)<=precision,`${actual} ≠ ${expected}`);
const valid=value=>assert.ok(typeof value==='number'&&Number.isFinite(value)&&value>0);

// ── 01｜資料不重複、不改原 ID，新增數值與來源均可追溯。 ──
check('336 規格與 15 牙系',()=>{
  assert.equal(records.length,336);assert.equal(byId.size,336);
  assert.equal(new Set(families.map(row=>row.id)).size,15);
  assert.equal(sources.length,new Set(sources.map(row=>row.id)).size);
  assert.deepEqual(Object.fromEntries(families.map(row=>[row.id,records.filter(item=>item.family===row.id).length])),{
    'metric-coarse':40,'metric-fine':70,unc:29,unf:24,ba:17,bsw:22,bsf:9,g:19,bspt:15,rp:15,npt:19,nptf:12,unef:18,tr:17,pg:10
  });
});
check('來源、尺寸與內外牙能力',()=>{
  const ids=new Set(sources.map(row=>row.id));
  for(const source of sources){assert.equal(new URL(source.url).protocol,'https:');assert.ok(source.scope&&source.title);}
  for(const row of records){
    assert.match(row.id,/^[a-z0-9]+(?:-[a-z0-9]+)*$/);valid(row.pitchMm);
    if(row.diameterMm!==null)valid(row.diameterMm);
    if(row.tpi!==null) {valid(row.tpi);near(row.pitchMm,25.4/row.tpi,0.00000051);}
    for(const value of Object.values(row.basic))if(value!==null)valid(value);
    assert.ok(row.sourceIds.length);row.sourceIds.forEach(id=>assert.ok(ids.has(id),row.id+'/'+id));
    if(row.supportedMembers){assert.ok(row.supportedMembers.length);row.supportedMembers.forEach(side=>assert.ok(['internal','external'].includes(side)));}
  }
});
check('60 筆工件限界與 276 筆非限界分開',()=>{
  const limited=records.filter(row=>row.internal||row.external);assert.equal(limited.length,60);
  for(const row of limited)for(const member of ['internal','external']){
    const side=row[member];assert.ok(side.className&&side.sourceId&&Number.isSafeInteger(side.page)&&side.page>0);
    assert.ok(row.sourceIds.includes(side.sourceId));
    for(const field of ['major','pitch','minor']){
      const {min,max}=side[field];if(min!==null)valid(min);if(max!==null)valid(max);if(min!==null&&max!==null)assert.ok(min<=max);
    }
    assert.deepEqual(row.internal.major,{min:null,max:null});assert.deepEqual(row.external.minor,{min:null,max:null});
  }
  assert.equal(records.filter(row=>!row.internal&&!row.external).length,276);
});
check('R／Rc 基準面與 R 外牙 a',()=>{
  const row=get('bspt-1-2');assert.deepEqual(row.basic,{major:20.955,pitch:19.793,minorInternal:18.631,minorExternal:18.631});
  assert.equal(row.taper.diameterRatio,16);assert.equal(row.taper.referenceLengthMm,8.16);
  assert.deepEqual(row.taper.referenceLengthMembers,['external']);
  assert.equal(row.memberDesignations.internal,'Rc 1/2');assert.equal(row.memberDesignations.external,'R 1/2');
  assert.match(row.taper.memberReferencePlanes.internal,/管口/);assert.match(row.taper.referenceLengthLabel,/a/);
  assert.equal(get('bspt-6').basic.major,163.83);
});
check('Rp 僅內牙且是平行牙',()=>{
  for(const row of records.filter(item=>item.family==='rp')){
    assert.deepEqual(row.supportedMembers,['internal']);assert.equal(row.geometry,'parallel');assert.equal(row.taper,null);assert.equal(row.basic.minorExternal,null);
  }
});
check('NPT 與 NPTF 獨立範圍及 E1／L1',()=>{
  for(const family of ['npt','nptf']){
    const row=get(family+'-1-2');near(row.basic.pitch,19.772122);near(row.taper.referenceLengthMm,8.128);
    assert.equal(row.taper.diameterRatio,16);assert.match(row.referenceEdition,/1957/);assert.equal(row.symbols.pitch,'E₁');
    assert.equal(row.diameterMm,null);assert.equal(row.basic.major,null);assert.equal(row.basic.minorInternal,null);assert.equal(row.basic.minorExternal,null);
    assert.notEqual(row.pipeOutsideDiameterMm,row.basic.pitch);assert.equal(row.internal,null);assert.equal(row.external,null);
  }
  assert.ok(byId.has('npt-12'));assert.ok(byId.has('nptf-3'));assert.ok(!byId.has('nptf-12'));
});
check('NPT 1 與 BSPT 1 牙數不同',()=>{assert.equal(get('npt-1').tpi,11.5);assert.equal(get('bspt-1').tpi,11);});
check('NPT 1/16 最大基本牙高模型獨立保存',()=>{
  const row=get('npt-1-16'),profile=row.profileReference;
  near(profile.majorMm,7.894565);near(profile.minorMm,6.389379);near(profile.heightMm,0.752593);
  assert.equal(profile.kind,'maximum-basic-height');assert.match(profile.formula,/0\.8P/);
  assert.equal(row.basic.major,null);assert.equal(row.basic.minorInternal,null);assert.equal(row.basic.minorExternal,null);
  assert.equal(row.internal,null);assert.equal(row.external,null);assert.notEqual(profile.majorMm,row.pipeOutsideDiameterMm);
});
check('19 筆 NPT 參考模型使用原始牙距，未改限界',()=>{
  for(const row of records.filter(item=>item.family==='npt')){
    const profile=row.profileReference;valid(profile.majorMm);valid(profile.minorMm);valid(profile.heightMm);
    near(profile.heightMm,0.8*25.4/row.tpi,0.00000051);
    near((profile.majorMm+profile.minorMm)/2,row.basic.pitch,0.000001);
    assert.ok(row.sourceIds.includes(profile.sourceId));assert.match(profile.scope,/不是工件大徑上限/);
  }
});
check('NPTF 與其他牙系不套用 NPT 計算模型',()=>{
  assert.equal(records.filter(row=>row.profileReference?.kind==='maximum-basic-height').length,19);
  for(const row of records.filter(item=>item.family==='nptf'))assert.notEqual(row.profileReference.kind,'maximum-basic-height');
});
check('NPTF1/16 內外牙截形範圍各自計算',()=>{
  const row=get('nptf-1-16'),profile=row.profileReference;
  assert.deepEqual(profile.members.internal.majorMm,{min:7.692644,max:7.779004});
  assert.deepEqual(profile.members.internal.minorMm,{min:6.4135,max:6.50494});
  assert.deepEqual(profile.members.external.majorMm,{min:7.779004,max:7.870444});
  assert.deepEqual(profile.members.external.minorMm,{min:6.50494,max:6.5913});
  assert.match(profile.formulaByMember.internal,/2fr/);assert.match(profile.formulaByMember.external,/2fc/);
});
check('NPTF 使用徑向截短表，不誤用平寬F',()=>{
  const expected={27:[.03208,.0017,.0035,.0035,.0052],18:[.04811,.0026,.0043,.0043,.0061],14:[.06186,.0026,.0043,.0043,.0061],11.5:[.07531,.0035,.0052,.0052,.0078],8:[.10825,.0052,.0069,.0069,.0095]};
  const rows=records.filter(row=>row.profileReference?.kind==='dryseal-truncation-range');assert.equal(rows.length,12);
  for(const row of rows){const values=row.profileReference.sourceInches;assert.deepEqual([values.sharpH,values.crest.min,values.crest.max,values.root.min,values.root.max],expected[row.tpi]);}
});
check('截形參考不回填工件限界或原始基本大徑',()=>{
  for(const row of records.filter(item=>item.family==='nptf')){
    assert.equal(row.internal,null);assert.equal(row.external,null);assert.equal(row.basic.major,null);assert.equal(row.basic.minorInternal,null);assert.equal(row.basic.minorExternal,null);
    for(const side of Object.values(row.profileReference.members)){
      valid(side.majorMm.min);valid(side.majorMm.max);valid(side.minorMm.min);valid(side.minorMm.max);
      assert.ok(side.majorMm.min<=side.majorMm.max&&side.minorMm.min<=side.minorMm.max);
      assert.ok(side.majorMm.min>row.basic.pitch&&side.minorMm.max<row.basic.pitch);
    }
  }
});
check('NPTF1/2 參考小徑符合官方顯示精度',()=>{
  const profile=get('nptf-1-2').profileReference;
  assert.equal(profile.members.internal.minorMm.min.toFixed(3),'18.333');assert.equal(profile.members.internal.minorMm.max.toFixed(3),'18.419');
  assert.equal(profile.members.external.majorMm.max.toFixed(3),'21.211');
});
check('Tr／Pg 不以公稱值冒充基本徑',()=>{
  const rows=records.filter(row=>row.nominalOnly);assert.equal(rows.length,27);
  for(const row of rows){assert.ok(['tr','pg'].includes(row.family));assert.ok(row.diameterLabel);assert.ok(Object.values(row.basic).every(value=>value===null));}
  assert.equal(get('pg-13-5').diameterMm,20.4);assert.equal(get('tr-20-p4').pitchMm,4);
});
check('新增工件等級依列保存',()=>{
  assert.equal(get('metric-coarse-m1-p0-25').internal.className,'5H');assert.equal(get('metric-coarse-m1-p0-25').external.className,'6h');
  assert.equal(get('metric-coarse-m14-p2').internal.className,'6H');assert.equal(get('metric-coarse-m14-p2').external.className,'6g');
  assert.equal(get('g-1-16').basic.major,7.723);assert.notEqual(get('g-1-16').basic.major,25.4/16);
});

// ── 02｜精確搜尋回歸：不能把相近代號、號數或混合分數配錯。 ──
const cases=[
  ['PT 1/2',['bspt-1-2']],['1/2 PT',['bspt-1-2']],['Rc1/2',['bspt-1-2']],['R 1/2',['bspt-1-2']],['BSPT ½',['bspt-1-2']],
  ['PS 1/2',['rp-1-2']],['Rp1/2',['rp-1-2']],['PF 1/2',['g-1-2']],
  ['NPT1/2',['npt-1-2']],['1/2-14 NPT',['npt-1-2']],['NPTF 1/2',['nptf-1-2']],['1⁄2-14 NPTF',['nptf-1-2']],
  ['NPT 1',['npt-1']],['PT 1',['bspt-1']],['NPT 1¼',['npt-1-1-4']],['1 1/4 NPT',['npt-1-1-4']],
  ['BA 0',['ba-0']],['0BA',['ba-0']],['BA#0',['ba-0']],['ＢＡ０',['ba-0']],['BA10',['ba-10']],
  ['M10×1.5',['metric-coarse-m10-p1-5']],['Ｍ１０×１．５',['metric-coarse-m10-p1-5']],['M10 1.5',['metric-coarse-m10-p1-5']],['M10×1.5-6H',['metric-coarse-m10-p1-5']],
  ['MF4×0.5',['metric-fine-m4-p0-5']],['¼-20 UNC',['unc-1-4-20']],['#10-24 UNC',['unc-no10-24']],
  ['Tr20×4',['tr-20-p4']],['Pg13.5',['pg-13-5']],['G 1/16',['g-1-16']]
];
for(const [query,expected] of cases)check('查找 '+query,()=>assert.deepEqual(find(query).map(row=>row.id),expected));
check('代號獨立與全牙系搜尋',()=>{
  assert.equal(find('NPT').length,19);assert.equal(find('NPTF').length,12);assert.equal(find('PT').length,15);
  assert.equal(find('UNEF').length,18);assert.equal(find('M10').length,4);assert.equal(find('無此螺紋').length,0);
  assert.ok(find('#10').every(row=>['unc','unf'].includes(row.family)));assert.equal(find('NPT 1/2 NPTF').length,0);
  assert.equal(find('').length,336);assert.equal(find('NPT 1/2-19').length,0);
});

// ── 03｜本機 classic 載入次序與 Node 匯出一致。 ──
const browser=vm.createContext({window:{}});
for(const [file] of datasets)vm.runInContext(await readFile(new URL(root+file,import.meta.url),'utf8'),browser,{filename:file});
vm.runInContext(await readFile(new URL(root+'thread-search.js',import.meta.url),'utf8'),browser,{filename:'thread-search.js'});
check('classic script 與 CommonJS 一致',()=>{
  for(const [file,name] of datasets)assert.equal(JSON.stringify(browser.window[name]),JSON.stringify(require(root+file)));
  assert.equal(browser.window.THREAD_SEARCH.create(families)(get('npt-1-2'),'NPT 1/2'),true);
});
const html=await readFile(new URL(root+'index.html',import.meta.url),'utf8');
check('HTML 先載資料與搜尋，再載介面',()=>{
  const ui=html.indexOf('src="thread-ui.js"');assert.ok(ui>=0);
  for(const file of [...datasets.map(([name])=>name),'thread-search.js']){const position=html.indexOf('src="'+file+'"');assert.ok(position>=0&&position<ui,file);}
  assert.ok(ui<html.indexOf('src="app.js"'));
});
console.log(`通過：${checks} 組完整螺紋資料與搜尋檢查；336 規格／15 牙系，60 筆工件限界。`);
