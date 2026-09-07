/* =========================================================
   חסלט מחסלת · מצב חיסול (הכה-בחפרפרת, 60 שניות)
   ========================================================= */
(function () {
  'use strict';

  const $ = s => document.querySelector(s);
  const DUR = 60000;
  const field = $('#field'), fieldWrap = field.parentElement;
  const WAVES = [20000, 40000];
  const WAVE_TEXT = [
    { kicker: 'גל 2 מתוך 3', title: 'מהר יותר', sub: 'הם צצים מהר יותר, ולפעמים שניים ביחד. 40 שניות נשארו.' },
    { kicker: 'גל 3 מתוך 3', title: 'הגל האחרון', sub: 'שלושה בו-זמנית. 20 שניות. תנו בראש.' }
  ];
  const els = { score: $('#wScore'), bar: $('#wBar'), time: $('#wTime'), combo: $('#wCombo'), toast: $('#wToast') };
  const timerBox = els.bar.closest('.hud__timer');
  const lerp = (a, b, t) => a + (b - a) * t;

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

  let S = null, raf = 0, toastT = 0, restT = 0;
  // מסך מגע: אין hover, אז היד עם עלי הסלק נשארת גלויה – נחה בתחתית השדה וחוזרת לשם אחרי כל מכה
  const coarse = !!(window.matchMedia && matchMedia('(pointer:coarse)').matches);
  function restHand(glide) {
    const r = field.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.bottom - 6;
    if (glide) Fx.Hand.glideTo(x, y); else Fx.Hand.moveTo(x, y);
    Fx.Hand.show();
  }

  function reset() {
    S = { score: 0, hits: 0, misses: 0, escapes: 0, decoyHits: 0, combo: 0, bestCombo: 0, kills: {}, startAt: 0, nextSpawn: 0, running: false, lastEnemy: null, waveIdx: 0, paused: false };
  }

  function start() {
    reset();
    holes.forEach(h => clearHole(h));
    S.running = true;
    S.startAt = performance.now();
    S.nextSpawn = S.startAt + 500;
    timerBox.classList.remove('is-rush');
    els.toast.hidden = true;
    updateHud();
    if (coarse) restHand(false);
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(tick);
  }

  function stop() {
    if (S) S.running = false;
    cancelAnimationFrame(raf);
    clearTimeout(restT);
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
    if (!S.running) return;
    const elapsed = Math.max(0, now - S.startAt), p = Math.min(1, elapsed / DUR), remaining = Math.max(0, DUR - elapsed);
    els.bar.style.width = (remaining / DUR * 100) + '%';
    els.time.textContent = Math.ceil(remaining / 1000);
    timerBox.classList.toggle('is-rush', remaining < 10000);

    if (now >= S.nextSpawn) {
      const upCount = holes.filter(h => h.state === 'up').length;
      const maxUp = 1 + (p > .3 ? 1 : 0) + (p > .65 ? 1 : 0);
      if (upCount < maxUp) spawn(now, p);
      S.nextSpawn = now + lerp(950, 380, p) * (.75 + Math.random() * .5);
    }
    for (const h of holes) if (h.state === 'up' && now >= h.downAt) escape(h);

    if (remaining <= 0) return end();
    if (S.waveIdx < WAVES.length && elapsed >= WAVES[S.waveIdx]) return breather(now);
    raf = requestAnimationFrame(tick);
  }

  // נשימה בין גלים: השעון עוצר, הבורות מתרוקנים, כרטיס לשנייה וחצי (לחיצה מדלגת)
  function breather(now) {
    const t = WAVE_TEXT[S.waveIdx];
    S.waveIdx++;
    S.paused = true;
    cancelAnimationFrame(raf);
    holes.forEach(h => { if (h.state === 'up') goDown(h); });
    Sfx.play('levelup');
    Fx.interstitial({ host: fieldWrap, kicker: t.kicker, title: t.title, sub: t.sub, auto: 1500, tapToSkip: true }).then(() => {
      if (!S.running) return;
      const resumeAt = performance.now();
      S.startAt += resumeAt - now;          // הזמן שעמדנו לא נספר
      S.nextSpawn = resumeAt + 350;
      S.paused = false;
      raf = requestAnimationFrame(tick);
    });
  }

  function spawn(now, p) {
    const empty = holes.filter(h => h.state === 'empty');
    if (!empty.length) return;
    const h = empty[Math.floor(Math.random() * empty.length)];
    const decoy = p > .06 && Math.random() < .13;
    h.decoy = decoy;
    h.enemy = decoy ? null : Chars.pickEnemy(S.lastEnemy);
    if (h.enemy) S.lastEnemy = h.enemy.id;
    h.sprite.innerHTML = decoy ? Products.renderDecoy() : Chars.enemySvg(h.enemy);
    h.sprite.className = 'sprite';
    void h.sprite.offsetWidth;
    h.sprite.classList.add('up');
    h.state = 'up'; h.upAt = now;
    let up = lerp(1550, 760, p);
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

  function escape(h) {
    const c = Fx.centerOf(h.el);
    if (h.decoy) { Fx.floatText(c.x, c.y - 24, '', 'is-muted'); goDown(h); return; }   // שקית שירדה – בלי עונש
    S.escapes++;
    S.combo = 0;
    S.score = Math.max(0, S.score - 25);
    Fx.floatText(c.x, c.y - 24, 'ברח! −25', 'is-bad');
    updateHud();
    goDown(h);
  }

  function onDown(e) {
    if (!S || !S.running || S.paused) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    Sfx.unlock();
    const x = e.clientX, y = e.clientY;
    Fx.Hand.slap(x, y);
    if (coarse) { clearTimeout(restT); restT = setTimeout(() => { if (S && S.running) restHand(true); }, 650); }
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

  function hitDecoy(h, x, y) {
    S.decoyHits++;
    S.score = Math.max(0, S.score - 150);
    S.combo = 0;
    h.state = 'hit';
    h.sprite.classList.add('hit');
    Sfx.play('bad');
    Fx.floatText(x, y - 14, '−150', 'is-bad');
    toast('אוי! זה <b>חסלט</b>! את זה לא מחסלים 😱', 'is-bad');
    clearTimeout(h.t);
    h.t = setTimeout(() => goDown(h), 450);
    updateHud(true);
  }

  function hit(h, x, y, now) {
    const e = h.enemy;
    S.hits++; S.combo++;
    S.bestCombo = Math.max(S.bestCombo, S.combo);
    const mult = Math.min(5, 1 + Math.floor(S.combo / 3));
    const fast = now - h.upAt < 420;
    const pts = e.points * mult + (fast ? 50 : 0) + S.waveIdx * 10;   // ניקוד אחיד: דמות × קומבו + מהיר + מדרגה
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
    Fx.floatText(x, y - 18, '+' + pts, e.bonus ? 'is-bonus' : 'is-good');

    const useQuip = Math.random() < .4;
    let msg = useQuip ? `<b>${e.name}</b>: ${e.quip}` : `<b>${e.name}</b> חוסל!`;
    if (e.bonus) msg = `⭐ בונוס! <b>${e.name}</b> חוסל!`;
    else if (fast && !useQuip) msg += ' ⚡ מהיר!';
    if (S.combo >= 3 && S.combo % 3 === 0) msg += ` · קומבו ×${mult}`;
    toast(msg, e.bonus ? 'is-bonus' : '');

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
    const mult = Math.min(5, 1 + Math.floor(S.combo / 3));
    els.combo.textContent = '×' + mult + (S.combo > 0 ? ` · ${S.combo}` : '');
  }

  function end() {
    S.running = false;
    cancelAnimationFrame(raf);
    holes.forEach(h => { if (h.state === 'up' || h.state === 'hit') goDown(h); });
    clearTimeout(restT);
    Fx.Hand.hide();
    Sfx.play('over');
    const tries = S.hits + S.misses + S.decoyHits;
    const acc = tries ? Math.round(S.hits / tries * 100) : 0;
    App.showResult({ mode: 'whack', score: S.score, hits: S.hits, accuracy: acc, bestCombo: S.bestCombo, decoyHits: S.decoyHits, escapes: S.escapes, kills: S.kills });
  }

  field.addEventListener('pointerdown', onDown);
  field.addEventListener('pointermove', e => {
    if (e.pointerType === 'mouse' && S && S.running) { Fx.Hand.cancelHide(); Fx.Hand.moveTo(e.clientX, e.clientY); Fx.Hand.show(); }
  });
  field.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') Fx.Hand.hide(); });
  field.addEventListener('contextmenu', e => e.preventDefault());

  window.Whack = { start, stop };
})();
