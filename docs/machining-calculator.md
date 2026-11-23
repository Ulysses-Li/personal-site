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
| `dist/tools/machining-calculator/thread-extended-data.js` | 173 筆擴充規格：公制／統一牙／G、24 筆新增公制工件限界、Tr／Pg 公稱資料 |
| `dist/tools/machining-calculator/thread-bsp-data.js` | 30 筆 R／Rc／Rp 基本尺寸、成員限制、直徑錐度與 R 外牙距離 a |
| `dist/tools/machining-calculator/thread-npt-data.js` | 31 筆 NPT／NPTF 的 E₁、L1、來源版本，以及各自獨立的牙型參考 |
| `dist/tools/machining-calculator/thread-search.js` | 不依賴 DOM 的牙系代號、前後置別名、完整尺寸、編號與牙距搜尋 |
| `dist/tools/machining-calculator/thread-ui.js` | 合併資料、用途分流、規格／內外牙、基準面、查表單位、規格收藏與複製來源 |
| `dist/tools/machining-calculator/thread-library.css` | 螺紋查表的獨立桌機、手機與尺寸表格版面 |
| `scripts/check-machining.mjs` | 14 組核心回歸檢查，不開瀏覽器、不使用網路、不改寫檔案 |
| `scripts/check-thread-data.mjs` | 18 組限界、基本牙型、合併身份、來源及匯出檢查 |
| `scripts/check-thread-library.mjs` | 完整擴充資料的筆數、牙系、限界／空值、基準面、成員及搜尋回歸檢查 |

分類 `id`、工具 `id` 與 `method` 是穩定識別。修改標題與說明時，保留這些識別，才能維持網址、收藏及方法對應。

## 螺紋資料庫的範圍

五個工具維持原有分類順序；其中 `thread` 分類開啟「螺紋資料」查表，不直接進入攻牙粗估。五份資料檔合併後共有 **15 牙系、336 個規格**：原始 36＋66 筆、直牙擴充 173 筆、BSP 管牙 30 筆、美制錐管牙 31 筆。用途入口分為一般牙、管牙與其他，並可選全部。

| 牙系 | 筆數 | 資料性質 |
| --- | ---: | --- |
| M 公制粗牙 | 40 | 部分收錄工件限界，其餘為基本牙型；等級依筆顯示 |
| MF 公制細牙 | 70 | 同為 M × P 標註；部分工件限界，其餘為基本牙型 |
| UNC | 29 | 原 10 筆有 2B／2A 工件限界，擴充部分為基本牙型 |
| UNF | 24 | 原 10 筆有 2B／2A 工件限界，擴充部分為基本牙型 |
| UNEF | 18 | 僅統一超細牙基本牙型，無等級限界 |
| BA | 17 | BA 0–16，僅基本牙型 |
| BSW | 22 | 僅基本牙型 |
| BSF | 9 | 僅基本牙型 |
| G／BSPP | 19 | 僅平行管螺紋基本牙型，與 Rp 分開 |
| R／Rc・BSPT | 15 | 1/16″–6″ 基準平面基本尺寸；R 外錐牙／Rc 內錐牙，PT 為歷史查找名稱 |
| Rp | 15 | 1/16″–6″ 平行內管牙基本尺寸；PS 為歷史查找名稱，無 Rp 外牙 |
| NPT | 19 | 1/16″–12″；1957 基本表的 E₁／L1，另有最大基本牙高模型參考，不含工件限界 |
| NPTF | 12 | 1/16″–3″；獨立 E₁／L1 及固定基本 E₁ 的內外牙截形參考範圍 |
| Tr | 17 | 30° 公制梯形牙；僅公稱直徑與牙距 |
| Pg | 10 | 80° 電線管牙；僅公稱外徑與 TPI，號數不是毫米外徑 |

**60 筆資料有已核對的工件限界**：`thread-data.js` 原有 36 筆，加上 `thread-extended-data.js` 新增 24 筆公制資料。內牙收錄有效徑及小徑 MIN/MAX，外牙收錄大徑及有效徑 MIN/MAX；內牙大徑與外牙小徑限界未列，保存為 `null`。公差等級由每筆 `internal.className`／`external.className` 決定：M1、M1.1、M1.2、M1.4 為 5H／6h，其餘已收錄公制限界為 6H／6g，UNC／UNF 已收錄限界為 2B／2A。不能把所有公制規格固定標成 6H／6g。

**其餘 276 筆是基本或公稱資料，沒有指定等級限界。** `basic` 與 `internal`／`external` 的限界分開保存。BA 的 D／P 採 Dormer 表值，BSW／BSF 的尺寸與 TPI 採 Thürmer 表，G 外徑與 TPI 採專用管牙表；部分節徑與小徑另依對應基本牙型推算。公制及 UN 擴充基本幾何也明示為基本值。G 公稱尺寸不能直接換成外徑，例如 G 1/2 的基本外徑為 20.955 mm，並非 12.7 mm。

