/* =========================================================
   חסלט מחסלת · תפריט, מסכים, תוצאה, אלבום, שיתוף, אחסון
   ========================================================= */
(function () {
  'use strict';

  const $ = s => document.querySelector(s);
  const LS = { best: 'silka.best', stats: 'silka.stats', muted: 'silka.muted' };
  const load = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
  const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* פרטי / חסום */ } };
  const fmt = n => (n || 0).toLocaleString('he-IL');

  const state = { mode: null, best: load(LS.best, {}), stats: load(LS.stats, {}), muted: !!load(LS.muted, false), shareText: '' };

  const RANKS = [
    [800, '🌱', 'עלה נובט'],
    [2000, '🥬', 'צרור מבטיח'],
    [4000, '🔪', 'סלק מנוסה'],
    [7000, '🏆', 'אלוף הסלט'],
    [Infinity, '👑', 'מחסל-על ירוק']
  ];
  const rank = score => RANKS.find(r => score < r[0]);

  const App = {
    stats: {
      addKill(id) { state.stats[id] = (state.stats[id] || 0) + 1; save(LS.stats, state.stats); },
      get() { return state.stats; }
    },
    showScreen(name) {
      document.querySelectorAll('.screen').forEach(s => s.classList.toggle('is-active', s.id === 'screen-' + name));
      document.body.dataset.screen = name;
      window.scrollTo(0, 0);
    },
    showResult(r) {
      const prevBest = state.best[r.mode] || 0;
      const isBest = r.score > prevBest && r.score > 0;
      if (isBest) { state.best[r.mode] = r.score; save(LS.best, state.best); }
      const rk = rank(r.score);

      const stamp = $('#resultStamp');
      stamp.textContent = r.mode === 'whack' ? '⏱️ הזמן נגמר!' : '🥬 נגמרו העלים!';
      stamp.classList.toggle('is-win', isBest);
      $('#resultTitle').textContent = `${fmt(r.score)} נקודות`;
      $('#resultSub').innerHTML = `${rk[1]} דרגה: <b>${rk[2]}</b>` +
        (isBest ? ' · שיא חדש! 🎉' : (prevBest ? ` · השיא שלכם: ${fmt(prevBest)}` : ''));

      const stats = r.mode === 'whack'
        ? [[r.hits, 'חיסולים'], [r.accuracy + '%', 'דיוק'], ['×' + Math.min(5, 1 + Math.floor(r.bestCombo / 3)), 'קומבו מקסימלי']]
        : [[r.hits, 'סולקו'], [r.level, 'שלב'], [r.wrong, 'טעויות במדף']];
      $('#resultStats').innerHTML = stats.map(s => `<div class="stat"><b>${s[0]}</b><span>${s[1]}</span></div>`).join('');

      let fav = null;
      for (const id in r.kills) if (!fav || r.kills[id] > r.kills[fav]) fav = id;
      const lines = [];
      if (fav) { const e = Chars.ENEMIES.find(x => x.id === fav); lines.push(`המחוסל המועדף עליכם: <b>${e.name}</b> (${r.kills[fav]}×)`); }
      if (r.mode === 'shelf' && r.worst) lines.push(`לחצתם על <b>${r.worst.name}</b> ${r.worst.n} פעמים. אנחנו לא שופטים. (כן, כן שופטים.)`);
      if (r.mode === 'whack' && r.decoyHits) lines.push(`ופגעתם ב-<b>${r.decoyHits}</b> שקיות חסלט. על זה דווקא נשפוט.`);
      if (!lines.length) lines.push(r.mode === 'whack' ? 'אפס חיסולים. האויבים שולחים תודה.' : 'אפילו אחד לא סולק. הכוסברה ניצחה.');
      $('#resultFav').innerHTML = lines.join('<br>');

      const url = cleanUrl();
      state.shareText = r.mode === 'whack'
        ? `חיסלתי ${r.hits} אויבים עם עלי סלק של חסלט וצברתי ${fmt(r.score)} נקודות 🥬💥\nדרגה: ${rk[2]}. נראה אותך:\n${url}`
        : `הגעתי לשלב ${r.level} במדף של חסלט וסילקתי ${r.hits} אויבים 🥬💨` +
          (r.worst ? `\n(ולחצתי על ${r.worst.name} ${r.worst.n} פעמים. לא שאלתם.)` : '') +
          `\nנראה אותך:\n${url}`;

      openOverlay('result');
      refreshBest();
    }
  };
  window.App = App;

  /* ---- אייקונים בתפריט ---- */
  $('#modeWhackIcon').innerHTML = Chars.enemySvg(Chars.ENEMIES[0]);
  $('#modeShelfIcon').innerHTML = Products.renderProduct(Products.PRODUCTS[0], { label: true });
  $('#heroHand').innerHTML = Chars.renderHand({ id: 'hero' });

  /* ---- ניווט ---- */
  function startMode(mode) {
    state.mode = mode;
    closeAll();
    App.showScreen(mode);
    Sfx.unlock();
    if (mode === 'whack') Whack.start(); else Shelf.start();
  }
  function quit() {
    if (state.mode === 'whack') Whack.stop();
    if (state.mode === 'shelf') Shelf.stop();
    App.showScreen('menu');
    refreshBest();
  }
  function refreshBest() {
    $('#bestWhack').textContent = state.best.whack ? `שיא: ${fmt(state.best.whack)}` : 'שיא: —';
    $('#bestShelf').textContent = state.best.shelf ? `שיא: ${fmt(state.best.shelf)}` : 'שיא: —';
  }

  /* ---- שכבות ---- */
  const openOverlay = id => $('#' + id).classList.add('is-open');
  const closeOverlay = id => $('#' + id).classList.remove('is-open');
  const closeAll = () => document.querySelectorAll('.overlay').forEach(o => o.classList.remove('is-open'));

  /* ---- אלבום ---- */
  function renderAlbum() {
    const st = state.stats;
    let total = 0, unlocked = 0;
    $('#albumGrid').innerHTML = Chars.ENEMIES.map(e => {
      const n = st[e.id] || 0; total += n; if (n) unlocked++;
      return `<div class="album__item ${n ? '' : 'is-locked'} ${e.bonus ? 'is-bonus' : ''}">${Chars.enemySvg(e)}
        <span class="album__count">${n ? n + '×' : '?'}</span><b>${e.name}</b><span>${e.org}</span></div>`;
    }).join('');
    $('#albumTotal').textContent = total
      ? `${fmt(total)} חיסולים בסך הכל · ${unlocked}/${Chars.ENEMIES.length} דמויות באלבום`
      : 'עדיין לא חיסלתם אף אחד. העלים מחכים.';
  }

  /* ---- שיתוף ---- */
  function cleanUrl() { try { const u = new URL(location.href); return u.origin + u.pathname; } catch (e) { return location.href; } }
  function share() {
    const text = state.shareText || cleanUrl();
    if (navigator.share && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      navigator.share({ text }).catch(() => openWa(text));
      return;
    }
    openWa(text);
  }
  function openWa(text) { window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank', 'noopener'); }

  /* ---- צליל ---- */
  function applyMute() {
    Sfx.setMuted(state.muted);
    const b = $('#soundBtn');
    b.textContent = state.muted ? '🔇' : '🔊';
    b.classList.toggle('is-muted', state.muted);
    b.setAttribute('aria-label', state.muted ? 'הפעלת צליל' : 'השתקה');
  }
  $('#soundBtn').addEventListener('click', () => {
    state.muted = !state.muted;
    save(LS.muted, state.muted);
    applyMute();
    if (!state.muted) { Sfx.unlock(); Sfx.play('pop'); }
  });

  /* ---- חיווט ---- */
  $('#modeWhack').addEventListener('click', () => startMode('whack'));
  $('#modeShelf').addEventListener('click', () => startMode('shelf'));
  $('#wQuit').addEventListener('click', quit);
  $('#sQuit').addEventListener('click', quit);
  $('#albumBtn').addEventListener('click', () => { renderAlbum(); openOverlay('album'); });
  $('#albumClose').addEventListener('click', () => closeOverlay('album'));
  $('#aboutBtn').addEventListener('click', () => openOverlay('about'));
  $('#aboutClose').addEventListener('click', () => closeOverlay('about'));
  $('#aboutPlay').addEventListener('click', () => { closeOverlay('about'); startMode('whack'); });
  $('#resultClose').addEventListener('click', () => { closeOverlay('result'); quit(); });
  $('#menuBtn').addEventListener('click', () => { closeOverlay('result'); quit(); });
  $('#againBtn').addEventListener('click', () => { closeOverlay('result'); startMode(state.mode || 'whack'); });
  $('#shareBtn').addEventListener('click', share);
  document.querySelectorAll('.overlay').forEach(o => o.addEventListener('click', e => {
    if (e.target !== o) return;
    o.classList.remove('is-open');
    if (o.id === 'result') quit();
  }));
  document.addEventListener('pointerdown', () => Sfx.unlock(), { once: true, passive: true });
  window.addEventListener('pageshow', e => { if (e.persisted) quit(); });

  // ניקוי פרמטרי מעקב (fbclid, utm_*) משורת הכתובת
  (function stripTrackingParams() {
    try {
      const u = new URL(location.href);
      const junk = [...u.searchParams.keys()].filter(k => /^utm_/i.test(k) || /^(fbclid|gclid|dclid|msclkid|mc_eid|igshid)$/i.test(k));
      if (junk.length) { junk.forEach(k => u.searchParams.delete(k)); history.replaceState(null, '', u.pathname + u.search + u.hash); }
    } catch (e) { /* לא קריטי */ }
  })();

  applyMute();
  refreshBest();
  App.showScreen('menu');
})();
