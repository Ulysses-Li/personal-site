/*
 * 加工中心常用 G／M 指令索引｜繁體中文短句整理
 * 範圍以 FANUC 加工中心系統為主，不混入車床專用循環。
 * <> 是需自行填寫的語法佔位；以下片段不是可直接加工的完整程式。
 * M03／M06／M08 等列為常見機床配號，實際機能以機床製造商手冊為準。
 */

// ── 01｜來源：原廠內容、手冊版本與可定位章節；鏡像不代表 FANUC 官方網站。 ──
window.FANUC_COMMAND_SOURCES = [
  {
    id: 'cmd-21imb-motion',
    title: 'GE FANUC 21i／210i-MB 操作手冊 B／GFZ-63614EN/01',
    url: 'https://www.warp9td.com/images/FAQ/GCode/FanucOperatorsManual63614en.pdf#page=58',
    kind: '原廠手冊',
    locator: '程式篇 §4.1 G00、§4.3 G01、§4.4 G02/G03；印刷頁 37、41–47，PDF 第 58、62–68 頁。',
    scope: '2001 年 GE FANUC 加工中心手冊的公開鏡像；僅作基本插補查找，不視為所有新系列規格。'
  },
  {
    id: 'cmd-0if-code-list',
    title: 'FANUC 0i-F 操作與維修手冊 B-64607EN/01',
    url: 'https://www.drivesul.com.br/template/imagens/manuais/manuais-fanuc/fanuc-series-0i-model-f/FANUC%20Series%200i%20MODEL%20F%20-%20OPERATION%20AND%20MAINTENANCE%20HANDBOOK.pdf',
    kind: '原廠手冊',
    locator: '§3.1「G CODE LIST IN THE MACHINING CENTER SYSTEM」，表 3.1，印刷頁 71–74。',
    scope: 'FANUC 手冊內容的第三方 PDF 鏡像；本索引只取加工中心表，未套用其車床 G-code 表。'
  },
  {
    id: 'cmd-0id-coordinate',
    title: 'FANUC 0i-D／0i Mate-D 共用操作手冊 B-64304EN/02',
    url: 'https://manuals.plus/m/efd5fe298cdcb175869b1307e9a25e758e74f3cf431a4065c4abdfff9dce7e94.pdf',
    kind: '原廠手冊',
    locator: '程式篇 §6.1 回參考點（頁 68 起）、§7.1 G53（頁 73–74）、§7.2.2 工件座標（頁 77）、§8.1 G90/G91（頁 90–91）。',
    scope: 'FANUC 原廠手冊之公開鏡像；共同手冊中的 M／T 系統有差異，本索引採 M 系統加工中心用法。'
  },
  {
    id: 'cmd-0id-feed-dwell',
    title: 'FANUC 0i-D 共用操作手冊：進給與暫停',
    url: 'https://manuals.plus/m/efd5fe298cdcb175869b1307e9a25e758e74f3cf431a4065c4abdfff9dce7e94.pdf',
    kind: '原廠手冊',
    locator: 'B-64304EN/02 程式篇 §5.3 CUTTING FEED，印刷頁 54–57；§5.6 DWELL，頁 67。',
    scope: 'G94/G95 取 M 系統定義；G04 的停留單位仍受增量系統與參數影響。'
  },
  {
    id: 'cmd-0id-compensation',
    title: 'FANUC 0i-D 加工中心操作手冊 B-64304EN-2/02',
    url: 'https://web.chungbuk.ac.kr/~kwjeong/lectures/teacher1class_automation/FANUC_0i%28VMC%29_OPERATORS_MANUAL.pdf',
    kind: '原廠手冊',
    locator: '程式篇 §6.1 G43/G44/G49，印刷頁 96–103；§6.5 G40–G42，頁 116–118。',
    scope: '大學網站提供的 FANUC 原廠 PDF 鏡像；補正型式、軸與參數差異須回查實際機台。'
  },
  {
    id: 'cmd-0if-drilling',
    title: 'FANUC 0i-F 加工中心操作手冊 B-64604EN-2/01',
    url: 'https://www.drivesul.com.br/template/imagens/manuais/manuais-fanuc/fanuc-series-0i-model-f/FANUC%20Series%200i%20MODEL%20F%20-%20OPERATOR_S%20MANUAL%20-%20Machining%20Center%20System.pdf',
    kind: '原廠手冊',
    locator: '程式篇 §5.1.4 G81（頁 48）、§5.1.5 G82（頁 49）、§5.1.6 G83（頁 51）、§5.1.8 G84（頁 57）；剛性攻牙另見 §5.2，頁 75 起。',
    scope: 'FANUC 原廠內容的第三方 PDF 鏡像；只列一般鑽孔／攻牙概要，不涵蓋所有選配變體。'
  },
  {
    id: 'cmd-21imb-program',
    title: 'GE FANUC 21i-MB 操作手冊：M 機能與副程式',
    url: 'https://www.warp9td.com/images/FAQ/GCode/FanucOperatorsManual63614en.pdf#page=135',
    kind: '原廠手冊',
    locator: 'B／GFZ-63614EN/01 程式篇 §11.1 M 機能，印刷頁 114；§11.2 同節多 M，頁 115；§12.3 M98/M99，頁 128–131。',
    scope: '2001 年 GE FANUC 原廠手冊的公開鏡像；停止、復歸與周邊裝置的實際狀態仍依機床製造商實作。'
  },
  {
    id: 'cmd-fryer-machine-mcodes',
    title: 'Fryer HB Series FANUC Maintenance Manual Ver 1.0',
    url: 'https://www.fryermachine.com/pdf/support/maintenance/production/HB%20SERIES%20FANUC%20MAINTENANCE%20MANUAL%20Ver%201.0.pdf',
    kind: '原廠手冊',
    locator: '§4.4「M CODE LIST／FANUC MILL M-CODES」，緊接印刷頁 22 的回參考點說明後。',
    scope: '機床製造商 Fryer 官方網站的 FANUC 銑床機能表，僅作常見 M 配號例證；不是 FANUC 全機型通用標準。'
  }
];

