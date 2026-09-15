const themeToggle = document.getElementById('themeToggle');

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    const next = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('triarch-theme', next);
  });
}

const scroller = document.getElementById('deckScroller');
const progress = document.getElementById('deckProgress');
const slides = Array.from(document.querySelectorAll('.slide'));
const navItems = Array.from(document.querySelectorAll('.deck-sidebar-list li'));
const arrowUp = document.getElementById('arrowUp');
const arrowDown = document.getElementById('arrowDown');

let activeIndex = 0;

function getActiveIndex() {
  let idx = 0;
  let bestDist = Infinity;
  slides.forEach((s, i) => {
    const dist = Math.abs(s.getBoundingClientRect().top);
    if (dist < bestDist) { bestDist = dist; idx = i; }
  });
  return idx;
}

function updateProgress() {
  const max = scroller.scrollHeight - scroller.clientHeight;
  const pct = max > 0 ? (scroller.scrollTop / max) * 100 : 0;
  progress.style.width = pct + '%';

  activeIndex = getActiveIndex();

  navItems.forEach((li, i) => li.classList.toggle('active', i === activeIndex));

  if (arrowUp) arrowUp.disabled = activeIndex === 0;
  if (arrowDown) arrowDown.disabled = activeIndex === slides.length - 1;
}

function goToSlide(i) {
  const clamped = Math.max(0, Math.min(slides.length - 1, i));
  slides[clamped].scrollIntoView({ behavior: 'smooth', block: 'start' });
}

scroller.addEventListener('scroll', updateProgress, { passive: true });
window.addEventListener('resize', updateProgress);
updateProgress();

navItems.forEach((li) => {
  li.addEventListener('click', () => goToSlide(parseInt(li.dataset.target, 10)));
});

if (arrowUp) arrowUp.addEventListener('click', () => goToSlide(activeIndex - 1));
if (arrowDown) arrowDown.addEventListener('click', () => goToSlide(activeIndex + 1));

document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown' || e.key === 'PageDown') {
    e.preventDefault();
    goToSlide(activeIndex + 1);
  } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
    e.preventDefault();
    goToSlide(activeIndex - 1);
  }
});
