/* 主站元件共用工具｜文字先跳脫，連結只接受明確允許的格式。 */
(() => {
  'use strict';

  function escape(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[char]));
  }

  function safeHref(value, { allowHash = false, allowMail = false } = {}) {
    if (typeof value !== 'string' || /[\u0000-\u0020\u007f]/.test(value)) return '';
    if (allowHash && /^#[a-z][a-z0-9-]*(?:\/[a-z0-9][a-z0-9-]*)?$/.test(value)) return value;
    if (allowMail && /^mailto:[^\s@<>?]+@[^\s@<>?]+$/.test(value)) return value;
    try {
      const url = new URL(value);
      return url.protocol === 'https:' ? url.href : '';
    } catch { return ''; }
  }

  // 站內品牌圖片只接受相對資源路徑，不接受外部追蹤或可執行 URL。
  function safeAssetPath(value) {
    if (typeof value !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9_./-]*\.(svg|png|webp)$/.test(value)) return '';
    if (value.split('/').some(part => part === '.' || part === '..' || part === '')) return '';
    return value;
  }

  window.SiteComponentUtils = { escape, safeHref, safeAssetPath };
})();
