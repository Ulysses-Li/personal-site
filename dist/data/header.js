/*
 * 主站頁首資料｜改選單名稱、排列、聯絡按鈕與漢堡選單朗讀文字。
 * id 對應 index.html 的 data-view 及既有分享網址，請保持穩定。
 * visible:false 可隱藏入口，但保留該頁的網址與標題。
 * pageTitle 未填時採 label；首頁標題共用 data/site.js 的 siteName。
 */
window.SITE_HEADER = {
  schemaVersion: 1,
  brandMark: 'L.',
  // 正式圖示版本路徑；原稿仍編輯 louis-li-mark.svg，再執行 build-brand-icons.mjs 同步。
  // 換新標誌時更換此檔名，可讓瀏覽器及新安裝的主畫面捷徑讀取新版。
  brandImage: 'assets/brand/louis-li-i3.svg',
  homeView: 'home',
  navigationLabel: '主要導覽',
  menu: {
    expandLabel: '展開導覽',
    collapseLabel: '收合導覽'
  },
  navigation: [
    { id: 'home', label: '關於我' },
    { id: 'work', label: '作品案例' },
    { id: 'tools', label: '小工具' },
    { id: 'notes', label: '技術知識庫' },
    { id: 'resume', label: '個人履歷' }
  ],
  contact: {
    visible: true,
    label: '與我聯絡',
    profileKey: 'email'
  }
};
