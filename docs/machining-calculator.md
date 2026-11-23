# 加工計算工具箱維護說明

更新日期：2026-11-23。本輪更新保存在本機，未推送遠端或發佈線上版本。

工具位於 `dist/tools/machining-calculator/index.html`，可直接在本機瀏覽器開啟，也可由網站的「個人小工具」入口進入。所有計算在瀏覽器執行，不會上傳輸入數值。

## 檔案分工

| 檔案 | 維護內容 |
| --- | --- |
| `dist/tools/machining-calculator/index.html` | 共用頁面、單位按鈕、桌機與手機導覽、本機 SVG 圖示 |
| `dist/tools/machining-calculator/app.css` | 本工具版面與手機樣式 |
| `dist/tools/machining-calculator/app.js` | 原計算表單、顯示單位、路由、工具收藏與螺紋查表串接 |
| `dist/tools/machining-calculator/engine.js` | 純數學核心與輸入驗證；不讀取 DOM 或儲存資料 |
| `dist/tools/machining-calculator/catalog.js` | 五個分類、公式短說明、適用範圍與官方來源 |
| `dist/tools/machining-calculator/illustrations/` | 五張原創加工 SVG 插圖，依分類 ID 命名 |
| `dist/tools/machining-calculator/thread-data.js` | 36 筆 M／MF／UNC／UNF 工件螺紋限界、基本尺寸與 OSG 來源 |
| `dist/tools/machining-calculator/thread-extra-data.js` | 66 筆 BA／BSW／BSF／G 基本牙型與來源，不提供等級限界 |
| `dist/tools/machining-calculator/thread-ui.js` | 搜尋、牙系／規格／內外牙、查表單位、規格收藏與複製來源 |
| `dist/tools/machining-calculator/thread-library.css` | 螺紋查表的獨立桌機、手機與尺寸表格版面 |
| `scripts/check-machining.mjs` | 14 組核心回歸檢查，不開瀏覽器、不使用網路、不改寫檔案 |
| `scripts/check-thread-data.mjs` | 18 組限界、基本牙型、合併身份、來源及匯出檢查 |

分類 `id`、工具 `id` 與 `method` 是穩定識別。修改標題與說明時，保留這些識別，才能維持網址、收藏及方法對應。

## 螺紋資料庫的範圍

五個工具維持原有分類順序；其中 `thread` 分類現在開啟「螺紋資料」查表，不直接進入攻牙粗估。資料合併後共有 8 牙系、102 個規格：

| 牙系 | 筆數 | 資料性質 |
| --- | ---: | --- |
| M 公制粗牙 | 10 | 工件內牙 6H／外牙 6g 的已收錄限界 |
| MF 公制細牙 | 6 | 同為 M × P 標註，工件內牙 6H／外牙 6g |
| UNC | 10 | 工件內牙 2B／外牙 2A 的已收錄限界 |
| UNF | 10 | 工件內牙 2B／外牙 2A 的已收錄限界 |
| BA | 17 | BA 0–16，僅基本牙型 |
| BSW | 22 | 僅基本牙型 |
| BSF | 9 | 僅基本牙型 |
| G／BSPP | 18 | 僅平行管螺紋基本牙型 |

`thread-data.js` 的 36 筆工件資料，內牙收錄有效徑及小徑 MIN/MAX，外牙收錄大徑及有效徑 MIN/MAX。內牙大徑與外牙小徑限界未列，保存為 `null`。畫面顯示「—」，不從基本牙型、`D−P`、推薦底孔、絲攻製造公差或量規尺寸補值。

`thread-extra-data.js` 的 66 筆資料以 `basic` 保存基本大徑、節徑、內牙小徑與外牙小徑；`internal`／`external` 均為 `null`。BA 的 D／P 採 Dormer 表值，BSW／BSF 的尺寸與 TPI 採 Thürmer 表，G 外徑與 TPI 採專用管牙表；節徑與小徑另依基本牙型幾何推算，畫面明示為基本值。G 公稱尺寸不能直接換成外徑，例如 G 1/2 的基本外徑為 20.955 mm，並非 12.7 mm。

基本值和限界使用不同欄位、不同表頭。內外小徑分開維護，介面依 `member` 選擇 `minorInternal` 或 `minorExternal`，不假設它們必須相同。牙型圖只示意尺寸位置，沒有依數值或角度比例繪製。

## 查找、分享網址與規格收藏

從分類頁點「螺紋資料」，或使用以下網址片段：

