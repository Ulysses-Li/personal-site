# 國際公差查表維護說明

更新：2026-11-23。入口為 `dist/tools/machining-calculator/index.html#tolerance`，沿用本機工具箱與顯示單位。

## 使用方式

- 「公差查表」選孔／軸、公差帶、IT 等級及基本尺寸，即時顯示上／下偏差、實際尺寸上下限與公差帶位置。
- 快速搜尋接受 `25 H7`、`h6`、`H7 25`、`25 H7/g6`、`IT01 25`。大寫代表孔，小寫代表軸；搜尋中的尺寸固定使用 mm。輸入欄的基本尺寸則依頁首 mm／in 切換。
- 直接選尺寸範圍，可只查偏差；若原基本尺寸不在新範圍，欄位清空，實際尺寸等輸入後才顯示，不將範圍端點假當工件尺寸。
- 「孔軸配合」以同一基本尺寸比較孔與軸，顯示最小／最大間隙及間隙、過渡、過盈類別；負間隙表示過盈。這是範圍比較，不是特定用途的配合推薦。
- 「IT 等級」提供 IT01、IT0、IT1–IT18 的公差寬度，不把 IT 寬度誤當上／下偏差。
- 星號保存常用規格，可在本頁及工具箱「收藏」開啟。複製結果附單位、標準版本與原表頁碼。「自行輸入偏差」保留舊計算頁。
- 手機上方先顯示即時偏差卡，再放查詢條件；下方有完整尺寸、示意、來源與複製。

## 收錄與來源

| 資料 | 收錄數量 | 實際來源 |
| --- | ---: | --- |
| 孔偏差 | 2,826 筆、28 帶 | GB/T 1800.2—2020 表 2–16，印刷 5–23／PDF 9–27 頁 |
| 軸偏差 | 2,984 筆、28 帶 | 同版表 17–32，印刷 24–44／PDF 28–48 頁 |
| IT 寬度 | 260 筆、20 級、13 尺寸段 | Schaeffler STT 第 4 版（2025-03）印刷 436–437 頁，原表依 ISO 286-1:2010 |

孔／軸原標準公開於[山東理工大學鏡像](https://jxxy.sdut.edu.cn/_upload/article/files/26/17/06ab39de419d854e8b52cb1c29b8/4ac55aa2-307d-46de-8f5c-06562a674c9f.pdf)，亦可查[國家標準官方題錄](https://openstd.samr.gov.cn/bzgk/std/newGbInfo?hcno=8450464EA932756AE6C10593E68AA1AF)。版本為 **GB/T 1800.2—2020，修改採用 ISO 286-2:2010（MOD），納入 Cor.1:2013**。前言列出的技術差異為規範引用改用 GB/T 1800.1—2020；介面保留完整版本，不冒稱最新 ISO 原版全文。

IT 原表見 [Schaeffler Technical Pocket Guide STT](https://www.schaeffler.com/remotemedien/media/_shared_media/08_media_library/01_publications/schaeffler_2/catalogue_1/downloads_6/stt_de_en.pdf)。不同種類資料各自標示來源。

只收錄原表有數值且位於 `0 < D ≤ 500 mm` 的組合，各公差帶與等級的實際範圍不同。28 帶不代表每帶都有全部等級。沒有把空白格用基本偏差公式、孔軸鏡射或寬度對半補值。

- A／B／a／b 第一段另限定 `D ≥ 1 mm`；部分高等級 H／h／JS／js 只適用 `D > 1 mm`，依各筆資料保留。
- 軸 za11、`225 < D ≤ 250 mm` 原表寫 +1100／+820 μm，與同版 IT11 寬度不符。本工具排除該格，原因記於 `omissions`，沒有自行改成推測數字。
- 尺寸段一般為下開上閉，例如 D=3 查 `(0,3]`，D=3.0001 查 `(3,6]`；表註的包含／不包含 1 mm 另外判斷。
- 如實際尺寸會小於等於零、尺寸超出原表、深連結不存在或查詢未收錄，結果停用；不沿用舊結果充當新查詢。

## 程式分工

| 檔案（相對工具目錄） | 工作 |
| --- | --- |
| `iso-hole-data.js` | 孔原表、版本、頁碼與最小尺寸限制 |
| `iso-shaft-data.js` | 軸原表、版本、頁碼與排除格 |
| `iso-it-data.js` | 獨立的 IT 公差寬度原表 |
| `tolerance-engine.js` | 純查詢、邊界、尺寸與配合；classic script／CommonJS 皆可用 |
| `tolerance-ui.js` | 控制項、搜尋、分享網址、單位顯示、複製與收藏 |
| `tolerance-library.css` | 公差查表的桌機與手機版面 |

偏差保存為 `lowerUm`／`upperUm`，單位 μm；基本尺寸與範圍保存為 mm。顯示 inch 時除以 25.4，不以已四捨五入的畫面值覆寫公制原值。偏好與最多 30 筆收藏存於 `cwli-iso-tolerance-v1`，沒有伺服器同步。

每筆孔／軸資料至少含 `zone`、字串 `grade`、`minMm`、`maxMm`、`lowerUm`、`upperUm`、`sourceId`、`pageLabel`。`minimumNominalMm` 表示額外最小值；`minimumNominalExclusive: true` 則不含該值。IT 的 `grade` 保持字串，避免 `01` 與 `1` 混淆。

分享網址範例：

```text
#tolerance/hole/A9/3
#tolerance/shaft/g6/25
#tolerance/hole/H7/band/80/120
#tolerance/fit/H7/g6/25
#tolerance/it/01/25
#tolerance-calculator
```

新增資料須附原表版本、頁碼及尺寸限制，並實際查看原頁，不採來源搜尋摘要猜值。資料完成後執行 `node scripts/check-iso-tolerance.mjs`；目前 30 組檢查涵蓋所有 5,810 筆偏差、260 筆 IT、479 個缺項區間、邊界、表註、配合與解析。另執行原有三份加工／螺紋檢查，並以瀏覽器檢查互動。資料檢查通過不等同加工或量測驗證。
