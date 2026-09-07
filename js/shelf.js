/* =========================================================
   חסלט מחסלת · מצב מדף
   האויב מרחף בזירה. במדף (הפאנל שלכם) מוצרי חסלט – רק עלי סלק מסלקים אותו (בפוף).
   מוצר אחר = תגובה מצחיקה + עונש זמן. כל 4 סילוקים: שלב חדש, יותר מוצרים, פחות זמן.
   ========================================================= */
(function () {
  'use strict';

  const $ = s => document.querySelector(s);
  const arena = $('#arena'), floater = $('#floater'), sprite = $('#sSprite'), bubble = $('#sBubble'), play = $('#shelfPlay');
  const bar = $('#sBar'), barBox = bar.parentElement, toastEl = $('#sToast'), shelf = $('#shelf'), foot = $('#sFootHint'), hint = $('#sHint');
  const els = { score: $('#sScore'), level: $('#sLevel'), lives: $('#sLives'), combo: $('#sComboBadge') };
  const LIVES = 3, PER_LEVEL = 4;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const LEVEL_LINES = {
    2: 'נכנסה חסה. אל תתבלבלו.',
    3: 'רוקט על המדף. (לא רקטה.)',
    4: 'תרד: נראה כמו סלק, לא סלק.',
    5: 'נענע. תרגעו. לא, אל תרגעו – פחות זמן!',
    6: 'התוויות ירדו. מעכשיו זה עיניים בלבד.',
    7: 'שמיר. למה שמיר? כי אפשר.',
    8: 'המדף מתערבב בכל טעות. בהצלחה.',
    9: 'בזיליקום, קייל... זה כבר מרכול שלם.'
  };
  const ESCAPE_LINES = ['ביי ביי 👋', 'לא הפעם!', 'כוסברה?! חה!', 'תודה על הסלט!', 'נתראה בסיבוב הבא', 'הזמן נגמר לכם, לא לי'];

  function levelCfg(n) {
    return {
      count: Math.min(2 + n, Products.PRODUCTS.length),
      limit: Math.max(1700, 5000 - (n - 1) * 380),
      labels: n < 6,
      shuffleOnWrong: n >= 8,
      speed: 40 + n * 12
    };
  }

  let S = null, raf = 0, roundT = 0, toastT = 0, bubbleT = 0, lastT = 0;

  function reset() {
    S = { score: 0, level: 1, lives: LIVES, hits: 0, wrong: 0, wrongBy: {}, kills: {}, running: false, round: null, lastEnemy: null, combo: 0, bestCombo: 0 };
  }
  function start() {
    reset();
    S.running = true;
    hint.hidden = false;
    toastEl.hidden = true;
    updateHud();
    startRound(true);
  }
  function stop() {
    if (S) S.running = false;
    if (S && S.round) S.round.active = false;
    cancelAnimationFrame(raf);
    clearTimeout(roundT); clearTimeout(bubbleT);
    Fx.closeInterstitial();
    bubble.hidden = true;
    floater.classList.add('is-hidden');
  }

  /* ---- סיבוב ---- */
  function startRound(first) {
    if (!S || !S.running) return;
    const cfg = levelCfg(S.level);
    const e = Chars.pickEnemy(S.lastEnemy);
    S.lastEnemy = e.id;
    sprite.innerHTML = Chars.enemySvg(e);
    sprite.className = 'floater__sprite sprite';

    const W = arena.clientWidth, H = arena.clientHeight, fw = floater.offsetWidth || 132, fh = floater.offsetHeight || 166;
    const bounds = { x0: 6, x1: Math.max(10, W - fw - 6), y0: 28, y1: Math.max(40, H - fh - 40) };
    const fromLeft = Math.random() < .5;
    const pos = { x: fromLeft ? -fw : W + 10, y: bounds.y0 + Math.random() * (bounds.y1 - bounds.y0) };
    const now = performance.now();
    S.round = { enemy: e, cfg, active: true, startAt: now, deadline: now + cfg.limit + 700, pos, target: randomPoint(bounds), bounds, speed: cfg.speed, wrongs: 0, entering: true };

    floater.style.transition = 'none';
    floater.classList.remove('is-escaping', 'is-hidden');
    setPos(pos);
    bubble.hidden = true;
    barBox.classList.remove('is-rush');
    bar.style.width = '100%';
    buildShelf(cfg, first);
    if (!first) hint.hidden = true;
    Sfx.play('pop');
    lastT = now;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(tick);
  }
  function randomPoint(b) { return { x: b.x0 + Math.random() * (b.x1 - b.x0), y: b.y0 + Math.random() * (b.y1 - b.y0) }; }
  function setPos(p) { floater.style.transform = `translate(${Math.round(p.x)}px, ${Math.round(p.y)}px)`; }

  function tick(now) {
    const R = S && S.round;
    if (!R || !R.active) return;
    const dt = Math.min(50, now - lastT); lastT = now;
    const dx = R.target.x - R.pos.x, dy = R.target.y - R.pos.y, dist = Math.hypot(dx, dy);
    if (R.entering && R.pos.x >= R.bounds.x0 && R.pos.x <= R.bounds.x1) R.entering = false;
    const step = (R.entering ? 520 : R.speed) * dt / 1000;
    if (dist <= step + 1) R.target = randomPoint(R.bounds);
    else { R.pos.x += dx / dist * step; R.pos.y += dy / dist * step; }
    setPos(R.pos);
    if (!bubble.hidden) placeBubble();

    const remaining = R.deadline - now, frac = clamp(remaining / R.cfg.limit, 0, 1);
    bar.style.width = (frac * 100) + '%';
    barBox.classList.toggle('is-rush', frac < .3);
    if (remaining <= 0) return escape();
    raf = requestAnimationFrame(tick);
  }

  /* ---- בועת דיבור ---- */
  function placeBubble() {
    const R = S.round;
    const fw = floater.offsetWidth, fh = floater.offsetHeight, bw = bubble.offsetWidth, bh = bubble.offsetHeight;
    const headX = R.pos.x + fw / 2;
    const x = clamp(headX + 34 - bw, 4, arena.clientWidth - bw - 4);
    let y = R.pos.y - bh - 12, below = false;
    if (y < 24) { y = R.pos.y + fh + 8; below = true; }
    bubble.style.left = x + 'px'; bubble.style.top = y + 'px';
    bubble.classList.toggle('is-below', below);
  }
  function say(text, cls, ms) {
    bubble.textContent = text;
    bubble.className = 'bubble ' + (cls || '');
    bubble.hidden = false;
    placeBubble();
    clearTimeout(bubbleT);
    bubbleT = setTimeout(() => { bubble.hidden = true; }, ms || 1800);
  }

  /* ---- המדף (הפאנל) ---- */
  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function buildShelf(cfg, showHint) {
    const list = shuffle(Products.PRODUCTS.slice(0, cfg.count));
    const perRow = cfg.count <= 3 ? 3 : cfg.count <= 8 ? 4 : 5;
    shelf.innerHTML = '';
    for (let i = 0; i < list.length; i += perRow) {
      const row = document.createElement('div');
      row.className = 'shelf__row';
      row.style.setProperty('--n', perRow);
      list.slice(i, i + perRow).forEach(p => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'bag'; b.dataset.id = p.id;
        b.setAttribute('aria-label', cfg.labels ? p.name : 'שקית חסלט');
        b.innerHTML = Products.renderProduct(p, { label: cfg.labels });
        if (showHint && p.target) b.classList.add('is-hint');
        row.appendChild(b);
      });
      shelf.appendChild(row);
    }
    foot.textContent = S.level === 1
      ? 'כוסברה, פטרוזיליה או עלי סלק?'
      : `שלב ${S.level} · ${cfg.count} מוצרים · ${(cfg.limit / 1000).toFixed(1)} שנ׳`;
  }

  shelf.addEventListener('pointerdown', ev => {
    const b = ev.target.closest ? ev.target.closest('.bag') : null;
    if (!b || !S || !S.round || !S.round.active) return;
    if (ev.pointerType === 'mouse' && ev.button !== 0) return;
    Sfx.unlock();
    const p = Products.PRODUCTS.find(x => x.id === b.dataset.id);
    if (!p) return;
    if (p.target) correct(b); else wrong(p, b);
  });
  shelf.addEventListener('contextmenu', e => e.preventDefault());

  /* ---- נכון: עלי סלק → פוף ---- */
  function correct(b) {
    const R = S.round;
    R.active = false;
    cancelAnimationFrame(raf);
    b.classList.remove('is-hint'); b.classList.add('is-popping');

    const now = performance.now();
    const frac = clamp((R.deadline - now) / R.cfg.limit, 0, 1);
    const fast = frac >= .6;                                  // סולק ב-40% הראשונים של הזמן
    S.combo++; S.bestCombo = Math.max(S.bestCombo, S.combo);
    const mult = Math.min(5, 1 + Math.floor(S.combo / 3));
    const pts = R.enemy.points * mult + (fast ? 50 : 0) + (S.level - 1) * 10;   // ניקוד אחיד: דמות × קומבו + מהיר + מדרגה
    S.score += pts; S.hits++;
    S.kills[R.enemy.id] = (S.kills[R.enemy.id] || 0) + 1;
    App.stats.addKill(R.enemy.id);

    const c = Fx.centerOf(sprite);
    sprite.classList.add('hit');
    Fx.poof(c.x, c.y, 14);
    Fx.burstLeaves(c.x, c.y, 8);
    Fx.stamp(c.x, c.y - 6, 'סוּלַק!');
    arena.classList.remove('is-flash'); void arena.offsetWidth; arena.classList.add('is-flash');
    Fx.floatText(c.x, c.y + 46, (fast ? '⚡ ' : '') + '+' + pts, R.enemy.bonus ? 'is-bonus' : 'is-good');
    setTimeout(() => sprite.classList.add('gone'), 90);
    Sfx.play('poof');
    if (R.enemy.bonus) Sfx.play('bonus');
    if (S.combo % 3 === 0) Sfx.play('combo');
    bubble.hidden = true;
    toast(`<b>${R.enemy.name}</b>: ${R.enemy.quip}`, R.enemy.bonus ? 'is-bonus' : '');
    updateHud(true);

    clearTimeout(roundT);
    if (S.hits % PER_LEVEL === 0) {
      // עולים שלב: אחרי הפוף – כרטיס קצר שאומר מה השתנה, ממשיך לבד (לחיצה מדלגת)
      const prev = levelCfg(S.level);
      S.level++;
      updateHud();
      const cfg = levelCfg(S.level);
      const added = cfg.count > prev.count ? Products.PRODUCTS[cfg.count - 1] : null;
      const changes = [`${cfg.count} מוצרים`, `${(cfg.limit / 1000).toFixed(1)} שנ׳`];
      if (added) changes.unshift(`חדש: ${added.name}`);
      if (!cfg.labels && prev.labels) changes.push('בלי תוויות!');
      if (cfg.shuffleOnWrong && !prev.shuffleOnWrong) changes.push('מתערבב בכל טעות');
      roundT = setTimeout(() => {
        if (!S.running) return;
        Sfx.play('levelup');
        Fx.interstitial({ host: play, title: `שלב ${S.level}`, sub: LEVEL_LINES[S.level] || 'המדף מתפוצץ ממוצרים. הזמן נגמר מהר.',
          line: changes.join(' · '), auto: 4800, tapToSkip: true }).then(() => { if (S.running) startRound(false); });
      }, 900);
    } else {
      roundT = setTimeout(() => startRound(false), 950);
    }
  }

  /* ---- לא נכון: תגובה מצחיקה + עונש זמן ---- */
  function wrong(p, b) {
    const R = S.round;
    R.wrongs++; S.wrong++;
    S.wrongBy[p.id] = (S.wrongBy[p.id] || 0) + 1;
    R.deadline -= 1000;
    if (S.combo > 0) { S.combo = 0; updateHud(); }
    b.classList.remove('is-shaking'); void b.offsetWidth; b.classList.add('is-shaking');
    say(Products.wrongLine(p), 'is-laugh', 2000);
    Sfx.play('bad');
    setTimeout(() => Sfx.play('laugh'), 130);
    const c = Fx.centerOf(b);
    Fx.floatText(c.x, c.r.top + 8, '−1 שנ׳', 'is-bad');
    if (R.cfg.shuffleOnWrong) setTimeout(() => { if (R.active) buildShelf(R.cfg, false); }, 380);
  }

  /* ---- ברח ---- */
  function escape() {
    const R = S.round;
    if (!R || !R.active) return;
    R.active = false;
    cancelAnimationFrame(raf);
    say(ESCAPE_LINES[Math.floor(Math.random() * ESCAPE_LINES.length)], '', 900);
    Sfx.play('escape');
    const W = arena.clientWidth;
    const toX = R.pos.x < W / 2 ? -240 : W + 240;
    floater.style.transition = '';
    floater.classList.add('is-escaping');
    requestAnimationFrame(() => { floater.style.transform = `translate(${toX}px, ${Math.round(R.pos.y - 90)}px) rotate(${toX < 0 ? -22 : 22}deg)`; });
    setTimeout(() => { bubble.hidden = true; }, 700);

    S.lives--; S.combo = 0;
    updateHud();
    Sfx.play('life');
    { const c = Fx.centerOf(arena); Fx.floatText(c.x, c.y, 'ברח · −🥬', 'is-bad'); }
    clearTimeout(roundT);
    if (S.lives <= 0) {
      toast(`<b>${R.enemy.name}</b> ברח`, 'is-bad');
      roundT = setTimeout(end, 1300);
    } else {
      toast(`<b>${R.enemy.name}</b> ברח`, 'is-bad');
      roundT = setTimeout(() => startRound(false), 1300);
    }
  }

  function toast(html, cls) {
    toastEl.innerHTML = html;
    toastEl.className = 'toast toast--arena ' + (cls || '');
    toastEl.hidden = true; void toastEl.offsetWidth; toastEl.hidden = false;
    clearTimeout(toastT);
    toastT = setTimeout(() => { toastEl.hidden = true; }, 2100);
  }

  function updateHud(bump) {
    els.score.textContent = S.score.toLocaleString('he-IL');
    if (bump) { els.score.classList.remove('bump'); void els.score.offsetWidth; els.score.classList.add('bump'); }
    els.level.textContent = S.level;
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
    Sfx.play('over');
    let worst = null;
    for (const id in S.wrongBy) if (!worst || S.wrongBy[id] > S.wrongBy[worst]) worst = id;
    const wp = worst ? Products.PRODUCTS.find(p => p.id === worst) : null;
    App.showResult({ mode: 'shelf', score: S.score, level: S.level, hits: S.hits, wrong: S.wrong, bestCombo: S.bestCombo, worst: wp ? { name: wp.name, n: S.wrongBy[worst] } : null, kills: S.kills });
  }

  window.Shelf = { start, stop };
})();
