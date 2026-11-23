# Louis Li｜工程實踐與技術筆記

這是放在你電腦裡的完整網站專案，位置是 `C:\Users\Louis\Desktop\CWLI\personal-site`。

本站同時作為個人介紹、作品集、面試履歷與長期技術知識索引。原本 `C:\Users\Louis\Desktop\links` 保留，新版採獨立資料夾維護。

## 開啟網站

**直接雙擊根目錄的 `開啟網站.html`**，就會開啟 `dist/index.html`。也可以直接將 `dist/index.html` 拖進瀏覽器。

所有前端資源均在本專案內，不需要 CDN、安裝套件或建置；介紹、作品詳情、技術搜尋與履歷可在本機使用。外部作品連結、Email 與 LINE 則連到對應網站或應用程式。

需要 HTTP 預覽時，在本資料夾執行：

```powershell
node scripts/preview.mjs
```

開啟程式顯示的 `http://127.0.0.1:5503`。關閉預覽可按 Ctrl+C。一般修改內容不需要執行發佈工具。

## 檔案結構

```text
personal-site/
├─ 開啟網站.html             雙擊開啟本機網站
├─ README.md                 本說明與 Git 使用方式
├─ QA.md                     驗證紀錄與限制
├─ .editorconfig             UTF-8 與兩格縮排設定
├─ .gitattributes            Git 文字換行與圖片格式設定
├─ .gitignore                Git 排除暫存檔與憑證
├─ dist/                     完整網站；可直接開啟與修改
│  ├─ index.html             五個頁面的版面與固定文案
│  ├─ content.js             個人資料、能力、作品、技術主題、履歷
│  ├─ styles.css             共用版面、手機版、列印版
│  ├─ studio.css             個人工作室首頁、作品舞台與微互動
│  ├─ tools.css              小工具卡片、搜尋分類與首頁入口
│  ├─ work.css               作品展示、專案縮圖、卡片與詳情的響應式排版
│  ├─ app.js                 導覽、列表、搜尋、分類、詳情與列印
│  ├─ tools/                 羽球 badminton/、FANUC 查找 fanuc-macro/、加工 machining-calculator/
│  │  └─ machining-calculator/
│  │     ├─ thread-data.js       M／MF／UNC／UNF 工件螺紋限界與來源
│  │     ├─ thread-extra-data.js BA／BSW／BSF／G 基本牙型與來源
│  │     ├─ thread-extended-data.js 公制／統一牙擴充、Tr／Pg 公稱規格
│  │     ├─ thread-bsp-data.js   R／Rc／Rp 管牙基本尺寸、錐度與基準面
│  │     ├─ thread-npt-data.js   NPT／NPTF 歷史基本節徑與 L1
│  │     ├─ thread-search.js     牙系別名、完整尺寸與牙距的純搜尋規則
│  │     ├─ thread-ui.js         螺紋搜尋、內外牙、單位、規格收藏與複製
│  │     └─ thread-library.css   螺紋查表的獨立響應式版面
│  └─ assets/                共用 theme.css、頭像、圖示與專案截圖
├─ docs/
│  ├─ support-center-case.md 代表作品的事實與畫面來源
│  ├─ badminton-tool.md      羽球工具複本、修改位置與驗證說明
│  ├─ fanuc-macro-tool.md    FANUC 資料、手冊來源及工具維護方式
│  └─ machining-calculator.md 加工計算、單位、公式來源與維護方式
├─ scripts/
│  ├─ preview.mjs            可選的本機預覽工具
│  ├─ check-fanuc.mjs        FANUC 條目、來源關聯及 G65 引數對照檢查
│  ├─ check-machining.mjs    加工公式、輸入驗證與單位換算檢查
│  ├─ check-thread-data.mjs  螺紋限界／基本牙型、合併資料與來源檢查
│  ├─ check-thread-library.mjs 全部擴充牙系、管牙基準與搜尋檢查
│  └─ publish-source.mjs     可選的 Sites 發佈工具
└─ .openai/hosting.json      既有 Sites 身分與部署設定
```

`.git/` 保存本機版本紀錄；`.staging/` 是先前發佈保留的封裝資料，已排除於 Git 之外，不是日常編輯的位置。

## 維護內容

主要編輯 `dist/content.js`：