// ── 02｜移動、平面與進給：語法均保留佔位，不提供實際加工座標。 ──
window.FANUC_COMMAND_ENTRIES = [
  {
    id: 'cmd-g00', type: 'gcode', category: '移動與平面', code: 'G00',
    title: '快速定位', summary: '以快速移動方式到指定位置。',
    syntax: 'G00 X<位置> Y<位置> Z<位置>;', example: 'G00 Z<核對後的位置>;',
    notes: ['多軸快速路徑未必是直線。'], tags: ['定位', '快移', '模態'], sourceIds: ['cmd-21imb-motion']
  },
  {
    id: 'cmd-g01', type: 'gcode', category: '移動與平面', code: 'G01',
    title: '直線插補', summary: '按指定進給作直線移動。',
    syntax: 'G01 X<位置> Y<位置> Z<位置> F<進給>;', example: 'G01 X<終點> F<進給>;',
    notes: ['F 的單位由進給模式決定。'], tags: ['直線', '進給', '模態'], sourceIds: ['cmd-21imb-motion']
  },
  {
    id: 'cmd-g02', type: 'gcode', category: '移動與平面', code: 'G02',
    title: '順時針圓弧', summary: '在選定平面作順時針插補。',
    syntax: 'G02 <平面內終點> <圓心偏移或R> F<進給>;', example: 'G17 G02 X<終點> Y<終點> I<圓心偏移> J<圓心偏移> F<進給>;',
    notes: ['方向按選定平面判讀。'], tags: ['圓弧', 'CW', 'IJK'], sourceIds: ['cmd-21imb-motion']
  },
  {
    id: 'cmd-g03', type: 'gcode', category: '移動與平面', code: 'G03',
    title: '逆時針圓弧', summary: '在選定平面作逆時針插補。',
    syntax: 'G03 <平面內終點> <圓心偏移或R> F<進給>;', example: 'G17 G03 X<終點> Y<終點> I<圓心偏移> J<圓心偏移> F<進給>;',
    notes: ['不得只憑螢幕視角判定方向。'], tags: ['圓弧', 'CCW', 'IJK'], sourceIds: ['cmd-21imb-motion']
  },
  {
    id: 'cmd-g04', type: 'gcode', category: '移動與平面', code: 'G04',
    title: '暫停／停留', summary: '延後執行下一單節。',
    syntax: 'G04 X<停留值>; 或 G04 P<停留值>;', example: 'G04 P<依機台單位填值>;',
    notes: ['P 單位受增量系統與參數影響，不能一律當秒。'], tags: ['暫停', '停留', 'dwell'], sourceIds: ['cmd-0id-feed-dwell']
  },
  {
    id: 'cmd-g17', type: 'gcode', category: '移動與平面', code: 'G17',
    title: 'XY 平面', summary: '選擇 XY 插補平面。', syntax: 'G17;', example: 'G17;',
    notes: ['平面選擇會影響圓弧與補正。'], tags: ['平面', 'XY'], sourceIds: ['cmd-0if-code-list']
  },
  {
    id: 'cmd-g18', type: 'gcode', category: '移動與平面', code: 'G18',
    title: 'ZX 平面', summary: '選擇 ZX 插補平面。', syntax: 'G18;', example: 'G18;',
    notes: ['這是平面選擇，不是指定軸移動。'], tags: ['平面', 'ZX', 'XZ'], sourceIds: ['cmd-0if-code-list']
  },
  {
    id: 'cmd-g19', type: 'gcode', category: '移動與平面', code: 'G19',
    title: 'YZ 平面', summary: '選擇 YZ 插補平面。', syntax: 'G19;', example: 'G19;',
    notes: ['圓弧所用圓心位址須配合平面。'], tags: ['平面', 'YZ'], sourceIds: ['cmd-0if-code-list']
  },
  {
    id: 'cmd-g94', type: 'gcode', category: '移動與平面', code: 'G94',
    title: '每分鐘進給', summary: '加工中心的 F 採每分鐘單位。',
    syntax: 'G94 F<每分鐘進給>;', example: 'G94 F<核對後的進給>;',
    notes: ['與 G95 區分；此處不是車床循環。'], tags: ['進給', 'mm/min', 'inch/min'], sourceIds: ['cmd-0id-feed-dwell']
  },
  {
    id: 'cmd-g95', type: 'gcode', category: '移動與平面', code: 'G95',
    title: '每轉進給', summary: '加工中心的 F 採每轉單位。',
    syntax: 'G95 F<每轉進給>;', example: 'G95 F<核對後的每轉進給>;',
    notes: ['須確認主軸回授與機台支援條件。'], tags: ['進給', 'mm/rev', 'inch/rev'], sourceIds: ['cmd-0id-feed-dwell']
  },

  // ── 03｜座標、單位與補正：保留加工中心的 G90/G91 定義。 ──
  {
    id: 'cmd-g20', type: 'gcode', category: '座標與補正', code: 'G20',
    title: '英吋輸入', summary: '選擇英吋輸入單位。', syntax: 'G20;', example: 'G20;',
    notes: ['單位切換須連同座標、補正及進給核對。'], tags: ['英制', 'inch', '單位'], sourceIds: ['cmd-0if-code-list']
  },
  {
    id: 'cmd-g21', type: 'gcode', category: '座標與補正', code: 'G21',
    title: '公制輸入', summary: '選擇毫米輸入單位。', syntax: 'G21;', example: 'G21;',
    notes: ['不以切換代碼取代整份程式的單位檢查。'], tags: ['公制', 'mm', '單位'], sourceIds: ['cmd-0if-code-list']
  },
  {
    id: 'cmd-g28', type: 'gcode', category: '座標與補正', code: 'G28',
    title: '回參考點', summary: '經中間點返回參考位置。',
    syntax: 'G28 <指定軸的中間點>;', example: 'G28 Z<中間點>;',
    notes: ['中間點受 G90/G91 影響，不能視為直接退刀。'], tags: ['參考點', '中間點', '回原點'], sourceIds: ['cmd-0id-coordinate']
  },
  {
    id: 'cmd-g40', type: 'gcode', category: '座標與補正', code: 'G40',
    title: '取消刀徑補正', summary: '解除 G41/G42 刀徑補正。',
    syntax: 'G40 <核對後的退出段>;', example: 'G40;',
    notes: ['取消時的退刀路徑須另行規劃。'], tags: ['刀徑', '取消補正'], sourceIds: ['cmd-0id-compensation']
  },
  {
    id: 'cmd-g41', type: 'gcode', category: '座標與補正', code: 'G41',
    title: '左側刀徑補正', summary: '沿前進方向將刀心補於左側。',
    syntax: 'G01 G41 <引入終點> D<補正號> F<進給>;', example: 'G01 G41 X<引入終點> D<補正號> F<進給>;',
    notes: ['D 是補正登錄號；引入段與補正符號須核對。'], tags: ['刀徑', '左補', 'D'], sourceIds: ['cmd-0id-compensation']
  },
  {
    id: 'cmd-g42', type: 'gcode', category: '座標與補正', code: 'G42',
    title: '右側刀徑補正', summary: '沿前進方向將刀心補於右側。',
    syntax: 'G01 G42 <引入終點> D<補正號> F<進給>;', example: 'G01 G42 X<引入終點> D<補正號> F<進給>;',
    notes: ['左右相對於走刀方向，不是圖面固定左右。'], tags: ['刀徑', '右補', 'D'], sourceIds: ['cmd-0id-compensation']
  },
  {
    id: 'cmd-g43', type: 'gcode', category: '座標與補正', code: 'G43',
    title: '正向刀長補正', summary: '啟用 H 登錄的正向刀長補正。',
    syntax: 'G43 H<刀長補正號> <補正軸位置>;', example: 'G43 H<補正號> Z<核對位置>;',
    notes: ['補正軸及移動時機依補正型式與參數。'], tags: ['刀長', 'H', '補正'], sourceIds: ['cmd-0id-compensation']
  },
  {
    id: 'cmd-g49', type: 'gcode', category: '座標與補正', code: 'G49',
    title: '取消刀長補正', summary: '解除刀長補正模式。', syntax: 'G49;', example: 'G49;',
    notes: ['取消與後續軸移動的關係須按機型核對。'], tags: ['刀長', '取消補正'], sourceIds: ['cmd-0id-compensation']
  },
  {
    id: 'cmd-g53', type: 'gcode', category: '座標與補正', code: 'G53',
    title: '機械座標指令', summary: '本單節使用機械座標。',
    syntax: 'G90 G53 <機械座標位置>;', example: 'G90 G53 Z<機械座標位置>;',
    notes: ['須用絕對指令；補正取消及恢復另核對。'], tags: ['機械座標', '非模態'], sourceIds: ['cmd-0id-coordinate']
  },
  {
    id: 'cmd-g54', type: 'gcode', category: '座標與補正', code: 'G54',
    title: '第 1 組工件座標', summary: '選取已設定的第 1 組工件原點。', syntax: 'G54;', example: 'G54;',
    notes: ['G55–G59 選其他組；選取不等於設定原點。'], tags: ['工件座標', '原點', 'G55', 'G59'], sourceIds: ['cmd-0id-coordinate']
  },
  {
    id: 'cmd-g90', type: 'gcode', category: '座標與補正', code: 'G90',
    title: '絕對座標模式', summary: '加工中心以終點座標指定位置。',
    syntax: 'G90 <移動指令>;', example: 'G90 G01 X<終點座標> F<進給>;',
    notes: ['此為銑床用法，不是車床 G90 切削循環。'], tags: ['絕對', '座標', '銑床'], sourceIds: ['cmd-0id-coordinate']
  },
  {
    id: 'cmd-g91', type: 'gcode', category: '座標與補正', code: 'G91',
    title: '增量座標模式', summary: '加工中心以移動量指定位置。',
    syntax: 'G91 <移動指令>;', example: 'G91 G01 X<本次移動量> F<進給>;',
    notes: ['後續單節仍受此模式影響，須規劃恢復。'], tags: ['增量', '相對移動', '銑床'], sourceIds: ['cmd-0id-coordinate']
  },

  // ── 04｜加工中心固定循環：Z/R 與返回平面不可混同車床進給模式。 ──
  {
    id: 'cmd-g80', type: 'gcode', category: '固定循環', code: 'G80',
    title: '取消鑽孔固定循環', summary: '退出加工中心鑽孔循環模式。', syntax: 'G80;', example: 'G80;',
    notes: ['此筆限定一般加工中心固定循環語境。'], tags: ['鑽孔', '循環取消'], sourceIds: ['cmd-0if-code-list']
  },
  {
    id: 'cmd-g81', type: 'gcode', category: '固定循環', code: 'G81',
    title: '一般鑽孔循環', summary: '進給至孔底，再快速返回。',
    syntax: 'G81 X<孔位> Y<孔位> Z<孔底或深度> R<R位置或距離> F<進給>;',
    example: 'G81 X<孔位> Y<孔位> Z<孔底> R<R平面> F<進給>;',
    notes: ['Z/R 意義受 G90/G91 影響；返回看 G98/G99。'], tags: ['鑽孔', '孔加工', 'R平面'], sourceIds: ['cmd-0if-drilling']
  },
  {
    id: 'cmd-g82', type: 'gcode', category: '固定循環', code: 'G82',
    title: '孔底停留鑽孔循環', summary: '鑽至孔底停留後返回。',
    syntax: 'G82 X<孔位> Y<孔位> Z<孔底> R<R平面> P<停留值> F<進給>;',
    example: 'G82 Z<孔底> R<R平面> P<停留值> F<進給>;',
    notes: ['P 參數的單位須依實際控制器核對。'], tags: ['鑽孔', '搪平', '停留'], sourceIds: ['cmd-0if-drilling']
  },
  {
    id: 'cmd-g83', type: 'gcode', category: '固定循環', code: 'G83',
    title: '啄鑽循環', summary: '分次切入並退回排屑。',
    syntax: 'G83 X<孔位> Y<孔位> Z<孔底> R<R平面> Q<每次切入量> F<進給>;',
    example: 'G83 Z<孔底> R<R平面> Q<每次切入量> F<進給>;',
    notes: ['此筆為一般啄鑽，不等同 G73 短退刀。'], tags: ['啄鑽', '排屑', 'Q'], sourceIds: ['cmd-0if-drilling']
  },
  {
    id: 'cmd-g84', type: 'gcode', category: '固定循環', code: 'G84',
    title: '攻牙循環', summary: '以主軸與進給配合完成攻牙。',
    syntax: 'G84 X<孔位> Y<孔位> Z<孔底> R<R平面> F<攻牙進給>;',
    example: 'G84 Z<孔底> R<R平面> F<核對後的攻牙進給>;',
    notes: ['剛性攻牙啟用方式及 S/F 配合依機床設定。'], tags: ['攻牙', '螺距', '剛性攻牙'], sourceIds: ['cmd-0if-drilling']
  },
  {
    id: 'cmd-g98', type: 'gcode', category: '固定循環', code: 'G98',
    title: '循環返回初始平面', summary: '加工中心循環完成後回初始平面。', syntax: 'G98 <固定循環>;', example: 'G98;',
    notes: ['銑床循環返回用法，不是車床每分鐘進給。'], tags: ['初始平面', '返回', '銑床'], sourceIds: ['cmd-0if-code-list']
  },
  {
    id: 'cmd-g99', type: 'gcode', category: '固定循環', code: 'G99',
    title: '循環返回 R 平面', summary: '加工中心循環完成後回 R 平面。', syntax: 'G99 <固定循環>;', example: 'G99;',
    notes: ['銑床循環返回用法，不是車床每轉進給。'], tags: ['R平面', '返回', '銑床'], sourceIds: ['cmd-0if-code-list']
  },

  // ── 05｜程式控制與常見機床 M 配號：CNC 機能和機床周邊實作分開標示。 ──
  {
    id: 'cmd-m00', type: 'mcode', category: '程式與主軸', code: 'M00',
    title: '程式停止', summary: '執行此單節後暫停自動運轉。', syntax: 'M00;', example: 'M00;',
    notes: ['主軸及周邊停止狀態依機床廠。'], tags: ['停止', '程式控制'], sourceIds: ['cmd-21imb-program']
  },
  {
    id: 'cmd-m01', type: 'mcode', category: '程式與主軸', code: 'M01',
    title: '選擇性停止', summary: '可選停止開關啟用時才暫停。', syntax: 'M01;', example: 'M01;',
    notes: ['未啟用 Optional Stop 時會繼續執行。'], tags: ['選擇停止', 'Optional Stop'], sourceIds: ['cmd-21imb-program']
  },
  {
    id: 'cmd-m03', type: 'mcode', category: '程式與主軸', code: 'M03',
    title: '主軸正轉（常見配號）', summary: '常見的主軸正轉要求。',
    syntax: 'S<主軸轉速> M03;', example: 'S<核對轉速> M03;',
    notes: ['機床廠實作；旋轉方向及主軸選擇須確認。'], tags: ['主軸', '正轉', '機床廠'], sourceIds: ['cmd-fryer-machine-mcodes']
  },
  {
    id: 'cmd-m04', type: 'mcode', category: '程式與主軸', code: 'M04',
    title: '主軸反轉（常見配號）', summary: '常見的主軸反轉要求。',
    syntax: 'S<主軸轉速> M04;', example: 'S<核對轉速> M04;',
    notes: ['機床廠實作；不能僅以螢幕視角判方向。'], tags: ['主軸', '反轉', '機床廠'], sourceIds: ['cmd-fryer-machine-mcodes']
  },
  {
    id: 'cmd-m05', type: 'mcode', category: '程式與主軸', code: 'M05',
    title: '主軸停止（常見配號）', summary: '常見的主軸停止要求。', syntax: 'M05;', example: 'M05;',
    notes: ['不等於所有軸、切削液與周邊都停止。'], tags: ['主軸', '停止', '機床廠'], sourceIds: ['cmd-fryer-machine-mcodes']
  },
  {
    id: 'cmd-m06', type: 'mcode', category: '程式與主軸', code: 'M06',
    title: '換刀要求（常見配號）', summary: '常見的自動換刀要求。',
    syntax: 'T<刀號> M06;', example: 'T<確認刀號> M06;',
    notes: ['T/M06 的節次及換刀位置必須依機床廠規定。'], tags: ['換刀', 'ATC', '機床廠'], sourceIds: ['cmd-fryer-machine-mcodes']
  },
  {
    id: 'cmd-m08', type: 'mcode', category: '程式與主軸', code: 'M08',
    title: '切削液開啟（常見配號）', summary: '常見的外部切削液開啟要求。', syntax: 'M08;', example: 'M08;',
    notes: ['不代表中心出水；回路與配號依機床廠。'], tags: ['切削液', '冷卻', '機床廠'], sourceIds: ['cmd-fryer-machine-mcodes']
  },
  {
    id: 'cmd-m09', type: 'mcode', category: '程式與主軸', code: 'M09',
    title: '切削液關閉（常見配號）', summary: '常見的切削液停止要求。', syntax: 'M09;', example: 'M09;',
    notes: ['哪些冷卻／吹氣回路會關閉，須查機床手冊。'], tags: ['切削液', '關閉', '機床廠'], sourceIds: ['cmd-fryer-machine-mcodes']
  },
  {
    id: 'cmd-m30', type: 'mcode', category: '程式與主軸', code: 'M30',
    title: '程式結束', summary: '結束主程式。', syntax: 'M30;', example: 'M30;',
    notes: ['復歸、回起始與周邊狀態依機床廠。'], tags: ['結束', '主程式'], sourceIds: ['cmd-21imb-program']
  },
  {
    id: 'cmd-m98', type: 'mcode', category: '程式與主軸', code: 'M98',
    title: '呼叫子程式', summary: '轉入指定子程式執行。',
    syntax: 'M98 P<子程式號>;', example: 'M98 P<已確認的子程式號>;',
    notes: ['重複次數的寫法依系列；不要套用其他控制器格式。'], tags: ['子程式', '呼叫', 'P'], sourceIds: ['cmd-21imb-program']
  },
  {
    id: 'cmd-m99', type: 'mcode', category: '程式與主軸', code: 'M99',
    title: '子程式返回', summary: '結束子程式並返回呼叫端。', syntax: 'M99;', example: 'M99;',
    notes: ['放在主程式可能形成重複執行，須確認層級。'], tags: ['子程式', '返回', '循環'], sourceIds: ['cmd-21imb-program']
  }
];
