const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── THEME TOGGLE ────────────────────────────────────────── */
const themeToggle = document.getElementById('themeToggle');

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    const next = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('triarch-theme', next); } catch (e) {}
  });
}

/* ── ELEMENTS ────────────────────────────────────────────── */
const scroller = document.getElementById('deckScroller');
const progress = document.getElementById('deckProgress');
const slides = Array.from(document.querySelectorAll('.slide'));
const navButtons = Array.from(document.querySelectorAll('.deck-sidebar-list button'));
const arrowUp = document.getElementById('arrowUp');
const arrowDown = document.getElementById('arrowDown');

let activeIndex = 0;

/* Stagger index for entrance animation */
slides.forEach((slide) => {
  slide.querySelectorAll('.rv').forEach((el, i) => el.style.setProperty('--i', i));
});

/* ── COUNT-UP NUMBERS ────────────────────────────────────── */
const counters = Array.from(document.querySelectorAll('[data-count]'));

function formatCount(el, value) {
  const decimals = parseInt(el.dataset.decimals || '0', 10);
  return (el.dataset.prefix || '') + value.toFixed(decimals) + (el.dataset.suffix || '');
}

if (!prefersReducedMotion) {
  counters.forEach((el) => { el.textContent = formatCount(el, 0); });
}

function runCounters(slide) {
  if (prefersReducedMotion) return;
  slide.querySelectorAll('[data-count]').forEach((el) => {
    const duration = 1300;
    const start = performance.now();
    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = formatCount(el, parseFloat(el.dataset.count) * eased);
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}

/* ── ACTIVE SLIDE + PROGRESS ─────────────────────────────── */
function setActive(index) {
  if (index < 0 || index === activeIndex && navButtons[index].classList.contains('active')) return;
  activeIndex = index;
  navButtons.forEach((btn, i) => {
    const on = i === index;
    btn.classList.toggle('active', on);
    if (on) btn.setAttribute('aria-current', 'true');
    else btn.removeAttribute('aria-current');
  });
  if (arrowUp) arrowUp.disabled = index === 0;
  if (arrowDown) arrowDown.disabled = index === slides.length - 1;

  const activeBtn = navButtons[index];
  if (activeBtn && activeBtn.scrollIntoView) {
    activeBtn.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  const id = slides[index].id;
  if (id) history.replaceState(null, '', '#' + id);
}

const activeObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) setActive(slides.indexOf(entry.target));
  });
}, { root: scroller, rootMargin: '-45% 0px -45% 0px', threshold: 0 });

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      runCounters(entry.target);
      revealObserver.unobserve(entry.target);
    }
  });
}, { root: scroller, threshold: 0.2 });

slides.forEach((slide) => {
  activeObserver.observe(slide);
  revealObserver.observe(slide);
});

let progressQueued = false;
scroller.addEventListener('scroll', () => {
  if (progressQueued) return;
  progressQueued = true;
  requestAnimationFrame(() => {
    progressQueued = false;
    const max = scroller.scrollHeight - scroller.clientHeight;
    progress.style.width = (max > 0 ? (scroller.scrollTop / max) * 100 : 0) + '%';
  });
}, { passive: true });

/* ── NAVIGATION ──────────────────────────────────────────── */
function goToSlide(i, instant) {
  const clamped = Math.max(0, Math.min(slides.length - 1, i));
  slides[clamped].scrollIntoView({
    behavior: instant || prefersReducedMotion ? 'auto' : 'smooth',
    block: 'start'
  });
}

navButtons.forEach((btn) => {
  btn.addEventListener('click', () => goToSlide(parseInt(btn.dataset.target, 10)));
});

if (arrowUp) arrowUp.addEventListener('click', () => goToSlide(activeIndex - 1));
if (arrowDown) arrowDown.addEventListener('click', () => goToSlide(activeIndex + 1));

document.addEventListener('keydown', (e) => {
  if (e.altKey || e.ctrlKey || e.metaKey) return;
  const tag = (e.target && e.target.tagName) || '';
  if (tag === 'INPUT' || tag === 'TEXTAREA') return;

  switch (e.key) {
    case 'ArrowDown':
    case 'PageDown':
      e.preventDefault();
      goToSlide(activeIndex + 1);
      break;
    case 'ArrowUp':
    case 'PageUp':
      e.preventDefault();
      goToSlide(activeIndex - 1);
      break;
    case 'Home':
      e.preventDefault();
      goToSlide(0);
      break;
    case 'End':
      e.preventDefault();
      goToSlide(slides.length - 1);
      break;
  }
});

/* Deep link: /pitchdeck/#traction */
if (location.hash) {
  const target = slides.findIndex((s) => '#' + s.id === location.hash);
  if (target > 0) goToSlide(target, true);
}

