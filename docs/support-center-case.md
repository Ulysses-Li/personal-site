# Nine9 Support Center｜個人作品集案例資料

核對日期：2026-11-18。

使用者表示此站是近期為公司外銷設計的技術支援網站，並授權向 Support Center 專案了解細節。本案例以正式網站、本機專案文件，以及該專案「檢視首頁優化方向 (2)」聊天回覆為依據。

## 案例定位

把產品型錄、加工條件與技術支援流程整理成可操作的網站，面向外銷客戶、經銷商與加工現場人員。

## 已可確認的參與範圍

需求主導、加工知識整理、操作流程規劃與迭代驗收。專案聊天能確認 Louis 提出材料、角度、孔徑、倒角補正、Z 基準、搪刀與手機摘要等需求，檢視樣板並補充原廠確認資訊。

沒有以 Git 帳號、程式碼行數或網址所有權推定獨立開發比例，也沒有新增使用量、節省工時與試切成效數字。

## 首頁可切換的真實畫面

| 畫面 | 正式網址 | 截圖 |
| --- | --- | --- |
| 技術入口 | https://n9sp.cwli.dev/index.html | `dist/assets/support-center-home.png` |
| ACE 切削工作台 | https://n9sp.cwli.dev/CuttingData/AceSpotDrill/index.html | `dist/assets/support-center-ace.png` |
| 螺紋銑削 V2 | https://n9sp.cwli.dev/NCProgram/Thread_Milling_V2/index.html | `dist/assets/support-center-nc.png` |

截圖於核對日由正式網頁擷取，不是模擬的產品介面；預覽切換的是截圖，右上角連結可開啟對應的實際工具。

## 技術亮點

- 產品分類與技術資源的集中入口。
- 型錄資料結構化，保留來源與頁碼，資料與介面分離。
- ACE 點鑽／倒角幾何示意與切削設定。
- 螺紋銑削 V2 的同步側視／俯視、參數設定、中英介面與 NC 匯出。
- 響應式介面與針對計算、配對、幾何及邊界條件的既有 Node 測試。

既有頁面仍持續迭代。設定示意與刀路動畫不等於實機試切或完整控制器模擬；作品集不將尚未確認的參數及資料當作已驗證成果。

## 本機參考文件

- `C:\Users\Louis\Desktop\Support Center\README.md`
- `C:\Users\Louis\Desktop\Support Center\docs\CODE_GUIDE.zh-TW.md`
- `C:\Users\Louis\Desktop\Support Center\NCProgram\Thread_Milling_V2\README.md`

本次僅將可展示的案例資訊與正式網頁截圖納入個人網站，沒有修改 Support Center 專案。
