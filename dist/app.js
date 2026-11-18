/**
 * 個人網站互動程式
 *
 * 修改內容請先到 content.js；版面在 index.html，配色在 styles.css。
 * 本檔負責把資料放進頁面，以及導覽、搜尋、分類、詳情視窗與履歷列印。
 * 所有功能都在瀏覽器本機執行，不需要伺服器或套件。
 */
(() => {
  'use strict';

  // ============================================================
  // 01. 取得內容資料、共用工具與頁面狀態
  // ============================================================
  const data = window.SITE_CONTENT;
  if (!data) return;

  const $ = (selector) => document.querySelector(selector);

  // 動態產生 HTML 時，先把特殊字元轉成純文字，避免內容被當成標籤執行。
  const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));

  const tags = (items) => items.map((item) => (
    `<span class="tag">${escape(item)}</span>`
  )).join('');

  const dialog = $('#detail-dialog');
  const categories = ['全部', ...new Set(data.knowledge.map((note) => note.category))];
  const titles = {
    home: '工程實踐與技術筆記',
    work: '作品案例',
    notes: '技術知識庫',
    resume: '個人履歷'
  };

  let activeView = null;
  let selectedCategory = '全部';
  let lastOpener = null;

  // ============================================================
  // 02. 個人資料：將 content.js 的設定套用到共用位置
  // ============================================================
  function renderProfile() {
    $('.brand-copy strong').textContent = data.profile.name.toUpperCase();
    $('.hero-author strong').textContent = data.profile.name;
    $('.hero-author img').alt = data.profile.name;
    $('.hero-intro').textContent = (
      `我是 ${data.profile.name}，${data.profile.role}。${data.profile.intro}`
    );
    $('#resume-title').textContent = data.profile.name;
    $('.resume-heading > div > p:last-child').textContent = data.profile.role;

    document.querySelectorAll('a[href^="mailto:"]').forEach((link) => {
      link.href = `mailto:${data.profile.email}`;
      if (link.classList.contains('resume-email')) {
        link.textContent = data.profile.email;
      }
    });

    // data-profile-link 指向 profile 中同名欄位，讓聯絡資料集中維護。
    document.querySelectorAll('[data-profile-link]').forEach((link) => {
      const value = data.profile[link.dataset.profileLink];
      if (typeof value !== 'string' || !/^https:\/\//i.test(value)) return;

      link.href = value;
      if (link.dataset.profileLabel === 'url') {
        link.textContent = value.replace(/^https:\/\//, '') + ' ↗';
      }
    });
  }

  // ============================================================
  // 03. 首頁能力與作品案例列表
  // ============================================================
  function renderOverview() {
    $('#practice-grid').innerHTML = data.competencies.map((item, index) => `
      <article class="practice-item">
        <span class="item-number">0${index + 1} / ${escape(item.english.toUpperCase())}</span>
        <h3>${escape(item.title)}</h3>
        <p>${escape(item.description)}</p>
        <div class="tag-list">${tags(item.tags)}</div>
      </article>
    `).join('');

    $('#work-list').innerHTML = data.projects.map((project, index) => `
      <article class="work-entry">
        <span class="work-number">${String(index + 1).padStart(2, '0')}</span>
        <div class="work-main">
          <span class="eyebrow">${escape(project.category)}</span>
          <h2>${escape(project.title)}</h2>
          <p>${escape(project.summary)}</p>
          <div class="tag-list">${tags(project.tags)}</div>
        </div>
        <div class="work-actions">
          <span class="status-note">${escape(project.status)}</span>
          <button class="text-link" type="button" data-project="${escape(project.id)}">
            查看案例 ${index === 0 ? '↗' : '整理架構 ↗'}
          </button>
        </div>
      </article>
    `).join('');
  }

  // ============================================================
  // 04. 履歷：重用個人能力與作品，避免重複維護相同資料
  // ============================================================
  function renderResume() {
    $('#resume-summary').textContent = data.resume.summary;
    $('#resume-competencies').innerHTML = data.competencies.map((item) => `
      <div class="resume-skill-line">
        <h3>${escape(item.english)} / ${escape(item.title)}</h3>
        <p>${escape(item.description)}</p>
      </div>
    `).join('');

    $('#resume-projects').innerHTML = data.projects.map((project) => `
      <div class="resume-skill-line">
        <h3>${escape(project.title)}</h3>
        <p>${escape(project.summary)}</p>
        <span class="status-note">${escape(project.status)}</span>
      </div>
    `).join('');

    $('#resume-skills').innerHTML = tags(data.resume.skills);
    $('#resume-gaps').innerHTML = data.resume.gaps.map((gap) => (
      `<li>${escape(gap)}</li>`
    )).join('');
  }

  // ============================================================
  // 05. 技術知識庫：分類與關鍵字搜尋採交集篩選
  // ============================================================
  function renderFilters() {
    $('#knowledge-filters').innerHTML = categories.map((category) => `
      <button
        class="filter-button"
        type="button"
        data-category="${escape(category)}"
        aria-pressed="${category === '全部'}"
      >${escape(category)}</button>
    `).join('');
  }

  function renderNotes() {
    const query = $('#knowledge-search').value.trim().toLocaleLowerCase();
    const tokens = query.split(/\s+/).filter(Boolean);

    const filtered = data.knowledge.filter((note) => {
      // 搜尋涵蓋標題、分類、介紹、標籤與內文；多個詞必須全部符合。
      const searchableText = [
        note.title,
        note.category,
        note.description,
        ...note.tags,
        ...note.sections.map((section) => `${section.heading} ${section.body}`)
      ].join(' ').toLocaleLowerCase();

      const matchesCategory = (
        selectedCategory === '全部' || note.category === selectedCategory
      );
      const matchesQuery = tokens.every((token) => searchableText.includes(token));
      return matchesCategory && matchesQuery;
    });

    $('#results-count').textContent = (
      `${filtered.length} 個整理主題 / ${data.knowledge.length} 個主題範本`
    );
    $('#knowledge-empty').hidden = filtered.length > 0;
    $('#knowledge-list').innerHTML = filtered.map((note) => `
      <button class="knowledge-row" type="button" data-note="${escape(note.id)}">
        <span class="note-index">${String(data.knowledge.indexOf(note) + 1).padStart(2, '0')}</span>
        <span class="note-main">
          <span class="note-category">${escape(note.category)} <span>／ 整理範本</span></span>
          <strong>${escape(note.title)}</strong>
          <span class="note-description">${escape(note.description.replace(/^整理範本[｜|]\s*/, ''))}</span>
        </span>
        <span class="note-arrow" aria-hidden="true">↗</span>
      </button>
    `).join('');

    document.querySelectorAll('.filter-button').forEach((button) => {
      button.setAttribute('aria-pressed', String(
        button.dataset.category === selectedCategory
      ));
    });
  }

  // ============================================================
  // 06. 共用詳情視窗：作品案例與技術文章使用相同容器
  // ============================================================
  function showDetail(kind, item) {
    $('#detail-kicker').textContent = kind === 'project'
      ? `${item.category} / ${item.status}`
      : `${item.category} / 整理範本`;
    $('#detail-title').textContent = item.title;
    $('#detail-tags').innerHTML = tags(item.tags);

    const sections = kind === 'project' ? [
      { heading: '問題與背景', body: item.context },
      { heading: '採用方法與實作', body: item.approach },
      { heading: '成果與驗證證據', body: item.evidence },
      { heading: '接下來要完成的事', body: item.nextStep }
    ] : item.sections;

    $('#detail-body').innerHTML = sections.map((section) => `
      <section class="detail-section">
        <h3>${escape(section.heading)}</h3>
        <p>${escape(section.body)}</p>
      </section>
    `).join('');
    $('#detail-footer').replaceChildren();

    if (kind === 'project') {
      const link = document.createElement('a');
      const isInternal = item.url.startsWith('#');
      link.className = 'button button-dark';
      link.textContent = isInternal ? '返回個人網站 →' : '前往既有網站 ↗';

      // 作品連結僅接受站內錨點或 HTTPS，不執行資料中其他協定的網址。
      if (isInternal || /^https:\/\//i.test(item.url)) {
        link.setAttribute('href', item.url);
      }
      if (!isInternal) {
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      }
      $('#detail-footer').append(link);
    } else {
      const note = document.createElement('p');
      note.textContent = '這是一份整理範本。補上自己的案例、適用條件、驗證結果與來源後，再作為技術文章使用。';
      $('#detail-footer').append(note);
    }

    if (!dialog.open) {
      dialog.showModal();
      document.body.classList.add('dialog-open');
      dialog.scrollTop = 0;
    }
  }

  // ============================================================
  // 07. 網址導覽：#home、#work、#notes、#resume 與詳情深連結
  // ============================================================
  function closeMenu() {
    $('#site-nav').classList.remove('is-open');
    $('.menu-toggle').setAttribute('aria-expanded', 'false');
    $('.menu-toggle').setAttribute('aria-label', '展開導覽');
  }

  function route({ initial = false } = {}) {
    let parts;
    try {
      parts = decodeURIComponent(location.hash.slice(1)).split('/');
    } catch {
      parts = ['home'];
    }

    let view = parts[0] || 'home';
    if (!Object.hasOwn(titles, view)) view = 'home';
    const changed = view !== activeView;

    document.querySelectorAll('main > .view').forEach((section) => {
      const current = section.dataset.view === view;
      section.hidden = !current;
      section.classList.toggle('is-active', current);
    });
    document.querySelectorAll('.site-nav a[data-view]').forEach((link) => {
      if (link.dataset.view === view) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });

    document.title = `${data.profile.name}｜${titles[view]}`;
    activeView = view;
    closeMenu();

    let item = null;
    if (view === 'work') {
      item = data.projects.find((project) => project.id === parts[1]);
    } else if (view === 'notes') {
      item = data.knowledge.find((note) => note.id === parts[1]);
    }

    if (item) showDetail(view === 'work' ? 'project' : 'note', item);
    else if (dialog.open) dialog.close();

    if (changed && !initial) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      if (!item) $('#main-content').focus({ preventScroll: true });
    }
  }

  // ============================================================
  // 08. 點擊、輸入與鍵盤事件：動態列表使用事件委派
  // ============================================================
  function bindEvents() {
    document.addEventListener('click', (event) => {
      // 跳躍連結只移動焦點，不把 #main-content 誤當作頁面路由。
      if (event.target.closest('.skip-link')) {
        event.preventDefault();
        $('#main-content').focus();
        return;
      }

      const projectButton = event.target.closest('[data-project]');
      const noteButton = event.target.closest('[data-note]');
      if (projectButton || noteButton) {
        lastOpener = projectButton || noteButton;
        location.hash = projectButton
          ? `work/${projectButton.dataset.project}`
          : `notes/${noteButton.dataset.note}`;
      }

      const categoryButton = event.target.closest('[data-category]');
      if (categoryButton) {
        selectedCategory = categoryButton.dataset.category;
        renderNotes();
      }

      if (!event.target.closest('.site-header')) closeMenu();
      const sameRouteLink = event.target.closest('a[href^="#"]');
      if (sameRouteLink?.getAttribute('href') === location.hash) closeMenu();
    });

    $('#knowledge-search').addEventListener('input', renderNotes);
    $('#reset-search').addEventListener('click', () => {
      selectedCategory = '全部';
      $('#knowledge-search').value = '';
      renderNotes();
      $('#knowledge-search').focus();
    });

    $('.menu-toggle').addEventListener('click', () => {
      const open = $('.menu-toggle').getAttribute('aria-expanded') !== 'true';
      $('.menu-toggle').setAttribute('aria-expanded', String(open));
      $('.menu-toggle').setAttribute('aria-label', open ? '收合導覽' : '展開導覽');
      $('#site-nav').classList.toggle('is-open', open);
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMenu();
    });

    $('.dialog-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (event) => {
      const box = dialog.getBoundingClientRect();
      const outside = (
        event.clientX < box.left || event.clientX > box.right ||
        event.clientY < box.top || event.clientY > box.bottom
      );
      if (event.target === dialog && outside) dialog.close();
    });
    dialog.addEventListener('close', () => {
      document.body.classList.remove('dialog-open');

      // 由列表開啟時回到前一筆網址；直接開深連結時，改寫成所屬頁面。
      if (location.hash.includes('/') && ['work', 'notes'].includes(activeView)) {
        if (lastOpener) history.back();
        else history.replaceState(null, '', `#${activeView}`);
      }
      if (lastOpener?.isConnected && !lastOpener.closest('[hidden]')) {
        lastOpener.focus({ preventScroll: true });
      }
      lastOpener = null;
    });

    // 列印版面由 styles.css 的 @media print 控制。
    $('#print-resume').addEventListener('click', () => window.print());
    window.addEventListener('hashchange', () => route());
  }

  // ============================================================
  // 09. 初始化順序：資料套用 → 建立列表 → 綁定事件 → 顯示目前頁面
  // ============================================================
  renderProfile();
  renderOverview();
  renderResume();
  renderFilters();
  renderNotes();
  bindEvents();
  route({ initial: true });
})();