/* ── STUDIO DATA: MOBILE SLIDE + COUNTS ──────────────────── */
function make(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function gameIcon(game, className) {
  const img = make('img', className);
  img.src = game.icon;
  img.alt = '';
  img.width = 256;
  img.height = 256;
  return img;
}

function buildFeature(game, isTop) {
  const slide = make('div', 'mobile-slide');
  if (game.icon) slide.appendChild(gameIcon(game, 'mobile-icon'));
  const body = make('div', 'mobile-feature-body');
  body.appendChild(make('p', 'mobile-eyebrow', isTop && game.minInstalls > 0 ? 'Most downloaded' : 'Live on Google Play'));
  body.appendChild(make('h3', null, game.title));
  if (game.summary) body.appendChild(make('p', 'mobile-summary', game.summary));

  const chips = make('ul', 'mobile-chips');
  if (game.genre) chips.appendChild(make('li', null, game.genre));
  if (game.free) chips.appendChild(make('li', null, 'Free to play'));
  if (game.minInstalls > 0) chips.appendChild(make('li', 'hl', game.installs + ' installs'));
  if (game.score && game.ratings > 0) chips.appendChild(make('li', 'hl', game.score.toFixed(1) + ' ★ · ' + game.ratings + ' ratings'));
  body.appendChild(chips);

  const link = make('a', 'slide-link', 'View on Google Play ↗');
  link.href = game.url;
  link.target = '_blank';
  link.rel = 'noopener';
  body.appendChild(link);
  slide.appendChild(body);
  return slide;
}

function buildListItem(game) {
  const item = make('li');
  const a = make('a');
  a.href = game.url;
  a.target = '_blank';
  a.rel = 'noopener';
  if (game.icon) a.appendChild(gameIcon(game, 'mobile-list-icon'));
  const text = make('span');
  text.appendChild(make('b', null, game.title));
  const detail = [game.genre, game.minInstalls > 0 ? game.installs + ' installs' : null].filter(Boolean).join(' · ');
  if (detail) text.appendChild(make('em', null, detail));
  a.appendChild(text);
  item.appendChild(a);
  return item;
}

function renderMobileSlide(data) {
  const live = document.getElementById('mobileLive');
  if (!live || data.games.length === 0) return;

  const ranked = TriarchData.byInstalls(data.games);

  /* Left: every game cross-fades through the feature card */
  const feature = document.getElementById('mobileFeature');
  const cards = ranked.map((game, i) => feature.appendChild(buildFeature(game, i === 0)));
  let current = 0;
  cards[0].classList.add('is-active');
  if (cards.length > 1 && !prefersReducedMotion) {
    setInterval(() => {
      cards[current].classList.remove('is-active');
      current = (current + 1) % cards.length;
      cards[current].classList.add('is-active');
    }, 3500);
  }

  /* Right: three rows; a new game drops in from the top while the bottom one leaves */
  const list = document.getElementById('mobileList');
  const VISIBLE = 3;
  const shown = Math.min(VISIBLE, ranked.length);
  let next = shown;
  for (let i = 0; i < shown; i++) list.appendChild(buildListItem(ranked[i]));
  if (ranked.length > VISIBLE && !prefersReducedMotion) {
    setInterval(() => {
      const last = list.lastElementChild;
      last.classList.add('is-leaving');
      setTimeout(() => {
        last.remove();
        const item = buildListItem(ranked[next % ranked.length]);
        item.classList.add('is-entering');
        list.insertBefore(item, list.firstElementChild);
        next++;
      }, 450);
    }, 2800);
  }

  live.classList.toggle('is-solo', ranked.length < 2);
  live.hidden = false;
}

function applyStudioCounts(counts) {
  document.getElementById('mobileLink').href = counts.developerUrl;
  const note = document.getElementById('mobileNote');
  if (counts.androidInDevelopment > 0) {
    note.textContent = counts.androidInDevelopment + ' more mobile ' + (counts.androidInDevelopment === 1 ? 'title is' : 'titles are') +
      ' in testing or development. Our mobile games are free to play, supported by optional rewarded ads.';
  }
  document.querySelectorAll('[data-bind]').forEach((node) => {
    const value = counts[node.dataset.bind];
    if (value === undefined) return;
    node.dataset.count = value;
    const slide = node.closest('.slide');
    if (prefersReducedMotion || (slide && slide.classList.contains('in-view'))) node.textContent = formatCount(node, value);
  });
}

if (window.TriarchData) {
  TriarchData.load('../').then((data) => {
    renderMobileSlide(data);
    if (data.counts) applyStudioCounts({ ...data.counts, developerUrl: data.developerUrl });
  });
}

/* ── PRINT / PDF EXPORT ──────────────────────────────────── */
function prepareForPrint() {
  slides.forEach((slide) => slide.classList.add('in-view'));
  counters.forEach((el) => { el.textContent = formatCount(el, parseFloat(el.dataset.count)); });
}

if (window.matchMedia('print').matches) prepareForPrint();
window.addEventListener('beforeprint', prepareForPrint);
if (window.matchMedia) {
  const printQuery = window.matchMedia('print');
  const printListener = (e) => { if (e.matches) prepareForPrint(); };
  if (printQuery.addEventListener) printQuery.addEventListener('change', printListener);
  else if (printQuery.addListener) printQuery.addListener(printListener);
}