其中 Tr 17 筆與 Pg 10 筆僅保存公稱直徑、牙距或 TPI；`nominalOnly: true`，所有 `basic` 直徑與內外牙限界均為 `null`。Tr 不套用 60° 牙型，Pg 號數不直接當毫米外徑。不得從公稱值、`D−P`、推薦底孔、絲攻製造公差或量規尺寸補造工件尺寸。

基本值和限界使用不同欄位、不同表頭。內外小徑分開維護，介面依 `member` 選擇 `minorInternal` 或 `minorExternal`，不假設它們必須相同。牙型圖只示意尺寸位置，沒有依數值或角度比例繪製。

## 管牙的成員、錐度與基準位置

`thread-bsp-data.js` 採 REX 原廠表列的 JIS B 0203 基本尺寸，來源註明摘自 2006 年版 JIS 手冊。R／Rc 共用 `bspt` 牙系：R 是外錐牙、Rc 是內錐牙；Rp 是另一個僅支援內牙的平行牙系，用來配合 R，與 G 分開。PT／PS 只提供歷史名稱搜尋，不能據此宣稱所有歷史尺寸、公差與量規可互換。

R／Rc、NPT、NPTF 的 `geometry` 為 `tapered`；`taper.diameterRatio: 16` 表示**直徑變化與軸向長度之比為 1:16**，不是半徑錐度，也不是牙型角。錐牙的直徑隨軸向位置改變，必須連同 `referencePlane` 理解。R 外牙由管端量距離 `a` 到基準面；Rc 內牙以管口端面為基準。`referenceLengthMembers: ['external']` 讓 `a` 只在 R 外牙顯示，不當作 Rc 攻牙深度。Rp 為 `parallel`、`taper: null`，外牙選項停用。

`thread-npt-data.js` 分別摘錄 NBS H28（1957）Part II 的 NPT 與 NPTF 工件基本表，介面顯示 **「NBS H28 · 1957 基本表」**版本標示；這是歷史基本資料，不是現行標準完整表或製造驗收限界。表列 `E₁` 為 `L1` 手緊旋合基準平面的基本節徑。原始大、小徑及其限界未收錄，`basic.major`、`basic.minorInternal`、`basic.minorExternal` 與內外牙限界仍保留空值。管材外徑另存 `pipeOutsideDiameterMm`，不當作該平面的螺紋大徑。

19 筆 NPT 的 `profileReference` 另存對稱最大基本牙高模型：`h = 0.8P`、大徑參考 `E₁ + h`、小徑參考 `E₁ − h`。依據為印刷頁 2–4／PDF 12–14 的 §2、圖 VII.1 及表 VII.1。最大指牙高，不代表工件最大大徑；實際牙頂、牙底截短及量規旋合位置允差另有規定。因此畫面以「大徑參考／小徑參考」、約等號與「牙型計算參考」呈現，表頭為「基本／參考值」，不填入 MIN／MAX。顯示取 mm 三位、inch 五位小數，複製內容一併保留模型公式與適用範圍。1/16-27 的參考大徑約 7.895 mm、參考小徑約 6.389 mm。

12 筆 NPTF 的 `profileReference.kind` 是 `dryseal-truncation-range`。採印刷頁 20／PDF 30 表 VIII.2 的尖 V 高 `H`、牙頂徑向截短 `fc` 與牙底徑向截短 `fr`，不誤用右側平寬 `F`。參考範圍分存在 `members.internal`／`members.external`：內牙大徑 `E₁ + H − 2fr`、小徑 `E₁ − H + 2fc`；外牙大徑 `E₁ + H − 2fc`、小徑 `E₁ − H + 2fr`。每個範圍的 min/max 僅屬固定基本 `E₁` 的截形參考，並未加入量規旋合位置、錐度等完整製造許差，不寫入 `record.internal`／`record.external` 工件限界。內外切換時，尺寸與複製公式都要一起更新。

NPTF 1/16-27 內牙的大徑參考為 7.693～7.779 mm，小徑參考為 6.414～6.505 mm；外牙大徑參考則為 7.779～7.870 mm。畫面表頭為「基本／參考範圍」，附「截形參考範圍」標記。小螢幕可將兩個完整端點分列，保留數字閱讀大小，不能裁切或在數字中間換行。

基本牙型、基準平面與公稱欄位缺值都顯示「—」，不代表零。新增管牙時，須同時核對 `supportedMembers`、`memberDesignations`、`referenceLabel`、錐度及基準距離的成員適用範圍。

## 查找、分享網址與規格收藏

從分類頁點「螺紋資料」，或使用以下網址片段：

