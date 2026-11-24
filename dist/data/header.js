/*
 * 主站頁首資料｜改選單名稱、排列、聯絡按鈕與漢堡選單朗讀文字。
 * id 對應 index.html 的 data-view 及既有分享網址，請保持穩定。
 * visible:false 可隱藏入口，但保留該頁的網址與標題。
 * pageTitle 未填時採 label；首頁標題共用 data/site.js 的 siteName。
 */
window.SITE_HEADER = {
  schemaVersion: 1,
  brandMark: 'L.',
  // 可編輯向量標誌；移除此欄位則退回上方純文字，不影響導覽。
  brandImage: 'assets/brand/louis-li-mark.svg',
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
