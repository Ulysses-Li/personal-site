/**
 * FANUC Custom Macro B｜繁體中文查找資料
 *
 * 依原廠手冊內容整理；下列網址為公開鏡像，不代表 FANUC 官方託管。
 * 以 21i-MB 為主要範圍，另用 0i-D 手冊標示已確認的系列差異。
 * 說明採自寫短句，範例為自行編寫的語法片段，未收錄機台運動程式。
 * <程式號>、<條件> 等為說明用佔位符；不是可直接載入機台的程式。
 * 同一手冊的不同章節來源只用來定位，不視為不同著作或重複引用額度。
 */

// ── 01｜來源定位：印刷頁碼與 PDF 閱讀器頁碼分開標示。 ──
window.FANUC_MACRO_SOURCES = [
  {
    id: 'macro21-variables',
    title: 'GE FANUC 21i/210i-MB 操作手冊 B-63614EN/01（2001，公開鏡像）',
    url: 'https://www.warp9td.com/images/FAQ/GCode/FanucOperatorsManual63614en.pdf#page=306',
    kind: '原廠手冊',
    locator: 'II §15.1；印刷頁 285–288／PDF 第 306–309 頁',
    scope: '21i-MB 的空值、局部／共用變數、擴充範圍及間接指定。'
  },
  {
    id: 'macro21-arithmetic',
    title: 'GE FANUC 21i/210i-MB：運算與函數（B-63614EN/01，公開鏡像）',
    url: 'https://www.warp9td.com/images/FAQ/GCode/FanucOperatorsManual63614en.pdf#page=319',
    kind: '原廠手冊',
    locator: 'II §15.3；印刷頁 298–302／PDF 第 319–323 頁',
    scope: '算術、中括號、角度函數及取整；不推定其他控制器的完整支援。'
  },
  {
    id: 'macro21-flow',
    title: 'GE FANUC 21i/210i-MB：分支與迴圈（B-63614EN/01，公開鏡像）',
    url: 'https://www.warp9td.com/images/FAQ/GCode/FanucOperatorsManual63614en.pdf#page=325',
    kind: '原廠手冊',
    locator: 'II §15.5.1–15.5.3；印刷頁 304–308／PDF 第 325–329 頁',
    scope: 'GOTO、IF、比較運算字與 WHILE／DO／END。'
  },
  {
    id: 'macro21-calls',
    title: 'GE FANUC 21i/210i-MB：巨集呼叫（B-63614EN/01，公開鏡像）',
    url: 'https://www.warp9td.com/images/FAQ/GCode/FanucOperatorsManual63614en.pdf#page=331',
    kind: '原廠手冊',
    locator: 'II §15.6.1–15.6.2；印刷頁 310–314／PDF 第 331–335 頁',
    scope: 'G65、G66／G67、M99 返回及引數指定 I／II；指定 I 排除 G、L、N、O、P。'
  },
  {
    id: 'macro21-return',
    title: 'GE FANUC 21i/210i-MB：M99 在主程式中的行為（公開鏡像）',
    url: 'https://www.warp9td.com/images/FAQ/GCode/FanucOperatorsManual63614en.pdf#page=151',
    kind: '原廠手冊',
    locator: 'B-63614EN/01；II 程式結構章，印刷頁 130／PDF 第 151 頁',
    scope: '區分巨集返回與主程式內 M99 的循環行為。'
  },
  {
    id: 'macro0id-variables',
    title: 'FANUC 0i-D／0i Mate-D：變數（B-64304EN/02，原廠內容鏡像）',
    url: 'https://zinref.ru/avtomobili/000_Kiiiaa-2026-02-04600_raznie_18/999-06-05-FANUC-Series-0i-OPERATOR_04600_raznie_15/007.htm',
    kind: '原廠手冊',
    locator: 'II §14.1；印刷頁 158–161',
    scope: '此版列出 #100–199 與 #500–999，供辨認系列差異，不取代實機規格。'
  },
  {
    id: 'macro0id-bitwise',
    title: 'FANUC 0i-D／0i Mate-D：邏輯運算（B-64304EN/02，原廠內容鏡像）',
    url: 'https://zinref.ru/avtomobili/000_Kiiiaa-2026-02-04600_raznie_18/999-06-05-FANUC-Series-0i-OPERATOR_04600_raznie_15/008.htm',
    kind: '原廠手冊',
    locator: 'II §14.3，表 14.3(a)；印刷頁 193–198',
    scope: 'AND／OR／XOR 的 32 位元逐位運算；與比較條件的用途分開。'
  },
  {
    id: 'macro0id-functions',
    title: 'FANUC 0i-D／0i Mate-D：反三角函數（B-64304EN/02，原廠內容鏡像）',
    url: 'https://zinref.ru/avtomobili/000_Kiiiaa-2026-02-04600_raznie_18/999-06-05-FANUC-Series-0i-OPERATOR_04600_raznie_15/008.htm',
    kind: '原廠手冊',
    locator: 'II §14.3；印刷頁 194–195',
    scope: '兩引數 ATAN 的 Y／X 順序、象限及 NAT 角度範圍。'
  }
];