- `#thread`：開啟查表，沿用目前或已儲存的規格選擇。
- `#thread/metric-coarse-m10-p1-5/internal`：直接開 M10 × 1.5 內牙；最後一段可換成 `external`。
- `#thread/g-1-2/external`：直接開 G 1/2 外牙基本牙型。
- `#thread/bspt-1-2/internal`：開 Rc 1/2；改為 `external` 則是 R 1/2。
- `#thread/rp-1-2/internal`：開 Rp 1/2 平行內牙；不能切成 Rp 外牙。
- `#thread/npt-1-2/external`：開 NPT 1/2 的歷史基準平面資料。
- `#thread-calculator`：開啟保留的公制螺距／TPI 與 `D−P` 預鑽粗估。

一般格式為 `#thread/{record.id}/{internal|external}`。修改紀錄 ID 會影響分享網址與收藏，因此應保持穩定。

搜尋由 `thread-search.js` 先辨識完整牙系與公稱尺寸，再比對牙距／TPI。它會正規化 Unicode、全形字元、乘號、引號與分數斜線，支援 `Ｍ１０×１．５`、`MF10 × 1.25`、`¼-20 UNC`、`UNC #6-32`、`BA 0`／`0BA`、`PT 1/2`／`1/2 PT`、`NPT 1/4`／`1/4 NPT`、`NPTF 1/4`、`PS 1/2` 等寫法。NPT 不會部分命中 NPTF；分數以完整公稱尺寸比對，避免把 `1/4` 當成 `1 1/4`，BA 號數與編號統一牙也分開處理。

輸入搜尋會切到全部用途與全部牙系，再依關鍵字篩選；選「一般牙／管牙／其他」或牙系時則清除搜尋字詞。`R` 代號會選外牙，`Rc`／`Rp`／`PS` 會選內牙，PT 僅作牙系別名；選到只支援內牙的 Rp 時會自動維持內牙。沒有結果時隱藏尺寸內容並提供清除與重設。

內外牙、mm／in 及規格選擇共用原始公制資料。星號收藏以規格 ID 保存，在查表頁「常用規格」與工具主「收藏」頁都可重新開啟。複製內容包含規格、內外牙、公差等級或基本牙型標示、單位、尺寸及來源網址。只有公制 M／MF 顯示「公制攻牙換算」，把該筆公稱直徑與牙距帶入獨立粗估畫面。

五份資料檔分別提供 `THREAD_DATA`、`THREAD_EXTRA_DATA`、`THREAD_BSP_DATA`、`THREAD_NPT_DATA`、`THREAD_EXTENDED_DATA`，均可供 Node 載入；`thread-search.js` 提供 `THREAD_SEARCH`。`thread-ui.js` 依穩定 ID 合併資料後，由 `window.ThreadLibrary` 串接 `mount()`、`open()`、`setUnit()`、`getHash()`。載入順序為 `engine.js`、`catalog.js`、五份資料、`thread-search.js`、`thread-ui.js`、`app.js`，全部使用本機 classic script，不需 fetch 或 CDN。

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

桌機和手機共用畫面。`app.js` 動態渲染原計算欄位，`thread-ui.js` 渲染查表與規格收藏，`thread-search.js` 提供兩者可檢查的純搜尋規則，沒有另一份手機計算或標準資料。

- 手機首頁保留五個分類列與底部導覽；選到螺紋分類後，原「計算」入口顯示為「查找」。共用樣式在 `app.css`，查表樣式在 `thread-library.css`。
- 查表頁先依一般牙／管牙／其他用途分流，再選牙系、規格與內外牙；成員可用性由資料決定。保留的公制換算頁才使用「依螺距／依 TPI」切換。
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

螺紋資料的官方連結集中在五份資料檔的 `sources`，並保留以下版本與範圍：

