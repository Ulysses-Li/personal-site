# Louis Li 個人標誌與主畫面圖示

更新：2026-11-24。主站維護版次：1.1.1。使用者已選定 **I3「切角精修」**為正式標誌；正式網站為 `lab.cwli.dev`，沿用 GitHub Pages 發布流程。

## 四款方向比較

開啟 `dist/brand-options.html` 可並排看 A「雙 L 刀路」、B「切角單 L」、C「LL 連線」、D「CW 字母章」，每款都有 48px／32px 顯示及大圖入口。原稿和 32／180／512px PNG 分別保存在 `dist/assets/brand/concepts/` 的四個方案資料夾。

第二輪依使用者喜歡的 A／B 延伸，開啟 `dist/brand-options-round2.html` 比較 E「直角雙 L」、F「並列雙 L」、G「斜肩單 L」、H「內嵌刀路」。新增四個方案資料夾保存各自原稿與 PNG，第一輪檔案全部保留。

第三輪沿著 G／H 增加創意構圖，開啟 `dist/brand-options-round3.html` 比較 I「負形刻線」、J「斜縫拼接」、K「折返刀路」、L「切面立體」。每款同樣保留 SVG、32／180／512px PNG 與小尺寸預覽；I 使用三層多邊形形成疊片與負形，其餘維持兩層。

使用者選定 I 方向後，`dist/brand-options-i-refined.html` 提供原稿與三款細修對照：I1 將前後疊片精準錯位 32；I2 採 104 厚 L、40 寬刻線及直線段兩側各 32 白邊；I3 在尾端加入一致的 45° 切角。精修原稿位於 `concepts/i1-aligned-layers/`、`i2-small-size/`、`i3-precision-chamfer/`，各有 32／180／512／1024px PNG。

正式採用 I3，來源保留於 `dist/assets/brand/concepts/i3-precision-chamfer/mark.svg`，日常維護原稿為 `dist/assets/brand/louis-li-mark.svg`。四個比較頁保留全部舊稿，I3 標示為「正式使用」，其他方向供回看設計過程。

提案輸出可使用 `export-brand-icons.ps1` 的 `SvgPath`、`TargetDirectory`、`Sizes` 參數，寫入指定方案資料夾，避免覆寫現用圖檔；未指定參數時保留原來的正式輸出行為。

## 設計

I3「切角精修」以白色 L、青色背片及藍色負形刻線三層多邊形構成。白色正面與青色背片錯位形成層次，藍色刻線沿 L 形轉折；主切角為 32×32，內切角為 16×16，均為 45°。標誌不依賴外部字型，縮放不會換字型或缺字。

底色與負形刻線使用 `#0369a1`，正面為 `#ffffff`，背片為 `#67e8f9`，沿用網站色系。512 座標中的主要 L 厚度為 96、刻線寬 32。必要圖形頂點均位於中心半徑 204.8 的圓內，供不同手機圖示遮罩裁切。PNG 使用滿版不透明背景，不預先裁圓角、畫外框或加陰影；實際手機造型交給系統。

## 檔案與修改位置

| 檔案 | 用途 |
| --- | --- |
| `dist/assets/brand/louis-li-mark.svg` | 唯一可編輯原稿；改形狀或顏色優先改這份 |
| `dist/assets/brand/louis-li-i3.svg` | I3 正式識別檔名；頁首與 SVG favicon 使用，從維護原稿同步產生 |
| `dist/assets/brand/louis-li-i3-{16,32,180,192,512,1024}.png` | 六個尺寸的 I3 輸出；180px 供 Apple 圖示，192／512px 供 Manifest |
| `dist/assets/brand/louis-li-i3.ico` | I3 的 32px PNG 內嵌 ICO；主站分頁相容圖示 |
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

第一個指令呼叫 Windows 內建 System.Drawing，從同一份 SVG 的底色與 polygon 圖層匯出所有尺寸，不安裝圖片套件。使用四倍取樣後縮小；維護檔名與 I3 正式檔名的 SVG／PNG／ICO、共用 SVG、Apple 根目錄圖示、Manifest 與安裝名稱一併同步。`louis-li-i3.*` 是輸出檔，不要另改一套幾何。一般改網頁文字不用執行此指令；換圖、改安裝名稱或個人姓名時才重新匯出。

目前匯出器支援 512×512、單一實色底色及多個 polygon 圖層。可直接修改 points、fill 或增加多邊形；若改成曲線、漸層等其他 SVG 元素，需同步調整 `scripts/export-brand-icons.ps1`。該 PowerShell 檔使用 UTF-8 BOM，供 Windows PowerShell 5.1 正確讀取繁體中文。

## 網站與手機安裝

本輪正式引用使用 `louis-li-i3.svg`、`louis-li-i3.ico` 及 `louis-li-i3-180.png`；Manifest 的 192／512px 圖示也採 I3 檔名。頁首由 `data/header.js.brandImage` 指向同一個 I3 SVG。名稱仍取自 `data/site.js`，不改既有個人資料結構、五頁網址或 Manifest 的 `id`、`start_url`、`scope`；相對路徑同時支援網域根目錄及 `/personal-site/dist/` 等部署子目錄。

原 `louis-li-mark.svg`、`louis-li-icon-*.png`、根目錄 `favicon.ico`／`apple-touch-icon.png` 及工具共用的 `assets/mark.svg` 保留並同步內容。正式版改用 I3 檔名，可讓瀏覽器請求與舊 A 圖示不同的資源網址；部署時需一起更新圖檔、頁首資料、HTML 與 Manifest。

這些檔案提供安裝外觀與獨立視窗設定，沒有新增 Service Worker 或保證整站離線快取。網站原有在瀏覽器本機執行的工具照常運作。

每次正式發布需確認 GitHub Actions 成功，並核對線上頁首、版次與圖檔，不能只以本機定稿當作正式上線。正式網站更新後，可從 Safari 的分享選單重新加入主畫面。已有舊捷徑的裝置仍可能保留舊圖示；工具沿用的共用圖示網址也可能保留瀏覽器快取。更換資源檔名不保證系統立即更新已安裝的捷徑，本專案未連接實際 iPhone 驗證。

Apple 的 [Web Clip 圖示設定](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html) 說明 PNG、180px `apple-touch-icon` 與安裝名稱；[W3C Manifest 規範](https://www.w3.org/TR/appmanifest/#icon-masks) 定義 maskable 中心 40% 半徑安全區。
