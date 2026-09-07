/* =========================================================
   חסלט מחסלת · אפקטי קול מסונתזים (Web Audio, בלי קבצים)
   ========================================================= */
(function () {
  'use strict';

  let ctx = null, master = null, noiseBuf = null, muted = false;

  function ensure() {
    if (ctx) return true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = .55;
      master.connect(ctx.destination);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    } catch (e) { return false; }
    return true;
  }
  function unlock() {
    if (!ensure()) return;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  }

  function tone(freq, dur, type, vol, slideTo, delay) {
    const t0 = ctx.currentTime + (delay || 0);
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(master);
    o.start(t0); o.stop(t0 + dur + .02);
  }
  function noise(dur, fromHz, toHz, vol, delay) {
    const t0 = ctx.currentTime + (delay || 0);
    const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass';
    f.frequency.setValueAtTime(fromHz, t0);
    f.frequency.exponentialRampToValueAtTime(Math.max(40, toHz), t0 + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f); f.connect(g); g.connect(master);
    src.start(t0); src.stop(t0 + dur + .02);
  }

  const SFX = {
    pop() { tone(300, .1, 'square', .08, 620); },
    whack() { noise(.13, 1200, 200, .55); tone(130, .13, 'sine', .35, 55); },
    poof() { noise(.4, 1800, 120, .4); tone(260, .32, 'sine', .14, 80); },
    miss() { noise(.18, 2600, 300, .1); },
    bad() { tone(250, .38, 'sawtooth', .1, 105); },
    laugh() { tone(200, .08, 'square', .09); tone(170, .08, 'square', .09, null, .11); tone(150, .11, 'square', .09, null, .22); },
    combo() { tone(660, .08, 'triangle', .14); tone(880, .11, 'triangle', .14, null, .08); },
    bonus() { tone(784, .09, 'triangle', .16); tone(988, .09, 'triangle', .16, null, .09); tone(1318, .16, 'triangle', .16, null, .18); },
    levelup() { [523, 659, 784, 1046].forEach((f, i) => tone(f, .15, 'triangle', .15, null, i * .09)); },
    over() { [392, 330, 262].forEach((f, i) => tone(f, .26, 'triangle', .15, null, i * .19)); },
    escape() { tone(420, .22, 'sine', .09, 980); },
    shoot() { noise(.1, 3200, 500, .16); tone(720, .09, 'triangle', .07, 280); },
    life() { tone(330, .18, 'sawtooth', .08, 160); tone(220, .22, 'sawtooth', .08, 110, .16); }
  };

  window.Sfx = {
    unlock,
    play(name) { if (muted || !ensure()) return; try { SFX[name](); } catch (e) { /* שקט */ } },
    setMuted(m) { muted = !!m; },
    isMuted() { return muted; }
  };
})();
