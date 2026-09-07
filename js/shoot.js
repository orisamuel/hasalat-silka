/* =========================================================
   חסלט מחסלת · מצב ירי
   האויבים צונחים במצנחים מלמעלה, גל אחרי גל. אתם למטה עם צרור עלי הסלק (גלוי כל הזמן).
   לחיצה על אויב משגרת עלה מהצרור. אויב שנוחת = חיים אחד פחות.
   שקית חסלט שצונחת: לא יורים – תופסים אותה עם היד למטה לבונוס.
   כל גל הוא כמות צונחים; כשכולם טופלו – כרטיס "גל הושלם" עם כפתור לגל הבא (וממשיך לבד אחרי 6 שניות).
   ========================================================= */
(function () {
  'use strict';

  const $ = s => document.querySelector(s);
  const sky = $('#sky'), gun = $('#gun'), ground = $('#skyGround'), toastEl = $('#gToast'), hint = $('#gHint');
  const els = { score: $('#gScore'), wave: $('#gWave'), lives: $('#gLives'), combo: $('#gComboBadge') };
  const LIVES = 3, AUTO_NEXT = 6000;
  const lerp = (a, b, t) => a + (b - a) * t, clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const FW = 104, FH = 200, GROUND = 64;

  const BREAK_LINES = ['הסלק עדיין טרי. אתם?', 'הפסקת סלט. תנשמו.', 'העלים לא הולכים לשום מקום. גם האויבים לא.', 'יופי של ידיים. עוד גל?', 'האויבים ביקשו הפסקה. לא קיבלו. אתם כן.', 'טרי, נקי, וממתין לגל הבא.'];
  const LEAF = `<svg viewBox="0 0 34 46" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M17 44 L17 26" stroke="#d81b60" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M17 2 C31 8 34 24 17 31 C0 24 3 8 17 2 Z" fill="#2f7d32" stroke="#245f27" stroke-width="1"/>
    <path d="M17 4 L17 29" stroke="#d81b60" stroke-width="2"/>
    <path d="M17 12 L10 18 M17 10 L24 17 M17 20 L11 25" stroke="#e57aa0" stroke-width="1.4" stroke-linecap="round"/></svg>`;
  const CANOPIES = ['#e53935', '#1e88e5', '#fb8c00', '#8e24aa', '#00897b'];
  function chute(color) {
    return `<svg viewBox="0 0 120 92" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M4 52 C4 10 116 10 116 52 Q60 40 4 52 Z" fill="${color}"/>
      <path d="M30 47 C32 18 46 12 60 12 C74 12 88 18 90 47" fill="none" stroke="rgba(255,255,255,.75)" stroke-width="7"/>
      <path d="M8 52 L58 90 M112 52 L62 90 M40 46 L60 90 M80 46 L60 90" stroke="#5d4037" stroke-width="1.8"/></svg>`;
  }

  gun.innerHTML = Chars.renderHand({ id: 'gun' });
  ground.innerHTML = `<div class="sky__lettuce">${[31, 32, 33, 34, 35].map(i => Products.renderHoleFront(i)).join('')}</div>`;

  // קושי לפי מספר הגל: כמות צונחים, מהירות נפילה, קצב הופעה, כמה בו-זמנית, כמה שקיות חסלט לתפוס
  function waveCfg(w) {
    const t = clamp((w - 1) / 8, 0, 1);
    return {
      count: 5 + w * 2,
      vy: lerp(72, 172, t),
      interval: lerp(1500, 620, t),
      maxUp: Math.min(4, 2 + Math.floor((w - 1) / 2)),
      decoys: w >= 5 ? 2 : (w >= 2 ? 1 : 0)
    };
  }

  let S = null, raf = 0, toastT = 0, lastT = 0, breakT = 0;

  function reset() {
    S = { score: 0, hits: 0, shots: 0, landed: 0, caught: 0, decoyHits: 0, combo: 0, bestCombo: 0, lives: LIVES, wave: 0, kills: {},
      running: false, paused: false, aborted: false, lastEnemy: null, fallers: [], shots_: [], gunX: 0, gunTarget: 0,
      cfg: null, spawned: 0, resolved: 0, waveHits: 0, waveCaught: 0, decoySlots: new Set(), nextSpawn: 0 };
  }
  function clearSky() { sky.querySelectorAll('.faller, .shot').forEach(n => n.remove()); }

  function start() {
    reset();
    clearSky();
    S.running = true;
    S.gunX = S.gunTarget = sky.clientWidth / 2;
    placeGun();
    hint.hidden = false;
    toastEl.hidden = true;
    startWave(1);
    lastT = performance.now();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(tick);
  }
  function stop() {
    if (S) { S.running = false; S.aborted = true; }
    cancelAnimationFrame(raf);
    clearTimeout(breakT);
    Fx.closeInterstitial();
    clearSky();
  }
  function placeGun() { gun.style.transform = `translateX(${Math.round(S.gunX - gun.offsetWidth / 2)}px)`; }
  function gunTop() { return sky.clientHeight - GROUND - gun.offsetHeight * .52; }

  /* ---- גלים ---- */
  function startWave(w) {
    S.wave = w;
    S.cfg = waveCfg(w);
    S.spawned = 0; S.resolved = 0; S.waveHits = 0; S.waveCaught = 0;
    S.decoySlots = new Set();
    while (S.decoySlots.size < S.cfg.decoys) S.decoySlots.add(1 + Math.floor(Math.random() * (S.cfg.count - 1)));
    S.nextSpawn = performance.now() + 600;
    S.paused = false;
    if (w > 1) hint.hidden = true;
    updateHud();
  }
  function checkWaveEnd() {
    if (!S.running || S.paused) return;
    if (S.spawned < S.cfg.count || S.resolved < S.cfg.count) return;
    S.paused = true;
    cancelAnimationFrame(raf);
    const enemies = S.cfg.count - S.cfg.decoys;
    const next = waveCfg(S.wave + 1);
    const w = S.wave;
    clearTimeout(breakT);
    breakT = setTimeout(() => {
      if (!S.running) return;
      Sfx.play('levelup');
      const sub = S.waveHits === enemies ? 'גל נקי! אף אחד לא נחת. ' : '';
      const nextLine = `בגל הבא: ${next.count - next.decoys} צונחים` + (next.decoys ? `, ${next.decoys} ${next.decoys === 1 ? 'שקית חסלט לתפוס' : 'שקיות חסלט לתפוס'}` : '') + (w >= 2 ? ' · מהר יותר' : '');
      Fx.interstitial({ host: sky, kicker: `גל ${w} הושלם ✅`, title: `${S.waveHits}/${enemies} חוסלו`,
        sub: sub + BREAK_LINES[Math.floor(Math.random() * BREAK_LINES.length)] + (S.waveCaught ? ` תפסתם ${S.waveCaught} ${S.waveCaught === 1 ? 'שקית' : 'שקיות'}.` : ''),
        line: nextLine, button: `לגל ${w + 1} ▶`, auto: AUTO_NEXT, tapToSkip: true }).then(() => {
          if (!S.running) return;
          startWave(w + 1);
          lastT = performance.now();
          cancelAnimationFrame(raf);
          raf = requestAnimationFrame(tick);
        });
    }, 750);
  }

  function tick(now) {
    if (!S.running || S.paused) return;
    const dt = Math.min(50, now - lastT); lastT = now;
    const cfg = S.cfg;

    S.gunX += (S.gunTarget - S.gunX) * Math.min(1, dt / 80);
    placeGun();

    if (S.spawned < cfg.count && now >= S.nextSpawn) {
      const alive = S.fallers.filter(f => f.state === 'falling').length;
      if (alive < cfg.maxUp) {
        spawn(now, S.decoySlots.has(S.spawned));
        S.spawned++;
        S.nextSpawn = now + cfg.interval * (.75 + Math.random() * .5);
      }
    }

    const landY = sky.clientHeight - GROUND - FH + 34;
    for (const f of S.fallers) {
      if (f.state !== 'falling') continue;
      f.y += f.vy * dt / 1000;
      f.x = f.x0 + Math.sin((now - f.born) / 900) * f.sway;
      setPos(f);
      if (f.y >= landY) land(f);
    }
    for (const s of S.shots_) {
      if (s.done) continue;
      const t = clamp((now - s.t0) / s.dur, 0, 1);
      const x = lerp(s.x0, s.x1, t), y = lerp(s.y0, s.y1, t) - Math.sin(t * Math.PI) * 26;
      s.el.style.transform = `translate(${Math.round(x - 17)}px, ${Math.round(y - 23)}px) rotate(${Math.round(lerp(s.r0, s.r1, t))}deg)`;
      if (t >= 1) resolveShot(s);
    }
    S.shots_ = S.shots_.filter(s => !s.done);
    S.fallers = S.fallers.filter(f => !f.removed);

    if (S.running && !S.paused) raf = requestAnimationFrame(tick);
  }

  function spawn(now, decoy) {
    const W = sky.clientWidth;
    const e = decoy ? null : Chars.pickEnemy(S.lastEnemy);
    if (e) S.lastEnemy = e.id;
    const el = document.createElement('div');
    el.className = 'faller';
    const color = decoy ? '#6FB23C' : CANOPIES[Math.floor(Math.random() * CANOPIES.length)];
    el.innerHTML = `<div class="faller__chute">${chute(color)}</div><div class="fsprite">${decoy ? Products.renderDecoy() : Chars.enemySvg(e)}</div>`;
    sky.appendChild(el);
    const sway = 8 + Math.random() * 22;
    const f = { el, enemy: e, decoy, x0: clamp(sway + 6 + Math.random() * (W - FW - sway * 2 - 12), 0, Math.max(0, W - FW)), x: 0, y: -FH + 60,
      vy: S.cfg.vy * (decoy ? 1.1 : 1) * (e && e.bonus ? 1.3 : 1), sway, born: now, state: 'falling', removed: false };
    f.x = f.x0;
    setPos(f);
    S.fallers.push(f);
    Sfx.play('pop');
  }
  function setPos(f) {
    f.el.style.setProperty('--x', Math.round(f.x) + 'px');
    f.el.style.setProperty('--y', Math.round(f.y) + 'px');
  }
  function removeSoon(f, ms) { setTimeout(() => { f.el.remove(); f.removed = true; }, ms); }
  function resolved() { S.resolved++; checkWaveEnd(); }

  /* ---- ירי ---- */
  function onDown(e) {
    if (!S || !S.running || S.paused) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    Sfx.unlock();
    const r = sky.getBoundingClientRect();
    const tx = e.clientX - r.left, ty = e.clientY - r.top;
    S.gunTarget = clamp(tx, 46, r.width - 46);
    fire(tx, ty);
  }
  function fire(tx, ty) {
    hint.hidden = true;
    S.shots++;
    gun.classList.remove('is-firing'); void gun.offsetWidth; gun.classList.add('is-firing');
    Sfx.play('shoot');
    const el = document.createElement('div');
    el.className = 'shot';
    el.innerHTML = LEAF;
    sky.appendChild(el);
    const x0 = S.gunX, y0 = gunTop();
    const dist = Math.hypot(tx - x0, ty - y0);
    const s = { el, x0, y0, x1: tx, y1: ty, t0: performance.now(), dur: 130 + dist * .32, r0: Math.random() * 40 - 20, r1: 360 * (Math.random() < .5 ? 1 : -1), done: false };
    el.style.transform = `translate(${Math.round(x0 - 17)}px, ${Math.round(y0 - 23)}px)`;
    S.shots_.push(s);
  }
  function resolveShot(s) {
    s.done = true;
    s.el.remove();
    if (!S.running) return;
    const r = sky.getBoundingClientRect();
    const px = s.x1, py = s.y1;
    let target = null, best = 1e9;
    for (const f of S.fallers) {
      if (f.state !== 'falling') continue;
      const cx = f.x + FW / 2, cy = f.y + 128;
      const d = Math.hypot(px - cx, (py - cy) * .8);
      if (d < 70 && d < best) { best = d; target = f; }
    }
    const cx = r.left + px, cy = r.top + py;
    if (!target) {
      if (S.combo > 0) { S.combo = 0; updateHud(); }
      Fx.floatText(cx, cy, 'פספוס', 'is-muted');
      Sfx.play('miss');
      return;
    }
    if (target.decoy) return hitDecoy(target, cx, cy);
    hit(target, cx, cy);
  }

  function hit(f, cx, cy) {
    const e = f.enemy;
    f.state = 'hit';
    S.hits++; S.waveHits++; S.combo++;
    S.bestCombo = Math.max(S.bestCombo, S.combo);
    const mult = Math.min(5, 1 + Math.floor(S.combo / 3));
    const fast = f.y + 128 < sky.clientHeight * .4;              // נפגע כשהוא עדיין גבוה
    const pts = e.points * mult + (fast ? 50 : 0) + (S.wave - 1) * 10;   // ניקוד אחיד: דמות × קומבו + מהיר + מדרגה
    S.score += pts;
    S.kills[e.id] = (S.kills[e.id] || 0) + 1;
    App.stats.addKill(e.id);
    f.el.querySelector('.fsprite').classList.add('hit');
    f.el.classList.add('is-hit');
    removeSoon(f, 700);
    Sfx.play(e.bonus ? 'bonus' : 'whack');
    if (S.combo % 3 === 0) Sfx.play('combo');
    Fx.burstLeaves(cx, cy, e.bonus ? 16 : 10);
    Fx.floatText(cx, cy - 34, '+' + pts, e.bonus ? 'is-bonus' : 'is-good');
    let msg = Math.random() < .4 ? `<b>${e.name}</b>: ${e.quip}` : `<b>${e.name}</b> חוסל באוויר!`;
    if (e.bonus) msg = `⭐ בונוס! <b>${e.name}</b> חוסל!`;
    else if (fast) msg += ' ⚡ מהיר!';
    if (S.combo >= 3 && S.combo % 3 === 0) msg += ` · קומבו ×${mult}`;
    toast(msg, e.bonus ? 'is-bonus' : '');
    updateHud(true);
    resolved();
  }
  function hitDecoy(f, cx, cy) {
    f.state = 'hit';
    S.decoyHits++;
    S.score = Math.max(0, S.score - 150);
    S.combo = 0;
    f.el.querySelector('.fsprite').classList.add('hit');
    f.el.classList.add('is-hit');
    removeSoon(f, 700);
    Sfx.play('bad');
    Fx.floatText(cx, cy - 24, '−150', 'is-bad');
    toast('אוי! יריתם על שקית <b>חסלט</b> 😱 את זה תופסים, לא מחסלים', 'is-bad');
    updateHud(true);
    resolved();
  }

  /* ---- נחיתה ---- */
  function land(f) {
    f.state = 'landed';
    const r = sky.getBoundingClientRect();
    const cx = r.left + f.x + FW / 2, cy = r.top + f.y + 110;
    if (f.decoy) {
      if (Math.abs((f.x + FW / 2) - S.gunX) < 66) {
        S.caught++; S.waveCaught++;
        S.score += 100;
        f.el.classList.add('is-caught');
        Sfx.play('bonus');
        Fx.burstLeaves(cx, cy + 20, 8);
        Fx.floatText(cx, cy - 30, '+100 תפיסה!', 'is-bonus');
        toast('תפסתם שקית <b>חסלט</b>! טרייה, נקייה, +100 🥬', 'is-bonus');
        updateHud(true);
      } else {
        f.el.classList.add('is-landed');
        Fx.floatText(cx, cy - 30, 'שקית נפלה', 'is-muted');
      }
      removeSoon(f, 600);
      resolved();
      return;
    }
    S.landed++; S.lives--; S.combo = 0;
    f.el.classList.add('is-landed');
    removeSoon(f, 600);
    Sfx.play('life');
    Fx.floatText(cx, cy - 30, 'נחת!', 'is-bad');
    toast(`<b>${f.enemy.name}</b> נחת! ${S.lives > 0 ? `נשארו ${S.lives} חיים` : 'ונגמרו העלים.'}`, 'is-bad');
    updateHud();
    if (S.lives <= 0) return end();
    resolved();
  }

  function toast(html, cls) {
    toastEl.innerHTML = html;
    toastEl.className = 'toast ' + (cls || '');
    toastEl.hidden = true; void toastEl.offsetWidth; toastEl.hidden = false;
    clearTimeout(toastT);
    toastT = setTimeout(() => { toastEl.hidden = true; }, 1700);
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
    clearTimeout(breakT);
    Sfx.play('over');
    const snap = S;
    setTimeout(() => {
      if (snap.aborted) return;
      App.showResult({ mode: 'shoot', score: snap.score, hits: snap.hits, wave: snap.wave, accuracy: snap.shots ? Math.round(snap.hits / snap.shots * 100) : 0,
        landed: snap.landed, caught: snap.caught, decoyHits: snap.decoyHits, bestCombo: snap.bestCombo, kills: snap.kills });
    }, 900);
  }

  // אייקון לתפריט: אויב במצנח
  function iconSvg() {
    const e = Chars.ENEMIES.find(x => x.id === 'sinwar');
    return `<div class="faller" style="position:relative;width:78%;height:auto;aspect-ratio:104/200;transform:none"><div class="faller__chute">${chute('#e53935')}</div><div class="fsprite">${Chars.enemySvg(e)}</div></div>`;
  }

  sky.addEventListener('pointerdown', onDown);
  sky.addEventListener('pointermove', e => {
    if (e.pointerType === 'mouse' && S && S.running) { const r = sky.getBoundingClientRect(); S.gunTarget = clamp(e.clientX - r.left, 46, r.width - 46); }
  });
  sky.addEventListener('contextmenu', e => e.preventDefault());

  window.Shoot = { start, stop, iconSvg };
})();
