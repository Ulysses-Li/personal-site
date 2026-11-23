/*
 * 螺紋資料補充｜R／Rc 錐管牙與 Rp 平行內管牙。
 * 所有尺寸單位為 mm；資料依 REX 原廠手冊所載 JIS B 0203 基本尺寸表。
 * basic 是指定基準位置的基本牙型，不是任意截面的直徑或 MIN／MAX 限界。
 * 本檔獨立輸出 THREAD_BSP_DATA；可由本機 classic script 或 Node 載入。
 */
(function publishThreadBspData() {
  'use strict';

  // ── 01｜第一手來源：尺寸表與牙型／代號說明分別定位。 ──
  const sources = [
    {
      id: 'bsp-rex-jis-basic',
      title: 'REX Industries｜F50A 操作說明書・JIS B 0203 管用錐螺紋表',
      url: 'https://www.rexind.co.jp/jp/tec/operation_manual/pdf/F50A_1601.pdf',
      page: '印刷第 22 頁／PDF 第 24 頁，表 11「管用テーパねじ規格表」',
      scope: '原廠手冊註明摘自 2006 年版 JIS 手冊。採 1/16–6 的 TPI、基本大／節／小徑及 R 外牙基準距離 a；表頭同列內外牙基本徑，註 1 說明 Rc／Rp 代號。未採管材外徑、底孔、軸向許差或量規尺寸作直徑限界。'
    },
    {
      id: 'bsp-osg-pipe-guide',
      title: 'OSG｜管用ねじ規格と工具について・シリーズ No.3（2019.12）',
      url: 'https://www.osg.co.jp/en/media_dl/technical/file/t_3.pdf',
      page: '印刷第 2、4、6 頁／PDF 第 4、6、8 頁；牙型、用途與 §5-1 ISO 導入',
      scope: '支持 55° 牙型、R／Rc 直徑錐度 1:16、R 配 Rc 或 Rp，以及 PT／PS 舊稱背景。舊稱只供查找；不據此宣稱所有舊版與現行標準、工具或量規可互換。Rp 與 G 分開處理。'
    }
  ];

  // ── 02｜牙系：R／Rc 共用規格；Rp 僅有內牙，不建立 Rp 外牙。 ──
  const families = [
    {
      id: 'bspt',
      label: 'R / Rc · BSPT（舊稱 PT）',
      kind: 'pipe',
      aliases: ['PT', 'BSPT', 'R', 'Rc'],
      description: '55° 錐管牙：R 為外牙、Rc 為內牙，直徑錐度 1:16。PT 為歷史查找名稱；本資料採所列 JIS 基本尺寸，不建立舊 PT 的獨立限界。',
      angleDeg: 55
    },
    {
      id: 'rp',
      label: 'Rp 平行內管牙（舊稱 PS）',
      kind: 'pipe',
      aliases: ['PS', 'Rp'],
      description: '55° 平行內管牙，用於配合 R 外錐管牙。PS 為歷史查找名稱；Rp 與 G 平行管牙的用途及檢驗分開，不提供 Rp 外牙。',
      angleDeg: 55
    }
  ];

  // ── 03｜原廠表列值：公稱尺寸、TPI、參考牙距 P、基本徑、外牙距離 a。 ──
  // 每列：規格／TPI／表列參考 P／大徑／節徑／小徑／R 外牙 a；單位 mm。
  // P 欄在來源標為參考值，故另保留原數；pitchMm 以 25.4 / TPI 換算。
  // 直徑直接採表列值，未以 D－P、牙高公式、管材外徑或預鑽值估算。
  const basicRows = [
    ['1/16', 28, 0.9071,   7.723,   7.142,   6.561,  3.97],
    ['1/8',  28, 0.9071,   9.728,   9.147,   8.566,  3.97],
    ['1/4',  19, 1.3368,  13.157,  12.301,  11.445,  6.01],
    ['3/8',  19, 1.3368,  16.662,  15.806,  14.950,  6.35],
    ['1/2',  14, 1.8143,  20.955,  19.793,  18.631,  8.16],
    ['3/4',  14, 1.8143,  26.441,  25.279,  24.117,  9.53],
    ['1',    11, 2.3091,  33.249,  31.770,  30.291, 10.39],
    ['1 1/4',11, 2.3091,  41.910,  40.431,  38.952, 12.70],
    ['1 1/2',11, 2.3091,  47.803,  46.324,  44.845, 12.70],
    ['2',    11, 2.3091,  59.614,  58.135,  56.656, 15.88],
    ['2 1/2',11, 2.3091,  75.184,  73.705,  72.226, 17.46],
    ['3',    11, 2.3091,  87.884,  86.405,  84.926, 20.64],
    ['4',    11, 2.3091, 113.030, 111.551, 110.072, 25.40],
    ['5',    11, 2.3091, 138.430, 136.951, 135.472, 28.58],
    ['6',    11, 2.3091, 163.830, 162.351, 160.872, 28.58]
  ];

  // ── 04｜建立資料列：共用基本值與成員適用範圍，不補不存在的限界。 ──
  const sourceIds = sources.map(source => source.id);
  const sourcePage = 'REX 印刷第 22 頁／PDF 第 24 頁，表 11';
  const records = [];

  for (const [size, tpi, referencePitchMm, major, pitch, minor, referenceLengthMm] of basicRows) {
    const suffix = size.replace(/[ /]+/g, '-');
    const shared = {
      sizeLabel: `${size}″`,
      diameterMm: major,
      pitchMm: 25.4 / tpi,
      referencePitchMm,
      tpi,
      // 本檔僅收基本尺寸；未整理直徑限界，不能把 basic 套入 MIN／MAX。
      internal: null,
      external: null,
      sourceIds: [...sourceIds],
      page: sourcePage
    };

    records.push({
      ...shared,
      id: `bspt-${suffix}`,
      family: 'bspt',
      designation: `R ${size} / Rc ${size}`,
      geometry: 'tapered',
      supportedMembers: ['internal', 'external'],
      memberDesignations: { internal: `Rc ${size}`, external: `R ${size}` },
      referenceLabel: '基準平面基本尺寸',
      basic: { major, pitch, minorInternal: minor, minorExternal: minor },
      taper: {
        diameterRatio: 16,
        referencePlane: 'R 外牙由小端管端沿軸線量 a 至基準面；Rc 內牙以管口端面為基準位置。',
        referenceLengthMm,
        referenceLengthLabel: 'R 外牙 a（管端至基準面）',
        referenceLengthMembers: ['external'],
        memberReferencePlanes: {
          external: 'R 外牙距管端 a 的基準面',
          internal: 'Rc 內牙管口端面'
        },
        note: 'a 僅適用 R 外牙，不是 Rc 內牙攻牙深度；錐牙離開基準面後，直徑隨軸向位置改變。'
      },
      scope: 'JIS B 0203 表列基準面基本尺寸；MIN／MAX 未收錄。R 為外錐牙、Rc 為內錐牙；PT 僅作歷史名稱查找，不保證舊版公差或量規等同。'
    });

    records.push({
      ...shared,
      id: `rp-${suffix}`,
      family: 'rp',
      designation: `Rp ${size}`,
      geometry: 'parallel',
      supportedMembers: ['internal'],
      memberDesignations: { internal: `Rp ${size}` },
      referenceLabel: '平行內牙基本尺寸',
      referenceNote: '平行內管牙，用於配合 R 外錐管牙，與 G 的用途及檢驗方式分開。',
      basic: { major, pitch, minorInternal: minor, minorExternal: null },
      taper: null,
      scope: 'JIS B 0203 表列平行內牙基本尺寸；MIN／MAX 未收錄。僅適用 Rp 內牙，不建立外牙；PS 僅供歷史名稱查找，不與 G 混用。'
    });
  }

  // ── 05｜雙環境匯出：網頁離線載入與 Node 資料檢查共用同一物件。 ──
  const data = { units: 'mm', sources, families, records };
  globalThis.THREAD_BSP_DATA = data;
  if (typeof window !== 'undefined') window.THREAD_BSP_DATA = data;
  if (typeof module === 'object' && module.exports) module.exports = data;
})();
