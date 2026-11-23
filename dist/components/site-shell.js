/*
 * 主站共用外框初始化｜資料 → 元件 → 本檔 → app.js。
 * 使用本機 classic script；不用 fetch 或模組匯入，可直接雙擊 HTML。
 * 外層 header／footer 仍是 body 的直接子元素，維持 sticky 與列印樣式。
 */
(() => {
  'use strict';
  const settings = window.SITE_SETTINGS;
  const header = window.SITE_HEADER;
  const footer = window.SITE_FOOTER;
  const version = window.SITE_VERSION;
  if (!settings || !header || !footer || !version || !window.SiteHeader || !window.SiteFooter) {
    throw new Error('主站共用元件尚未載入，請依 index.html 的 defer 順序載入 data/ 與 components/。');
  }

  const shell = { header: null, version, mount };
  function mount() {
    shell.header = window.SiteHeader.mount(document.querySelector('[data-site-header]'), settings, header);
    window.SiteFooter.mount(document.querySelector('[data-site-footer]'), settings, footer);
    let view = header.homeView;
    try { view = decodeURIComponent(location.hash.slice(1)).split('/')[0] || view; } catch { /* 無效網址由主程式返回首頁。 */ }
    shell.header.setActive(view);
    document.documentElement.dataset.siteVersion = version.version;
    document.documentElement.dataset.siteSchemaVersion = String(settings.schemaVersion);
  }

  window.SiteShell = shell;
  mount();
})();