- `profile`：個人資料與聯絡入口。姓名、職稱、個人簡介與 Email 會套用到頁面；其餘固定文案與頁尾位於 `index.html`。
- `showcase`：首頁可切換的專案畫面，包含按鈕標籤、標題、圖片路徑、說明與對應正式網址。
- `tools`：個人小工具清單，已加入「羽球開打」、「FANUC Macro B 指令手冊」及「加工計算工具箱」。填入工具名稱、分類、用途、標籤與網址後，工具箱會自動產生卡片、分類與搜尋。
- `competencies`：四類能力，會同步顯示在首頁與履歷。
- `projects`：每個案例保留背景、方法、證據與下一步；只有可確認的成果才加入。只在一筆作品設定 `featured: true` 選擇代表作，`highlights` 保存參與重點，`previewIds` 對應該作品在 `showcase` 的畫面 ID，`previewTitle` 設定預覽框名稱；個人工程網站的 `cover`／`coverAlt` 設定實際縮圖與圖片說明。
- `knowledge`：每個主題包含分類、關鍵字與文章段落。現有 8 篇為整理範本；轉成正式文章時，需同步調整 `app.js` 的範本顯示文字。
- `resume`：個人摘要、技術清單與待補資料。

`dist/assets/theme.css` 管理主站與小工具共用配色；`dist/styles.css` 管理共用版面與列印版；`dist/studio.css` 管理新版首頁排版與微互動。`dist/app.js` 管理導覽、作品舞台、案例詳情、知識搜尋與分類。

## 最常用的修改方式

| 想修改什麼 | 編輯位置 |
| --- | --- |
| 姓名、職稱、簡介、聯絡方式 | `content.js` 的 `profile` |
| 首頁專長與履歷能力 | `content.js` 的 `competencies` |
| 新增作品、補上成果與證據 | `content.js` 的 `projects` |
| 新增技術主題與文章段落 | `content.js` 的 `knowledge` |
| 履歷摘要、技術與待補資料 | `content.js` 的 `resume` |
| 首頁大標題、固定介紹、頁尾 | `index.html` 的繁體中文分區 |
| 首頁展示的專案畫面與連結 | `content.js` 的 `showcase` |
| 新增自己的小工具 | `content.js` 的 `tools`；本機程式放在 `dist/tools/` |
| 主站與工具的背景、文字、按鈕及卡片色彩 | `assets/theme.css` 的共用色彩變數 |
| 首頁錯落卡片、漂浮標籤、畫面舞台 | `studio.css` 的繁體中文分區 |
| 小工具的卡片與搜尋分類版面 | `tools.css` 的繁體中文分區 |
| 作品頁的代表作、專案卡片、縮圖與詳情字級 | `work.css` 的繁體中文分區 |
| 螺紋工件限界、基本牙型與公稱規格 | `tools/machining-calculator/thread-data.js`、`thread-extra-data.js`、`thread-extended-data.js` |
| R／Rc／Rp 與 NPT／NPTF 管牙資料 | `tools/machining-calculator/thread-bsp-data.js`／`thread-npt-data.js` |
| 螺紋搜尋、查表、規格收藏與版面 | `tools/machining-calculator/thread-search.js`、`thread-ui.js`、`thread-library.css` |
| 手機與列印版面 | `styles.css` 的響應式與列印區塊 |
| 搜尋、切頁與詳情行為 | `app.js` 的編號功能區塊 |

用 VS Code 或其他支援 UTF-8 的文字編輯器開啟整個資料夾。修改後儲存，再重新整理瀏覽器；若仍看到舊樣式，可按 Ctrl+F5。

新增資料時，複製同類型的一整個物件，保留欄位名稱與逗號。`projects` 與 `knowledge` 的 `id` 應維持唯一且穩定，因為它會成為詳情網址的一部分。

## 新增自己的小工具

上方導覽「小工具」與首頁「打開工具箱」皆通往 `#tools`。目前已有「羽球開打」，程式位於 `dist/tools/badminton/`；詳細修改說明見 `docs/badminton-tool.md`。

「FANUC Macro B 指令手冊」位於 `dist/tools/fanuc-macro/`，涵蓋 Macro B 與銑床／加工中心常用 G、M 指令。條目與來源分別在 `macro-data.js`、`command-data.js` 維護；支援代碼別名、變數範圍、中文及多詞搜尋、用途分類、收藏、複製與 G65 引數對照。修改後可執行 `node scripts/check-fanuc.mjs` 檢查資料。完整說明見 `docs/fanuc-macro-tool.md`。

FANUC 手機版的 App 外觀集中於同目錄 `mobile.css`；固定搜尋、底部「查指令／引數表／收藏／說明」、分頁查詢記憶及詳情返回由 `app.js` 管理，800px 以下啟用。

「加工計算工具箱」位於 `dist/tools/machining-calculator/`，提供銑削、鑽削、車削、螺紋資料、公差與配合五個分類，支援公英制、結果複製及收藏。螺紋入口目前收錄 **15 個牙系、336 個規格**，可依「一般牙／管牙／其他」用途及牙系查找。

