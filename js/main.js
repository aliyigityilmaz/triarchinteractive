/* ═══════════════════════════════════════════════════════════
   TRIARCH INTERACTIVE — main.js
═══════════════════════════════════════════════════════════ */

/* ── THEME TOGGLE ────────────────────────────────────────── */
const themeToggle = document.getElementById('themeToggle');

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    const next = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('triarch-theme', next);
  });
}

/* ── PROGRESS BAR ────────────────────────────────────────── */
const progressBar = document.getElementById('progressBar');

window.addEventListener('scroll', () => {
  const scrollTop    = document.documentElement.scrollTop;
  const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  progressBar.style.width = (scrollTop / scrollHeight * 100) + '%';
});

/* ── HEADER SHRINK ON SCROLL ─────────────────────────────── */
const header = document.getElementById('site-header');

window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 60);
});

/* ── SCROLL REVEAL ───────────────────────────────────────── */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('active');
    }
  });
}, {
  threshold: 0.1
});

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* ── SMOOTH SCROLL (NAV LINKS) ───────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});