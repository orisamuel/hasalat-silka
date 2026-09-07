/* =========================================================
   חסלט מחסלת · אפקטים: היד, עלים עפים, פוף, טקסט מרחף, חותמת
   ========================================================= */
(function () {
  'use strict';

  const handEl = document.getElementById('hand');
  const fxEl = document.getElementById('fx');
  handEl.innerHTML = Chars.renderHand({ id: 'main' });

  let hw = 150, hh = 200;
  function measure() { const r = handEl.getBoundingClientRect(); hw = r.width || 150; hh = r.height || 200; }
  measure();
  window.addEventListener('resize', measure);

  // נקודת המגע של היד = מרכז צרור העלים (50% מהרוחב, 24% מהגובה)
  function place(x, y) { handEl.style.transform = `translate(${Math.round(x - hw * .5)}px, ${Math.round(y - hh * .24)}px)`; }
  function placeInstant(x, y) { handEl.classList.remove('is-gliding'); place(x, y); }

  let slapT = 0, hideT = 0;
  const Hand = {
    show() { handEl.classList.add('is-on'); },
    hide() { handEl.classList.remove('is-on'); },
    moveTo: placeInstant,
    // חזרה רכה למקום המנוחה (בנייד היד נשארת על המסך כל הזמן)
    glideTo(x, y) { handEl.classList.add('is-gliding'); place(x, y); handEl.classList.add('is-on'); },
    slap(x, y) {
      placeInstant(x, y);
      handEl.classList.add('is-on');
      handEl.classList.remove('is-slapping');
      void handEl.offsetWidth; // מאפס את האנימציה
      handEl.classList.add('is-slapping');
      clearTimeout(slapT);
      slapT = setTimeout(() => handEl.classList.remove('is-slapping'), 230);
    },
    hideSoon(ms) { clearTimeout(hideT); hideT = setTimeout(() => Hand.hide(), ms || 380); },
    cancelHide() { clearTimeout(hideT); }
  };

  function spawn(cls, x, y, vars) {
    const el = document.createElement('div');
    el.className = cls;
    el.style.left = x + 'px'; el.style.top = y + 'px';
    for (const k in vars) el.style.setProperty('--' + k, vars[k]);
    el.addEventListener('animationend', () => el.remove());
    fxEl.appendChild(el);
    setTimeout(() => el.remove(), 1600); // ביטוח
    return el;
  }
  const rnd = (a, b) => a + Math.random() * (b - a);

  function burstLeaves(x, y, n) {
    for (let i = 0; i < (n || 10); i++) {
      const a = rnd(-Math.PI, 0) + rnd(-.4, .4), d = rnd(50, 130);
      spawn('leafbit', x, y, { dx: Math.cos(a) * d + 'px', dy: (Math.sin(a) * d - 20) + 'px', rot: rnd(-540, 540) + 'deg' });
    }
  }
  function poof(x, y, n) {
    spawn('poofcore', x, y, {});
    for (let i = 0; i < (n || 12); i++) {
      const a = (i / (n || 12)) * Math.PI * 2 + rnd(-.3, .3), d = rnd(24, 70);
      spawn('poofbit', x, y, { dx: Math.cos(a) * d + 'px', dy: (Math.sin(a) * d - 10) + 'px', s: rnd(2.2, 4.4) });
    }
  }
  function floatText(x, y, text, cls) {
    const el = spawn('floatxt ' + (cls || ''), x, y, {});
    el.textContent = text;
    return el;
  }
  function stamp(x, y, text, small) {
    const el = spawn('stampfx' + (small ? ' stampfx--sm' : ''), x, y, {});
    el.textContent = text;
    return el;
  }
  /* ---- כרטיס ביניים בין גלים / שלבים ----
     host: אזור המשחק (position:relative). button: טקסט כפתור (אופציונלי). auto: ms להמשך אוטומטי. tapToSkip: לחיצה ממשיכה. */
  let interEl = null, interResolve = null, interT = 0;
  function interstitial(o) {
    closeInterstitial();
    return new Promise(resolve => {
      interResolve = resolve;
      const el = document.createElement('div');
      el.className = 'inter';
      const tap = o.tapToSkip !== false;
      el.innerHTML = `<div class="inter__card">
        ${o.kicker ? `<div class="inter__kicker">${o.kicker}</div>` : ''}
        <div class="inter__title">${o.title}</div>
        ${o.sub ? `<p class="inter__sub">${o.sub}</p>` : ''}
        ${o.line ? `<p class="inter__line">${o.line}</p>` : ''}
        ${o.button ? `<button type="button" class="inter__btn">${o.button}</button>` : ''}
        ${o.auto ? `<div class="inter__bar"><i></i></div>` : ''}
      </div>`;
      o.host.appendChild(el);
      interEl = el;
      const done = () => {
        if (interEl !== el) return;
        el.remove(); interEl = null; clearTimeout(interT);
        const r = interResolve; interResolve = null;
        if (r) r();
      };
      if (o.button) el.querySelector('.inter__btn').addEventListener('click', e => { e.stopPropagation(); done(); });
      if (tap) el.addEventListener('click', done);
      if (o.auto) {
        const bar = el.querySelector('.inter__bar i');
        requestAnimationFrame(() => { bar.style.transition = `width ${o.auto}ms linear`; bar.style.width = '0%'; });
        interT = setTimeout(done, o.auto);
      }
    });
  }
  function closeInterstitial() {
    if (interEl) { interEl.remove(); interEl = null; }
    clearTimeout(interT);
    if (interResolve) { const r = interResolve; interResolve = null; r(); }
  }

  function centerOf(el) {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, r };
  }

  window.Fx = { Hand, burstLeaves, poof, floatText, stamp, centerOf, interstitial, closeInterstitial };
})();
