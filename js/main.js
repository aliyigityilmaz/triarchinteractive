/* ═══════════════════════════════════════════════════════════
   TRIARCH INTERACTIVE — main.js
═══════════════════════════════════════════════════════════ */

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

/* ── SCROLL: PROGRESS BAR + HEADER SHRINK ────────────────── */
const progressBar = document.getElementById('progressBar');
const header = document.getElementById('site-header');
let scrollQueued = false;

function onScroll() {
  scrollQueued = false;
  const doc = document.documentElement;
  const max = doc.scrollHeight - doc.clientHeight;
  progressBar.style.width = (max > 0 ? (doc.scrollTop / max) * 100 : 0) + '%';
  header.classList.toggle('scrolled', window.scrollY > 60);
}

window.addEventListener('scroll', () => {
  if (!scrollQueued) {
    scrollQueued = true;
    requestAnimationFrame(onScroll);
  }
}, { passive: true });

onScroll();

/* ── SCROLL REVEAL ───────────────────────────────────────── */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('active');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.08 });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* ── STUDIO DATA: MOBILE GAMES + COUNTS ──────────────────── */
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function buildPlayCard(game) {
  const card = el('article', 'project-card');

  const thumb = el('a', 'project-thumb play-thumb');
  thumb.href = game.url;
  thumb.target = '_blank';
  thumb.rel = 'noopener';
  thumb.setAttribute('aria-label', game.title + ' on Google Play');
  if (game.icon) {
    thumb.style.setProperty('--icon', 'url("' + game.icon + '")');
    const icon = el('img', 'play-icon');
    icon.src = game.icon;
    icon.alt = game.title + ' icon';
    icon.width = 256;
    icon.height = 256;
    icon.loading = 'lazy';
    thumb.appendChild(icon);
  }
  thumb.appendChild(el('span', 'badge badge-live', 'Available now'));

  const meta = el('div', 'project-meta');
  meta.appendChild(el('h3', null, game.title));
  const button = el('a', 'btn-fill sm', 'Get on Google Play');
  button.href = game.url;
  button.target = '_blank';
  button.rel = 'noopener';
  meta.appendChild(button);

  card.append(thumb, meta);
  return card;
}

if (window.TriarchData) {
  TriarchData.load('').then((data) => {
    const grid = document.getElementById('mobileGrid');
    if (grid) {
      const tile = grid.querySelector('.see-all-card');
      tile.querySelector('a').href = data.developerUrl;
      TriarchData.newest(data.games).slice(0, 3).forEach((game) => grid.insertBefore(buildPlayCard(game), tile));
    }
    if (data.counts) {
      document.querySelectorAll('[data-stat]').forEach((node) => {
        const value = data.counts[node.dataset.stat];
        if (value !== undefined) node.textContent = value;
      });
    }
  });
}

/* ── SMOOTH SCROLL (NAV LINKS) ───────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const id = this.getAttribute('href');
    if (id.length < 2) return;
    const target = document.querySelector(id);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      history.replaceState(null, '', id);
    }
  });
});
