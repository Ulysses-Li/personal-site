/*
 * 螺紋資料補充｜BA、BSW、BSF、G 的基本尺寸。
 * 原廠表列輸入與基本牙型幾何推算分開維護；不提供任何指定公差等級限界。
 * 僅輸出 THREAD_EXTRA_DATA，交由主程式與 THREAD_DATA 合併，不修改原始資料。
 */
(function publishThreadExtraData() {
  'use strict';

  // ── 01｜可定位的原廠來源：海報、規格表與平行管牙表。 ──
  const sources = [
    {
      id: 'extra-dormer-poster',
      title: 'Dormer Pramet｜VÝROBA ZÁVITŮ 螺紋技術海報',
      url: 'https://api.dormerpramet.com/medias/Technick-plak-t-V-ROBA-Z-VIT-.pdf?context=bWFzdGVyfHJvb3R8NDU4MTM4fGFwcGxpY2F0aW9uL3BkZnxhR1poTDJnM1lTODRPVFE0TWpNMk56YzVOVFV3TDFSbFkyaHVhV05ydzcwZ2NHeGhhOE9oZEY5V3c1MVNUMEpCSUZyRGdWWkpWTVd1TG5Ca1pnfDk0NTgyYjgyODYxZGUxYmU0Mjk5YzU1NmNkYzNjZjdmNTI3YzhjODZlOGYyODNmZDAzNWY5OWRlZGI1YzQ3OGY',
      page: '第 1 頁「DRUHY ZÁVITŮ」BA／Whitworth 基本牙型；第 2 頁「BA (British Association) (BS)」表',
      scope: 'BA 的公稱外徑與牙距採表列值。47.5° BA 的 h = 0.6P；55° Whitworth 的 h 約為 0.64033P。節徑及小徑另作基本牙型推算，不將海報 D1min 欄當成指定等級限界。'
    },
    {
      id: 'extra-thurmer-bsw-bsf',
      title: 'Thürmer Tools｜Special thread sizes – FAQ',
      url: 'https://www.thurmer.com/special-sizes-faq/',
      page: '「Tap drill size reference tables」中的「BSW 55°」與「BSF 55°」表，Thread／TPI 欄',
      scope: '只採規格與每英吋牙數；BSW／BSF 的基本外徑由公稱英吋乘以 25.4，避開表列毫米值的四捨五入。未使用底孔建議值作小徑或公差限界。'
    },
    {
      id: 'extra-thurmer-g-chart',
      title: 'Thürmer Tools｜Rørgevind ISO 228/1: G',
      url: 'https://www.thurmer.dk/upload_dir/pics/roergeind.png',
      page: '官方圖片「Rørgevind ISO 228/1: G」，G／Gev. pr. tomme／Udv. diam. mm 欄',
      scope: 'G 的基本外徑與 TPI 直接採管牙表，含圖中括號規格。G 公稱尺寸不等於公稱英吋乘以 25.4；未使用右欄底孔建議值作尺寸限界。'
    }
  ];

  // ── 02｜牙系：牙型角及查找說明，不混用其他牙系的公差等級。 ──
  const families = [
    { id: 'ba', label: 'BA', description: '47.5° 英國協會螺紋；BA 0–16 基本尺寸。', angleDeg: 47.5 },
    { id: 'bsw', label: 'BSW', description: '55° Whitworth 粗牙；公稱英吋與 TPI。', angleDeg: 55 },
    { id: 'bsf', label: 'BSF', description: '55° British Standard Fine 細牙；公稱英吋與 TPI。', angleDeg: 55 },
    { id: 'g', label: 'G / BSPP', description: '55° 平行管螺紋；外徑採 ISO 228/1 G 管牙表。', angleDeg: 55 }
  ];

  // ── 03｜原廠表列輸入：BA 號數／公稱外徑 mm／牙距 mm。 ──
  // 已逐列核對海報 BA 裁圖；tpi 保留 null，牙距以原廠公制列值為準。
  const baRows = [
    [0, 6.000, 1.00],
    [1, 5.300, 0.90],
    [2, 4.700, 0.81],
    [3, 4.100, 0.73],
    [4, 3.600, 0.66],
    [5, 3.200, 0.59],
    [6, 2.800, 0.53],
    [7, 2.500, 0.48],
    [8, 2.200, 0.43],
    [9, 1.900, 0.39],
    [10, 1.700, 0.35],
    [11, 1.500, 0.31],
    [12, 1.300, 0.28],
    [13, 1.200, 0.25],
    [14, 1.000, 0.23],
    [15, 0.900, 0.21],
    [16, 0.790, 0.19]
  ];

  // ── 04｜BSW／BSF：原廠表列公稱英吋／TPI，未抄錄底孔尺寸。 ──
  const bswRows = [
    ['1/16', 60],
    ['3/32', 48],
    ['1/8', 40],
    ['5/32', 32],
    ['3/16', 24],
    ['7/32', 24],
    ['1/4', 20],
    ['5/16', 18],
    ['3/8', 16],
    ['7/16', 14],
    ['1/2', 12],
    ['9/16', 12],
    ['5/8', 11],
    ['3/4', 10],
    ['7/8', 9],
    ['1', 8],
    ['1 1/8', 7],
    ['1 1/4', 7],
    ['1 3/8', 6],
    ['1 1/2', 6],
    ['1 3/4', 5],
    ['2', 4.5]
  ];

  const bsfRows = [
    ['3/16', 32],
    ['7/32', 28],
    ['1/4', 26],
    ['5/16', 22],
    ['3/8', 20],
    ['7/16', 18],
    ['1/2', 16],
    ['9/16', 16],
    ['5/8', 14]
  ];

  // ── 05｜G：公稱尺寸／表列基本外徑 mm／TPI。 ──
  // 尺寸為管牙公稱標示；第二欄必須保留原廠表值，不能從第一欄換算。
  const gRows = [
    ['1/8', 9.728, 28],
    ['1/4', 13.157, 19],
    ['3/8', 16.662, 19],
    ['1/2', 20.955, 14],
    ['5/8', 22.911, 14],
    ['3/4', 26.441, 14],
    ['7/8', 30.201, 14],
    ['1', 33.249, 11],
    ['1 1/8', 37.897, 11],
    ['1 1/4', 41.910, 11],
    ['1 3/8', 44.323, 11],
    ['1 1/2', 47.803, 11],
    ['1 3/4', 53.746, 11],
    ['2', 59.614, 11],
    ['2 1/4', 65.710, 11],
    ['2 1/2', 75.184, 11],
    ['2 3/4', 81.534, 11],
    ['3', 87.884, 11]
  ];

  // ── 06｜基本牙型推算：與任何內、外螺紋公差限界明確分開。 ──
  // BA：節徑 = D - 0.6P；基本內、外小徑 = D - 1.2P。
  // 55° Whitworth：節徑 = D - 0.640327P；基本內、外小徑 = D - 1.280654P。
  // 上述係數為基本牙型幾何的近似值；六位小數僅供數值運算，不代表公差精度。
  const roundMm = value => Number(value.toFixed(6));
  const sizeKey = label => label.replace(/[\s/]+/g, '-');

  function nominalInchToMm(label) {
    const parts = label.split(' ');
    const fraction = parts[parts.length - 1].split('/').map(Number);
    const whole = parts.length === 2 ? Number(parts[0]) : 0;
    const inches = whole + (fraction.length === 2 ? fraction[0] / fraction[1] : fraction[0]);
    return roundMm(inches * 25.4);
  }

  function basicProfile(diameter, pitch, family) {
    const pitchDepth = family === 'ba' ? 0.6 : 0.640327;
    const minorDepth = family === 'ba' ? 1.2 : 1.280654;
    return {
      major: roundMm(diameter),
      pitch: roundMm(diameter - pitchDepth * pitch),
      minorInternal: roundMm(diameter - minorDepth * pitch),
      minorExternal: roundMm(diameter - minorDepth * pitch)
    };
  }

  const baScope = '基本牙型：D／P 為 Dormer 海報列值；節徑及內外小徑由 47.5° BA 基本牙型推算，不含指定等級限界，亦非海報 D1min 欄的轉錄。';
  const whitworthScope = '基本牙型：D 由公稱英吋換算、P = 25.4/TPI；節徑及內外小徑由 55° Whitworth 基本牙型推算，不含指定等級限界或底孔建議值。';
  const gScope = '基本牙型：D 與 TPI 採 Thürmer G 管牙表，P = 25.4/TPI；節徑及內外小徑由 55° 基本牙型推算，不含指定等級限界；公稱管徑不是外徑。';

  const baRecords = baRows.map(([number, diameterMm, pitchMm]) => ({
    id: `ba-${number}`,
    family: 'ba',
    sizeLabel: `BA ${number}`,
    designation: `BA ${number}`,
    diameterMm,
    pitchMm,
    tpi: null,
    basic: basicProfile(diameterMm, pitchMm, 'ba'),
    internal: null,
    external: null,
    sourceIds: ['extra-dormer-poster'],
    scope: baScope
  }));

  function whitworthRecords(family, rows) {
    return rows.map(([size, tpi]) => {
      const diameterMm = nominalInchToMm(size);
      const pitchMm = 25.4 / tpi;
      return {
        id: `${family}-${sizeKey(size)}`,
        family,
        sizeLabel: `${size}″`,
        designation: `${size}-${tpi} ${family.toUpperCase()}`,
        diameterMm,
        pitchMm: roundMm(pitchMm),
        tpi,
        basic: basicProfile(diameterMm, pitchMm, family),
        internal: null,
        external: null,
        sourceIds: ['extra-thurmer-bsw-bsf', 'extra-dormer-poster'],
        scope: whitworthScope
      };
    });
  }

  const gRecords = gRows.map(([size, diameterMm, tpi]) => {
    const pitchMm = 25.4 / tpi;
    return {
      id: `g-${sizeKey(size)}`,
      family: 'g',
      sizeLabel: `G ${size}`,
      designation: `G ${size}`,
      diameterMm,
      pitchMm: roundMm(pitchMm),
      tpi,
      basic: basicProfile(diameterMm, pitchMm, 'g'),
      internal: null,
      external: null,
      sourceIds: ['extra-thurmer-g-chart', 'extra-dormer-poster'],
      scope: gScope
    };
  });

  // ── 07｜獨立輸出：瀏覽器與 Node.js 使用同一份補充資料。 ──
  const data = {
    families,
    sources,
    records: [
      ...baRecords,
      ...whitworthRecords('bsw', bswRows),
      ...whitworthRecords('bsf', bsfRows),
      ...gRecords
    ]
  };

  if (typeof globalThis !== 'undefined') globalThis.THREAD_EXTRA_DATA = data;
  if (typeof window !== 'undefined') window.THREAD_EXTRA_DATA = data;
  if (typeof module !== 'undefined' && module.exports) module.exports = data;
}());
