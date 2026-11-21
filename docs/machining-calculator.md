# 加工計算工具箱維護說明

工具位於 `dist/tools/machining-calculator/index.html`，可直接在本機瀏覽器開啟，也可由網站的「個人小工具」入口進入。所有計算在瀏覽器執行，不會上傳輸入數值。

## 檔案分工

| 檔案 | 維護內容 |
| --- | --- |
| `dist/tools/machining-calculator/index.html` | 共用頁面、單位按鈕、桌機與手機導覽、本機 SVG 圖示 |
| `dist/tools/machining-calculator/app.css` | 本工具版面與手機樣式 |
| `dist/tools/machining-calculator/app.js` | 表單、顯示單位、模式切換、錯誤與結果、收藏 |
| `dist/tools/machining-calculator/engine.js` | 純數學核心與輸入驗證；不讀取 DOM 或儲存資料 |
| `dist/tools/machining-calculator/catalog.js` | 五個分類、公式短說明、適用範圍與官方來源 |
| `dist/tools/machining-calculator/illustrations/` | 五張原創加工 SVG 插圖，依分類 ID 命名 |
| `scripts/check-machining.mjs` | 14 組核心回歸檢查，不開瀏覽器、不使用網路、不改寫檔案 |

分類 `id`、工具 `id` 與 `method` 是穩定識別。修改標題與說明時，保留這些識別，才能維持網址、收藏及方法對應。

## 分類插圖

`illustrations/` 的五張圖依序為立銑刀切削方塊、麻花鑽鑽孔、車刀加工圓柱、螺栓螺帽，以及游標卡尺量測。均為本站原創向量圖，透明底、`viewBox="0 0 240 160"`，不需要字型或外部圖片。

首頁與收藏頁共用 `app.js` 的 `cards()`，依分類 ID 載入同名 SVG。圖片已有相鄰的分類文字，故使用空白 `alt` 與裝飾標記，避免輔助閱讀重複朗讀。大小由 `app.css` 的 `.category-art` 控制：桌機 186 × 124px、手機 100 × 68px，操作導覽的小圖示維持獨立設定。

## 公式與範圍

| 分類 | 計算內容 |
| --- | --- |
| 銑削 | `n = 1000 × Vc / (π × D)`；`vf = n × z × fz` |
| 鑽削 | `n = 1000 × Vc / (π × D)`；`vf = n × fn` |
| 車削 | `n = 1000 × Vc / (π × D)`；`vf = n × fn` |
| 螺紋與攻牙 | `P(mm) = 25.4 / TPI`；`TPI = 25.4 / P(mm)`；公制切削攻牙預鑽孔徑粗估 `d ≈ D − P` |
| 公差與配合 | 基本尺寸加上下偏差求尺寸界限，再以孔減軸求最小與最大間隙 |

`D` 在銑削為實際切深的有效切削直徑，在鑽削為鑽頭直徑，在車削為工件加工直徑。`z` 為有效刀刃數；`fz` 是每齒進給，`fn` 是每轉進給。車削每分鐘進給由原廠時間式 `Tc = lm / (fn × n)` 等價推導。

攻牙 `D − P` 僅作公制 60° 切削攻牙的基本粗估，不套用成形攻牙，也不代替精密預鑽或刀具原廠指定孔徑。TPI 欄位只換算牙距，不會自動選定 UNC、UNF 或其他螺紋標準。

公差工具沒有內建 ISO 公差等級、孔軸標準表或建議配合。使用者必須自行輸入圖面數值。正間隙表示孔較大，負間隙表示過盈；範圍跨越零為過渡配合，兩端全為零時畫面顯示零間隙。

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

桌機和手機共用同一份表單與結果。`app.js` 動態渲染各分類欄位，沒有另一份手機計算邏輯。

- 手機首頁以五個大圖示分類列呈現，底部固定「分類／計算／收藏／說明」；版面斷點及觸控尺寸集中在 `app.css` 的繁體中文分區。
- 螺紋頁以「依螺距／依 TPI」切換同一個公制螺距值。
- 公差頁以「尺寸上下限／孔軸配合」切換；兩種模式共用基本尺寸，保留各自的偏差欄位。
- 顯示單位 `mm／in` 只改顯示與輸入換算，長度用 `25.4 mm/in`，切削速度用 `0.3048 m/ft`，刀刃數與 TPI 不換算。
- 計算成功後保存本次開啟期間的公制原值；切換顯示單位不以顯示時的四捨五入數字覆寫原值。
- 無效輸入會清空結果並停用複製。單位或子模式切換前，會先要求修正目前的無效輸入。

新增模式時，應一起更新 `fields()`、`run()`、`resultRows()` 與對應的目錄公式。修改單位時，須同步核對 `fromMetric()`、`toMetric()`、欄位單位及公式說明。

## 本機偏好與工作數值

`localStorage` 鍵為 `cwli-machining-preferences-v1`，只保存：

```json
{ "unit": "metric", "favorites": ["milling"] }
```

`unit` 為 `metric` 或 `imperial`；`favorites` 是分類 ID 清單。計算輸入值只留在本次頁面開啟期間，重新整理後回到示範值，不寫入此鍵。不同網址或瀏覽器的偏好不會自動同步。

## 官方來源

來源清單在 `catalog.js`，依工具的 `sourceIds` 顯示。內容採自寫短說明，沒有收錄整份原廠文件。

- [Sandvik Coromant 銑削公制公式](https://cdn.sandvik.coromant.com/files/sitecollectiondocuments/services/metal-cutting-e-learning/formulas-and-definitions/formulas-and-deinitions-for-milling-metric-enu.pdf)：轉速與工作台進給。
- [Sandvik Coromant 鑽削公式與定義](https://www.sandvik.coromant.com/en-gb/knowledge/machining-formulas-definitions/drilling-formulas-definitions)：每轉進給與每分鐘進給。
- [Sandvik Coromant 車削公式與定義](https://www.sandvik.coromant.com/en-gb/knowledge/machining-formulas-definitions/general-turning-formulas-definitions)：加工直徑、轉速及加工時間式。
- [Sandvik Coromant 螺紋與攻牙公式](https://www.sandvik.coromant.com/en-gb/knowledge/machining-formulas-definitions/threading-formulas-definitions)：基本預鑽粗估，並區分切削與成形攻牙。
- [Sandvik Coromant 螺紋應用指南](https://cdn2.sandvik.coromant.com/files/a53b485b-be0f-019d-8100-3f0d1619b9fa/5370939c-6de5-4b34-a938-2fa290a42316/c-2920-031.pdf)：印刷頁 118 的螺距／TPI 換算。

## 修改後檢查

在 `personal-site` 根目錄執行：

```powershell
node --check dist/tools/machining-calculator/engine.js
node --check dist/tools/machining-calculator/catalog.js
node --check dist/tools/machining-calculator/app.js
node --check scripts/check-machining.mjs
node scripts/check-machining.mjs
```

核心檢查目前包含 14 組：固定銑削數值、鑽削／車削、螺距／TPI、公英制往返、偏差正負值、三種配合與零邊界、不合法輸入、安全整數刀刃、極值，以及目錄來源對應。其結果不代表瀏覽器操作或實際加工驗證。

調整表單、導覽、單位或模式後，另在本機瀏覽器檢查五個分類、公英制切換、螺紋與公差子模式、無效輸入清空結果及收藏保存。可從網站根目錄執行 `node scripts/preview.mjs`，依終端機顯示的網址預覽。

本次核心與瀏覽器驗證紀錄見根目錄 `QA.md` 的「加工計算工具箱」段落。
