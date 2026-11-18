(() => {
  'use strict';
  const data = window.SITE_CONTENT;
  if (!data) return;
  const $ = (selector) => document.querySelector(selector);
  const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[char]));
  const tags = (items) => items.map((item) => `<span class="tag">${escape(item)}</span>`).join('');
  const dialog = $('#detail-dialog');
  let activeView = null;
  let selectedCategory = '全部';
  let lastOpener = null;
  const categories = ['全部', ...new Set(data.knowledge.map((note) => note.category))];
  const titles = {home: '工程實踐與技術筆記', work: '作品案例', notes: '技術知識庫', resume: '個人履歷'};

  // Keep identity and contact information in one editable content source.
  $('.brand-copy strong').textContent = data.profile.name.toUpperCase();
  $('.hero-author strong').textContent = data.profile.name;
  $('.hero-author img').alt = data.profile.name;
  $('.hero-intro').textContent = `我是 ${data.profile.name}，${data.profile.role}。${data.profile.intro}`;
  $('#resume-title').textContent = data.profile.name;
  $('.resume-heading > div > p:last-child').textContent = data.profile.role;
  document.querySelectorAll('a[href^="mailto:"]').forEach((link) => {
    link.href = `mailto:${data.profile.email}`;
    if (link.classList.contains('resume-email')) link.textContent = data.profile.email;
  });
  document.querySelectorAll('[data-profile-link]').forEach((link) => {
    const value = data.profile[link.dataset.profileLink];
    if (typeof value !== 'string' || !/^https:\/\//i.test(value)) return;
    link.href = value;
    if (link.dataset.profileLabel === 'url') link.textContent = value.replace(/^https:\/\//, '') + ' ↗';
  });

  $('#practice-grid').innerHTML = data.competencies.map((item, index) => `<article class="practice-item"><span class="item-number">0${index + 1} / ${escape(item.english.toUpperCase())}</span><h3>${escape(item.title)}</h3><p>${escape(item.description)}</p><div class="tag-list">${tags(item.tags)}</div></article>`).join('');

  $('#work-list').innerHTML = data.projects.map((project, index) => `<article class="work-entry"><span class="work-number">${String(index + 1).padStart(2, '0')}</span><div class="work-main"><span class="eyebrow">${escape(project.category)}</span><h2>${escape(project.title)}</h2><p>${escape(project.summary)}</p><div class="tag-list">${tags(project.tags)}</div></div><div class="work-actions"><span class="status-note">${escape(project.status)}</span><button class="text-link" type="button" data-project="${escape(project.id)}">查看案例 ${index === 0 ? '↗' : '整理架構 ↗'}</button></div></article>`).join('');

  $('#knowledge-filters').innerHTML = categories.map((category) => `<button class="filter-button" type="button" data-category="${escape(category)}" aria-pressed="${category === '全部'}">${escape(category)}</button>`).join('');
  $('#resume-summary').textContent = data.resume.summary;
  $('#resume-competencies').innerHTML = data.competencies.map((item) => `<div class="resume-skill-line"><h3>${escape(item.english)} / ${escape(item.title)}</h3><p>${escape(item.description)}</p></div>`).join('');
  $('#resume-projects').innerHTML = data.projects.map((project) => `<div class="resume-skill-line"><h3>${escape(project.title)}</h3><p>${escape(project.summary)}</p><span class="status-note">${escape(project.status)}</span></div>`).join('');
  $('#resume-skills').innerHTML = tags(data.resume.skills);
  $('#resume-gaps').innerHTML = data.resume.gaps.map((gap) => `<li>${escape(gap)}</li>`).join('');

  function renderNotes() {
    const query = $('#knowledge-search').value.trim().toLocaleLowerCase();
    const tokens = query.split(/\s+/).filter(Boolean);
    const filtered = data.knowledge.filter((note) => {
      const text = [note.title, note.category, note.description, ...note.tags, ...note.sections.map((section) => `${section.heading} ${section.body}`)].join(' ').toLocaleLowerCase();
      return (selectedCategory === '全部' || note.category === selectedCategory) && tokens.every((token) => text.includes(token));
    });
    $('#results-count').textContent = `${filtered.length} 個整理主題 / ${data.knowledge.length} 個主題範本`;
    $('#knowledge-empty').hidden = filtered.length > 0;
    $('#knowledge-list').innerHTML = filtered.map((note) => `<button class="knowledge-row" type="button" data-note="${escape(note.id)}"><span class="note-index">${String(data.knowledge.indexOf(note) + 1).padStart(2, '0')}</span><span class="note-main"><span class="note-category">${escape(note.category)} <span>／ 整理範本</span></span><strong>${escape(note.title)}</strong><span class="note-description">${escape(note.description.replace(/^整理範本[｜|]\s*/, ''))}</span></span><span class="note-arrow" aria-hidden="true">↗</span></button>`).join('');
    document.querySelectorAll('.filter-button').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.category === selectedCategory)));
  }

  function closeMenu() {
    $('#site-nav').classList.remove('is-open');
    $('.menu-toggle').setAttribute('aria-expanded', 'false');
    $('.menu-toggle').setAttribute('aria-label', '展開導覽');
  }

  function showDetail(kind, item) {
    $('#detail-kicker').textContent = kind === 'project' ? `${item.category} / ${item.status}` : `${item.category} / 整理範本`;
    $('#detail-title').textContent = item.title;
    $('#detail-tags').innerHTML = tags(item.tags);
    const sections = kind === 'project' ? [
      {heading: '問題與背景', body: item.context},
      {heading: '採用方法與實作', body: item.approach},
      {heading: '成果與驗證證據', body: item.evidence},
      {heading: '接下來要完成的事', body: item.nextStep}
    ] : item.sections;
    $('#detail-body').innerHTML = sections.map((section) => `<section class="detail-section"><h3>${escape(section.heading)}</h3><p>${escape(section.body)}</p></section>`).join('');
    $('#detail-footer').replaceChildren();
    if (kind === 'project') {
      const link = document.createElement('a');
      link.className = 'button button-dark';
      link.textContent = item.url.startsWith('#') ? '返回個人網站 →' : '前往既有網站 ↗';
      // Content is maintained in the repository. Only expected navigation schemes are accepted.
      if (item.url.startsWith('#') || /^https:\/\//i.test(item.url)) link.setAttribute('href', item.url);
      if (!item.url.startsWith('#')) { link.target = '_blank'; link.rel = 'noopener noreferrer'; }
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

  function route({initial = false} = {}) {
    let parts;
    try { parts = decodeURIComponent(location.hash.slice(1)).split('/'); } catch { parts = ['home']; }
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
    const item = view === 'work' ? data.projects.find((project) => project.id === parts[1]) : view === 'notes' ? data.knowledge.find((note) => note.id === parts[1]) : null;
    if (item) showDetail(view === 'work' ? 'project' : 'note', item);
    else if (dialog.open) dialog.close();
    if (changed && !initial) {
      window.scrollTo({top: 0, behavior: 'instant'});
      if (!item) $('#main-content').focus({preventScroll: true});
    }
  }

  document.addEventListener('click', (event) => {
    if (event.target.closest('.skip-link')) {
      event.preventDefault();
      $('#main-content').focus();
      return;
    }
    const projectButton = event.target.closest('[data-project]');
    const noteButton = event.target.closest('[data-note]');
    if (projectButton || noteButton) {
      lastOpener = projectButton || noteButton;
      location.hash = projectButton ? `work/${projectButton.dataset.project}` : `notes/${noteButton.dataset.note}`;
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
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeMenu(); });
  $('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    const box = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('dialog-open');
    if (location.hash.includes('/') && ['work', 'notes'].includes(activeView)) {
      if (lastOpener) history.back();
      else history.replaceState(null, '', `#${activeView}`);
    }
    if (lastOpener?.isConnected && !lastOpener.closest('[hidden]')) lastOpener.focus({preventScroll: true});
    lastOpener = null;
  });
  $('#print-resume').addEventListener('click', () => window.print());
  window.addEventListener('hashchange', () => route());
  renderNotes();
  route({initial: true});
})();
