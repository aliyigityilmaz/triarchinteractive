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
