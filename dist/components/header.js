/*
 * 主站頁首元件
 * 01 render：資料變成既有 HTML 結構　02 mount：綁定漢堡選單與關閉行為
 * 不讀作品資料、不切換內容頁；目前路由由 app.js 呼叫 setActive 同步。
 */
(() => {
  'use strict';
  const mounted = new WeakMap();

  function render(settings, config) {
    const { escape, safeHref, safeAssetPath } = window.SiteComponentUtils;
    const profile = settings.profile;
    const home = safeHref('#' + config.homeView, { allowHash: true });
    const contact = config.contact;
    const brandImage = safeAssetPath(config.brandImage);
    const email = contact && safeHref('mailto:' + (profile[contact.profileKey] || ''), { allowMail: true });
    const links = config.navigation.filter(item => item.visible !== false).map(item => {
      const href = safeHref('#' + item.id, { allowHash: true });
      return href ? `<a href="${escape(href)}" data-view="${escape(item.id)}">${escape(item.label)}</a>` : '';
    }).join('\n');

    return `<div class="container header-inner">
      <a class="brand" href="${escape(home)}" aria-label="${escape(profile.name)} 首頁">
        <span class="brand-mark${brandImage ? ' has-image' : ''}" aria-hidden="true">${brandImage ? `<img src="${escape(brandImage)}" alt="" width="49" height="49" decoding="sync">` : escape(config.brandMark)}</span>
        <span class="brand-copy"><strong>${escape(profile.name.toUpperCase())}</strong><small>${escape(settings.siteName)}</small></span>
      </a>
      <button class="menu-toggle" type="button" aria-label="${escape(config.menu.expandLabel)}" aria-controls="site-nav" aria-expanded="false">
        <span class="menu-icon" aria-hidden="true"><span></span><span></span><span></span></span>
      </button>
      <nav class="site-nav" id="site-nav" aria-label="${escape(config.navigationLabel)}">${links}</nav>
      ${contact?.visible !== false && email ? `<a class="nav-contact" href="${escape(email)}">${escape(contact.label)} <span aria-hidden="true">↗</span></a>` : ''}
    </div>`;
  }

  function mount(host, settings, config) {
    // 重新掛載先解除舊監聽器，日後替換資料或版型不會讓選單觸發兩次。
    mounted.get(host)?.destroy();
    host.innerHTML = render(settings, config);
    const button = host.querySelector('.menu-toggle');
    const nav = host.querySelector('#site-nav');

    function closeMenu() {
      nav.classList.remove('is-open');
      button.setAttribute('aria-expanded', 'false');
      button.setAttribute('aria-label', config.menu.expandLabel);
    }
    function toggleMenu() {
      const open = button.getAttribute('aria-expanded') !== 'true';
      button.setAttribute('aria-expanded', String(open));
      button.setAttribute('aria-label', open ? config.menu.collapseLabel : config.menu.expandLabel);
      nav.classList.toggle('is-open', open);
    }
    function outsideClick(event) {
      const link = event.target.closest('a[href^="#"]');
      if (!host.contains(event.target) || link?.getAttribute('href') === location.hash) closeMenu();
    }
    function escapeKey(event) { if (event.key === 'Escape') closeMenu(); }
    function setActive(view) {
      nav.querySelectorAll('a[data-view]').forEach(link => {
        if (link.dataset.view === view) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      });
      closeMenu();
    }
    function destroy() {
      button.removeEventListener('click', toggleMenu);
      document.removeEventListener('click', outsideClick);
      document.removeEventListener('keydown', escapeKey);
      mounted.delete(host);
    }

    button.addEventListener('click', toggleMenu);
    document.addEventListener('click', outsideClick);
    document.addEventListener('keydown', escapeKey);
    const controller = { closeMenu, setActive, destroy };
    mounted.set(host, controller);
    return controller;
  }

  window.SiteHeader = { render, mount };
})();
