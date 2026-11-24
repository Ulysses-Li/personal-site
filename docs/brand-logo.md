# Louis Li 個人標誌與主畫面圖示

更新：2026-11-24。主站維護版次：1.1.0。本機檔案已設定，正式 `lab.cwli.dev` 需更新相同檔案後才會採用。

## 四款方向比較

開啟 `dist/brand-options.html` 可並排看 A「雙 L 刀路」、B「切角單 L」、C「LL 連線」、D「CW 字母章」，每款都有 48px／32px 顯示及大圖入口。原稿和 32／180／512px PNG 分別保存在 `dist/assets/brand/concepts/` 的四個方案資料夾。

第二輪依使用者喜歡的 A／B 延伸，開啟 `dist/brand-options-round2.html` 比較 E「直角雙 L」、F「並列雙 L」、G「斜肩單 L」、H「內嵌刀路」。新增四個方案資料夾保存各自原稿與 PNG，第一輪檔案全部保留。

第三輪沿著 G／H 增加創意構圖，開啟 `dist/brand-options-round3.html` 比較 I「負形刻線」、J「斜縫拼接」、K「折返刀路」、L「切面立體」。每款同樣保留 SVG、32／180／512px PNG 與小尺寸預覽；I 使用三層多邊形形成疊片與負形，其餘維持兩層。

目前正式設定仍使用 A，提案比較頁不會切換網站圖示。選定後，再將該方案原稿套用到 `louis-li-mark.svg`，重新匯出正式圖示並記錄新版本。

提案輸出可使用 `export-brand-icons.ps1` 的 `SvgPath`、`TargetDirectory`、`Sizes` 參數，寫入指定方案資料夾，避免覆寫現用圖檔；未指定參數時保留原來的正式輸出行為。

## 設計

「雙 L 刀路」以白色大 L 與青色小 L 對應 Louis Li。兩條平行轉折保留加工刀路的方向感，30×30 的切角為 45°；字母沒有使用外部字型，縮放不會換字型或缺字。

底色 `#0369a1`、白色 `#ffffff`、青色 `#67e8f9`，沿用網站色系。512 座標中的筆畫寬 60、間隙 40，32px 時約為 3.75px／2.5px。必要圖形頂點均位於中心半徑 204.8 的圓內，供不同手機圖示遮罩裁切。PNG 背景完全不透明，不預先裁圓角、畫外框或加陰影；實際手機造型交給系統。

## 檔案與修改位置

| 檔案 | 用途 |
| --- | --- |
| `dist/assets/brand/louis-li-mark.svg` | 唯一可編輯原稿；改形狀或顏色優先改這份 |
| `dist/assets/brand/louis-li-icon-1024.png` | 高解析度完整圖，可用於簡報或其他個人識別 |
| `dist/assets/brand/louis-li-icon-512.png` | Web App／maskable 圖示 |
| `dist/assets/brand/louis-li-icon-192.png` | Web App 圖示 |
| `dist/assets/brand/louis-li-icon-180.png` | iPhone 加入主畫面的 PNG |
| `dist/assets/brand/louis-li-icon-32.png`／`-16.png` | 小尺寸圖示與檢視用檔 |
| `dist/apple-touch-icon.png` | 180px 同內容的根目錄相容入口 |
| `dist/favicon.ico` | 32px PNG 內嵌 ICO 相容入口 |
| `dist/assets/mark.svg` | 原有工具沿用的共用圖示路徑，匯出時同步原稿 |
| `dist/site.webmanifest` | App 名稱、啟動網址、色彩及圖示清單；由匯出工具產生 |
| `dist/data/header.js` 的 `brandImage` | 頁首向量圖路徑；移除或清空後退回 `brandMark` 文字 |

## 重新匯出

在專案根目錄執行：

```powershell
node scripts/build-brand-icons.mjs
node scripts/check-brand-icons.mjs
node scripts/check-site-shell.mjs
```

第一個指令呼叫 Windows 內建 System.Drawing，從同一份 SVG 的底色與 polygon 圖層匯出所有尺寸，不安裝圖片套件。使用四倍取樣後縮小；PNG、ICO、共用 SVG、Apple 根目錄圖示、Manifest 與安裝名稱會同步更新。一般改網頁文字不用執行此指令；換圖、改安裝名稱或個人姓名時才重新匯出。

目前匯出器支援 512×512、單一實色底色及多個 polygon 圖層。可直接修改 points、fill 或增加多邊形；若改成曲線、漸層等其他 SVG 元素，需同步調整 `scripts/export-brand-icons.ps1`。該 PowerShell 檔使用 UTF-8 BOM，供 Windows PowerShell 5.1 正確讀取繁體中文。

## 網站與手機安裝

`index.html` 已設定 SVG favicon、ICO、180px `apple-touch-icon`、安裝標題與 Manifest。頁首採同一份 SVG。名稱取自 `data/site.js`；Manifest 的相對路徑同時支援網域根目錄及 `/personal-site/dist/` 等部署子目錄。

這些檔案提供安裝外觀與獨立視窗設定，沒有新增 Service Worker 或保證整站離線快取。網站原有在瀏覽器本機執行的工具照常運作。

正式網站更新後，可從 Safari 的分享選單重新加入主畫面。已有舊捷徑的裝置可能保留舊圖示；本專案沒有連接或控制實際 iPhone，本輪驗證是本機圖檔、HTML 設定與桌機／手機寬度預覽。

Apple 的 [Web Clip 圖示設定](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html) 說明 PNG、180px `apple-touch-icon` 與安裝名稱；[W3C Manifest 規範](https://www.w3.org/TR/appmanifest/#icon-masks) 定義 maskable 中心 40% 半徑安全區。