資料包含 M 粗牙 40、MF 細牙 70、UNC 29、UNF 24、UNEF 18、BA 17、BSW 22、BSF 9、G／BSPP 19、R／Rc 15、Rp 15、NPT 19、NPTF 12、Tr 17、Pg 10 筆。R／Rc 與 Rp 收錄 1/16″–6″；NPT 至 12″，NPTF 至 3″。PT、PS 作歷史名稱查找，分別導向 R／Rc、Rp，不建立重複規格，也不宣稱所有舊版公差與量規相同。

其中 **60 筆** M／MF／UNC／UNF 收錄已核對的工件限界；公差等級依各筆顯示，新增 M1–M1.4 為內牙 5H／外牙 6h，其餘已收錄公制為 6H／6g、統一牙為 2B／2A。其餘 **276 筆** 為基本牙型、基準平面或公稱資料；Tr 17 筆與 Pg 10 筆僅有公稱規格及牙距。來源未列的限界或尺寸以「—」顯示，不以基本尺寸、預鑽孔、絲攻或量規尺寸補值。

管牙尺寸連同基準面呈現：R 為外錐牙、Rc 為內錐牙，Rp 僅內平行牙；錐管牙的直徑錐度為 1:16。R 外牙距離 `a` 只在外牙顯示；NPT／NPTF 顯示 `L1` 平面的基本節徑 `E₁`，並標示 **NBS H28（1957）歷史基本表**。19 筆 NPT 另外提供 `h = 0.8P` 對稱最大基本牙高模型的大、小徑參考，以「≈」與「牙型計算參考」標示；例如 1/16-27 的大徑參考約 7.895 mm。原表未收錄的基本徑與工件限界仍保留空值，NPTF 不套用此模型。管材外徑另列。來源版本、頁碼與官方連結集中在五份資料檔的 `sources`。

查表支援 Unicode／全形字元、乘號、完整分數尺寸、編號牙與前後置牙系，例如 `Ｍ１０×１．５`、`¼-20 UNC`、`UNC #6-32`、`BA 0`／`0BA`、`PT 1/2`／`1/2 PT`、`NPT 1/4`。NPT 與 NPTF 分開比對；`R` 選外牙、`Rc`／`Rp`／`PS` 選內牙，Rp 外牙停用。可切 mm／in、收藏規格，並複製尺寸、基準說明、單位及來源；規格收藏同時出現在工具的主「收藏」頁。`#thread` 進入查表，`#thread/metric-coarse-m10-p1-5/internal` 等網址可直接開指定規格與內外牙。

舊公制螺距／TPI 與切削攻牙 `D−P` 粗估仍保留於 `#thread-calculator`，也可從公制查表規格開啟；它不產生工件小徑限界。公差與配合仍依使用者輸入的圖面偏差計算，沒有內建 ISO 孔軸配合等級表。原公式核心、目錄與介面在 `engine.js`、`catalog.js`、`app.js`；螺紋搜尋規則由 `thread-search.js` 提供，查表與收藏由 `thread-ui.js` 管理。

本機偏好分成兩鍵：`cwli-machining-preferences-v1` 保存顯示單位與工具分類收藏；`cwli-thread-reference-v1` 保存所選螺紋、內外牙及規格收藏。原計算輸入只留在本次開啟期間。修改後執行 `node scripts/check-machining.mjs`、`node scripts/check-thread-data.mjs` 及 `node scripts/check-thread-library.mjs`；前兩者保留原核心 14 組與原 102 筆資料的 18 組檢查，新增檢查負責完整擴充資料與搜尋。完整資料範圍與維護方式見 `docs/machining-calculator.md`。

2026-11-23 本輪保存在本機，未推送遠端或發佈線上版本。完整資料庫與搜尋的 46 組檢查、原資料 18 組、原計算 14 組皆通過；擴充版曾完成 58 項瀏覽器檢查，本次 NPT 參考值另通過 11 項介面檢查。最新結果與截圖位置見 `QA.md`。

加工工具首頁與收藏頁的五張原創加工插圖放在同目錄 `illustrations/`，使用 SVG 保持放大清晰；桌機與手機的插圖尺寸由 `app.css` 的 `.category-art` 調整。

羽球工具的手機介面集中在 `dist/tools/badminton/mobile.css`（四分頁、底部導覽、觸控尺寸）與 `mobile-app.js`（切頁、焦點、操作按鈕位置）；本機 Bootstrap Icons 由 `icons.js` 管理，原始 SVG 與授權放在 `vendor/icons/`。修改手機版不需要另建一份名單、比分或儲存資料。

在 `dist/content.js` 找到 `tools` 陣列，保留既有工具，再依下列格式加入新物件。以下為填寫範例，需替換成自己的名稱與可開啟網址：

