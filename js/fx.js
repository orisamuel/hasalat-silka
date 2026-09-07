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

  let slapT = 0, hideT = 0;
  const Hand = {
    show() { handEl.classList.add('is-on'); },
    hide() { handEl.classList.remove('is-on'); },
    moveTo: place,
    slap(x, y) {
      place(x, y);
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
  function stamp(x, y, text) {
    const el = spawn('stampfx', x, y, {});
    el.textContent = text;
    return el;
  }
  function centerOf(el) {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, r };
  }

  window.Fx = { Hand, burstLeaves, poof, floatText, stamp, centerOf };
})();
