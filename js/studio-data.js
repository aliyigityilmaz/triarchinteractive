/* ═══════════════════════════════════════════════════════════
   TRIARCH INTERACTIVE — studio-data.js
   Shared by the site and the pitch deck. Loads the Google Play game
   list (data/play-games.json, refreshed by a GitHub Action) and the
   hand-edited studio counts (data/studio.json).
═══════════════════════════════════════════════════════════ */

(function () {
  const DEVELOPER_URL = 'https://play.google.com/store/apps/developer?id=Triarch+Interactive';

  function getJSON(url) {
    return fetch(url, { cache: 'no-cache' }).then((res) => {
      if (!res.ok) throw new Error(url + ' ' + res.status);
      return res.json();
    });
  }

  const byNewest = (a, b) => (b.released || '').localeCompare(a.released || '') || a.title.localeCompare(b.title);
  const byInstalls = (a, b) => (b.minInstalls - a.minInstalls) || (b.ratings - a.ratings) || byNewest(a, b);

  /* Resolves with { developerUrl, games, counts }. Never rejects: if a file
     cannot be loaded, games is empty and counts is null so pages keep
     their built-in fallback numbers. */
  function load(base) {
    return Promise.all([
      getJSON(base + 'data/play-games.json').catch(() => null),
      getJSON(base + 'data/studio.json').catch(() => null)
    ]).then(([play, studio]) => {
      const games = (play && Array.isArray(play.games) ? play.games : []).map((g) => ({
        ...g,
        icon: g.icon ? base + g.icon : null,
        minInstalls: g.minInstalls || 0,
        ratings: g.ratings || 0
      }));

      let counts = null;
      if (play && studio) {
        const live = games.length;
        const steam = studio.steam || {};
        const roblox = studio.roblox || {};
        const androidTotal = Math.max((studio.android && studio.android.total) || 0, live);
        counts = {
          live: live,
          released: (steam.released || 0) + live + (roblox.released || 0),
          inDevelopment: (steam.inDevelopment || 0) + (androidTotal - live) + (roblox.inDevelopment || 0),
          androidInDevelopment: androidTotal - live
        };
      }

      return { developerUrl: (play && play.developerUrl) || DEVELOPER_URL, games: games, counts: counts };
    });
  }

  window.TriarchData = {
    load: load,
    newest: (games) => games.slice().sort(byNewest),
    byInstalls: (games) => games.slice().sort(byInstalls)
  };
})();