- `#thread`：開啟查表，沿用目前或已儲存的規格選擇。
- `#thread/metric-coarse-m10-p1-5/internal`：直接開 M10 × 1.5 內牙；最後一段可換成 `external`。
- `#thread/g-1-2/external`：直接開 G 1/2 外牙基本牙型。
- `#thread-calculator`：開啟保留的公制螺距／TPI 與 `D−P` 預鑽粗估。

一般格式為 `#thread/{record.id}/{internal|external}`。修改紀錄 ID 會影響分享網址與收藏，因此應保持穩定。

搜尋會正規化 Unicode、全形字元、乘號、引號與分數斜線；支援 `Ｍ１０×１．５`、`MF10 × 1.25`、`1/4-20 UNC`、`¼-20 UNC`、`G 1/2`、`BA 0`／`0BA` 等寫法。分數以完整公稱尺寸比對，避免把 `1/4` 當成 `1 1/4`；BA 號數也不以部分數字混配。輸入搜尋時會切到全部牙系，再依關鍵字篩選；沒有結果時隱藏尺寸內容並提供清除與重設。

內外牙、mm／in 及規格選擇共用原始公制資料。星號收藏以規格 ID 保存，在查表頁「常用規格」與工具主「收藏」頁都可重新開啟。複製內容包含規格、內外牙、公差等級或基本牙型標示、單位、尺寸及來源網址。只有公制 M／MF 顯示「公制攻牙換算」，把該筆公稱直徑與牙距帶入獨立粗估畫面。

資料檔只提供 `THREAD_DATA`／`THREAD_EXTRA_DATA`；`thread-ui.js` 合併後由 `window.ThreadLibrary` 串接 `mount()`、`open()`、`setUnit()`、`getHash()`。載入順序須為核心與目錄、兩份螺紋資料、`thread-ui.js`，最後才是 `app.js`，全部使用本機 classic script。

## 分類插圖

`illustrations/` 的五張圖依序為立銑刀加工台階、麻花鑽與盲孔剖面、車刀加工階梯軸、直槽絲攻進入預鑽孔，以及卡尺量測圓柱端面。採簡化技術手冊的示意風格，以銀灰藍材質、深藍輪廓、剖面線與少量接觸重點呈現，不使用背景弧線、漂浮切屑或彩色刀柄套圈。均為本站原創向量圖，透明底、`viewBox="0 0 240 160"`，不需要字型或外部圖片。

