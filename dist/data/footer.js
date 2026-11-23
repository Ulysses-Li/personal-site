/*
 * 共用頁尾資料。
 * 網站名稱與個人名稱／網址統一維護於 data/site.js，不在此重複保存。
 */
(function publishFooterData(root) {
  'use strict';

  root.SITE_FOOTER = {
    schemaVersion: 1,

    // 01｜版權：起始年固定；當年由元件產生，名稱可選擇大寫顯示。
    copyright: {
      startYear: 2026,
      uppercaseName: true
    },

    // 02｜頁尾短句與入口：profileKey對應SITE_SETTINGS.profile的欄位。
    tagline: '持續整理，持續向前。',
    links: [
      {
        profileKey: 'github',
        label: 'GITHUB',
        ariaLabel: '{name} 的 GitHub',
        external: true
      }
    ]
  };
})(typeof window === 'object' ? window : globalThis);