// ── 02｜變數：範例只改局部變數，不寫入持久共用變數。 ──
window.FANUC_MACRO_ENTRIES = [
  {
    id: 'macro-null', type: 'macro', category: '變數', code: '#0',
    title: '空值',
    summary: '唯讀空值，可用來清空局部變數。',
    syntax: '#局部變數 = #0;',
    example: '#1=#0;',
    notes: ['空值不等同數值 0。'],
    tags: ['空值', 'null', '未定義'], sourceIds: ['macro21-variables']
  },
  {
    id: 'macro-local', type: 'macro', category: '變數', code: '#1–#33',
    title: '局部變數',
    summary: '各層巨集呼叫有自己的局部變數。',
    syntax: '#1 … #33',
    example: '#1=8.;\n#2=[#1+2.];',
    notes: ['未傳入的引數為空值。'],
    tags: ['局部', '引數', '呼叫層'], sourceIds: ['macro21-variables']
  },
  {
    id: 'macro-common-volatile', type: 'macro', category: '變數', code: '#100–#149',
    title: '共用變數：斷電清空',
    summary: '此 21i-MB 範圍在斷電時清空。',
    syntax: '#100 … #149',
    example: '#1=#100;',
    notes: ['21i-MB 的 #150–199 為擴充選項；0i-D 此版列出 #100–199。', 'RESET 清除行為須另核對。'],
    tags: ['共用', '斷電', '系列差異'], sourceIds: ['macro21-variables', 'macro0id-variables']
  },
  {
    id: 'macro-common-retained', type: 'macro', category: '變數', code: '#500–#531',
    title: '共用變數：斷電保留',
    summary: '此 21i-MB 範圍可跨斷電保留。',
    syntax: '#500 … #531',
    example: '#1=#500;',
    notes: ['21i-MB 的 #532–999 為擴充選項；0i-D 此版列出 #500–999。', '例中只讀取既有值。'],
    tags: ['共用', '保留', '系列差異'], sourceIds: ['macro21-variables', 'macro0id-variables']
  },
  {
    id: 'macro-assignment', type: 'macro', category: '變數', code: '=',
    title: '賦值',
    summary: '把右側結果存入左側變數。',
    syntax: '#i = 表達式;',
    example: '#1=6.;\n#2=#1+4.;',
    notes: ['這是賦值；相等比較使用 EQ。'],
    tags: ['賦值', '代入', 'assignment'], sourceIds: ['macro21-arithmetic']
  },
  {
    id: 'macro-indirect', type: 'macro', category: '變數', code: '#[ ]',
    title: '間接變數編號',
    summary: '先計算括號，再取對應變數。',
    syntax: '#[表達式]',
    example: '#1=2.;\n#2=9.;\n#3=#[#1];',
    notes: ['不要寫成 ##1。'],
    tags: ['間接', '編號', '中括號'], sourceIds: ['macro21-variables']
  },

  // ── 03｜算術、比較與函數：下列皆為局部變數的學習片段。 ──
  {
    id: 'macro-add', type: 'macro', category: '運算函數', code: '+',
    title: '加法', summary: '計算兩值之和。', syntax: '#i = 值1 + 值2;',
    example: '#1=2.+6.;', notes: [],
    tags: ['算術', '加'], sourceIds: ['macro21-arithmetic']
  },
  {
    id: 'macro-subtract', type: 'macro', category: '運算函數', code: '-',
    title: '減法', summary: '計算兩值之差。', syntax: '#i = 值1 - 值2;',
    example: '#1=9.-4.;', notes: [],
    tags: ['算術', '減'], sourceIds: ['macro21-arithmetic']
  },
  {
    id: 'macro-multiply', type: 'macro', category: '運算函數', code: '*',
    title: '乘法', summary: '計算兩值之積。', syntax: '#i = 值1 * 值2;',
    example: '#1=3.*4.;', notes: [],
    tags: ['算術', '乘'], sourceIds: ['macro21-arithmetic']
  },
  {
    id: 'macro-divide', type: 'macro', category: '運算函數', code: '/',
    title: '除法', summary: '計算兩值之商。', syntax: '#i = 分子 / 分母;',
    example: '#1=15./3.;', notes: ['分母不可為零。'],
    tags: ['算術', '除'], sourceIds: ['macro21-arithmetic']
  },
  {
    id: 'macro-brackets', type: 'macro', category: '運算函數', code: '[ ]',
    title: '運算分組', summary: '用中括號改變計算順序。', syntax: '#i = [表達式];',
    example: '#1=[2.+3.]*4.;', notes: ['圓括號用於註解。'],
    tags: ['優先序', '括號'], sourceIds: ['macro21-arithmetic']
  },
  {
    id: 'macro-eq', type: 'macro', category: '運算函數', code: 'EQ',
    title: '等於', summary: '判斷兩值相等。', syntax: '[值1 EQ 值2]',
    example: 'IF[#1 EQ 2.]THEN #2=1.;', notes: ['計算結果須留意浮點誤差。'],
    tags: ['比較', '相等'], sourceIds: ['macro21-flow']
  },
  {
    id: 'macro-ne', type: 'macro', category: '運算函數', code: 'NE',
    title: '不等於', summary: '判斷兩值不同。', syntax: '[值1 NE 值2]',
    example: 'IF[#1 NE #0]THEN #2=1.;', notes: ['可用來區別空值。'],
    tags: ['比較', '空值'], sourceIds: ['macro21-flow', 'macro21-variables']
  },
  {
    id: 'macro-gt', type: 'macro', category: '運算函數', code: 'GT',
    title: '大於', summary: '左值大於右值。', syntax: '[值1 GT 值2]',
    example: 'IF[#1 GT 4.]THEN #2=1.;', notes: [],
    tags: ['比較', '大於'], sourceIds: ['macro21-flow']
  },
  {
    id: 'macro-ge', type: 'macro', category: '運算函數', code: 'GE',
    title: '大於或等於', summary: '左值不小於右值。', syntax: '[值1 GE 值2]',
    example: 'IF[#1 GE 4.]THEN #2=1.;', notes: [],
    tags: ['比較', '大於等於'], sourceIds: ['macro21-flow']
  },
  {
    id: 'macro-lt', type: 'macro', category: '運算函數', code: 'LT',
    title: '小於', summary: '左值小於右值。', syntax: '[值1 LT 值2]',
    example: 'IF[#1 LT 4.]THEN #2=1.;', notes: [],
    tags: ['比較', '小於'], sourceIds: ['macro21-flow']
  },
  {
    id: 'macro-le', type: 'macro', category: '運算函數', code: 'LE',
    title: '小於或等於', summary: '左值不大於右值。', syntax: '[值1 LE 值2]',
    example: 'IF[#1 LE 4.]THEN #2=1.;', notes: [],
    tags: ['比較', '小於等於'], sourceIds: ['macro21-flow']
  },
  {
    id: 'macro-and', type: 'macro', category: '運算函數', code: 'AND',
    title: '逐位 AND', summary: '同為 1 的位元才保留。', syntax: '#i = 整數1 AND 整數2;',
    example: '#1=5 AND 3;', notes: ['此筆是 32 位元逐位運算。'],
    tags: ['位元', '邏輯'], sourceIds: ['macro0id-bitwise']
  },
  {
    id: 'macro-or', type: 'macro', category: '運算函數', code: 'OR',
    title: '逐位 OR', summary: '任一為 1 的位元即保留。', syntax: '#i = 整數1 OR 整數2;',
    example: '#1=5 OR 3;', notes: ['此筆是 32 位元逐位運算。'],
    tags: ['位元', '邏輯'], sourceIds: ['macro0id-bitwise']
  },
  {
    id: 'macro-xor', type: 'macro', category: '運算函數', code: 'XOR',
    title: '逐位 XOR', summary: '不同的位元才保留。', syntax: '#i = 整數1 XOR 整數2;',
    example: '#1=5 XOR 3;', notes: ['此筆是 32 位元逐位運算。'],
    tags: ['位元', '互斥或'], sourceIds: ['macro0id-bitwise']
  },
  {
    id: 'macro-sin', type: 'macro', category: '運算函數', code: 'SIN',
    title: '正弦', summary: '以度數計算正弦。', syntax: '#i = SIN[角度];',
    example: '#1=SIN[30.];', notes: [],
    tags: ['三角函數', '角度'], sourceIds: ['macro21-arithmetic']
  },
  {
    id: 'macro-cos', type: 'macro', category: '運算函數', code: 'COS',
    title: '餘弦', summary: '以度數計算餘弦。', syntax: '#i = COS[角度];',
    example: '#1=COS[60.];', notes: [],
    tags: ['三角函數', '角度'], sourceIds: ['macro21-arithmetic']
  },
  {
    id: 'macro-tan', type: 'macro', category: '運算函數', code: 'TAN',
    title: '正切', summary: '以度數計算正切。', syntax: '#i = TAN[角度];',
    example: '#1=TAN[45.];', notes: ['避開正切未定義的角度。'],
    tags: ['三角函數', '角度'], sourceIds: ['macro21-arithmetic']
  },
  {
    id: 'macro-asin', type: 'macro', category: '運算函數', code: 'ASIN',
    title: '反正弦', summary: '反正弦的輸出為角度。', syntax: '#i = ASIN[數值];',
    example: '#1=ASIN[0.5];', notes: ['輸入須在 -1 到 1；負角表示依 NAT。'],
    tags: ['反三角函數', '角度', 'NAT'], sourceIds: ['macro21-arithmetic']
  },
  {
    id: 'macro-acos', type: 'macro', category: '運算函數', code: 'ACOS',
    title: '反餘弦', summary: '反餘弦的輸出為角度。', syntax: '#i = ACOS[數值];',
    example: '#1=ACOS[0.5];', notes: ['輸入須在 -1 到 1，結果介於 0° 與 180°。'],
    tags: ['反三角函數', '角度'], sourceIds: ['macro21-arithmetic']
  },
  {
    id: 'macro-atan', type: 'macro', category: '運算函數', code: 'ATAN',
    title: '兩引數反正切', summary: '由 Y、X 分量取得象限角度（度）。', syntax: '#i = ATAN[Y]/[X];',
    example: '#1=ATAN[1.]/[-1.];',
    notes: ['先 Y 後 X；本例為第二象限 135°。', 'NAT=0 為 0°–360°；NAT=1 為 -180°–180°。'],
    tags: ['反三角函數', '象限', 'Y/X', 'NAT'], sourceIds: ['macro21-arithmetic', 'macro0id-functions']
  },
  {
    id: 'macro-sqrt', type: 'macro', category: '運算函數', code: 'SQRT',
    title: '平方根', summary: '取非負數的平方根。', syntax: '#i = SQRT[數值];',
    example: '#1=SQRT[25.];', notes: [],
    tags: ['數學', '開根號'], sourceIds: ['macro21-arithmetic']
  },
  {
    id: 'macro-abs', type: 'macro', category: '運算函數', code: 'ABS',
    title: '絕對值', summary: '取得數值大小。', syntax: '#i = ABS[數值];',
    example: '#1=ABS[-6.];', notes: [],
    tags: ['數學', '正負'], sourceIds: ['macro21-arithmetic']
  },
  {
    id: 'macro-ln', type: 'macro', category: '運算函數', code: 'LN',
    title: '自然對數', summary: '以 e 為底的對數。', syntax: '#i = LN[數值];',
    example: '#1=LN[2.];', notes: ['輸入必須大於 0。'],
    tags: ['對數', '數學'], sourceIds: ['macro21-arithmetic']
  },
  {
    id: 'macro-exp', type: 'macro', category: '運算函數', code: 'EXP',
    title: '指數函數', summary: '以 e 為底的指數。', syntax: '#i = EXP[數值];',
    example: '#1=EXP[1.];', notes: ['結果過大會溢位。'],
    tags: ['指數', '數學'], sourceIds: ['macro21-arithmetic']
  },
  {
    id: 'macro-fix', type: 'macro', category: '運算函數', code: 'FIX',
    title: '朝零截取整數', summary: '截去小數部分。', syntax: '#i = FIX[數值];',
    example: '#1=FIX[-2.6];', notes: ['本例為 -2.，不是 -3.。'],
    tags: ['整數', '截尾', '負數'], sourceIds: ['macro21-arithmetic']
  },
  {
    id: 'macro-fup', type: 'macro', category: '運算函數', code: 'FUP',
    title: '離零進位整數', summary: '有小數時，整數絕對值變大。', syntax: '#i = FUP[數值];',
    example: '#1=FUP[-2.6];', notes: ['本例為 -3.，不是 -2.。'],
    tags: ['整數', '進位', '負數'], sourceIds: ['macro21-arithmetic']
  },
  {
    id: 'macro-round', type: 'macro', category: '運算函數', code: 'ROUND',
    title: '賦值中的取整', summary: '在賦值運算中取最近整數。', syntax: '#i = ROUND[數值];',
    example: '#1=ROUND[2.6];', notes: ['NC 位址內的 ROUND 另依最小輸入增量。'],
    tags: ['整數', '四捨五入', '增量'], sourceIds: ['macro21-arithmetic']
  },

  // ── 04｜流程控制：只示範有限次數的資料運算，不含軸移動。 ──
  {
    id: 'macro-goto', type: 'macro', category: '流程控制', code: 'GOTO',
    title: '無條件跳躍', summary: '轉到指定的 N 序號。', syntax: 'GOTO 序號;',
    example: 'GOTO100;\nN100 #1=1.;', notes: ['目標序號須唯一。'],
    tags: ['跳躍', '序號'], sourceIds: ['macro21-flow']
  },
  {
    id: 'macro-if-goto', type: 'macro', category: '流程控制', code: 'IF … GOTO',
    title: '條件跳躍', summary: '條件成立才轉往指定序號。', syntax: 'IF[條件]GOTO 序號;',
    example: 'IF[#1 GT 4.]GOTO100;\n#2=0.;\nN100 #3=1.;', notes: ['比較使用 EQ／GT 等運算字。'],
    tags: ['條件', '分支'], sourceIds: ['macro21-flow']
  },
  {
    id: 'macro-if-then', type: 'macro', category: '流程控制', code: 'IF … THEN',
    title: '條件巨集敘述', summary: '條件成立才執行後方敘述。', syntax: 'IF[條件]THEN 巨集敘述;',
    example: 'IF[#1 GT 4.]THEN #2=1.;', notes: ['THEN 後為一個巨集敘述。'],
    tags: ['條件', '賦值'], sourceIds: ['macro21-flow']
  },
  {
    id: 'macro-while', type: 'macro', category: '流程控制', code: 'WHILE / DO / END',
    title: '條件迴圈', summary: '條件成立時重複區塊。',
    syntax: 'WHILE[條件]DO m;\n  巨集敘述;\nEND m;',
    example: '#1=0.;\nWHILE[#1 LT 3.]DO1;\n  #1=#1+1.;\nEND1;',
    notes: ['此手冊的 DO／END 編號為 1–3，須配對。'],
    tags: ['迴圈', '重複', '有限次數'], sourceIds: ['macro21-flow']
  },

  // ── 05｜巨集呼叫：佔位符不對應任何實機既有程式。 ──
  {
    id: 'macro-g65', type: 'macro', category: '巨集呼叫', code: 'G65',
    title: '單次巨集呼叫', summary: '呼叫 P 指定的巨集並傳入引數。',
    syntax: 'G65 P<程式號> [L<次數>] <引數>;',
    example: 'G65 P<程式號> A2. B4.;',
    notes: ['引數加小數點，避免輸入增量差異。'],
    tags: ['呼叫', '引數', '單次'], sourceIds: ['macro21-calls']
  },
  {
    id: 'macro-g66', type: 'macro', category: '巨集呼叫', code: 'G66',
    title: '模態巨集呼叫', summary: '保留巨集呼叫模式。',
    syntax: 'G66 P<程式號> [L<次數>] <引數>;',
    example: 'G66 P<程式號> A2.;\n(後續移動區塊省略)\nG67;',
    notes: ['軸移動區塊完成後觸發，不是每一行都呼叫。'],
    tags: ['模態', '重複呼叫'], sourceIds: ['macro21-calls']
  },
  {
    id: 'macro-g67', type: 'macro', category: '巨集呼叫', code: 'G67',
    title: '取消模態巨集', summary: '取消對應的 G66 呼叫模式。', syntax: 'G67;',
    example: 'G67;', notes: ['不代表結束主程式。'],
    tags: ['取消', '模態'], sourceIds: ['macro21-calls']
  },
  {
    id: 'macro-m99', type: 'macro', category: '巨集呼叫', code: 'M99',
    title: '巨集返回', summary: '從被呼叫巨集返回上層。', syntax: 'M99;',
    example: 'M99;', notes: ['放在主程式內可能形成循環。'],
    tags: ['返回', '局部層'], sourceIds: ['macro21-calls', 'macro21-return']
  },
  {
    id: 'macro-arguments-one', type: 'macro', category: '巨集呼叫', code: '引數指定 I',
    title: '位址與局部變數對照', summary: '單一位址對應一個局部變數。',
    syntax: 'G65 P<程式號> A… D… X…;',
    example: 'G65 P<程式號> A2. D4. X6.;',
    notes: ['G、L、N、O、P 不作引數。', '本例對應 #1、#7、#24；I／J／K 順序另須遵守。'],
    tags: ['引數', '對照表', '指定I'], sourceIds: ['macro21-calls']
  },
  {
    id: 'macro-arguments-two', type: 'macro', category: '巨集呼叫', code: '引數指定 II',
    title: '重複 I／J／K', summary: '以重複順序傳入多組引數。',
    syntax: 'G65 P<程式號> I… J… K… I… J… K…;',
    example: 'G65 P<程式號> I2. J4. K6. I8. J10. K12.;',
    notes: ['第二組對應 #7、#8、#9；不可混看指定 I 表。', '可用性與排列須核對機型／參數。'],
    tags: ['引數', 'IJK', '指定II'], sourceIds: ['macro21-calls']
  }
];

// ── 06｜標準引數指定 I：只列 21 個可傳入的位址，不含 G、L、N、O、P。 ──
// I／J／K 重複指定屬於指定 II，不加入本表；也不是加工軸／圓弧參數表。
window.FANUC_ARGUMENTS = [
  { address: 'A', variable: 1 },
  { address: 'B', variable: 2 },
  { address: 'C', variable: 3 },
  { address: 'D', variable: 7 },
  { address: 'E', variable: 8 },
  { address: 'F', variable: 9 },
  { address: 'H', variable: 11 },
  { address: 'I', variable: 4 },
  { address: 'J', variable: 5 },
  { address: 'K', variable: 6 },
  { address: 'M', variable: 13 },
  { address: 'Q', variable: 17 },
  { address: 'R', variable: 18 },
  { address: 'S', variable: 19 },
  { address: 'T', variable: 20 },
  { address: 'U', variable: 21 },
  { address: 'V', variable: 22 },
  { address: 'W', variable: 23 },
  { address: 'X', variable: 24 },
  { address: 'Y', variable: 25 },
  { address: 'Z', variable: 26 }
];
window.FANUC_ARGUMENT_SOURCE_IDS = ['macro21-calls'];
