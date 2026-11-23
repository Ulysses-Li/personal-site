/*
 * 共用頁尾元件：只產生掛載點內的HTML，不建立或取代外層footer。
 * 依賴SiteComponentUtils.escape／safeHref；在render時才讀取，方便離線載入與測試。
 */
(function publishFooterComponent(root) {
  'use strict';

  // 01｜年份可由options.year注入；尚未到起始年時不產生倒置的年份範圍。
  function copyrightYears(copyright, options) {
    const startYear = Number(copyright.startYear);
    if (!Number.isInteger(startYear) || startYear <= 0) {
      throw new TypeError('頁尾copyright.startYear必須是有效的起始年份。');
    }

    const requestedYear = Number(options.year ?? new Date().getFullYear());
    const year = Number.isInteger(requestedYear) && requestedYear >= startYear ? requestedYear : startYear;
    return year === startYear ? String(startYear) : `${startYear}–${year}`;
  }

  // 02｜動態文字一律跳脫，網址經共用helper確認後才建立連結。
  function render(settings, config, options = {}) {
    const utils = root.SiteComponentUtils;
    if (!utils || typeof utils.escape !== 'function' || typeof utils.safeHref !== 'function') {
      throw new TypeError('頁尾元件需要先載入SiteComponentUtils共用工具。');
    }

    const profile = settings?.profile ?? {};
    const copyright = config?.copyright ?? {};
    const name = String(profile.name ?? '');
    const displayName = copyright.uppercaseName ? name.toUpperCase() : name;
    const years = copyrightYears(copyright, options);
    const description = utils.escape(settings?.siteName ?? '');
    const tagline = utils.escape(config?.tagline ?? '');

    const links = (Array.isArray(config?.links) ? config.links : []).map(link => {
      const profileKey = String(link.profileKey ?? '');
      const href = utils.safeHref(profile[profileKey]);
      if (typeof href !== 'string' || !href) return '';

      const label = utils.escape(link.label ?? '');
      const ariaLabel = utils.escape(String(link.ariaLabel ?? link.label ?? '').replace(/\{name\}/g, name));
      const external = link.external === true;
      const attributes = external ? ' target="_blank" rel="noopener noreferrer"' : '';
      const arrow = external ? ' ↗' : '';

      return `<a data-profile-link="${utils.escape(profileKey)}" href="${utils.escape(href)}"${attributes} aria-label="${ariaLabel}">${label}${arrow}</a>`;
    }).filter(Boolean).join(' ');

    // 保留原來的container、兩個直接子span及footer-dot，既有CSS可原封沿用。
    return `<div class="container footer-inner">
        <span>© ${utils.escape(years)} ${utils.escape(displayName)} <span class="footer-dot">/</span> ${description}</span>
        <span>${tagline}${links ? ` ${links}` : ''}</span>
      </div>`;
  }

  // 03｜掛載時只更新內部內容；外層footer的class與data-site-footer由頁面保留。
  function mount(host, settings, config, options = {}) {
    if (!host || typeof host !== 'object' || !('innerHTML' in host)) {
      throw new TypeError('頁尾掛載點必須是可更新innerHTML的元素。');
    }

    host.innerHTML = render(settings, config, options);
    return host;
  }

  root.SiteFooter = { render, mount };
})(typeof window === 'object' ? window : globalThis);
