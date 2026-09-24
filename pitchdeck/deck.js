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
    const target = parseFloat(el.dataset.count);
    const duration = 1300;
    const start = performance.now();
    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = formatCount(el, target * eased);
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
