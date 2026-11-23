/*
 * 美制錐管牙基本資料｜NPT 與 NPTF 分開查證、分開建表。
 * 依 NIST 官方保存的 NBS H28（1957）Part II 歷史基本尺寸表整理。
 * 已渲染並目視核對工件基本尺寸表的表頭，未摘錄後段的量規製造尺寸表。
 * E₁ 為指定平面的基本節徑；管材外徑 D 另存，不當成該平面的螺紋大徑。
 * NPT 的最大基本牙高模型另存 profileReference，不回填原表基本徑或工件限界。
 */
(function publishThreadNptData() {
  'use strict';

  // ── 01｜來源與版本：NPT、NPTF 各有獨立的工件基本尺寸表。 ──
  const handbookUrl = 'https://nvlpubs.nist.gov/nistpubs/Legacy/hb/nbshandbook28supp1957pt2.pdf';
  const sources = [
    {
      id: 'npt-nbs-h28-1957-basic',
      title: 'NBS H28（1957）Part II｜NPT 工件基本尺寸',
      url: handbookUrl,
      page: '印刷頁 5–6／PDF 第 15–16 頁，表 VII.2 的 E1／L1；印刷頁 2–4／PDF 第 12–14 頁，§2、圖 VII.1 與表 VII.1 的牙型及截短範圍',
      scope: 'E1、L1 與管材外徑採工件基本表。另以 h=0.8P 最大基本牙高、對稱牙型模型計算參考大／小徑，與原表及工件限界分欄。保留歷史版本；參考輪廓不是實際工件的唯一尺寸或製造驗收上下限。'
    },
    {
      id: 'nptf-nbs-h28-1957-basic',
      title: 'NBS H28（1957）Part II｜NPTF 乾密封工件基本尺寸',
      url: handbookUrl,
      page: '印刷頁 21–22／PDF 第 31–32 頁；§3 與 Table VIII.4「Basic dimensions of Dryseal American Standard taper pipe thread, NPTF」',
      scope: '獨立採 NPTF 工件基本表，不由 NPT 推定；該表收錄 1/16–3。未摘錄 Tables VIII.15–21 的量規尺寸，也未推算乾密封牙頂、牙底截形或公差界限。'
    },
    {
      id: 'baer-npt-reference-check',
      title: 'BAER Tools｜NPT thread profile・指定數值交叉核對',
      url: 'https://www.gewindebohrer.de/en/service/technische-daten/thread-type-npt',
      page: '「Dimensions for NPT - thread profile」的 1/2、1 列及 E1／L1 定義',
      scope: '交叉核對 NPT 1/2 的 E1=19.772 mm（原表顯示精度）、L1=8.128 mm，以及 NPT 1 的 11.5 TPI。只佐證這些指定數值，不將 1957 歷史表全部宣稱為現行標準。'
    },
    {
      id: 'vermont-npt-reference-plane',
      title: 'Vermont Gage｜NPT Taper Pipe Thread Inspection',
      url: 'https://vermontgage.com/support/detail/npt-taper-pipe-thread-inspection',
      page: '「Thread Form」「Lengths」「Diameters」與 Fig. 1 的 L1／E1 定義；文中 NPT 與 NPTF 量測系統差異說明',
      scope: '核對 60° 牙型、直徑錐度 1:16、L1 手緊旋合長度與 E1 平面。此文不作本檔逐尺寸數值來源；亦不把 NPT 的截形與公差套到 NPTF。'
    }
  ];

  // ── 02｜牙系與內外牙能力：兩者都具有內錐牙及外錐牙。 ──
  const families = [
    {
      id: 'npt',
      label: 'NPT 美制錐管牙',
      description: '60° 一般用途美制錐管牙；顯示 L1 基準平面的基本節徑 E1。',
      angleDeg: 60,
      geometry: 'tapered',
      supportedMembers: ['internal', 'external']
    },
    {
      id: 'nptf',
      label: 'NPTF 乾密封錐管牙',
      description: '60° Dryseal 錐管牙；牙頂及牙底截形與 NPT 分開，不能沿用其公差。',
      angleDeg: 60,
      geometry: 'tapered',
      supportedMembers: ['internal', 'external']
    }
  ];

  // ── 03｜NPT 原始摘錄：公稱管尺寸／TPI／E1 inch／L1 inch／管外徑 D inch。 ──
  // 只採表 VII.2 的工件基本值；不採其後量規表或小徑底孔參考欄。
  // 本次收錄至 12；原表再往上的 14 OD 等列另有標示，未混入本次範圍。
  const nptRows = [
    ['1/16', 27, 0.28118, 0.1600, 0.3125],
    ['1/8', 27, 0.37360, 0.1615, 0.4050],
    ['1/4', 18, 0.49163, 0.2278, 0.5400],
    ['3/8', 18, 0.62701, 0.2400, 0.6750],
    ['1/2', 14, 0.77843, 0.3200, 0.8400],
    ['3/4', 14, 0.98887, 0.3390, 1.0500],
    ['1', 11.5, 1.23863, 0.4000, 1.3150],
    ['1 1/4', 11.5, 1.58338, 0.4200, 1.6600],
    ['1 1/2', 11.5, 1.82234, 0.4200, 1.9000],
    ['2', 11.5, 2.29627, 0.4360, 2.3750],
    ['2 1/2', 8, 2.76216, 0.6820, 2.8750],
    ['3', 8, 3.38850, 0.7660, 3.5000],
    ['3 1/2', 8, 3.88881, 0.8210, 4.0000],
    ['4', 8, 4.38712, 0.8440, 4.5000],
    ['5', 8, 5.44929, 0.9370, 5.5630],
    ['6', 8, 6.50597, 0.9580, 6.6250],
    ['8', 8, 8.50003, 1.0630, 8.6250],
    ['10', 8, 10.62094, 1.2100, 10.7500],
    ['12', 8, 12.61781, 1.3600, 12.7500]
  ];

  // ── 04｜NPTF 獨立摘錄：欄位與上表相同，來源是表 VIII.4。 ──
  // 即使部分基本數值相同，也不以 NPT 表複製生成 NPTF。
  // 來源只列到 3，因此未將 NPT 的 3 1/2–12 外推為 NPTF。
  const nptfRows = [
    ['1/16', 27, 0.28118, 0.1600, 0.3125],
    ['1/8', 27, 0.37360, 0.1615, 0.4050],
    ['1/4', 18, 0.49163, 0.2278, 0.5400],
    ['3/8', 18, 0.62701, 0.2400, 0.6750],
    ['1/2', 14, 0.77843, 0.3200, 0.8400],
    ['3/4', 14, 0.98887, 0.3390, 1.0500],
    ['1', 11.5, 1.23863, 0.4000, 1.3150],
    ['1 1/4', 11.5, 1.58338, 0.4200, 1.6600],
    ['1 1/2', 11.5, 1.82234, 0.4200, 1.9000],
    ['2', 11.5, 2.29627, 0.4360, 2.3750],
    ['2 1/2', 8, 2.76216, 0.6820, 2.8750],
    ['3', 8, 3.38850, 0.7660, 3.5000]
  ];

  // ── 05｜換算與 schema：僅把原表 inch 換成 mm，不反推任何限界。 ──
  const mm = inches => Number((inches * 25.4).toFixed(6));
  const sizeKey = size => size.replace(/[\s/]+/g, '-');
  const referencePlane = 'E₁：外牙自小端（管端）沿軸線距離 L1 的手緊旋合平面；在基本旋合位置亦為內牙大端參考平面。';

  // 最大基本牙高是選定的對稱牙型模型，不等於工件最大／最小大徑。
  // 從原始 inch 值計算後再轉 mm；不使用已四捨五入的 pitchMm 反算。
  function maximumBasicProfile(e1Inch,tpi) {
    const heightInch=0.8/tpi;
    return {
      kind:'maximum-basic-height',
      sourceId:'npt-nbs-h28-1957-basic',
      majorMm:mm(e1Inch+heightInch),
      minorMm:mm(e1Inch-heightInch),
      heightMm:mm(heightInch),
      formula:'h = 0.8P；大徑參考 = E₁ + h；小徑參考 = E₁ − h',
      scope:'E₁ 基準面的對稱最大基本牙高模型。最大指牙高，不是工件大徑上限；實際牙頂、牙底可有不同截短，並受量規旋合位置允差影響。此值不是製造或檢驗限界。'
    };
  }

  function makeRecords(family, rows, sourceId) {
    const code = family.toUpperCase();
    return rows.map(([size, tpi, e1Inch, l1Inch, pipeOutsideInch]) => ({
      id: `${family}-${sizeKey(size)}`,
      family,
      sizeLabel: `${size}″`,
      designation: `${size}-${tpi} ${code}`,
      aliases: [`${code} ${size}`, `${size} ${code}`],
      geometry: 'tapered',
      supportedMembers: ['internal', 'external'],
      memberDesignations: {
        internal: `${size}-${tpi} ${code} 內錐牙`,
        external: `${size}-${tpi} ${code} 外錐牙`
      },
      diameterMm: null,
      pipeOutsideDiameterMm: mm(pipeOutsideInch),
      pitchMm: Number((25.4 / tpi).toFixed(6)),
      tpi,
      basic: {
        // NBS 印刷頁 2 的 h=0.8P 是最大基本牙高，不能以 E1±h 填通用大／小徑。
        major: null,
        pitch: mm(e1Inch),
        minorInternal: null,
        minorExternal: null
      },
      // NPTF 的截形另有規定，不能套用此 NPT 參考模型。
      profileReference:family==='npt'?maximumBasicProfile(e1Inch,tpi):null,
      symbols: { pitch: 'E₁' },
      referenceLabel: '基準平面基本尺寸',
      referenceEdition: 'NBS H28 · 1957 基本表',
      taper: {
        diameterRatio: 16,
        referencePlane,
        referenceLengthMm: mm(l1Inch),
        referenceLengthLabel: 'L1 手緊旋合長度',
        note: family === 'nptf'
          ? '乾密封 NPTF 的牙頂、牙底截形另有規定；不能從 NPT 或管外徑 D 推定基準面大、小徑。'
          : '1:16 為直徑變化與軸向長度之比；E₁ 只適用此基準平面，不能當整段錐牙的固定直徑。'
      },
      internal: null,
      external: null,
      sourceIds: [sourceId, 'vermont-npt-reference-plane', ...(family==='npt'&&['1/2','1'].includes(size)?['baer-npt-reference-check']:[])],
      scope: family === 'nptf'
        ? '依 NBS H28（1957）表 VIII.4 摘錄的歷史 NPTF 工件基本值。只收 E₁／L1 與牙距；管材外徑 D 另列。未收基準面大、小徑及指定等級製造限界；不以 NPT 截形或量規尺寸代替。'
        : '依 NBS H28（1957）表 VII.2 摘錄 E₁／L1 與牙距，管材外徑 D 另列。大、小徑另提供 h=0.8P 最大基本牙高模型的計算參考；原表大、小徑欄及製造限界未收錄，不是量規製造尺寸。'
    }));
  }

  // ── 06｜輸出：不修改其他資料集，供主程式按 id 合併。 ──
  const data = {
    families,
    sources,
    records: [
      ...makeRecords('npt', nptRows, 'npt-nbs-h28-1957-basic'),
      ...makeRecords('nptf', nptfRows, 'nptf-nbs-h28-1957-basic')
    ]
  };

  if (typeof globalThis !== 'undefined') globalThis.THREAD_NPT_DATA = data;
  if (typeof window !== 'undefined') window.THREAD_NPT_DATA = data;
  if (typeof module !== 'undefined' && module.exports) module.exports = data;
}());
