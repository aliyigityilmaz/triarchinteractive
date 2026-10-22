/* ═══════════════════════════════════════════════════════════
   Refreshes data/play-games.json and assets/play/*.webp from the
   public Google Play developer page. Run by
   .github/workflows/update-play-games.yml (or: npm ci --prefix scripts
   && node scripts/update-play-games.mjs).
═══════════════════════════════════════════════════════════ */
import gplay from 'google-play-scraper';
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEV_ID = 'Triarch Interactive';
const DEV_URL = 'https://play.google.com/store/apps/developer?id=Triarch+Interactive';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA_FILE = join(ROOT, 'data', 'play-games.json');
const ICON_DIR = join(ROOT, 'assets', 'play');
const LOCALE = { lang: 'en', country: 'us' };

async function retry(label, fn, attempts = 3) {
  for (let i = 1; ; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i >= attempts) throw new Error(`${label} failed after ${attempts} attempts: ${err.message}`);
      await new Promise((r) => setTimeout(r, 2000 * i));
    }
  }
}

const exists = (p) => access(p).then(() => true, () => false);

function plainText(s) {
  return String(s || '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

/* Play gives "Oct 9, 2026" (no zone) or a ms timestamp; read both as UTC so the result never depends on the machine's timezone. */
function isoDate(value) {
  const d = new Date(typeof value === 'string' ? `${value} UTC` : value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

async function readPrevious() {
  try {
    return JSON.parse(await readFile(DATA_FILE, 'utf8'));
  } catch {
    return { developerUrl: DEV_URL, games: [] };
  }
}

async function saveIcon(appId, iconUrl, previous) {
  const rel = `assets/play/${appId}.webp`;
  const file = join(ROOT, rel);
  const key = iconUrl.split('/').pop();
  if (previous && previous.iconKey === key && (await exists(file))) return { icon: rel, iconKey: key };
  try {
    const res = await fetch(`${iconUrl}=s256-rw`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    await writeFile(file, Buffer.from(await res.arrayBuffer()));
    return { icon: rel, iconKey: key };
  } catch (err) {
    console.warn(`Icon for ${appId} not updated: ${err.message}`);
    return previous && (await exists(file)) ? { icon: rel, iconKey: previous.iconKey } : { icon: null, iconKey: null };
  }
}

const previous = await readPrevious();
const listed = await retry('Developer page', () => gplay.developer({ devId: DEV_ID, num: 60, ...LOCALE }));

if (listed.length === 0 && previous.games.length > 0) {
  throw new Error('Developer page returned no apps; keeping the existing data/play-games.json.');
}

await mkdir(ICON_DIR, { recursive: true });

const games = [];
for (const item of listed) {
  const app = await retry(item.appId, () => gplay.app({ appId: item.appId, ...LOCALE }));
  const prev = previous.games.find((g) => g.id === item.appId);
  const icon = await saveIcon(item.appId, app.icon, prev);
  games.push({
    id: item.appId,
    title: app.title,
    url: `https://play.google.com/store/apps/details?id=${item.appId}`,
    icon: icon.icon,
    iconKey: icon.iconKey,
    summary: plainText(app.summary),
    genre: app.genre || null,
    free: Boolean(app.free),
    adSupported: Boolean(app.adSupported),
    offersIAP: Boolean(app.offersIAP),
    installs: app.installs || null,
    minInstalls: app.minInstalls || 0,
    score: app.score || null,
    ratings: app.ratings || 0,
    released: isoDate(app.released),
    updated: isoDate(app.updated),
  });
}

games.sort((a, b) => (b.released || '').localeCompare(a.released || '') || a.title.localeCompare(b.title));

const next = { developerUrl: DEV_URL, games };
const json = JSON.stringify(next, null, 2) + '\n';
if (json === JSON.stringify(previous, null, 2) + '\n') {
  console.log(`No changes (${games.length} game${games.length === 1 ? '' : 's'} listed).`);
} else {
  await mkdir(dirname(DATA_FILE), { recursive: true });
  await writeFile(DATA_FILE, json);
  console.log(`Wrote ${games.length} game${games.length === 1 ? '' : 's'} to data/play-games.json: ${games.map((g) => g.title).join(', ')}`);
}