```javascript
tools: [
  {
    id: 'my-tool',
    title: '我的工具名稱',
    category: '日常工具',
    description: '簡短說明這個工具能幫忙完成什麼事情。',
    url: 'tools/my-tool/index.html',
    icon: 'grid',
    tags: ['關鍵字'],
    source: '個人工具'
  }
],
```

- 自己的 HTML 工具可放在 `dist/tools/my-tool/index.html`，相關 CSS、JavaScript、圖片放在同一工具子資料夾；`url` 使用相對於 `dist/index.html` 的路徑。
- 已上線的工具可直接將 `url` 換成完整 HTTP(S) 網址，點選後會在新分頁開啟。
- `icon` 可填 `calculator`、`code`、`document`、`grid`、`badminton`；未指定時使用方格圖示。
- 分類會從 `category` 自動建立，搜尋涵蓋名稱、分類、說明、來源與標籤。
- 工具網址尚未填好時，卡片會顯示「入口待補」，不產生無效的開啟按鈕。
- 此版透過本機程式檔維護工具清單，沒有線上新增／刪除後台。

## 配色設定

參考 [links.cwli.dev](https://links.cwli.dev/) 的淺藍、白、青色與淡紫漸層。常用色彩集中在 `assets/theme.css`，個人站、羽球、FANUC 與加工工具共同載入：

- 背景基色：`#eef8ff`
- 主要文字：`#172033`
- 重點藍色：`#0ea5e9`
- 深藍文字與按鈕：`#0369a1`
- 青色點綴：`#67e8f9`

## Git 版本管理（繁體中文）

本資料夾已是獨立 Git 儲存庫。本次以繁體中文提交訊息記錄修改；先前版本紀錄完整保留。日後修改完成，可在此資料夾執行：

```powershell
git status
git add --all
git commit -m "更新個人履歷與作品內容"
git log --oneline -5
```

`git commit` 會把版本保存在這台電腦；推送遠端與發佈網站是另外的步驟。本機檔案修改後，先前線上預覽不會自動更新。

程式碼、註解與文件採 UTF-8；本儲存庫也設定 Git 提交與紀錄輸出使用 UTF-8，中文檔名直接顯示。

## 第一版已實作

五個導覽頁面、作品詳情、小工具分類與搜尋、可分享的主題網址（例如 `#notes/cam-review-checklist`）、搜尋與分類交集、空結果提示、手機選單、鍵盤操作、可列印的履歷版面。

首頁改為個人數位工作室：Support Center 真實畫面手動切換、方向鍵選擇、對應實際工具連結、錯落作品與筆記入口、捲動進場與桌機作品卡輕微傾角。啟用「減少動態效果」時，保留功能並停止漂浮、進場與傾角動畫。

Nine9 Support Center 為目前代表案例，共有 5 項作品入口。專案截圖於 2026-11-18 由正式網站擷取，畫面來源與可確認的參與範圍記錄在 `docs/support-center-case.md`。首頁預覽是本站儲存的截圖，點選右上角箭頭可開啟實際工具。

作品頁以大型代表作展示 Support Center，三個預覽按鈕共用 `showcase` 的本機截圖；切換操作使用獨立的 `data-work-preview`，不影響首頁選圖。個人工程網站使用 2026-11-21 擷取的 `assets/personal-site-preview.jpg`；若首頁大幅改版，可重新擷取後替換同名圖片。其他三個舊網站入口保留「案例待補」與整理架構，未加入尚未核對的畫面或成果。

## 下一步優先順序

1. 補上實際工作經歷、任職日期、學歷與證照，整理可投遞的履歷。
2. 選三個代表案例，提供自己的角色、畫面、決策過程與可核對的結果。
3. 將最常查用的技術逐篇寫成文章，記錄前提、方法、驗證、限制與來源。
4. 依需求建立真正的私人儲存與登入權限，承載未公開工作筆記。

## 內容與儲存範圍

網站目前為靜態展示網站，內容以本機檔案維護。瀏覽器搜尋不會將輸入送往伺服器。沒有線上編輯器、帳號系統、雲端筆記或私人後台。先前的 Sites 版本設為僅擁有者可看；這是託管平台的存取設定，不代表本機前端內建私人筆記保護。未來公開前，應把私人草稿放在分離且經身分驗證的儲存系統。

年資、公司經歷與成效數字尚未提供；頁面以待補狀態呈現。既有外部網站僅沿用原連結，沒有把其功能視為已驗證。履歷目前是能力摘要初版，補齊待確認資料後再用於正式投遞。

## 封裝說明

為遵守本工作區「禁止批量刪除文件或目錄」的規則，封裝流程採新增 staging 目錄並保留，不執行遞迴清理。發佈憑證僅由 stdin 輸入並存於程序記憶體，不寫入專案。