| 資料來源 | 本站採用範圍 |
| --- | --- |
| OSG Gauge Stock List，印刷 101／PDF 102 | 公制工件限界及基本尺寸；表引 JIS B0205-4、B0209-2/3:2001。M1–M1.4 的 5H／6h 與其他列的 6H／6g 分別保存 |
| OSG USA CFD Die Products，印刷 23／PDF 25 | UN 2A 工件大徑與有效徑限界；不採推薦毛胚欄 |
| OSG USA Tapping Guide Vol.3 2024 | PDF 1 的 2B 小徑、PDF 2 的 2B 有效徑；不採推薦絲攻與百分比底孔欄 |
| Dormer Pramet 螺紋技術海報 | BA 的 D／P、47.5° BA、55° Whitworth 與 60° M／UN 基本牙型依據，及核對 M4×0.5；不把 D1min 列當本工具的等級限界 |
| Thürmer Tools 官方規格表及 G 圖表 | 公制／UNC／UNF／UNEF／BSW／BSF／Tr／Pg 規格、牙距或 TPI，以及 G 的實際基本外徑；不使用底孔建議欄。M4×0.35 疑義列排除，改採 Dormer 已列的 M4×0.5 |
| REX F50A 原廠手冊，印刷 22／PDF 24 表 11 | 引用 2006 年版 JIS 手冊的 JIS B 0203 R／Rc／Rp 基本徑與 R 外牙基準距離 a；不採管材外徑或軸向許差作直徑限界 |
| OSG《管用ねじ規格と工具について》No.3，2019.12 修訂 | 印刷 2、4、6／PDF 4、6、8：55°、1:16、成員配合與 PT／PS 舊稱背景；不據此保證舊今量規可互換 |
| NIST 保存的 NBS H28（1957）Part II | NPT 表 VII.2，印刷 5–6／PDF 15–16；NPTF 表 VIII.4，印刷 21–22／PDF 31–32，分別採 E₁／L1。NPT 另依印刷 2–4／PDF 12–14 建立牙高參考；NPTF 依印刷 20／PDF 30 表 VIII.2 建立截形範圍。不把量規製造尺寸當工件限界 |
| YAMAWA YEU23，印刷 711／電子頁 713 | 交叉核對 NPTF 1/16 與 1/2 在固定基本 E₁ 位置的小徑，排除預鑽及絲攻尺寸欄 |
| Vermont Gage〈NPT Taper Pipe Thread Inspection〉 | 核對 NPT 的 60°、1:16、E₁／L1 定義與 NPTF 的差異；不作逐尺寸數值來源 |

這是已核對範圍的摘錄，不是完整標準或所有尺寸等級。UN 原表 inch 限界換算 mm，不表示精度增加。新增資料時應先核對工件／刀具／量規種類、內外牙、等級與頁碼；缺值保持 `null`，基本牙型推算只能放在 `basic`。

## 修改後檢查

在 `personal-site` 根目錄執行：

```powershell
node --check dist/tools/machining-calculator/engine.js
node --check dist/tools/machining-calculator/catalog.js
node --check dist/tools/machining-calculator/app.js
node --check dist/tools/machining-calculator/thread-data.js
node --check dist/tools/machining-calculator/thread-extra-data.js
node --check dist/tools/machining-calculator/thread-extended-data.js
node --check dist/tools/machining-calculator/thread-bsp-data.js
node --check dist/tools/machining-calculator/thread-npt-data.js
node --check dist/tools/machining-calculator/thread-search.js
node --check dist/tools/machining-calculator/thread-ui.js
node --check scripts/check-machining.mjs
node --check scripts/check-thread-data.mjs
node --check scripts/check-thread-library.mjs
node scripts/check-machining.mjs
node scripts/check-thread-data.mjs
node scripts/check-thread-library.mjs
```

原計算核心 14 組與原始螺紋資料 18 組保留為回歸檢查。前者涵蓋固定計算值、單位、配合與輸入極值；後者涵蓋原 36＋66 筆的唯一 ID、來源映射、上下限、基本值與空限界分離、M10×1.5、1/4-20、BA 0、G 1/2、BSF 1/4 基準，以及 classic script／CommonJS 匯出一致。它們原有的通過紀錄不涵蓋本輪所有擴充資料。

新增 `check-thread-library.mjs` 的 50 組檢查已通過，涵蓋完整 336 筆／15 牙系、60 筆工件限界、空尺寸、Tr／Pg 公稱資料、內外牙能力、R 的 a／Rc 基準面、NPT／NPTF 歷史 E₁／L1、19 筆 NPT 模型與 12 筆獨立 NPTF 截形範圍、徑向截短與內外牙映射、參考資料和工件限界分離、完整代號及尺寸搜尋、classic script 載入與匯出。原資料 18 組與原計算 14 組也已通過。程式與資料檢查不代表實際加工驗證。

調整表單、查找、導覽、單位或模式後，另在本機瀏覽器檢查五個分類、用途分流、完整螺紋搜尋與分享網址、Rp 外牙停用、R／Rc 基準面、歷史版本標示、空值、複製來源、兩種收藏、原公制換算與公差模式。可從網站根目錄執行 `node scripts/preview.mjs`，依終端機顯示的網址預覽。

2026-11-23 本輪 58 項 UI 檢查通過，涵蓋十五牙系完整選單、用途分流、管牙別名、內外牙與 Rp 能力限制、R／Rc 基準面、NPT E₁／L1 與獨立管材外徑、實際剪貼簿、單位往返及收藏深連結。已檢查 320、390、430、768、1024、1391px 查表頁，沒有橫向溢出；手機選規格後修正重複的頁首間距。瀏覽器沒有 JavaScript 錯誤或警告，臨時視窗尺寸已恢復。截圖與細節見根目錄 `QA.md`；舊初版紀錄另外保留。
