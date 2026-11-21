/**
 * 加工工具目錄與公式來源｜修改說明、分類與來源可從本檔開始。
 * category.id、tool.id 與 method 為畫面與網址的穩定識別，請勿隨文案改名。
 * 數學核心與輸入驗證在 engine.js；本檔只放自寫短說明，不含材料推薦值。
 * 圖面上下限與配合採使用者輸入的數值加減，沒有內建 ISO 公差表。
 */

(() => {
  'use strict';

  // ── 01｜分類與工具：公式中的長度一律 mm，速度一律 m/min 或 mm/min。 ──
  const catalog = {
    categories: [
      {
        id: 'milling', title: '銑削', english: 'Milling',
        description: '由切削速度、直徑與每齒進給求轉速和工作台進給。',
        icon: 'milling', color: '#0b83c9',
        tools: [{
          id: 'milling-feed', title: '轉速與每分鐘進給', method: 'milling',
          formula: 'n = 1000 × Vc ÷ (π × D)；vf = n × z × fz',
          notes: ['D 使用實際切深的有效切削直徑；z 為有效刀刃數。', 'Vc 與 fz 由刀具、材料及加工條件自行選定。'],
          sourceIds: ['sandvik-milling']
        }]
      },
      {
        id: 'drilling', title: '鑽削', english: 'Drilling',
        description: '以鑽頭直徑、切削速度與每轉進給換算加工參數。',
        icon: 'drilling', color: '#0b9388',
        tools: [{
          id: 'drilling-feed', title: '轉速與每分鐘進給', method: 'drilling',
          formula: 'n = 1000 × Vc ÷ (π × D)；vf = n × fn',
          notes: ['D 為鑽頭直徑；fn 是整支鑽頭的每轉進給，不是每刃進給。'],
          sourceIds: ['sandvik-drilling']
        }]
      },
      {
        id: 'turning', title: '車削', english: 'Turning',
        description: '依工件加工直徑與每轉進給計算轉速和線性進給。',
        icon: 'turning', color: '#b97b14',
        tools: [{
          id: 'turning-feed', title: '轉速與每分鐘進給', method: 'turning',
          formula: 'n = 1000 × Vc ÷ (π × D)；vf = n × fn',
          notes: ['D 為當下工件加工直徑，直徑改變時請重新計算。', 'vf 由原廠時間式 Tc = lm ÷ (fn × n) 等價推導。'],
          sourceIds: ['sandvik-turning']
        }]
      },
      {
        id: 'thread', title: '螺紋與攻牙', english: 'Threading',
        description: '換算螺距與 TPI，並粗估公制切削攻牙預鑽孔徑。',
        icon: 'thread', color: '#8562b6',
        tools: [{
          id: 'thread-pitch-drill', title: '螺距換算與預鑽粗估', method: 'thread',
          formula: 'P = 25.4 ÷ TPI；TPI = 25.4 ÷ P；預鑽 d ≈ D − P',
          notes: ['D−P 僅作公制 60° 切削攻牙的基本粗估。', '成形攻牙與精密預鑽須依刀具原廠建議，不能套用此粗估。'],
          sourceIds: ['sandvik-threading', 'sandvik-thread-pitch']
        }]
      },
      {
        id: 'tolerance', title: '公差與配合', english: 'Tolerance & Fit',
        description: '把圖面偏差換成尺寸上下限，檢查孔軸間隙範圍。',
        icon: 'tolerance', color: '#bf638d',
        tools: [
          {
            id: 'dimension-limits', title: '圖面尺寸上下限', method: 'limits',
            formula: '最大尺寸 = 基本尺寸 + 上偏差；最小尺寸 = 基本尺寸 + 下偏差',
            notes: ['偏差需連同正負號輸入，沒有內建 ISO 公差或配合等級表。'],
            sourceIds: []
          },
          {
            id: 'hole-shaft-fit', title: '孔軸配合範圍', method: 'fit',
            formula: '最小間隙 = 孔最小 − 軸最大；最大間隙 = 孔最大 − 軸最小',
            notes: ['正值為間隙，負值為過盈；跨越零表示兩種情形都可能發生。', '全為零是零間隙特例；此處只依輸入上下限做尺寸加減。'],
            sourceIds: []
          }
        ]
      }
    ],

    // ── 02｜第一手來源：官方頁面支持公式，不代表推薦本工具的輸入參數。 ──
    sources: [
      {
        id: 'sandvik-milling', title: 'Sandvik Coromant｜銑削公制公式',
        url: 'https://cdn.sandvik.coromant.com/files/sitecollectiondocuments/services/metal-cutting-e-learning/formulas-and-definitions/formulas-and-deinitions-for-milling-metric-enu.pdf',
        scope: '公制轉速、每齒進給與工作台進給；D 為有效切削直徑。'
      },
      {
        id: 'sandvik-drilling', title: 'Sandvik Coromant｜鑽削公式與定義',
        url: 'https://www.sandvik.coromant.com/en-gb/knowledge/machining-formulas-definitions/drilling-formulas-definitions',
        scope: '轉速 n 與每轉進給 fn 換算每分鐘進給 vf。'
      },
      {
        id: 'sandvik-turning', title: 'Sandvik Coromant｜車削公式與定義',
        url: 'https://www.sandvik.coromant.com/en-gb/knowledge/machining-formulas-definitions/general-turning-formulas-definitions',
        scope: '加工直徑與轉速；由加工時間式推導 vf = n × fn。'
      },
      {
        id: 'sandvik-threading', title: 'Sandvik Coromant｜螺紋與攻牙公式',
        url: 'https://www.sandvik.coromant.com/en-gb/knowledge/machining-formulas-definitions/threading-formulas-definitions',
        scope: '切削攻牙基本孔徑 D−P，並與成形攻牙區分；不採其百分比範例。'
      },
      {
        id: 'sandvik-thread-pitch', title: 'Sandvik Coromant｜螺紋應用指南',
        url: 'https://cdn2.sandvik.coromant.com/files/a53b485b-be0f-019d-8100-3f0d1619b9fa/5370939c-6de5-4b34-a938-2fa290a42316/c-2920-031.pdf',
        scope: '印刷頁 118：公釐螺距與每英吋牙數以 25.4 互換。'
      }
    ]
  };

  // ── 03｜公開資料：可離線直接開檔；Node 檢查亦可讀取。 ──
  globalThis.MACHINING_CATALOG = catalog;
  if (typeof window !== 'undefined') window.MACHINING_CATALOG = catalog;
  if (typeof module === 'object' && module.exports) module.exports = catalog;
})();
