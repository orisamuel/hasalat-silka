/* =========================================================
   חסלט מחסלת · דמויות (קריקטורות SVG מקוריות) + היד עם עלי הסלק
   כל דמות מורכבת מחלקים משותפים: ראש, זקן, שיער, כיסוי ראש, משקפיים, לבוש.
   ========================================================= */
(function () {
  'use strict';

  let counter = 0;
  const uid = () => 'c' + (++counter).toString(36);

  // הבהרה/הכהיה של צבע hex. amt חיובי = בהיר יותר, שלילי = כהה יותר
  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(c => {
      const v = amt < 0 ? c * (1 + amt) : c + (255 - c) * amt;
      return Math.max(0, Math.min(255, Math.round(v)));
    });
    return '#' + ch.map(v => v.toString(16).padStart(2, '0')).join('');
  }

  /* ---------- גוף ---------- */
  const TORSO = 'M20 250 L20 208 C20 176 44 164 72 164 L128 164 C156 164 180 176 180 208 L180 250 Z';

  const CLOTHES = {
    // גלימת אנשי דת: קבא שחור + עבאיה חומה
    robe: c => `
      <path d="${TORSO}" fill="#1c1c1c"/>
      <path d="M20 250 L20 208 C20 176 44 164 72 164 L88 164 L70 250 Z" fill="${c.cloak || '#5b4636'}"/>
      <path d="M180 250 L180 208 C180 176 156 164 128 164 L112 164 L130 250 Z" fill="${c.cloak || '#5b4636'}"/>
      <path d="M88 164 L100 194 L112 164 Z" fill="#9a9a9a"/>`,
    suit: c => {
      const s = c.suit || '#1f2a44';
      return `
      <path d="${TORSO}" fill="${s}"/>
      <path d="M78 164 L100 216 L122 164 Z" fill="#ffffff"/>
      <path d="M78 164 L100 216 L91 172 Z" fill="${shade(s, -.35)}"/>
      <path d="M122 164 L100 216 L109 172 Z" fill="${shade(s, -.35)}"/>
      <path d="M95 168 L105 168 L109 206 L100 218 L91 206 Z" fill="${c.tie || '#b71c1c'}"/>`;
    },
    military: c => {
      const m = c.color || '#4e5b3c';
      return `
      <path d="${TORSO}" fill="${m}"/>
      <path d="M80 164 L100 194 L120 164 Z" fill="${shade(m, -.4)}"/>
      <g transform="rotate(-14 48 182)"><rect x="30" y="176" width="36" height="12" rx="3" fill="#b71c1c"/><path d="M36 182 L60 182" stroke="#f4c542" stroke-width="2"/></g>
      <g transform="rotate(14 152 182)"><rect x="134" y="176" width="36" height="12" rx="3" fill="#b71c1c"/><path d="M140 182 L164 182" stroke="#f4c542" stroke-width="2"/></g>
      <circle cx="100" cy="208" r="3" fill="#f4c542"/><circle cx="100" cy="224" r="3" fill="#f4c542"/><circle cx="100" cy="240" r="3" fill="#f4c542"/>`;
    },
    shirt: c => {
      const s = c.color || '#2b2b2b';
      return `
      <path d="${TORSO}" fill="${s}"/>
      <path d="M80 164 L100 192 L86 178 Z" fill="${shade(s, .22)}"/>
      <path d="M120 164 L100 192 L114 178 Z" fill="${shade(s, .22)}"/>`;
    },
    jacket: c => {
      const j = c.color || '#c9b58c';
      return `
      <path d="${TORSO}" fill="${j}"/>
      <path d="M80 164 L100 208 L120 164 Z" fill="#f7f7f7"/>
      <path d="M80 164 L100 208 L88 170 Z" fill="${shade(j, -.22)}"/>
      <path d="M120 164 L100 208 L112 170 Z" fill="${shade(j, -.22)}"/>
      <path d="M100 208 L100 250" stroke="${shade(j, -.3)}" stroke-width="3"/>`;
    },
    royal: c => `
      <path d="${TORSO}" fill="${c.color || '#5e1a7a'}"/>
      <path d="M20 208 C20 176 44 164 72 164 L128 164 C156 164 180 176 180 208" stroke="#f4c542" stroke-width="7" fill="none"/>
      <path d="M86 164 L100 190 L114 164 Z" fill="#f4c542"/>
      <circle cx="100" cy="214" r="10" fill="#f4c542"/><circle cx="100" cy="214" r="5" fill="#d32f2f"/>`,
    pharaoh: () => `
      <path d="${TORSO}" fill="#f3ecd8"/>
      <path d="M52 168 Q100 242 148 168" stroke="#f4c542" stroke-width="16" fill="none"/>
      <path d="M60 166 Q100 224 140 166" stroke="#1e5aa8" stroke-width="7" fill="none"/>
      <path d="M70 165 Q100 206 130 165" stroke="#d32f2f" stroke-width="5" fill="none"/>`
  };

  /* ---------- פנים ---------- */
  function head(skin, u) {
    const dark = shade(skin, -.24);
    return `
      <ellipse cx="44" cy="120" rx="9" ry="13" fill="${skin}"/>
      <ellipse cx="156" cy="120" rx="9" ry="13" fill="${skin}"/>
      <ellipse cx="100" cy="112" rx="56" ry="62" fill="${skin}"/>
      <ellipse cx="100" cy="112" rx="56" ry="62" fill="url(#shd${u})" opacity=".18"/>
      <path d="M100 108 L91 137 Q100 143 109 137 Z" fill="${dark}" opacity=".85"/>`;
  }

  function eyes(e) {
    const brow = e.brow || '#222', bw = e.browWidth || 6;
    const brows = e.brows === false ? '' : `
      <path class="n" d="M62 94 L92 102" stroke="${brow}" stroke-width="${bw}" stroke-linecap="round"/>
      <path class="n" d="M138 94 L108 102" stroke="${brow}" stroke-width="${bw}" stroke-linecap="round"/>`;
    const kohl = e.kohl ? `
      <path class="n" d="M92 108 Q78 95 64 108 L54 105" stroke="#111" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path class="n" d="M108 108 Q122 95 136 108 L146 105" stroke="#111" stroke-width="3" fill="none" stroke-linecap="round"/>` : '';
    return `${brows}
      <ellipse class="n" cx="78" cy="108" rx="10" ry="8" fill="#fff"/><ellipse class="n" cx="122" cy="108" rx="10" ry="8" fill="#fff"/>
      <circle class="n" cx="79" cy="109" r="4.5" fill="#1d1d1d"/><circle class="n" cx="121" cy="109" r="4.5" fill="#1d1d1d"/>
      <circle class="n" cx="80.5" cy="107.5" r="1.4" fill="#fff"/><circle class="n" cx="122.5" cy="107.5" r="1.4" fill="#fff"/>
      ${kohl}`;
  }

  const MOUTH = {
    frown: `<path class="n" d="M86 160 Q100 149 114 160" stroke="#3a1a08" stroke-width="4" fill="none" stroke-linecap="round"/>`,
    flat: `<path class="n" d="M87 156 L113 156" stroke="#3a1a08" stroke-width="4" stroke-linecap="round"/>`,
    smirk: `<path class="n" d="M86 156 Q100 161 116 150" stroke="#3a1a08" stroke-width="4" fill="none" stroke-linecap="round"/>`,
    grin: `<path class="n" d="M80 150 Q100 172 120 150 Z" fill="#5a1010"/><path class="n" d="M84 151 L116 151 L112 157 L88 157 Z" fill="#fff"/>`
  };
  const HIT_MOUTH = `<ellipse class="h" cx="100" cy="158" rx="9" ry="12" fill="#4a1010"/>`;

  const BEARD = {
    full: 'M46 122 C46 172 70 188 100 188 C130 188 154 172 154 122 C140 140 120 145 100 145 C80 145 60 140 46 122 Z',
    long: 'M46 122 C44 180 66 205 100 224 C134 205 156 180 154 122 C140 140 120 145 100 145 C80 145 60 140 46 122 Z',
    trim: 'M50 126 C50 170 72 182 100 182 C128 182 150 170 150 126 C138 146 118 152 100 152 C82 152 62 146 50 126 Z',
    goatee: 'M88 156 C86 180 114 180 112 156 C106 161 94 161 88 156 Z'
  };
  const MOUSTACHE = 'M72 140 C82 131 95 134 100 139 C105 134 118 131 128 140 C118 149 82 149 72 140 Z';

  function beardSvg(type, color) {
    if (type === 'stubble') return `<path d="${BEARD.trim}" fill="${color}" opacity=".45"/>`;
    if (type === 'false') return `<rect x="93" y="168" width="14" height="38" rx="6" fill="#1e5aa8"/><path d="M93 180 H107 M93 190 H107 M93 200 H107" stroke="#f4c542" stroke-width="2"/>`;
    return `<path d="${BEARD[type]}" fill="${color}"/>`;
  }
  function moustacheSvg(type, color) {
    let s = `<path d="${MOUSTACHE}" fill="${color}"/>`;
    if (type === 'curly') s += `
      <path d="M72 140 C64 147 56 141 60 132" stroke="${color}" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M128 140 C136 147 144 141 140 132" stroke="${color}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
    return s;
  }

  const HAIR = {
    short: 'M44 116 C42 62 62 46 100 46 C138 46 158 62 156 116 C152 92 142 86 132 86 C120 82 80 82 68 86 C58 86 48 92 44 116 Z',
    receding: 'M44 116 C42 66 60 50 100 50 C140 50 158 66 156 116 C152 90 142 72 100 76 C58 72 48 90 44 116 Z',
    combed: 'M44 116 C42 60 62 44 100 44 C138 44 158 60 156 116 C152 90 146 78 136 80 C124 74 90 72 70 84 C58 88 48 96 44 116 Z'
  };
  function hairSvg(type, color) {
    let s = `<path d="${HAIR[type]}" fill="${color}"/>`;
    if (type === 'combed') s += `<path d="M64 70 Q100 52 140 66 M60 82 Q100 66 144 78" stroke="${shade(color, -.25)}" stroke-width="2.5" fill="none" opacity=".8"/>`;
    if (type === 'short') s += `<path d="M62 74 Q100 60 138 74" stroke="${shade(color, -.2)}" stroke-width="2.5" fill="none" opacity=".6"/>`;
    return s;
  }

  const GLASSES = {
    round: c => `<g fill="rgba(255,255,255,.16)" stroke="${c}" stroke-width="2.5"><circle cx="78" cy="108" r="14"/><circle cx="122" cy="108" r="14"/><path d="M92 106 Q100 102 108 106" fill="none"/><path d="M64 106 L48 100 M136 106 L152 100" fill="none"/></g>`,
    thin: c => `<g fill="rgba(255,255,255,.14)" stroke="${c}" stroke-width="2"><ellipse cx="78" cy="108" rx="15" ry="12"/><ellipse cx="122" cy="108" rx="15" ry="12"/><path d="M93 106 Q100 103 107 106" fill="none"/><path d="M63 106 L47 100 M137 106 L153 100" fill="none"/></g>`,
    square: c => `<g fill="rgba(255,255,255,.16)" stroke="${c}" stroke-width="3.5"><rect x="60" y="94" width="34" height="28" rx="5"/><rect x="106" y="94" width="34" height="28" rx="5"/><path d="M94 106 L106 106" fill="none"/><path d="M60 104 L46 100 M140 104 L154 100" fill="none"/></g>`
  };

  function kefDefs(u) {
    return `<pattern id="kef${u}" width="14" height="14" patternUnits="userSpaceOnUse">
      <rect width="14" height="14" fill="#f6f6f6"/>
      <path d="M0 7 H14 M7 0 V14" stroke="#c62828" stroke-width="2.6"/>
      <path d="M0 0 L14 14 M14 0 L0 14" stroke="#c62828" stroke-width="1.4" opacity=".65"/>
    </pattern>`;
  }

  const HEAD = {
    turban: e => {
      const c = e.turban || '#1a1a1a', c2 = c === '#1a1a1a' ? '#4a4a4a' : shade(c, -.2);
      return `
      <ellipse cx="100" cy="58" rx="66" ry="30" fill="${c}"/>
      <path d="M38 64 Q100 42 162 64" stroke="${c2}" stroke-width="3" fill="none" opacity=".8"/>
      <path d="M40 74 Q100 54 160 74" stroke="${c2}" stroke-width="3" fill="none" opacity=".7"/>
      <path d="M46 84 Q100 66 154 84" stroke="${c2}" stroke-width="3" fill="none" opacity=".5"/>`;
    },
    wrap: () => `
      <ellipse cx="100" cy="62" rx="62" ry="26" fill="#f4f4f4"/>
      <path d="M150 66 C172 80 178 110 166 142 C170 108 158 90 142 80 Z" fill="#e6e6e6"/>
      <path d="M42 70 Q100 52 158 70" stroke="#d2d2d2" stroke-width="3" fill="none"/>
      <path d="M46 80 Q100 62 154 80" stroke="#d2d2d2" stroke-width="3" fill="none"/>`,
    haman: () => `
      <path d="M100 6 L176 88 L24 88 Z" fill="#1a1a1a"/>
      <path d="M100 6 L176 88 L150 88 Z" fill="#303030"/>
      <path d="M24 88 Q100 74 176 88 L176 100 Q100 86 24 100 Z" fill="#7b1fa2"/>
      <circle cx="100" cy="8" r="7" fill="#f4c542"/>`,
    nemes: (e, u) => `
      <pattern id="nm${u}" width="200" height="16" patternUnits="userSpaceOnUse"><rect width="200" height="8" fill="#1e5aa8"/><rect y="8" width="200" height="8" fill="#f4c542"/></pattern>
      <path d="M40 90 C34 28 166 28 160 90 L172 178 L136 178 L138 88 L62 88 L64 178 L28 178 Z" fill="url(#nm${u})"/>
      <path d="M42 84 Q100 74 158 84 L158 96 Q100 86 42 96 Z" fill="#f4c542"/>
      <path d="M100 84 C90 72 94 58 104 60 C112 62 110 74 100 84 Z" fill="#f4c542" stroke="#b58a00" stroke-width="1.5"/>`,
    keffiyeh: (e, u) => `
      <path d="M44 100 C40 50 70 36 100 36 C130 36 160 50 156 100 C140 88 120 84 100 84 C80 84 60 88 44 100 Z" fill="url(#kef${u})"/>
      <path d="M46 124 C46 172 70 190 100 190 C130 190 154 172 154 124 C136 118 116 116 100 116 C84 116 64 118 46 124 Z" fill="url(#kef${u})"/>
      <path d="M60 150 Q100 162 140 150" stroke="#b71c1c" stroke-width="1.5" fill="none" opacity=".5"/>
      <path d="M42 84 Q100 74 158 84 L158 96 Q100 86 42 96 Z" fill="#1b5e20"/>`
  };

  /* ---------- שכבת "חוסל" (מוצגת רק כשיש class hit) ---------- */
  const star = (x, y, r) => `<path transform="translate(${x} ${y})" d="M0 -${r} L${r * .38} -${r * .38} L${r} 0 L${r * .38} ${r * .38} L0 ${r} L-${r * .38} ${r * .38} L-${r} 0 L-${r * .38} -${r * .38} Z" fill="#ffd54f" stroke="#f59e0b" stroke-width="1.5"/>`;
  const HIT_LAYER = `
      <g class="h">
        <path d="M69 99 L87 117 M87 99 L69 117" stroke="#1d1d1d" stroke-width="5" stroke-linecap="round"/>
        <path d="M113 99 L131 117 M131 99 L113 117" stroke="#1d1d1d" stroke-width="5" stroke-linecap="round"/>
      </g>
      <g class="h stars">${star(52, 56, 9)}${star(100, 24, 8)}${star(150, 58, 9)}${star(136, 30, 6)}${star(66, 30, 6)}</g>
      <g class="h">
        <path d="M118 118 C138 104 162 110 160 128 C146 144 122 140 118 118 Z" fill="#5cb85c" opacity=".92"/>
        <path d="M120 120 L156 130" stroke="#c2185b" stroke-width="2.2"/>
      </g>`;

  const DEFS = u => `<radialGradient id="shd${u}" cx="50%" cy="35%" r="70%"><stop offset="55%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity="1"/></radialGradient>`;

  function renderShadow(e) {
    return `<svg class="char" viewBox="0 0 200 250" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="84" y="150" width="32" height="30" fill="#2b3038"/>
      <path d="${TORSO}" fill="#232830"/>
      <ellipse cx="44" cy="120" rx="9" ry="13" fill="#2b3038"/><ellipse cx="156" cy="120" rx="9" ry="13" fill="#2b3038"/>
      <ellipse cx="100" cy="112" rx="56" ry="62" fill="#2f353e"/>
      <path d="${HAIR.short}" fill="#232830"/>
      <text class="n" x="100" y="142" text-anchor="middle" font-size="84" font-weight="900" font-family="Rubik, Arial, sans-serif" fill="#cfd8dc">?</text>
      <g class="h">
        <path d="M69 99 L87 117 M87 99 L69 117" stroke="#ffd54f" stroke-width="5" stroke-linecap="round"/>
        <path d="M113 99 L131 117 M131 99 L113 117" stroke="#ffd54f" stroke-width="5" stroke-linecap="round"/>
      </g>
      ${HIT_MOUTH}
      <g class="h stars">${star(52, 56, 9)}${star(100, 24, 8)}${star(150, 58, 9)}${star(136, 30, 6)}${star(66, 30, 6)}</g>
      <g class="h"><path d="M118 118 C138 104 162 110 160 128 C146 144 122 140 118 118 Z" fill="#5cb85c" opacity=".92"/><path d="M120 120 L156 130" stroke="#c2185b" stroke-width="2.2"/></g>
    </svg>`;
  }

  function renderEnemy(e) {
    if (e.special === 'shadow') return renderShadow(e);
    const u = uid();
    const skin = e.skin || '#d9a56d';
    const beardColor = e.beardColor || '#8a8a8a';
    let defs = DEFS(u);
    if (e.headgear === 'keffiyeh') defs += kefDefs(u);

    let s = `<svg class="char" viewBox="0 0 200 250" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>${defs}</defs>`;
    s += `<rect x="84" y="150" width="32" height="30" fill="${shade(skin, -.12)}"/>`;
    s += CLOTHES[e.clothes.type](e.clothes);
    if (e.headgear === 'keffiyeh') s += `<path d="M30 216 C26 150 42 92 100 62 C158 92 174 150 170 216 Z" fill="url(#kef${u})"/>`;
    s += head(skin, u);
    if (e.hair) s += hairSvg(e.hair, e.hairColor || '#555');
    if (e.beard) s += beardSvg(e.beard, beardColor);
    s += eyes(e);
    s += MOUTH[e.mouth || 'frown'] + HIT_MOUTH;
    if (e.moustache) s += moustacheSvg(e.moustache, beardColor);
    if (e.headgear) s += HEAD[e.headgear](e, u);
    if (e.glasses) s += GLASSES[e.glasses.type](e.glasses.color || '#2b2b2b');
    s += HIT_LAYER;
    s += '</svg>';
    return s;
  }

  /* ---------- הרשימה ---------- */
  const ENEMIES = [
    { id: 'nasrallah', name: 'נסראללה', org: 'חיזבאללה', quip: 'יצא מהבונקר – וחטף עלה', weight: 10, points: 100,
      skin: '#d9a56d', beard: 'full', beardColor: '#b3b3b3', moustache: 'plain', headgear: 'turban', turban: '#1a1a1a',
      clothes: { type: 'robe', cloak: '#5b4636' }, glasses: { type: 'thin', color: '#3a3a3a' }, brow: '#5a5a5a', browWidth: 7 },
    { id: 'khamenei', name: 'חמינאי', org: 'איראן', quip: 'המנהיג העליון – עם עלה על הפרצוף', weight: 10, points: 100,
      skin: '#dcb283', beard: 'long', beardColor: '#ebebeb', moustache: 'plain', headgear: 'turban', turban: '#1a1a1a',
      clothes: { type: 'robe', cloak: '#5c5148' }, glasses: { type: 'square', color: '#2b2b2b' }, brow: '#8a8a8a', browWidth: 6 },
    { id: 'sinwar', name: 'סינוואר', org: 'חמאס', quip: 'סולק. עם סלק.', weight: 10, points: 100,
      skin: '#c4915c', hair: 'short', hairColor: '#a3a3a3', beard: 'trim', beardColor: '#8a8a8a', moustache: 'plain',
      clothes: { type: 'shirt', color: '#2b2b2b' }, brow: '#1d1d1d', browWidth: 9 },
    { id: 'haniyeh', name: 'הנייה', org: 'חמאס', quip: 'עלה אחד – והנייה בחוץ', weight: 9, points: 100,
      skin: '#cf9c66', hair: 'short', hairColor: '#8f8f8f', beard: 'trim', beardColor: '#a8a8a8', moustache: 'plain',
      clothes: { type: 'suit', suit: '#1f2a44', tie: '#b71c1c' }, brow: '#4a4a4a', browWidth: 6 },
    { id: 'deif', name: 'מוחמד דף', org: 'חמאס', quip: 'יצא מהצללים – בשביל לחטוף עלה', weight: 7, points: 150, special: 'shadow' },
    { id: 'abuobaida', name: 'אבו עוביידה', org: 'חמאס · הדובר', quip: 'ההודעה האחרונה: "אאוץ׳"', weight: 8, points: 120,
      skin: '#c8955e', headgear: 'keffiyeh', clothes: { type: 'military', color: '#4b5d3a' }, brows: false },
    { id: 'houthi', name: 'אל-חות׳י', org: 'החות׳ים · תימן', quip: 'בלי טילים. רק סלק.', weight: 8, points: 110,
      skin: '#b8834f', beard: 'full', beardColor: '#2b2b2b', moustache: 'plain', headgear: 'wrap',
      clothes: { type: 'jacket', color: '#6b4f2a' }, brow: '#1d1d1d', browWidth: 7 },
    { id: 'soleimani', name: 'סולימאני', org: 'משמרות המהפכה', quip: 'חוסל. שוב. הפעם בעלה.', weight: 7, points: 120,
      skin: '#cfa07a', hair: 'combed', hairColor: '#d6d6d6', beard: 'trim', beardColor: '#9a9a9a', moustache: 'plain',
      clothes: { type: 'military', color: '#4e5b3c' }, brow: '#6a6a6a', browWidth: 6 },
    { id: 'ahmadinejad', name: 'אחמדינג׳אד', org: 'איראן', quip: 'המהפכה הירוקה הגיעה גם אליו', weight: 7, points: 100,
      skin: '#d5a672', hair: 'receding', hairColor: '#6b6b6b', beard: 'stubble', beardColor: '#5a5a5a', moustache: 'plain',
      clothes: { type: 'jacket', color: '#c9b58c' }, brow: '#3a3a3a', browWidth: 6, mouth: 'smirk' },
    { id: 'qassem', name: 'נעים קאסם', org: 'חיזבאללה', quip: 'לא נעים, קאסם', weight: 8, points: 100,
      skin: '#d8ab7c', beard: 'full', beardColor: '#bdbdbd', moustache: 'plain', headgear: 'turban', turban: '#f2f2f2',
      clothes: { type: 'robe', cloak: '#3b3b3b' }, glasses: { type: 'square', color: '#3a3a3a' }, brow: '#7a7a7a', browWidth: 6 },
    { id: 'haman', name: 'המן הרשע', org: 'פרס · מגילת אסתר', quip: 'חוסל. הפעם בלי אוזניים.', weight: 3, points: 250, bonus: true,
      skin: '#e8b98a', hair: 'short', hairColor: '#1a1a1a', beard: 'goatee', beardColor: '#1a1a1a', moustache: 'curly', headgear: 'haman',
      clothes: { type: 'royal', color: '#5e1a7a' }, brow: '#1a1a1a', browWidth: 6, mouth: 'grin' },
    { id: 'pharaoh', name: 'פרעה', org: 'מצרים · ספר שמות', quip: 'המכה האחת-עשרה: עלה סלק', weight: 3, points: 250, bonus: true,
      skin: '#c68a52', beard: 'false', headgear: 'nemes', clothes: { type: 'pharaoh' }, brow: '#111', browWidth: 5, kohl: true, mouth: 'flat' }
  ];

  const cache = new Map();
  function enemySvg(e) {
    if (!cache.has(e.id)) cache.set(e.id, renderEnemy(e));
    return cache.get(e.id);
  }
  function pickEnemy(exclude) {
    const pool = ENEMIES.filter(e => e.id !== exclude);
    const total = pool.reduce((s, e) => s + e.weight, 0);
    let r = Math.random() * total;
    for (const e of pool) { r -= e.weight; if (r <= 0) return e; }
    return pool[pool.length - 1];
  }

  /* ---------- היד עם עלי הסלק ---------- */
  function renderHand(opts) {
    const o = opts || {};
    const skin = o.skin || '#e6b389', skinD = shade(skin, -.2);
    const leaf = `
      <g id="leaf${o.id || ''}">
        <path d="M0 0 L0 -64" stroke="#d81b60" stroke-width="6.5" stroke-linecap="round"/>
        <path d="M0 -58 C-8 -80 -34 -96 -36 -132 C-38 -162 -18 -182 0 -194 C18 -182 38 -162 36 -132 C34 -96 8 -80 0 -58 Z" fill="#2f7d32"/>
        <path d="M0 -58 C-8 -80 -34 -96 -36 -132 C-38 -162 -18 -182 0 -194" stroke="#245f27" stroke-width="2" fill="none" opacity=".7"/>
        <path d="M-6 -70 C-22 -92 -28 -120 -22 -160" stroke="#3f9142" stroke-width="1.6" fill="none" opacity=".5"/>
        <path d="M6 -70 C22 -92 28 -120 22 -160" stroke="#3f9142" stroke-width="1.6" fill="none" opacity=".5"/>
        <path d="M0 -58 L0 -184" stroke="#d81b60" stroke-width="4" stroke-linecap="round"/>
        <path d="M0 -92 L-14 -118 M0 -112 L13 -140 M0 -134 L-11 -158 M0 -150 L10 -170" stroke="#e57aa0" stroke-width="2.4" stroke-linecap="round" opacity=".95"/>
      </g>`;
    const L = (rot, sc) => `<use href="#leaf${o.id || ''}" transform="translate(120 208) rotate(${rot}) scale(${sc})"/>`;
    return `<svg class="hand__svg" viewBox="0 0 240 320" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>${leaf}</defs>
      ${L(-36, .92)}${L(-18, 1)}${L(2, 1.04)}${L(20, .98)}${L(37, .9)}
      <path d="M106 252 L110 200 M117 252 L119 198 M125 252 L125 198 M133 252 L130 200" stroke="#d81b60" stroke-width="6" stroke-linecap="round"/>
      <path d="M78 228 C78 206 96 196 120 196 C144 196 162 206 162 228 L162 262 C162 282 148 292 120 292 C92 292 78 282 78 262 Z" fill="${skin}"/>
      <path d="M82 232 C100 224 140 224 158 232 M82 249 C100 241 140 241 158 249 M84 266 C100 260 140 260 156 266" stroke="${skinD}" stroke-width="3" fill="none" stroke-linecap="round"/>
      <ellipse cx="160" cy="222" rx="13" ry="21" fill="${skin}" transform="rotate(-22 160 222)"/>
      <path d="M74 284 L166 284 L172 320 L68 320 Z" fill="#6FB23C"/>
      <path d="M74 284 L166 284 L167 293 L73 293 Z" fill="#4f8f2a"/>
    </svg>`;
  }

  window.Chars = { ENEMIES, renderEnemy, enemySvg, pickEnemy, renderHand, shade };
})();
