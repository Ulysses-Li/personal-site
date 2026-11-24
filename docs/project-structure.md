# 主站資料結構、頁首頁尾與改版維護

更新：2026-11-23。主站檔案位於 `dist/`，直接修改後重新整理即可，不需安裝套件或執行建置。

## 先找到要改的檔案

| 想改什麼 | 編輯檔案 | 主要欄位 |
| --- | --- | --- |
| 姓名、職稱、簡介、Email、GitHub、LINE | `dist/data/site.js` | `profile` |
| 網站副標題 | `dist/data/site.js` | `siteName`；頁首與頁尾共用 |
| 頁首 Logo 字樣 | `dist/data/header.js` | `brandMark` |
| 頁首 Logo 圖片 | `dist/data/header.js` | `brandImage`；原稿與匯出方式見 `docs/brand-logo.md` |
| 導覽文字、順序及是否顯示 | `dist/data/header.js` | `navigation`、`visible` |
| 各頁瀏覽器標題 | `dist/data/header.js` | `navigation[].pageTitle`，未填則採選單名稱；首頁共用 `siteName` |
| 聯絡按鈕文字 | `dist/data/header.js` | `contact.label`；信箱來自 `profile.email` |
| 漢堡選單的朗讀名稱 | `dist/data/header.js` | `menu.expandLabel`、`menu.collapseLabel` |
| 頁尾短句、連結標籤及排列 | `dist/data/footer.js` | `tagline`、`links` |
| 頁尾版權起始年 | `dist/data/footer.js` | `copyright.startYear`；當年由元件產生 |
| 目前版次與改版摘要 | `dist/data/version.js` | `version`、`updatedAt`、`summary` |
| 頁首 HTML 或漢堡選單程式 | `dist/components/header.js` | `render`、`mount` |
| 頁尾 HTML 或年份呈現 | `dist/components/footer.js` | `render`、`mount` |
| 頁首頁尾共用文字及連結處理 | `dist/components/shared.js` | `escape`、`safeHref` |
| 頁首頁尾初始化順序 | `dist/components/site-shell.js` | `mount` |
| 作品、工具清單、知識及履歷摘要 | `dist/content.js` | `projects`、`tools`、`knowledge`、`resume` 等 |
| 主內容排版及固定文案 | `dist/index.html` | 各 `section.view` |
| 外觀、手機斷點與列印 | `styles.css`、`studio.css`、`tools.css`、`work.css` | 保留原樣式優先序；共用配色在 `assets/theme.css` |

`content.js` 的 `profile` 是 `SITE_SETTINGS.profile` 的引用，沒有第二份姓名或聯絡資料。工具各自的操作頁首仍在 `dist/tools/`，本次只拆分使用者標出的主站 `.site-header` 與 `.site-footer`。

## 分層與載入順序

```text
dist/
├─ data/                    只維護資料，不操作網頁
│  ├─ site.js               網站名稱與共用個人資料
│  ├─ header.js             頁首、導覽與聯絡按鈕設定
│  ├─ footer.js             頁尾、版權及外部連結設定
│  └─ version.js            版次、日期與改版摘要
├─ components/              共用頁面元件
│  ├─ shared.js             文字／連結工具
│  ├─ header.js             頁首呈現與選單行為
│  ├─ footer.js             頁尾呈現與年份
│  └─ site-shell.js         掛載元件，先於 app.js 執行
├─ content.js               作品與知識內容，沿用既有資料介面
├─ index.html               頁首／頁尾掛載點與主內容版面
├─ app.js                   切頁、列表、搜尋、詳情及列印
├─ assets/                  配色、照片與圖示
└─ tools/                   羽球、FANUC、加工工具各自維護
```

`index.html` 的 `defer` 順序為：`data/` → `content.js` → 共用工具與元件 → `site-shell.js` → `app.js`。元件先建立節點，主程式再綁定內容功能；不要只載入 `app.js`。使用一般本機 script，不以 fetch 讀取 HTML，因此保留 `file://` 直接開檔能力；瀏覽器需啟用 JavaScript。

外層 `<header class="site-header" data-site-header>` 與 `<footer class="site-footer" data-site-footer>` 保留在 body 之下。不要再包一層短容器，以免影響 sticky、手機選單定位或列印隱藏。

## 常見修改範例

在 `data/header.js` 改選單名稱：

```js
{ id: 'notes', label: '我的技術筆記' }
```

名稱改了，`#notes` 網址仍有效。若想暫時藏起入口，加上 `visible: false`，不要刪除 id；主程式仍保留該頁的標題與深連結。`home`、`work`、`tools`、`notes`、`resume` 為既有穩定 id。新增真正的內容頁時，需同步新增 `index.html` 的對應 `section.view`，不能只加一個選單名稱。

在 `data/footer.js` 改短句即可：

```js
tagline: '持續整理，持續向前。'
```

GitHub 網址改在 `data/site.js` 的 `profile.github`，不是元件 HTML。`links[].profileKey` 引用同名個人資料欄位；`label` 控制畫面標籤，`ariaLabel` 的 `{name}` 會換成姓名。連結目前使用完整 HTTPS 網址。保留 `external: true` 可另開分頁並附安全的 rel 屬性。

版權起始年固定為 2026；2026 顯示「© 2026」，2027 起顯示「© 2026–2027」等年份範圍。不要每年手動改寫 HTML。

## 修改與版次流程

1. 先改對應資料或元件，儲存後重新整理。HTTP 預覽可沿用 Live Server，或執行 `node scripts/preview.mjs`。
2. 執行 `node scripts/check-site-shell.mjs`，確認資料、載入、連結及元件契約。頁首互動改動後，另檢查手機展開／收合、Escape、同頁連結、外部點擊與切頁。
3. 在 `data/version.js` 更新版號、`updatedAt`（YYYY-MM-DD）與摘要；在根目錄 `CHANGELOG.md` 寫清楚改了什麼。
4. 用 Git 建立繁體中文提交，例如 `git commit -m "調整主站導覽名稱與頁尾說明"`。檔案版次描述目前狀態，Git 保存每一次實際修改。

首次建立的維護版次是 `1.0.0`。可採 `1.0.1` 記文字或修正、`1.1.0` 記相容的新功能、`2.0.0` 記不相容結構調整。資料內 `schemaVersion: 1` 是資料格式版本，不是日期或每次文案修改的版號；只有格式不相容時才升級並記錄遷移方法。

版本資訊可在 `window.SITE_VERSION` 及 `<html data-site-version>` 查到，不額外佔用產品畫面。頁首頁尾不寫改版紀錄。

檢視歷史可用 `git log --oneline` 或 `git show <提交代碼>`；需要撤回已提交的變更時，`git revert <提交代碼>` 會建立保留歷史的反向提交。不要用刪除資料夾的方式管理版次。提交只保存在本機，不會自動 push 或部署。
