/*
 * 直牙擴充資料｜公制、統一牙、Tr 與 Pg。
 * 表列公稱規格與基本牙型幾何分開；未收錄的尺寸保留 null。
 * 不改寫原有紀錄 ID，也不把底孔、絲攻或量規尺寸當成工件限界。
 */
(function publishExtendedThreads() {
  'use strict';

  // ── 01｜一手來源：每筆記錄保留可定位的原廠表格或幾何依據。 ──
  const sources = [
    {
      "id": "extended-thurmer-thread-series",
      "title": "Thürmer Tools｜公制、UNC／UNF／UNEF、Tr、Pg 規格表",
      "url": "https://www.thurmer.com/special-sizes-faq/",
      "page": "Tap drill size reference tables：ISO metric coarse／fine、UNC、UNF、UNEF、Trapezoidal Tr、Pg conduit 及 G 表",
      "scope": "只取公稱尺寸、牙距與 TPI；分數英吋外徑以公稱英吋精確換算，No. 螺紋外徑保留原表毫米列值。未把 Drill 欄當作小徑或公差限界。FAQ 的 M4×0.35 疑義列排除，改採 Dormer 的 M4×0.5。"
    },
    {
      "id": "extended-dormer-basic-profile",
      "title": "Dormer Pramet｜M／UN 60° 基本牙型與 M4×0.5",
      "url": "https://api.dormerpramet.com/medias/Technick-plak-t-V-ROBA-Z-VIT-.pdf?context=bWFzdGVyfHJvb3R8NDU4MTM4fGFwcGxpY2F0aW9uL3BkZnxhR1poTDJnM1lTODRPVFE0TWpNMk56YzVOVFV3TDFSbFkyaHVhV05ydzcwZ2NHeGhhOE9oZEY5V3c1MVNUMEpCSUZyRGdWWkpWTVd1TG5Ca1pnfDk0NTgyYjgyODYxZGUxYmU0Mjk5YzU1NmNkYzNjZjdmNTI3YzhjODZlOGYyODNmZDAzNWY5OWRlZGI1YzQ3OGY",
      "page": "PDF 第 1 頁「ISO závitníky • M metrické • UN unifikované」；第 2 頁 ISO METRICKÝ 的 M4×0.5 列",
      "scope": "60° M／UN：H=√3P/2；基本節徑以 D−3H/4 推算，內牙小徑以 D−5H/4，外牙圓底小徑以 D−17H/12 分別推算。第 1 頁另有 55° Whitworth 基本幾何，供 G 1/16 基本徑推算。僅為基本幾何，不是公差等級限界。"
    },
    {
      "id": "extended-osg-metric-workpiece",
      "title": "OSG Gauge Stock List｜補充公制工件限界",
      "url": "https://www.osg.co.jp/media_dl/flier/file/p_9.pdf",
      "page": "印刷 101／PDF 102；JIS B0205-4、B0209-2/3:2001 摘錄",
      "scope": "新增來源已列的 M1–M33 常用工件尺寸。依列保留內牙5H或6H、外牙6h或6g，並非全部同級。僅取工件限界，排除空白列與 S 火星塞列。內牙大徑與外牙小徑限界未列，保留null。"
    }
  ];

  const families = [
    {id:'unef',label:'UNEF 超細牙',kind:'unified',angleDeg:60,description:'統一超細牙；公稱尺寸與 TPI，基本幾何不代表配合等級。'},
    {id:'tr',label:'Tr 梯形牙',kind:'other',angleDeg:30,description:'DIN 103 公制梯形牙；此批僅收公稱直徑與牙距。'},
    {id:'pg',label:'Pg 電線管牙',kind:'other',angleDeg:80,description:'DIN 40430 電線管牙；僅收公稱外徑與 TPI，不套用 60° 牙型。'}
  ];

  // ── 02｜公制原廠規格：直徑／牙距；不含預鑽欄。 ──
  const metricRows = [
    ["metric-coarse",36,4],
    ["metric-coarse",39,4],
    ["metric-coarse",42,4.5],
    ["metric-coarse",45,4.5],
    ["metric-coarse",48,5],
    ["metric-coarse",52,5],
    ["metric-coarse",56,5.5],
    ["metric-coarse",60,5.5],
    ["metric-coarse",64,6],
    ["metric-coarse",68,6],
    ["metric-fine",3,0.35],
    ["metric-fine",4,0.5],
    ["metric-fine",5,0.5],
    ["metric-fine",6,0.75],
    ["metric-fine",7,0.75],
    ["metric-fine",8,0.75],
    ["metric-fine",8,1],
    ["metric-fine",10,0.75],
    ["metric-fine",11,1],
    ["metric-fine",13,1],
    ["metric-fine",14,1],
    ["metric-fine",14,1.25],
    ["metric-fine",15,1],
    ["metric-fine",15,1.5],
    ["metric-fine",16,1],
    ["metric-fine",17,1],
    ["metric-fine",18,1],
    ["metric-fine",18,1.5],
    ["metric-fine",18,2],
    ["metric-fine",20,1],
    ["metric-fine",22,1],
    ["metric-fine",22,1.5],
    ["metric-fine",22,2],
    ["metric-fine",24,1],
    ["metric-fine",24,1.5],
    ["metric-fine",24,2],
    ["metric-fine",25,1],
    ["metric-fine",25,1.5],
    ["metric-fine",26,1.5],
    ["metric-fine",27,1],
    ["metric-fine",27,1.5],
    ["metric-fine",27,2],
    ["metric-fine",28,1.5],
    ["metric-fine",30,1.5],
    ["metric-fine",30,2],
    ["metric-fine",32,1.5],
    ["metric-fine",33,2],
    ["metric-fine",35,1.5],
    ["metric-fine",36,1.5],
    ["metric-fine",36,2],
    ["metric-fine",36,3],
    ["metric-fine",38,1.5],
    ["metric-fine",40,1.5],
    ["metric-fine",40,2],
    ["metric-fine",42,1.5],
    ["metric-fine",42,2],
    ["metric-fine",45,1.5],
    ["metric-fine",48,1.5],
    ["metric-fine",48,2],
    ["metric-fine",50,1.5],
    ["metric-fine",52,1.5],
    ["metric-fine",52,2],
    ["metric-fine",56,2],
    ["metric-fine",60,2],
    ["metric-fine",64,2],
    ["metric-fine",64,4],
    ["metric-fine",70,2],
    ["metric-fine",80,2],
    ["metric-fine",90,2],
    ["metric-fine",100,2]
  ];

  const metricLimitRows = [
    ["metric-coarse",1,0.25,1,0.838,0.729,"5H",0.894,0.838,0.785,0.729,"6h",1,0.933,0.838,0.785],
    ["metric-coarse",1.1,0.25,1.1,0.938,0.829,"5H",0.994,0.938,0.885,0.829,"6h",1.1,1.033,0.938,0.885],
    ["metric-coarse",1.2,0.25,1.2,1.038,0.929,"5H",1.094,1.038,0.985,0.929,"6h",1.2,1.133,1.038,0.985],
    ["metric-coarse",1.4,0.3,1.4,1.205,1.075,"5H",1.265,1.205,1.142,1.075,"6h",1.4,1.325,1.205,1.149],
    ["metric-coarse",1.6,0.35,1.6,1.373,1.221,"6H",1.458,1.373,1.321,1.221,"6g",1.581,1.496,1.354,1.291],
    ["metric-coarse",1.8,0.35,1.8,1.573,1.421,"6H",1.658,1.573,1.521,1.421,"6g",1.781,1.696,1.554,1.491],
    ["metric-coarse",2.2,0.45,2.2,1.908,1.713,"6H",2.003,1.908,1.838,1.713,"6g",2.18,2.08,1.888,1.817],
    ["metric-coarse",2.5,0.45,2.5,2.208,2.013,"6H",2.303,2.208,2.138,2.013,"6g",2.48,2.38,2.188,2.117],
    ["metric-coarse",3.5,0.6,3.5,3.11,2.85,"6H",3.222,3.11,3.01,2.85,"6g",3.479,3.354,3.089,3.004],
    ["metric-coarse",4.5,0.75,4.5,4.013,3.688,"6H",4.131,4.013,3.878,3.688,"6g",4.478,4.338,3.991,3.901],
    ["metric-coarse",7,1,7,6.35,5.917,"6H",6.5,6.35,6.153,5.917,"6g",6.974,6.794,6.324,6.212],
    ["metric-coarse",9,1.25,9,8.188,7.647,"6H",8.348,8.188,7.912,7.647,"6g",8.972,8.76,8.16,8.042],
    ["metric-fine",9,1,9,8.35,7.917,"6H",8.5,8.35,8.153,7.917,"6g",8.974,8.794,8.324,8.212],
    ["metric-coarse",11,1.5,11,10.026,9.376,"6H",10.206,10.026,9.676,9.376,"6g",10.968,10.732,9.994,9.862],
    ["metric-fine",12,1,12,11.35,10.917,"6H",11.51,11.35,11.153,10.917,"6g",11.974,11.794,11.324,11.206],
    ["metric-coarse",14,2,14,12.701,11.835,"6H",12.913,12.701,12.21,11.835,"6g",13.962,13.682,12.663,12.503],
    ["metric-fine",14,1.5,14,13.026,12.376,"6H",13.216,13.026,12.676,12.376,"6g",13.968,13.732,12.994,12.854],
    ["metric-coarse",18,2.5,18,16.376,15.294,"6H",16.6,16.376,15.744,15.294,"6g",17.958,17.623,16.334,16.164],
    ["metric-fine",20,2,20,18.701,17.835,"6H",18.913,18.701,18.21,17.835,"6g",19.962,19.682,18.663,18.503],
    ["metric-coarse",22,2.5,22,20.376,19.294,"6H",20.6,20.376,19.744,19.294,"6g",21.958,21.623,20.334,20.164],
    ["metric-coarse",24,3,24,22.051,20.752,"6H",22.316,22.051,21.252,20.752,"6g",23.952,23.577,22.003,21.803],
    ["metric-coarse",27,3,27,25.051,23.752,"6H",25.316,25.051,24.252,23.752,"6g",26.952,26.577,25.003,24.803],
    ["metric-coarse",30,3.5,30,27.727,26.211,"6H",28.007,27.727,26.771,26.211,"6g",29.947,29.522,27.674,27.462],
    ["metric-coarse",33,3.5,33,30.727,29.211,"6H",31.007,30.727,29.771,29.211,"6g",32.947,32.522,30.674,30.462]
  ];

  const unifiedRows = [
    ["unc","No.1",64,1.854],
    ["unc","No.2",56,2.184],
    ["unc","No.3",48,2.515],
    ["unc","No.4",40,2.845],
    ["unc","No.5",40,3.175],
    ["unc","No.6",32,3.505],
    ["unc","No.8",32,4.166],
    ["unc","No.10",24,4.826],
    ["unc","No.12",24,5.486],
    ["unc","1 1/8",7,28.575],
    ["unc","1 1/4",7,31.75],
    ["unc","1 3/8",6,34.925],
    ["unc","1 1/2",6,38.1],
    ["unc","1 3/4",5,44.45],
    ["unc","2",4.5,50.8],
    ["unc","2 1/4",4.5,57.15],
    ["unc","2 1/2",4,63.5],
    ["unc","2 3/4",4,69.85],
    ["unc","3",4,76.2],
    ["unf","No.0",80,1.524],
    ["unf","No.1",72,1.854],
    ["unf","No.2",64,2.184],
    ["unf","No.3",56,2.515],
    ["unf","No.4",48,2.845],
    ["unf","No.5",44,3.175],
    ["unf","No.6",40,3.505],
    ["unf","No.8",36,4.166],
    ["unf","No.10",32,4.826],
    ["unf","No.12",28,5.486],
    ["unf","1 1/8",12,28.575],
    ["unf","1 1/4",12,31.75],
    ["unf","1 3/8",12,34.925],
    ["unf","1 1/2",12,38.1],
    ["unef","No.12",32,5.486],
    ["unef","1/4",32,6.35],
    ["unef","5/16",32,7.938],
    ["unef","3/8",32,9.525],
    ["unef","7/16",28,11.112],
    ["unef","1/2",28,12.7],
    ["unef","9/16",24,14.288],
    ["unef","5/8",24,15.875],
    ["unef","11/16",24,17.462],
    ["unef","3/4",20,19.05],
    ["unef","13/16",20,20.638],
    ["unef","7/8",20,22.225],
    ["unef","1",20,25.4],
    ["unef","1 1/16",18,26.988],
    ["unef","1 1/8",18,28.575],
    ["unef","1 1/4",18,31.75],
    ["unef","1 3/8",18,34.925],
    ["unef","1 1/2",18,38.1]
  ];

  const trRows = [
    [8,1.5],
    [10,2],
    [10,3],
    [12,3],
    [14,3],
    [14,4],
    [16,4],
    [18,4],
    [20,4],
    [22,5],
    [24,5],
    [26,5],
    [28,5],
    [30,6],
    [32,6],
    [36,6],
    [40,7]
  ];

  const pgRows = [
    [7,20,12.5],
    [9,18,15.2],
    [11,18,18.6],
    [13.5,18,20.4],
    [16,18,22.5],
    [21,16,28.3],
    [29,16,37],
    [36,16,47],
    [42,16,54],
    [48,16,59.3]
  ];

  const round = x => Number(x.toFixed(6));
  const idN = x => String(x).replace('.', '-');
  const metricId = (family,d,p) => family+'-m'+idN(d)+'-p'+idN(p);
  const empty = () => ({min:null,max:null});
  function isoProfile(d,p) {
    const h = Math.sqrt(3) * p / 2;
    return {major:d,pitch:round(d-3*h/4),minorInternal:round(d-5*h/4),minorExternal:round(d-17*h/12)};
  }
  const metricRecords = metricRows.map(([family,d,p]) => ({
    id:metricId(family,d,p),family,sizeLabel:'M'+d,designation:'M'+d+' × '+p,
    geometry:'parallel',diameterMm:d,pitchMm:p,tpi:null,basic:isoProfile(d,p),internal:null,external:null,
    sourceIds:['extended-thurmer-thread-series','extended-dormer-basic-profile'],
    scope:'公稱直徑與牙距採原廠規格表；節徑、內牙小徑與外牙圓底小徑分別由60°基本牙型推算。未指定公差等級，並非製造或檢驗上下限。'
  }));

  // ── 03｜工件限界：保留每列實際5H／6H與6h／6g，不套用單一預設等級。 ──
  const metricLimitRecords = metricLimitRows.map(([family,d,p,bMajor,bPitch,bMinor,iClass,iPitchMax,iPitchMin,iMinorMax,iMinorMin,eClass,eMajorMax,eMajorMin,ePitchMax,ePitchMin]) => ({
    id:metricId(family,d,p),family,sizeLabel:'M'+d,designation:'M'+d+' × '+p,
    geometry:'parallel',diameterMm:d,pitchMm:p,tpi:null,
    basic:{major:bMajor,pitch:bPitch,minorInternal:bMinor,minorExternal:null},
    internal:{className:iClass,major:empty(),pitch:{min:iPitchMin,max:iPitchMax},minor:{min:iMinorMin,max:iMinorMax},sourceId:'extended-osg-metric-workpiece',page:102,pageLabel:'印刷101／PDF102',scope:iClass+' 工件有效徑與小徑限界；大徑限界未收錄。'},
    external:{className:eClass,major:{min:eMajorMin,max:eMajorMax},pitch:{min:ePitchMin,max:ePitchMax},minor:empty(),sourceId:'extended-osg-metric-workpiece',page:102,pageLabel:'印刷101／PDF102',scope:eClass+' 工件大徑與有效徑限界；小徑限界未收錄。'},
    sourceIds:['extended-osg-metric-workpiece'],scope:'OSG依JIS 2001版本摘錄的工件限界；缺值不以基本牙型或預鑽尺寸補入。'
  }));

  // ── 04｜統一牙：No.尺寸保留原表OD；分數英吋直接換算公稱直徑。 ──
  function nominalMm(size,tableOd) {
    if(size.startsWith('No.')) return tableOd;
    const parts=size.split(' '), f=parts.at(-1).split('/').map(Number);
    return round(((parts.length>1?Number(parts[0]):0)+(f.length>1?f[0]/f[1]:f[0]))*25.4);
  }
  const unifiedRecords = unifiedRows.map(([family,size,tpi,tableOd]) => {
    const d=nominalMm(size,tableOd), p=25.4/tpi, number=size.startsWith('No.');
    const display=number?'#'+size.slice(3):size;
    // UN／UNR 的外牙牙底形狀要求不同，本批不從共用示意圖補外牙小徑。
    const basic=isoProfile(d,p);basic.minorExternal=null;
    return {id:family+'-'+(number?'no'+size.slice(3):size.replace(/[\s/]+/g,'-'))+'-'+idN(tpi),family,
      sizeLabel:number?display:size+'″',designation:display+'-'+tpi+' '+family.toUpperCase(),
      aliases:number?[size+'-'+tpi+' '+family.toUpperCase(),size.replace('No.','No ')+'-'+tpi+' '+family.toUpperCase()]:[],
      geometry:'parallel',diameterMm:d,pitchMm:p,tpi,basic,internal:null,external:null,
      sourceIds:['extended-thurmer-thread-series','extended-dormer-basic-profile'],
      scope:(number?'No.螺紋公稱外徑保留原表毫米精度；':'公稱外徑由標示英吋精確換算；')+'牙數採原廠表。基本節徑與內牙小徑由60°牙型推算；外牙牙底形狀與小徑未收錄，不混用UN／UNR。基本值不代表2A／2B或其他公差等級限界。'
    };
  });

  // ── 05｜Tr／Pg：缺少可靠基本直徑時留空，不冒用公稱值或底孔。 ──
  const trRecords = trRows.map(([d,p])=>({
    id:'tr-'+idN(d)+'-p'+idN(p),family:'tr',sizeLabel:'Tr '+d,designation:'Tr '+d+' × '+p,
    geometry:'parallel',diameterMm:d,diameterLabel:'公稱直徑 d',pitchMm:p,tpi:null,nominalOnly:true,
    basic:{major:null,pitch:null,minorInternal:null,minorExternal:null},internal:null,external:null,
    sourceIds:['extended-thurmer-thread-series'],
    scope:'此批僅收DIN 103梯形牙的公稱直徑與牙距；實際內外牙基本直徑及限界未收錄。公稱d不當作內牙牙底大徑，旁列預鑽值亦不當作小徑。Tr不等同舊TM規格，單頭／多頭及旋向須依圖面。'
  }));
  const pgRecords = pgRows.map(([n,tpi,d])=>({
    id:'pg-'+idN(n),family:'pg',sizeLabel:'Pg '+n,designation:'Pg '+n,
    geometry:'parallel',diameterMm:d,diameterLabel:'公稱外徑 d',pitchMm:25.4/tpi,tpi,nominalOnly:true,
    basic:{major:null,pitch:null,minorInternal:null,minorExternal:null},internal:null,external:null,
    sourceIds:['extended-thurmer-thread-series'],
    scope:'DIN 40430 Pg電線管牙：公稱外徑與TPI採原廠表；此批未收錄基本節徑、小徑與公差限界，不以其他牙型公式或預鑽欄補值。Pg號數不是外徑毫米值。'
  }));
  const gRecords=[{id:'g-1-16',family:'g',sizeLabel:'G 1/16',designation:'G 1/16',geometry:'parallel',
    diameterMm:7.723,pitchMm:25.4/28,tpi:28,
    basic:{major:7.723,pitch:round(7.723-.640327*25.4/28),minorInternal:round(7.723-1.280654*25.4/28),minorExternal:round(7.723-1.280654*25.4/28)},
    internal:null,external:null,sourceIds:['extended-thurmer-thread-series','extended-dormer-basic-profile'],
    scope:'G 1/16基本外徑7.723mm與28TPI採原廠G表，公稱管徑不是外徑。55°基本節徑與小徑按Dormer Whitworth牙型推算，未收錄任何配合等級限界。'}];

  // ── 06｜瀏覽器與Node共用輸出，無外部執行期依賴。 ──
  const data={units:'mm',sources,families,records:[...metricLimitRecords,...metricRecords,...unifiedRecords,...trRecords,...pgRecords,...gRecords]};
  if(typeof globalThis!=='undefined')globalThis.THREAD_EXTENDED_DATA=data;
  if(typeof window!=='undefined')window.THREAD_EXTENDED_DATA=data;
  if(typeof module==='object'&&module.exports)module.exports=data;
}());