修改時優先檢查刀具與工件的接觸關係：銑刀平底與槽底相接、鑽體與孔壁對齊、車刀接觸外圓台階、絲攻底部留有預鑽孔餘量、卡尺相向量面貼合工件。幾何用途可參考 [Sandvik 溝槽銑削說明](https://www.sandvik.coromant.com/en-us/knowledge/milling/groove-or-slot-milling)與 [Mitutoyo 卡尺量面說明](https://www.mitutoyo.com/webfoo/wp-content/uploads/D_section.pdf#page=34)，圖片本身由本站繪製。

首頁與收藏頁共用 `app.js` 的 `cards()`，依分類 ID 載入同名 SVG。圖片已有相鄰的分類文字，故使用空白 `alt` 與裝飾標記，避免輔助閱讀重複朗讀。大小由 `app.css` 的 `.category-art` 控制：桌機 186 × 124px、手機 100 × 68px，操作導覽的小圖示維持獨立設定。

## 公式與範圍

| 分類 | 計算內容 |
| --- | --- |
| 銑削 | `n = 1000 × Vc / (π × D)`；`vf = n × z × fz` |
| 鑽削 | `n = 1000 × Vc / (π × D)`；`vf = n × fn` |
| 車削 | `n = 1000 × Vc / (π × D)`；`vf = n × fn` |
| 螺紋資料／公制換算 | 主入口依來源查表；`#thread-calculator` 保留 `P(mm) = 25.4 / TPI`、`TPI = 25.4 / P(mm)` 與預鑽粗估 `d ≈ D − P` |
| 公差與配合 | 基本尺寸加上下偏差求尺寸界限，再以孔減軸求最小與最大間隙 |

`D` 在銑削為實際切深的有效切削直徑，在鑽削為鑽頭直徑，在車削為工件加工直徑。`z` 為有效刀刃數；`fz` 是每齒進給，`fn` 是每轉進給。車削每分鐘進給由原廠時間式 `Tc = lm / (fn × n)` 等價推導。

攻牙 `D − P` 僅作公制 60° 切削攻牙的基本粗估，不套用成形攻牙，也不代替精密預鑽或刀具原廠指定孔徑。TPI 欄位只換算牙距，不會自動選定 UNC、UNF 或其他螺紋標準。

公差與配合計算器沒有內建 ISO 孔軸等級表或建議配合；它與上述有指定螺紋等級的查表資料分開。使用者必須自行輸入圖面偏差。正間隙表示孔較大，負間隙表示過盈；範圍跨越零為過渡配合，兩端全為零時畫面顯示零間隙。

預填數字只供示範計算，不是材料或刀具的建議加工條件。

## 全公制核心與方法契約

`engine.js` 提供 `window.MachiningMath`／`globalThis.MachiningMath`，亦可由 Node `require` 載入。核心一律接收真正的 `number`，不接受數字字串或空值。

| 方法 | 輸入與輸出 |
| --- | --- |
| `milling({ diameter, cuttingSpeed, teeth, feedPerTooth })` | 回傳 `{ rpm, feedRate }` |
| `drilling({ diameter, cuttingSpeed, feedPerRev })` | 回傳 `{ rpm, feedRate }` |
| `turning({ diameter, cuttingSpeed, feedPerRev })` | 回傳 `{ rpm, feedRate }` |
| `thread({ majorDiameter, pitch })` | 回傳 `{ pitch, tpi, tapDrill }` |
| `limits(nominal, upper, lower)` | 回傳 `{ min, max }` |
| `fit(holeMin, holeMax, shaftMin, shaftMax)` | 回傳 `{ minClearance, maxClearance, type }` |
| `pitchToTpi(pitch)`／`tpiToPitch(tpi)` | 回傳換算後的數字 |
| `mmToInch(mm)`／`inchToMm(inch)` | 回傳換算後的數字，可換算帶正負號的圖面偏差 |

核心單位為尺寸 `mm`、切削速度 `m/min`、每齒進給 `mm/tooth`、每轉進給 `mm/rev`；輸出轉速 `rpm`、每分鐘進給 `mm/min`。`fit.type` 為 `clearance`、`interference` 或 `transition`：最小間隙大於或等於零歸為 `clearance`；最小間隙為負且最大間隙小於或等於零歸為 `interference`；跨越零歸為 `transition`。全零另行顯示為零間隙。

直徑、速度、進給、螺距與實際尺寸必須大於零；刀刃數須為正的安全整數。圖面偏差允許正數、負數及零，但上偏差不得小於下偏差，計算後尺寸仍須大於零。非有限數字、溢位及無法表示的正數結果會拋出 `RangeError`。

## 同一份 UI 的模式與單位

桌機和手機共用畫面。`app.js` 動態渲染原計算欄位，`thread-ui.js` 渲染查表與規格收藏，沒有另一份手機計算或標準資料。

- 手機首頁保留五個分類列與底部導覽；選到螺紋分類後，原「計算」入口顯示為「查找」。共用樣式在 `app.css`，查表樣式在 `thread-library.css`。
- 查表頁提供牙系、規格與內外牙選擇；保留的公制換算頁才使用「依螺距／依 TPI」切換。
- 公差頁以「尺寸上下限／孔軸配合」切換；兩種模式共用基本尺寸，保留各自的偏差欄位。
- 顯示單位 `mm／in` 只改顯示與輸入換算，長度用 `25.4 mm/in`，切削速度用 `0.3048 m/ft`，刀刃數與 TPI 不換算。
- 計算成功後保存本次開啟期間的公制原值；切換顯示單位不以顯示時的四捨五入數字覆寫原值。
- 無效輸入會清空結果並停用複製。單位或子模式切換前，會先要求修正目前的無效輸入。

新增模式時，應一起更新 `fields()`、`run()`、`resultRows()` 與對應的目錄公式。修改單位時，須同步核對 `fromMetric()`、`toMetric()`、欄位單位及公式說明。

## 本機偏好與工作數值

工具偏好使用 `localStorage` 鍵 `cwli-machining-preferences-v1`，保存：

```json
{ "unit": "metric", "favorites": ["milling"] }
```

`unit` 為 `metric` 或 `imperial`；`favorites` 是工具分類 ID 清單。規格查表另外使用 `cwli-thread-reference-v1`：

```json
{ "selected": "metric-coarse-m10-p1-5", "member": "internal", "favorites": ["g-1-2"] }
```

`selected` 為規格 ID，`member` 為 `internal` 或 `external`，此處 `favorites` 是規格 ID 清單。查表顯示單位沿用工具偏好的 `unit`，不在螺紋鍵重複保存。搜尋字詞及原計算輸入只留在本次頁面開啟期間；重新整理後原計算回到示範值。兩個鍵都不儲存或改寫標準尺寸，不同網址或瀏覽器的偏好不會自動同步。

## 官方來源

公式來源清單在 `catalog.js`，依工具的 `sourceIds` 顯示。內容採自寫短說明，沒有收錄整份原廠文件。

- [Sandvik Coromant 銑削公制公式](https://cdn.sandvik.coromant.com/files/sitecollectiondocuments/services/metal-cutting-e-learning/formulas-and-definitions/formulas-and-deinitions-for-milling-metric-enu.pdf)：轉速與工作台進給。
- [Sandvik Coromant 鑽削公式與定義](https://www.sandvik.coromant.com/en-gb/knowledge/machining-formulas-definitions/drilling-formulas-definitions)：每轉進給與每分鐘進給。
- [Sandvik Coromant 車削公式與定義](https://www.sandvik.coromant.com/en-gb/knowledge/machining-formulas-definitions/general-turning-formulas-definitions)：加工直徑、轉速及加工時間式。
- [Sandvik Coromant 螺紋與攻牙公式](https://www.sandvik.coromant.com/en-gb/knowledge/machining-formulas-definitions/threading-formulas-definitions)：基本預鑽粗估，並區分切削與成形攻牙。
- [Sandvik Coromant 螺紋應用指南](https://cdn2.sandvik.coromant.com/files/a53b485b-be0f-019d-8100-3f0d1619b9fa/5370939c-6de5-4b34-a938-2fa290a42316/c-2920-031.pdf)：印刷頁 118 的螺距／TPI 換算。

螺紋資料的官方連結集中在兩份資料檔的 `sources`，並保留以下版本與範圍：

| 資料來源 | 本站採用範圍 |
| --- | --- |
| OSG Gauge Stock List，印刷 101／PDF 102 | 公制工件限界及基本尺寸；表引 JIS B0205-4、B0209-2/3:2001 |
| OSG USA CFD Die Products，印刷 23／PDF 25 | UN 2A 工件大徑與有效徑限界；不採推薦毛胚欄 |
| OSG USA Tapping Guide Vol.3 2024 | PDF 1 的 2B 小徑、PDF 2 的 2B 有效徑；不採推薦絲攻與百分比底孔欄 |
| Dormer Pramet 螺紋技術海報 | BA 的 D／P 列值、47.5° BA 與 55° Whitworth 基本牙型依據；不把 D1min 列當本工具的等級限界 |
| Thürmer Tools BSW／BSF 表及 G 圖表 | 規格／TPI，以及 G 的實際基本外徑；不使用底孔建議欄 |

這是已核對範圍的摘錄，不是完整標準或所有尺寸等級。UN 原表 inch 限界換算 mm，不表示精度增加。新增資料時應先核對工件／刀具／量規種類、內外牙、等級與頁碼；缺值保持 `null`，基本牙型推算只能放在 `basic`。

## 修改後檢查

在 `personal-site` 根目錄執行：

```powershell
node --check dist/tools/machining-calculator/engine.js
node --check dist/tools/machining-calculator/catalog.js
node --check dist/tools/machining-calculator/app.js
node --check dist/tools/machining-calculator/thread-data.js
node --check dist/tools/machining-calculator/thread-extra-data.js
node --check dist/tools/machining-calculator/thread-ui.js
node --check scripts/check-machining.mjs
node --check scripts/check-thread-data.mjs
node scripts/check-machining.mjs
node scripts/check-thread-data.mjs
```

原計算核心 14 組與螺紋資料 18 組目前皆通過。前者涵蓋固定計算值、單位、配合與輸入極值；後者涵蓋 36＋66 筆的唯一 ID、來源映射、上下限、基本值與空限界分離、M10×1.5、1/4-20、BA 0、G 1/2、BSF 1/4 基準，以及 classic script／CommonJS 匯出一致。程式與資料檢查不代表實際加工驗證。

調整表單、查找、導覽、單位或模式後，另在本機瀏覽器檢查五個分類、螺紋搜尋與分享網址、內外牙、空值、複製來源、兩種收藏、原公制換算與公差模式。可從網站根目錄執行 `node scripts/preview.mjs`，依終端機顯示的網址預覽。

2026-11-23 本輪 58 項 UI 檢查通過；已檢視 320、390、430、768、900、1024px 與預設 1391px 桌機版，頁面及尺寸表沒有橫向溢出。手機精確搜尋單筆時不顯示重複結果，多筆搜尋選取後移至資料標題；原四類計算與公制攻牙換算仍正常。瀏覽器沒有 JavaScript 錯誤或警告，臨時視窗尺寸已恢復。詳細範圍與本機截圖位置見根目錄 `QA.md`。
