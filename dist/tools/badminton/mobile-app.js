/**
 * 羽球工具的手機操作層
 *
 * 同一份名單、設定、球場及紀錄 DOM 在手機分頁顯示，桌機恢復完整工作區。
 * 本檔只管理畫面、焦點與按鈕位置，不更動計分引擎或儲存資料格式。
 */
(() => {
  'use strict';

  // ── 01｜畫面設定：與 mobile.css 的手機斷點一致。 ──
  const media = matchMedia('(max-width: 767.98px)');
  const screens = {
    court: { title: '球場', panel: 'courts-panel' },
    players: { title: '球友', panel: 'players-panel' },
    settings: { title: '設定', panel: 'settings-panel' },
    history: { title: '紀錄', panel: 'history-panel' }
  };
  const $ = (id) => document.getElementById(id);
  const navButtons = [...document.querySelectorAll('.mobile-nav [data-mobile-go]')];
  const panels = [...document.querySelectorAll('[data-mobile-panel]')];
  let current = 'court';

  // ── 02｜只有一組操作按鈕：手機搬至對應畫面，桌機放回原本位置。 ──
  function placeActions() {
    if (media.matches) {
      $('mobile-round-dock').append($('round-controls'));
      $('mobile-export-host').append($('export'));
      $('mobile-reset-host').append($('reset'));
    } else {
      $('desktop-round-host').append($('round-controls'));
      $('desktop-activity-host').append($('export'), $('reset'));
    }
  }

  // ── 03｜更新頁名、選中狀態與人數提示，不從畫面反推或改寫比賽狀態。 ──
  function sync() {
    $('mobile-page-title').textContent = screens[current].title;
    document.body.dataset.mobileScreen = current;
    navButtons.forEach((button) => {
      if (button.dataset.mobileGo === current) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
    panels.forEach((panel) => {
      if (media.matches) {
        panel.setAttribute('aria-hidden', String(panel.dataset.mobilePanel !== current));
      } else {
        panel.removeAttribute('aria-hidden');
      }
    });
    const counts = {
      players: parseInt($('roster-count').textContent, 10) || 0,
      history: parseInt($('history-count').textContent, 10) || 0
    };
    document.querySelectorAll('[data-badge]').forEach((badge) => {
      const count = counts[badge.dataset.badge] || 0;
      badge.textContent = count > 99 ? '99+' : String(count);
      badge.hidden = count === 0;
    });
  }

  // ── 04｜切換畫面前驗證設定；離開球場時先退出放大，解除捲動鎖定。 ──
  function show(screen, { validate = true, focus = true, scroll = true } = {}) {
    if (!Object.hasOwn(screens, screen)) return false;
    if (media.matches && current === 'settings' && screen !== current && validate) {
      if (globalThis.BadmintonUI?.commitSettings() === false) return false;
    }
    if (screen !== 'court') globalThis.BadmintonUI?.closeFocusedCourt();
    current = screen;
    if (media.matches) {
      if (screen === 'players') $('roster-details').open = true;
      if (screen === 'settings') $('settings-details').open = true;
    }
    sync();
    if (media.matches) {
      const panel = $(screens[screen].panel);
      if (focus) panel.focus({ preventScroll: true });
      if (scroll) window.scrollTo({ top: 0, behavior: 'instant' });
    }
    return true;
  }

  // ── 05｜底部導覽、空球場引導及面板完成按鈕共用事件。 ──
  document.addEventListener('click', (event) => {
    // 手機名單與設定為完整畫面，標題保持展開，避免誤觸後收起整頁。
    const summary = event.target.closest('#roster-details > summary, #settings-details > summary');
    if (media.matches && summary) {
      event.preventDefault();
      summary.parentElement.open = true;
    }
    const button = event.target.closest('[data-mobile-go]');
    if (!button) return;
    event.preventDefault();
    show(button.dataset.mobileGo);
  });
  document.addEventListener('badminton:render', sync);
  media.addEventListener('change', () => {
    placeActions();
    if (media.matches && current === 'players') $('roster-details').open = true;
    if (media.matches && current === 'settings') $('settings-details').open = true;
    sync();
  });

  // ── 06｜提供 UI 層切換畫面；不公開或複製名單、比分等核心資料。 ──
  globalThis.BadmintonMobile = { show, sync, get isMobile() { return media.matches; } };
  placeActions();
  show('court', { validate: false, focus: false, scroll: false });
})();
