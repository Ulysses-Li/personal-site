/**
 * 螺紋工件尺寸資料｜單位一律 mm，TPI 僅表示每英吋牙數。
 *
 * 本檔可由 classic script 直接載入，也提供 Node module.exports。
 * limits 是工件螺紋的限界，不是絲攻製造公差、預鑽孔徑或量規製造尺寸。
 * null 表示這批已查證來源未收錄該界限，不能以基本牙形或 D−P 補值。
 * basic 另存基本尺寸，不代表 min/max；page 使用 PDF 頁碼，pageLabel 補印刷頁。
 * 日後擴充請保留 id、family，並逐欄核對內外牙、公差等級與來源表頭。
 */
(() => {
  'use strict';

  // ── 01｜來源版本：只摘錄工件尺寸表，不把同書的量規尺寸混入。 ──
  const sources = [
    {
      id: 'osg-metric-workpiece-limits',
      title: 'OSG Gauge Stock List｜JIS 公制工件螺紋基本尺寸與限界',
      url: 'https://www.osg.co.jp/media_dl/flier/file/p_9.pdf',
      scope: '印刷頁 101／PDF 102；工件 6H 的有效徑、小徑及 6g 的大徑、有效徑。表據 JIS B0205-4、B0209-2/3:2001；不收量規尺寸。'
    },
    {
      id: 'osg-cfd-die-products',
      title: 'OSG USA CFD Die Products｜UN／UNR 外牙工件尺寸',
      url: 'https://res.cloudinary.com/osg-usa-inc/image/upload/v1717165102/Literature/01%20-%20Catalogs/OSG_-_Product_Catalog_-_CFD_Die_Products_-_Update.pdf',
      scope: '印刷頁 23／PDF 25；只收 CLASS 2A 工件大徑與有效徑上下限，排除推薦毛胚及 3A 欄。英制原值換算 mm 不增加原表精度。'
    },
    {
      id: 'osg-pd-limits-2024',
      title: 'OSG USA Tapping Guide Vol.3 2024｜2B 工件螺紋限界',
      url: 'https://res.cloudinary.com/osg-usa-inc/image/upload/v1717093846/Literature/03%20-%20Charts%20and%20Guides/OSG_-_Chart_-_Tap_Drill_Size_and_Pitch_Diameter_Limit_-_Vol_3_-_2024_-_IA.pdf',
      scope: 'PDF 1 的 2B 小徑 MIN/MAX；PDF 2 的統一牙基本有效徑／共同 MIN 與 CLASS 2B MAX。排除絲攻 H 級及百分比預鑽推薦；原值為 inch。'
    }
  ];

  // ── 02｜種類：同一直徑可有多個牙距，尺寸名稱與完整標註分欄保存。 ──
  const families = [
    { id: 'metric-coarse', label: 'M 公制粗牙', description: '常用公制粗牙；內牙 6H、外牙 6g 的已收錄工件限界。', angleDeg: 60 },
    { id: 'metric-fine', label: 'MF 公制細牙', description: '常用公制細牙；規格仍以 M × P 標示，相同公稱直徑須選正確牙距。', angleDeg: 60 },
    { id: 'unc', label: 'UNC 統一粗牙', description: '英制尺寸與 TPI；表內數值已換算 mm。', angleDeg: 60 },
    { id: 'unf', label: 'UNF 統一細牙', description: '英制尺寸與 TPI；表內數值已換算 mm。', angleDeg: 60 }
  ];

  // ── 03｜公制常用摘錄：依原表的 MAX、MIN 次序抄入，再明確轉成 min/max。 ──
  // 欄位：[種類, 公稱直徑, 牙距, 內有效MAX, MIN, 內小徑MAX, MIN,
  //        外大徑MAX, MIN, 外有效MAX, MIN]；皆是原廠表值，不以公式估算。
  const metricRows = [
    ['metric-coarse', 2, 0.4, 1.830, 1.740, 1.679, 1.567, 1.981, 1.886, 1.721, 1.654],
    ['metric-coarse', 3, 0.5, 2.775, 2.675, 2.599, 2.459, 2.980, 2.874, 2.655, 2.580],
    ['metric-coarse', 4, 0.7, 3.663, 3.545, 3.422, 3.242, 3.978, 3.838, 3.523, 3.433],
    ['metric-coarse', 5, 0.8, 4.605, 4.480, 4.334, 4.134, 4.976, 4.826, 4.456, 4.361],
    ['metric-coarse', 6, 1, 5.500, 5.350, 5.153, 4.917, 5.974, 5.794, 5.324, 5.212],
    ['metric-coarse', 8, 1.25, 7.348, 7.188, 6.912, 6.647, 7.972, 7.760, 7.160, 7.042],
    ['metric-coarse', 10, 1.5, 9.206, 9.026, 8.676, 8.376, 9.968, 9.732, 8.994, 8.862],
    ['metric-fine', 10, 1.25, 9.348, 9.188, 8.912, 8.647, 9.972, 9.760, 9.160, 9.042],
    ['metric-fine', 10, 1, 9.500, 9.350, 9.153, 8.917, 9.974, 9.794, 9.324, 9.212],
    ['metric-coarse', 12, 1.75, 11.063, 10.863, 10.441, 10.106, 11.966, 11.701, 10.829, 10.679],
    ['metric-fine', 12, 1.5, 11.216, 11.026, 10.676, 10.376, 11.968, 11.732, 10.994, 10.854],
    ['metric-fine', 12, 1.25, 11.368, 11.188, 10.912, 10.647, 11.972, 11.760, 11.160, 11.028],
    ['metric-coarse', 16, 2, 14.913, 14.701, 14.210, 13.835, 15.962, 15.682, 14.663, 14.503],
    ['metric-fine', 16, 1.5, 15.216, 15.026, 14.676, 14.376, 15.968, 15.732, 14.994, 14.854],
    ['metric-coarse', 20, 2.5, 18.600, 18.376, 17.744, 17.294, 19.958, 19.623, 18.334, 18.164],
    ['metric-fine', 20, 1.5, 19.216, 19.026, 18.676, 18.376, 19.968, 19.732, 18.994, 18.854]
  ];
  const emptyBounds = () => ({ min: null, max: null });
  const idNumber = value => String(value).replace('.', '-');
  const metricRecords = metricRows.map(([family, diameterMm, pitchMm, iPitchMax, iPitchMin, iMinorMax, iMinorMin, eMajorMax, eMajorMin, ePitchMax, ePitchMin]) => ({
    id: `${family}-m${idNumber(diameterMm)}-p${idNumber(pitchMm)}`,
    family,
    sizeLabel: `M${diameterMm}`,
    designation: `M${diameterMm} × ${pitchMm}`,
    diameterMm,
    pitchMm,
    tpi: null,
    // 本表 6H 的這兩個下限與同列基本尺寸相同；基本值仍獨立呈現，不當成限界。
    basic: { major: diameterMm, pitch: iPitchMin, minorInternal: iMinorMin, minorExternal: null },
    scope: '工件限界摘錄。內牙大徑與外牙小徑未列，保留空值；不等於攻牙預鑽尺寸。',
    sourceIds: ['osg-metric-workpiece-limits'],
    internal: {
      className: '6H', major: emptyBounds(), pitch: { min: iPitchMin, max: iPitchMax }, minor: { min: iMinorMin, max: iMinorMax },
      sourceId: 'osg-metric-workpiece-limits', page: 102, pageLabel: '印刷 101／PDF 102',
      scope: '6H 工件有效徑與小徑；大徑限界未收錄。'
    },
    external: {
      className: '6g', major: { min: eMajorMin, max: eMajorMax }, pitch: { min: ePitchMin, max: ePitchMax }, minor: emptyBounds(),
      sourceId: 'osg-metric-workpiece-limits', page: 102, pageLabel: '印刷 101／PDF 102',
      scope: '6g 工件大徑與有效徑；小徑限界未收錄。'
    }
  }));

  // ── 04｜統一牙：只把原表工件限界換算 mm，旁列的絲攻／毛胚資料不採用。 ──
  // 欄位：[種類, 英制公稱尺寸, TPI, 內有效MIN, MAX, 內小徑MIN, MAX,
  //        外大徑MIN, MAX, 外有效MIN, MAX]；這一段原始限界單位是 inch。
  const unifiedRows = [
    ['unc', '1/4', 20, .2175, .2224, .1960, .2070, .2408, .2489, .2127, .2164],
    ['unf', '1/4', 28, .2268, .2311, .2110, .2200, .2425, .2490, .2225, .2258],
    ['unc', '5/16', 18, .2764, .2817, .2520, .2650, .3026, .3113, .2712, .2752],
    ['unf', '5/16', 24, .2854, .2902, .2670, .2770, .3042, .3114, .2806, .2843],
    ['unc', '3/8', 16, .3344, .3401, .3070, .3210, .3643, .3737, .3287, .3331],
    ['unf', '3/8', 24, .3479, .3528, .3300, .3400, .3667, .3739, .3430, .3468],
    ['unc', '7/16', 14, .3911, .3972, .3600, .3760, .4258, .4361, .3850, .3897],
    ['unf', '7/16', 20, .4050, .4104, .3830, .3950, .4281, .4362, .3995, .4037],
    ['unc', '1/2', 13, .4500, .4565, .4170, .4340, .4876, .4985, .4435, .4485],
    ['unf', '1/2', 20, .4675, .4731, .4460, .4570, .4906, .4987, .4619, .4662],
    ['unc', '9/16', 12, .5084, .5152, .4720, .4900, .5495, .5609, .5016, .5068],
    ['unf', '9/16', 18, .5264, .5323, .5020, .5150, .5524, .5611, .5205, .5250],
    ['unc', '5/8', 11, .5660, .5732, .5270, .5460, .6113, .6234, .5589, .5644],
    ['unf', '5/8', 18, .5889, .5949, .5650, .5780, .6149, .6236, .5828, .5875],
    ['unc', '3/4', 10, .6850, .6927, .6420, .6630, .7353, .7482, .6773, .6832],
    ['unf', '3/4', 16, .7094, .7159, .6820, .6960, .7391, .7485, .7029, .7079],
    ['unc', '7/8', 9, .8028, .8110, .7550, .7780, .8592, .8731, .7946, .8009],
    ['unf', '7/8', 14, .8286, .8356, .7980, .8140, .8631, .8734, .8216, .8270],
    ['unc', '1', 8, .9188, .9276, .8650, .8900, .9830, .9980, .9100, .9168],
    ['unf', '1', 12, .9459, .9535, .9100, .9280, .9868, .9982, .9382, .9441]
  ];
  // 原表英制限界最多四位小數；只消除浮點換算尾差，不增加來源有效精度。
  const inchToMm = value => Number((value * 25.4).toFixed(6));
  const unifiedRecords = unifiedRows.map(([family, inchSize, tpi, iPitchMin, iPitchMax, iMinorMin, iMinorMax, eMajorMin, eMajorMax, ePitchMin, ePitchMax]) => {
    const fraction = inchSize.split('/').map(Number);
    const nominalInch = fraction.length === 1 ? fraction[0] : fraction[0] / fraction[1];
    const diameterMm = inchToMm(nominalInch);
    return {
      id: `${family}-${inchSize.replace('/', '-')}-${tpi}`,
      family,
      sizeLabel: `${inchSize}″`,
      designation: `${inchSize}-${tpi} ${family.toUpperCase()}`,
      diameterMm,
      pitchMm: 25.4 / tpi,
      tpi,
      basic: { major: diameterMm, pitch: inchToMm(iPitchMin), minorInternal: null, minorExternal: null },
      scope: 'OSG 工件限界；內牙大徑、外牙小徑未列。原表英制限界換算 mm，不等於推薦預鑽或絲攻製造尺寸。',
      sourceIds: ['osg-pd-limits-2024', 'osg-cfd-die-products'],
      internal: {
        className: '2B', major: emptyBounds(), pitch: { min: inchToMm(iPitchMin), max: inchToMm(iPitchMax) }, minor: { min: inchToMm(iMinorMin), max: inchToMm(iMinorMax) },
        sourceId: 'osg-pd-limits-2024', page: 2, pages: [1, 2], pageLabel: 'PDF 2（有效徑）／PDF 1（小徑）',
        dimensionPages: { major: null, pitch: 2, minor: 1 },
        scope: '2B 工件有效徑與小徑；來源是同圖表的兩頁，大徑限界未收錄。'
      },
      external: {
        className: '2A', major: { min: inchToMm(eMajorMin), max: inchToMm(eMajorMax) }, pitch: { min: inchToMm(ePitchMin), max: inchToMm(ePitchMax) }, minor: emptyBounds(),
        sourceId: 'osg-cfd-die-products', page: 25, pageLabel: '印刷 23／PDF 25',
        scope: '2A 工件大徑與有效徑；小徑限界未收錄，沒有採用推薦毛胚值。'
      },
      // 原始英制值供人工與程式複核；畫面計算仍只使用上述 mm 欄位。
      sourceInches: {
        internal: { major: emptyBounds(), pitch: { min: iPitchMin, max: iPitchMax }, minor: { min: iMinorMin, max: iMinorMax } },
        external: { major: { min: eMajorMin, max: eMajorMax }, pitch: { min: ePitchMin, max: ePitchMax }, minor: emptyBounds() }
      }
    };
  });

  // ── 05｜公開資料：沒有 fetch、CDN 或開檔時的外部依賴。 ──
  const data = { units: 'mm', sources, families, records: [...metricRecords, ...unifiedRecords] };
  globalThis.THREAD_DATA = data;
  if (typeof window !== 'undefined') window.THREAD_DATA = data;
  if (typeof module === 'object' && module.exports) module.exports = data;
})();
