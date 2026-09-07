/* =========================================================
   חסלט מחסלת · מצב חיסול (הכה-בחפרפרת) – אינסופי, 3 חיים
   אויב שברח = חיים פחות. שקית חסלט שנפגעה = חיים פחות. גל חדש כל 20 שניות, מהר יותר.
   ========================================================= */
(function () {
  'use strict';

  const $ = s => document.querySelector(s);
  const field = $('#field'), fieldWrap = field.parentElement;
  const els = { score: $('#wScore'), bar: $('#wBar'), wave: $('#wWave'), lives: $('#wLives'), toast: $('#wToast'), combo: $('#wComboBadge') };
  const LIVES = 3, WAVE_MS = 20000;
  const lerp = (a, b, t) => a + (b - a) * t;

  // כל גל: מרווח הופעה, זמן שהאויב נשאר בחוץ, כמה בו-זמנית, סיכוי לשקית
  function waveCfg(w) {
    const t = Math.min(1, (w - 1) / 6);
    return { interval: lerp(950, 320, t), upTime: lerp(1550, 620, t), maxUp: Math.min(4, 1 + Math.floor((w - 1) / 2)), decoy: w === 1 ? .08 : .14 };
  }
  const WAVE_INFO = {
    2: { title: 'מהר יותר', sub: 'צצים מהר יותר, נשארים פחות.' },
    3: { title: 'שניים ביחד', sub: 'העיניים על כל הבורות.' },
    4: { title: 'עוד יותר מהר', sub: 'רגע של היסוס = אויב שברח.' },
    5: { title: 'שלושה בו-זמנית', sub: 'הידיים, לא הראש.' },
    6: { title: 'הסלק לא נגמר', sub: 'אתם כן, בסוף.' }
  };

  /* ---- בניית 9 בורות ---- */
  const holes = [];
  for (let i = 0; i < 9; i++) {
    const el = document.createElement('div');
    el.className = 'hole'; el.dataset.i = i;
    el.innerHTML = `<div class="hole__dirt"></div><div class="hole__pit"><div class="sprite"></div></div>
      <div class="hole__front">${Products.renderHoleFront(i)}</div><div class="hole__label"></div>`;
    field.appendChild(el);
    holes.push({ el, sprite: el.querySelector('.sprite'), label: el.querySelector('.hole__label'), state: 'empty', enemy: null, decoy: false, upAt: 0, downAt: 0, t: 0 });
  }

  let S = null, raf = 0, toastT = 0, restT = 0, endT = 0;
  // מסך מגע: אין hover, אז היד עם עלי הסלק נשארת גלויה – נחה בתחתית השדה וחוזרת לשם אחרי כל מכה
  const coarse = !!(window.matchMedia && matchMedia('(pointer:coarse)').matches);
  function restHand(glide) {
    const r = field.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.bottom - 6;
    if (glide) Fx.Hand.glideTo(x, y); else Fx.Hand.moveTo(x, y);
    Fx.Hand.show();
  }

  function reset() {
    S = { score: 0, hits: 0, misses: 0, escapes: 0, decoyHits: 0, combo: 0, bestCombo: 0, kills: {}, lives: LIVES, wave: 1, waveStart: 0,
      nextSpawn: 0, running: false, paused: false, aborted: false, lastEnemy: null };
  }

  function start() {
    reset();
    holes.forEach(h => clearHole(h));
    S.running = true;
    const now = performance.now();
    S.waveStart = now;
    S.nextSpawn = now + 500;
    els.toast.hidden = true;
    updateHud();
    if (coarse) restHand(false);
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(tick);
  }

  function stop() {
    if (S) { S.running = false; S.aborted = true; }
    cancelAnimationFrame(raf);
    clearTimeout(restT); clearTimeout(endT);
    Fx.closeInterstitial();
    holes.forEach(h => clearHole(h));
    Fx.Hand.hide();
  }

  function clearHole(h) {
    clearTimeout(h.t);
    h.state = 'empty'; h.enemy = null; h.decoy = false;
    h.sprite.className = 'sprite'; h.sprite.innerHTML = '';
    h.el.classList.remove('has-name');
  }

  function tick(now) {
    if (!S.running || S.paused) return;
    const cfg = waveCfg(S.wave);
    const wp = (now - S.waveStart) / WAVE_MS;
    els.bar.style.width = (Math.min(1, Math.max(0, wp)) * 100) + '%';
    if (wp >= 1) return breather(now);

    if (now >= S.nextSpawn) {
      const upCount = holes.filter(h => h.state === 'up').length;
      if (upCount < cfg.maxUp) spawn(now, cfg);
      S.nextSpawn = now + cfg.interval * (.75 + Math.random() * .5);
    }
    for (const h of holes) if (h.state === 'up' && now >= h.downAt) escape(h);
    if (S.running && !S.paused) raf = requestAnimationFrame(tick);
  }

  // נשימה בין גלים: הבורות מתרוקנים, כרטיס לשלוש שניות (לחיצה מדלגת), ואז הגל הבא
  function breather(now) {
    S.paused = true;
    cancelAnimationFrame(raf);
    holes.forEach(h => { if (h.state === 'up') goDown(h); });
    clearTimeout(restT);
    Fx.Hand.hide();
    Sfx.play('levelup');
    const next = S.wave + 1;
    const info = WAVE_INFO[next] || { title: `גל ${next}`, sub: next >= 7 ? 'ארבעה בו-זמנית. בהצלחה.' : '' };
    Fx.interstitial({ host: fieldWrap, kicker: `גל ${next}`, title: info.title, sub: info.sub, auto: 3000, tapToSkip: true }).then(() => {
      if (!S.running) return;
      S.wave = next;
      const t = performance.now();
      S.waveStart = t;
      S.nextSpawn = t + 400;
      S.paused = false;
      updateHud();
      if (coarse) restHand(false);
      raf = requestAnimationFrame(tick);
    });
  }

  function spawn(now, cfg) {
    const empty = holes.filter(h => h.state === 'empty');
    if (!empty.length) return;
    const h = empty[Math.floor(Math.random() * empty.length)];
    const decoy = Math.random() < cfg.decoy;
    h.decoy = decoy;
    h.enemy = decoy ? null : Chars.pickEnemy(S.lastEnemy);
    if (h.enemy) S.lastEnemy = h.enemy.id;
    h.sprite.innerHTML = decoy ? Products.renderDecoy() : Chars.enemySvg(h.enemy);
    h.sprite.className = 'sprite';
    void h.sprite.offsetWidth;
    h.sprite.classList.add('up');
    h.state = 'up'; h.upAt = now;
    let up = cfg.upTime;
    if (decoy) up *= 1.1;
    if (h.enemy && h.enemy.bonus) up *= .8;
    h.downAt = now + up;
    Sfx.play('pop');
  }

  function goDown(h) {
    h.state = 'leaving';
    h.sprite.classList.remove('up', 'hit');
    h.sprite.classList.add('down');
    clearTimeout(h.t);
    h.t = setTimeout(() => { h.sprite.className = 'sprite'; h.state = 'empty'; h.enemy = null; h.decoy = false; h.el.classList.remove('has-name'); }, 240);
  }

  /* ---- ברח: חיים פחות ---- */
  function escape(h) {
    const c = Fx.centerOf(h.el);
    if (h.decoy) { goDown(h); return; }              // שקית שירדה – בלי עונש
    S.escapes++;
    S.combo = 0;
    goDown(h);
    loseLife(c.x, c.y - 24, 'ברח');
  }
  function loseLife(x, y, word) {
    S.lives--;
    Fx.floatText(x, y, `${word} · −🥬`, 'is-bad');
    Sfx.play('life');
    updateHud();
    if (S.lives <= 0) end();
  }

  function onDown(e) {
    if (!S || !S.running || S.paused) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    Sfx.unlock();
    const x = e.clientX, y = e.clientY;
    Fx.Hand.slap(x, y);
    if (coarse) { clearTimeout(restT); restT = setTimeout(() => { if (S && S.running && !S.paused) restHand(true); }, 650); }
    else if (e.pointerType !== 'mouse') Fx.Hand.hideSoon(420);

    const holeEl = e.target.closest ? e.target.closest('.hole') : null;
    const h = holeEl ? holes[+holeEl.dataset.i] : null;
    if (!h || h.state !== 'up') return miss();
    if (h.decoy) return hitDecoy(h, x, y);
    hit(h, x, y, performance.now());
  }

  function miss() {
    S.misses++;
    if (S.combo > 0) { S.combo = 0; updateHud(); }
    Sfx.play('miss');
  }

  /* ---- פגיעה בשקית חסלט: חיים פחות ---- */
  function hitDecoy(h, x, y) {
    S.decoyHits++;
    S.combo = 0;
    h.state = 'hit';
    h.sprite.classList.add('hit');
    Sfx.play('bad');
    toast('אוי! זה <b>חסלט</b> 😱', 'is-bad');
    clearTimeout(h.t);
    h.t = setTimeout(() => goDown(h), 450);
    loseLife(x, y - 14, 'חסלט!');
  }

  function hit(h, x, y, now) {
    const e = h.enemy;
    S.hits++; S.combo++;
    S.bestCombo = Math.max(S.bestCombo, S.combo);
    const mult = Math.min(5, 1 + Math.floor(S.combo / 3));
    const fast = now - h.upAt < 420;
    const pts = e.points * mult + (fast ? 50 : 0) + (S.wave - 1) * 10;   // ניקוד אחיד: דמות × קומבו + מהיר + מדרגה
    S.score += pts;
    S.kills[e.id] = (S.kills[e.id] || 0) + 1;
    App.stats.addKill(e.id);

    h.state = 'hit';
    h.sprite.classList.remove('up');
    h.sprite.classList.add('hit');
    h.label.textContent = e.name;
    h.el.classList.add('has-name');

    Sfx.play(e.bonus ? 'bonus' : 'whack');
    if (S.combo % 3 === 0) Sfx.play('combo');
    Fx.burstLeaves(x, y, e.bonus ? 16 : 10);
    Fx.floatText(x, y - 18, (fast ? '⚡ ' : '') + '+' + pts, e.bonus ? 'is-bonus' : 'is-good');
    Fx.stamp(x, y - 54, 'סוּלַק!', true);
    if (e.bonus) toast(`⭐ <b>${e.name}</b> סולק!`, 'is-bonus');
    else if (Math.random() < .3) toast(`<b>${e.name}</b>: ${e.quip}`);

    clearTimeout(h.t);
    h.t = setTimeout(() => goDown(h), 480);
    updateHud(true);
  }

  function toast(html, cls) {
    els.toast.innerHTML = html;
    els.toast.className = 'toast ' + (cls || '');
    els.toast.hidden = true; void els.toast.offsetWidth; els.toast.hidden = false;
    clearTimeout(toastT);
    toastT = setTimeout(() => { els.toast.hidden = true; }, 1150);
  }

  function updateHud(bump) {
    els.score.textContent = S.score.toLocaleString('he-IL');
    if (bump) { els.score.classList.remove('bump'); void els.score.offsetWidth; els.score.classList.add('bump'); }
    els.wave.textContent = S.wave;
    let lives = '';
    for (let i = 0; i < LIVES; i++) lives += `<span class="${i < S.lives ? '' : 'lost'}">🥬</span>`;
    els.lives.innerHTML = lives;
    const mult = Math.min(5, 1 + Math.floor(S.combo / 3));
    els.combo.hidden = mult <= 1;
    els.combo.textContent = `קומבו ×${mult}`;
  }

  function end() {
    S.running = false;
    cancelAnimationFrame(raf);
    clearTimeout(restT);
    holes.forEach(h => { if (h.state === 'up' || h.state === 'hit') goDown(h); });
    Fx.Hand.hide();
    Sfx.play('over');
    const snap = S;
    clearTimeout(endT);
    endT = setTimeout(() => {
      if (snap.aborted) return;
      const tries = snap.hits + snap.misses + snap.decoyHits;
      App.showResult({ mode: 'whack', score: snap.score, hits: snap.hits, wave: snap.wave, accuracy: tries ? Math.round(snap.hits / tries * 100) : 0,
        bestCombo: snap.bestCombo, decoyHits: snap.decoyHits, escapes: snap.escapes, kills: snap.kills });
    }, 900);
  }

  field.addEventListener('pointerdown', onDown);
  field.addEventListener('pointermove', e => {
    if (e.pointerType === 'mouse' && S && S.running && !S.paused) { Fx.Hand.cancelHide(); Fx.Hand.moveTo(e.clientX, e.clientY); Fx.Hand.show(); }
  });
  field.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') Fx.Hand.hide(); });
  field.addEventListener('contextmenu', e => e.preventDefault());

  window.Whack = { start, stop };
})();
