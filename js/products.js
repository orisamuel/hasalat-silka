/* =========================================================
   חסלט מחסלת · מוצרי המדף (שקיות SVG) + התגובות ללחיצה שגויה
   ========================================================= */
(function () {
  'use strict';

  let counter = 0;
  const uid = () => 'p' + (++counter).toString(36);

  // מחולל אקראי עם seed – כדי שכל שקית תיראה אותו דבר בכל רינדור
  function rng(seed) {
    let a = seed >>> 0;
    return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const f1 = n => Math.round(n * 10) / 10;

  // עלה מחודד (עדשה)
  function leafPath(cx, cy, w, h, rot) {
    const d = `M${f1(cx)} ${f1(cy - h)} C${f1(cx + w)} ${f1(cy - h * .55)} ${f1(cx + w)} ${f1(cy + h * .55)} ${f1(cx)} ${f1(cy + h)} C${f1(cx - w)} ${f1(cy + h * .55)} ${f1(cx - w)} ${f1(cy - h * .55)} ${f1(cx)} ${f1(cy - h)} Z`;
    return { d, t: rot ? `transform="rotate(${f1(rot)} ${f1(cx)} ${f1(cy)})"` : '' };
  }
  // עלה מסולסל (חסה / קייל)
  function rufflePath(cx, cy, rx, ry, n, amp, r) {
    let d = '';
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2;
      const bump = (i % 2 ? amp : -amp) * (0.6 + r() * .8);
      const x = cx + Math.cos(a) * (rx + bump), y = cy + Math.sin(a) * (ry + bump);
      if (i === 0) d += `M${f1(x)} ${f1(y)}`;
      else {
        const am = ((i - .5) / n) * Math.PI * 2;
        const qx = cx + Math.cos(am) * (rx + amp * 1.6), qy = cy + Math.sin(am) * (ry + amp * 1.6);
        d += ` Q${f1(qx)} ${f1(qy)} ${f1(x)} ${f1(y)}`;
      }
    }
    return d + ' Z';
  }
  function frill(cx, cy, r, color, pointed) {
    if (pointed) {
      // פטרוזיליה מסולסלת – משונן
      let d = '';
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2, rr = i % 2 ? r : r * .55;
        d += (i ? ' L' : 'M') + f1(cx + Math.cos(a) * rr) + ' ' + f1(cy + Math.sin(a) * rr);
      }
      return `<path d="${d} Z" fill="${color}"/>`;
    }
    // כוסברה – אונות עגולות
    return `<circle cx="${f1(cx)}" cy="${f1(cy - r * .55)}" r="${f1(r * .62)}" fill="${color}"/>
      <circle cx="${f1(cx - r * .62)}" cy="${f1(cy + r * .3)}" r="${f1(r * .6)}" fill="${color}"/>
      <circle cx="${f1(cx + r * .62)}" cy="${f1(cy + r * .3)}" r="${f1(r * .6)}" fill="${color}"/>`;
  }

  /* ---- מחוללי תוכן השקית. אזור העלים: x 16..104, y 26..112 ---- */
  const LEAVES = {
    chard(r) { // עלי סלק – עלים ירוקים כהים, גבעולים ועורקים בורדו
      let s = '';
      const xs = [38, 60, 82, 50, 72];
      xs.forEach((x, i) => {
        const cy = 62 + (i % 2) * 8, h = 30 - (i > 2 ? 4 : 0), w = 15;
        s += `<path d="M${x} 116 L${x} ${cy + h - 6}" stroke="#c2185b" stroke-width="5" stroke-linecap="round"/>`;
        const lp = leafPath(x, cy, w, h, (r() - .5) * 18);
        s += `<path d="${lp.d}" ${lp.t} fill="${i > 2 ? '#2e6b2e' : '#2f7d32'}" stroke="#245f27" stroke-width="1"/>`;
        s += `<path d="M${x} ${cy + h - 4} L${x} ${cy - h + 8}" stroke="#d81b60" stroke-width="2.6" ${lp.t}/>`;
        s += `<path d="M${x} ${cy + 6} L${x - 8} ${cy - 6} M${x} ${cy - 2} L${x + 8} ${cy - 14} M${x} ${cy + 14} L${x + 7} ${cy + 2}" stroke="#e57aa0" stroke-width="1.5" opacity=".9" ${lp.t}/>`;
      });
      return s;
    },
    cilantro(r) {
      let s = '';
      for (let i = 0; i < 12; i++) {
        const x = 22 + r() * 76, y = 34 + r() * 66;
        s += `<path d="M${f1(x)} ${f1(y)} L${f1(x + (r() - .5) * 10)} 118" stroke="#7cb342" stroke-width="1.6"/>`;
        s += frill(x, y, 6.5 + r() * 2, r() > .5 ? '#5db75d' : '#6cc46c', false);
      }
      return s;
    },
    parsley(r) {
      let s = '';
      for (let i = 0; i < 13; i++) {
        const x = 22 + r() * 76, y = 34 + r() * 66;
        s += `<path d="M${f1(x)} ${f1(y)} L${f1(x + (r() - .5) * 10)} 118" stroke="#3d8b3d" stroke-width="1.6"/>`;
        s += frill(x, y, 7 + r() * 2.5, r() > .5 ? '#2e7d32' : '#388e3c', true);
      }
      return s;
    },
    lettuce(r) {
      let s = '';
      const cols = ['#b5e07a', '#9fd45f', '#cdeea0', '#a8d86c', '#c1e68f'];
      for (let i = 0; i < 6; i++) {
        const cx = 30 + r() * 60, cy = 48 + r() * 50, rx = 20 + r() * 8, ry = 16 + r() * 8;
        s += `<path d="${rufflePath(cx, cy, rx, ry, 14, 3.2, r)}" fill="${cols[i % cols.length]}" stroke="#8fce5a" stroke-width="1"/>`;
        s += `<path d="M${f1(cx)} ${f1(cy + ry)} L${f1(cx)} ${f1(cy - ry * .7)}" stroke="#e8f6d2" stroke-width="2"/>`;
      }
      return s;
    },
    rocket(r) {
      let s = '';
      for (let i = 0; i < 9; i++) {
        const x = 26 + r() * 68, y = 60 + r() * 20, rot = (r() - .5) * 40;
        const lp = leafPath(x, y, 6, 28, rot);
        s += `<path d="${lp.d}" ${lp.t} fill="#4a9c3a" stroke="#3a7d2c" stroke-width=".8"/>`;
        // אונות – "נשיכות" בצבע רקע השקית
        for (let k = -1; k <= 1; k++) s += `<g ${lp.t}><circle cx="${f1(x - 6)}" cy="${f1(y + k * 12)}" r="3.4" fill="#eef7ff"/><circle cx="${f1(x + 6)}" cy="${f1(y + k * 12 + 6)}" r="3.4" fill="#eef7ff"/></g>`;
        s += `<path d="M${f1(x)} ${f1(y + 26)} L${f1(x)} ${f1(y - 22)}" stroke="#a9d68b" stroke-width="1.4" ${lp.t}/>`;
      }
      return s;
    },
    spinach(r) {
      let s = '';
      for (let i = 0; i < 7; i++) {
        const x = 26 + r() * 68, y = 50 + r() * 44, rot = (r() - .5) * 50;
        s += `<path d="M${f1(x)} ${f1(y + 16)} L${f1(x + (r() - .5) * 8)} 118" stroke="#4c9a4c" stroke-width="2.2"/>`;
        s += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="13" ry="17" transform="rotate(${f1(rot)} ${f1(x)} ${f1(y)})" fill="#1f5e2a" stroke="#174720" stroke-width="1"/>`;
        s += `<ellipse cx="${f1(x - 4)}" cy="${f1(y - 5)}" rx="4" ry="7" transform="rotate(${f1(rot)} ${f1(x)} ${f1(y)})" fill="#fff" opacity=".22"/>`;
        s += `<path d="M${f1(x)} ${f1(y + 14)} L${f1(x)} ${f1(y - 12)}" stroke="#4c9a4c" stroke-width="1.4" transform="rotate(${f1(rot)} ${f1(x)} ${f1(y)})"/>`;
      }
      return s;
    },
    mint(r) {
      let s = '';
      for (let i = 0; i < 5; i++) {
        const x = 26 + i * 17 + r() * 6, top = 34 + r() * 14;
        s += `<path d="M${f1(x)} 118 L${f1(x)} ${f1(top)}" stroke="#3f9142" stroke-width="2"/>`;
        for (let k = 0; k < 4; k++) {
          const y = top + 8 + k * 17;
          s += `<ellipse cx="${f1(x - 7)}" cy="${f1(y)}" rx="7" ry="4.6" transform="rotate(-28 ${f1(x - 7)} ${f1(y)})" fill="#66bb6a" stroke="#2e7d32" stroke-width="1" stroke-dasharray="2 1.2"/>`;
          s += `<ellipse cx="${f1(x + 7)}" cy="${f1(y + 4)}" rx="7" ry="4.6" transform="rotate(28 ${f1(x + 7)} ${f1(y + 4)})" fill="#66bb6a" stroke="#2e7d32" stroke-width="1" stroke-dasharray="2 1.2"/>`;
        }
      }
      return s;
    },
    dill(r) {
      let s = '';
      for (let i = 0; i < 7; i++) {
        const x0 = 32 + i * 9 + r() * 4, x1 = x0 + (r() - .5) * 30, top = 30 + r() * 20;
        s += `<path d="M${f1(x0)} 118 L${f1(x1)} ${f1(top)}" stroke="#8bc34a" stroke-width="1.4"/>`;
        for (let k = 0; k < 6; k++) {
          const t = .25 + k * .13, px = x0 + (x1 - x0) * t, py = 118 + (top - 118) * t;
          s += `<path d="M${f1(px)} ${f1(py)} l-8 -7 m8 7 l8 -7 m-8 7 l-6 -10 m6 10 l6 -10" stroke="#9ccc65" stroke-width="1.2" fill="none" stroke-linecap="round"/>`;
        }
      }
      return s;
    },
    basil(r) {
      let s = '';
      for (let i = 0; i < 6; i++) {
        const x = 28 + r() * 64, y = 48 + r() * 46, rot = (r() - .5) * 60;
        s += `<path d="M${f1(x)} ${f1(y + 14)} L${f1(x + (r() - .5) * 6)} 118" stroke="#558b2f" stroke-width="2"/>`;
        const lp = leafPath(x, y, 14, 19, rot);
        s += `<path d="${lp.d}" ${lp.t} fill="#43a047" stroke="#2e7d32" stroke-width="1"/>`;
        s += `<ellipse cx="${f1(x - 4)}" cy="${f1(y - 6)}" rx="3.5" ry="7" ${lp.t} fill="#fff" opacity=".35"/>`;
        s += `<path d="M${f1(x)} ${f1(y + 16)} L${f1(x)} ${f1(y - 14)}" stroke="#a5d6a7" stroke-width="1.3" ${lp.t}/>`;
      }
      return s;
    },
    kale(r) {
      let s = '';
      const cols = ['#2e5e4e', '#3a6f5c', '#2a5245'];
      for (let i = 0; i < 5; i++) {
        const cx = 32 + r() * 56, cy = 50 + r() * 44, rx = 18 + r() * 6, ry = 20 + r() * 6;
        s += `<path d="M${f1(cx)} 118 L${f1(cx)} ${f1(cy)}" stroke="#a5c9b0" stroke-width="3"/>`;
        s += `<path d="${rufflePath(cx, cy, rx, ry, 22, 4.2, r)}" fill="${cols[i % 3]}" stroke="#1f463a" stroke-width="1"/>`;
        s += `<path d="M${f1(cx)} ${f1(cy + ry)} L${f1(cx)} ${f1(cy - ry * .7)}" stroke="#a5c9b0" stroke-width="2"/>`;
      }
      return s;
    },
    baby(r) {
      let s = '';
      const cols = ['#6b2d3a', '#8bc34a', '#2f6b2f', '#a5d66f', '#7b3f5e', '#4a9c3a'];
      for (let i = 0; i < 16; i++) {
        const x = 24 + r() * 72, y = 36 + r() * 72, rot = r() * 180;
        const lp = leafPath(x, y, 5.5, 9, rot);
        s += `<path d="${lp.d}" ${lp.t} fill="${cols[i % cols.length]}"/>`;
      }
      return s;
    },
    onion(r) {
      let s = '';
      for (let i = 0; i < 6; i++) {
        const x = 30 + i * 12 + r() * 3;
        s += `<rect x="${f1(x - 3.5)}" y="${f1(26 + r() * 10)}" width="7" height="72" rx="3.5" fill="#5aa832"/>`;
        s += `<rect x="${f1(x - 3.5)}" y="90" width="7" height="24" rx="3" fill="#f5f5f5" stroke="#dcdcdc" stroke-width=".8"/>`;
        s += `<path d="M${f1(x - 2)} 114 l-3 6 M${f1(x)} 114 l0 7 M${f1(x + 2)} 114 l3 6" stroke="#d7d7d7" stroke-width="1"/>`;
      }
      return s;
    },
    celery(r) {
      let s = '';
      for (let i = 0; i < 5; i++) {
        const x = 30 + i * 15 + r() * 3;
        s += `<rect x="${f1(x - 5)}" y="44" width="10" height="74" rx="4" fill="#b5d86f" stroke="#8fbf4a" stroke-width="1"/>`;
        s += `<path d="M${f1(x - 2)} 48 L${f1(x - 2)} 114 M${f1(x + 2)} 48 L${f1(x + 2)} 114" stroke="#d9ecb2" stroke-width="1.4"/>`;
        s += frill(x, 40 - r() * 8, 6, '#7cb342', false);
      }
      return s;
    },
    cabbage(r) {
      let s = '';
      const cols = ['#eef3d6', '#dce8b8', '#c8dd9a', '#f3f7e3'];
      for (let i = 0; i < 44; i++) {
        const x = 20 + r() * 80, y = 30 + r() * 82, rot = r() * 180, len = 10 + r() * 14;
        s += `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(len)}" height="3" rx="1.5" transform="rotate(${f1(rot)} ${f1(x)} ${f1(y)})" fill="${cols[i % cols.length]}" stroke="#b7c98a" stroke-width=".5"/>`;
      }
      for (let i = 0; i < 10; i++) {
        const x = 24 + r() * 72, y = 34 + r() * 74;
        s += `<rect x="${f1(x)}" y="${f1(y)}" width="7" height="2.6" rx="1.2" transform="rotate(${f1(r() * 180)} ${f1(x)} ${f1(y)})" fill="#f5a623"/>`;
      }
      return s;
    }
  };

  /* ---- המוצרים. הסדר קובע את סדר הכניסה לשלבים ---- */
  const PRODUCTS = [
    { id: 'chard', name: 'עלי סלק', leaves: 'chard', target: true, seed: 7 },
    { id: 'cilantro', name: 'כוסברה', leaves: 'cilantro', seed: 11, wrong: [
      'כוסברה? חצי מהמדינה שונאת אותה. האויב דווקא מת עליה.',
      'כוסברה לא מחסלת. היא רק מפלגת את העם.',
      'האויב: "כוסברה? יאמי, תודה!"' ] },
    { id: 'parsley', name: 'פטרוזיליה', leaves: 'parsley', seed: 13, wrong: [
      'פטרוזיליה זה לקישוט, לא לחיסול.',
      'האויב הזיז את הפטרוזיליה לצד הצלחת. כמו כולם.',
      'פטרוזיליה? בטוח שזה לא כוסברה? גם אנחנו לא בטוחים.' ] },
    { id: 'lettuce', name: 'חסה', leaves: 'lettuce', seed: 17, wrong: [
      'חסה? האויב עשה סלט ואמר "סחתיין".',
      'חסה: קרה, מרעננת, לא קטלנית.',
      'האויב אכל את החסה. הוא בריא יותר עכשיו. אוף.' ] },
    { id: 'rocket', name: 'רוקט', leaves: 'rocket', seed: 19, wrong: [
      'רוקט זה לא רקטה. כמעט. אבל לא.',
      'רוקט? מר קצת, אבל האויב עדיין פה.',
      'האויב שם את הרוקט על פיצה. חצוף.' ] },
    { id: 'spinach', name: 'תרד', leaves: 'spinach', seed: 23, wrong: [
      'תרד נותן כוח לפופאי. לא לכם.',
      'תרד? נראה כמו עלי סלק, אבל איפה האדום?!',
      'האויב מודה לכם על הברזל.' ] },
    { id: 'mint', name: 'נענע', leaves: 'mint', seed: 29, wrong: [
      'נענע – האויב קיבל תה ונרגע. הפוך ממה שרצינו.',
      'נענע? עכשיו יש לו נשימה רעננה. תודה רבה.',
      'נענע לא מחסלת. היא מרגיעה. מה עשיתם?' ] },
    { id: 'dill', name: 'שמיר', leaves: 'dill', seed: 31, wrong: [
      'שמיר? האויב מריח עכשיו כמו מלפפון חמוץ.',
      'שמיר זה לדג. האויב לא דג.',
      'שמיר – חמוד, ריחני, חסר תועלת מבצעית.' ] },
    { id: 'basil', name: 'בזיליקום', leaves: 'basil', seed: 37, wrong: [
      'בזיליקום? עשיתם לו פסטו. הוא מרוצה.',
      'בזיליקום זה איטלקי. האויב לא מבין איטלקית.',
      'האויב: "בזיליקום? מה אני, קפרזה?"' ] },
    { id: 'kale', name: 'קייל', leaves: 'kale', seed: 41, wrong: [
      'קייל זה לאינסטגרם, לא למלחמה.',
      'קייל? האויב עשה ממנו שייק ירוק. ומתפאר בזה.',
      'קייל – בריא, אופנתי, ולא מחסל כלום.' ] },
    { id: 'baby', name: 'עלי בייבי', leaves: 'baby', seed: 43, wrong: [
      'עלי בייבי? האויב אמר "כמה חמוד" והלך הביתה.',
      'עלי בייבי זה לסלט מעוצב. תתרכזו.',
      'בייבי? האויב לא מתרשם מדברים קטנים.' ] },
    { id: 'onion', name: 'בצל ירוק', leaves: 'onion', seed: 47, wrong: [
      'בצל ירוק – רק אתם בוכים עכשיו.',
      'בצל ירוק? האויב מכין שקשוקה. בלי הזמנה.',
      'בצל ירוק: ריח חזק, אפקט אפס.' ] },
    { id: 'celery', name: 'סלרי', leaves: 'celery', seed: 53, wrong: [
      'סלרי? האויב עושה קראנץ׳ ומחייך.',
      'סלרי זה למי שבדיאטה. האויב לא.',
      'סלרי – שלילי בקלוריות, שלילי בחיסול.' ] },
    { id: 'cabbage', name: 'סלט כרוב', leaves: 'cabbage', seed: 59, wrong: [
      'סלט כרוב זה לפלאפל, לא לאויב.',
      'כרוב? האויב ביקש גם חמוצים.',
      'סלט כרוב – בלי עלי סלק אין חיסול. כמה פעמים?' ] }
  ];
  const GENERIC_WRONG = [
    'רק עלי סלק מחסלים. כתוב על השקית.',
    'כמעט! אבל האויב עדיין צוחק.',
    'היד שלנו מחזיקה עלי סלק. לא את זה.',
    'האויב: "תודה על הירקות, יש לכם גם טחינה?"'
  ];

  /* ---- רינדור שקית ---- */
  function renderProduct(p, opts) {
    const o = Object.assign({ label: true, size: 'normal' }, opts || {});
    const u = uid(), r = rng(p.seed * 1000 + 17);
    const inner = LEAVES[p.leaves](r);
    const name = o.label ? `<text x="60" y="147" text-anchor="middle" font-family="Rubik, Arial, sans-serif" font-weight="700" font-size="12.5" fill="#fff">${p.name}</text>` :
      `<text x="60" y="147" text-anchor="middle" font-family="Rubik, Arial, sans-serif" font-weight="700" font-size="11" fill="#dff3c8">???</text>`;
    return `<svg class="bagsvg" viewBox="0 0 120 170" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="film${u}" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#fff" stop-opacity=".62"/><stop offset=".3" stop-color="#fff" stop-opacity=".04"/>
          <stop offset=".62" stop-color="#fff" stop-opacity=".14"/><stop offset="1" stop-color="#fff" stop-opacity=".5"/>
        </linearGradient>
        <clipPath id="clip${u}"><path d="M14 22 L106 22 L110 160 L10 160 Z"/></clipPath>
      </defs>
      <path d="M14 22 L106 22 L110 160 L10 160 Z" fill="#eef7ff"/>
      <g clip-path="url(#clip${u})">${inner}</g>
      <path d="M14 22 L106 22 L110 160 L10 160 Z" fill="url(#film${u})"/>
      <path d="M10 8 L110 8 L110 24 L10 24 Z" fill="#dfe9f3"/>
      <path d="M10 24 L110 24" stroke="#b9c9d8" stroke-width="1" stroke-dasharray="3 3"/>
      <ellipse cx="60" cy="16" rx="8" ry="3" fill="#c6d4e1"/>
      <rect x="17" y="112" width="86" height="42" rx="9" fill="#6FB23C"/>
      <text x="60" y="131" text-anchor="middle" font-family="Rubik, Arial, sans-serif" font-weight="900" font-size="18" fill="#161616" stroke="#fff" stroke-width="1" paint-order="stroke">חסלט</text>
      ${name}
      <path d="M14 22 L106 22 L110 160 L10 160 Z" fill="none" stroke="#bcd0e2" stroke-width="2"/>
    </svg>`;
  }

  // שקית הפתיון במצב חיסול (לא לפגוע בה!)
  function renderDecoy() {
    return `<svg class="char decoy" viewBox="0 0 200 250" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g transform="translate(24 40) scale(1.27)">${renderProduct(PRODUCTS[0], { label: true }).replace(/<svg[^>]*>|<\/svg>/g, '')}</g>
      <g class="h"><path d="M60 120 L140 200 M140 120 L60 200" stroke="#d6483b" stroke-width="12" stroke-linecap="round" opacity=".9"/></g>
    </svg>`;
  }

  // ראשי חסה בקדמת הבור (מצב חיסול)
  function renderHoleFront(seed) {
    const r = rng(seed * 77 + 3);
    let s = '';
    const cols = ['#a8d86c', '#b5e07a', '#9fd45f'];
    [[30, 34, 26, 18], [100, 30, 30, 20], [170, 34, 26, 18], [65, 40, 24, 15], [135, 40, 24, 15]].forEach((c, i) => {
      s += `<path d="${rufflePath(c[0], c[1], c[2], c[3], 14, 3, r)}" fill="${cols[i % 3]}" stroke="#7fbf4a" stroke-width="1.2"/>`;
      s += `<path d="M${c[0]} ${c[1] + c[3]} L${c[0]} ${c[1] - c[3] * .5}" stroke="#e8f6d2" stroke-width="2.2"/>`;
    });
    return `<svg viewBox="0 0 200 60" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${s}</svg>`;
  }

  function wrongLine(p) {
    const pool = (p.wrong || []).concat(Math.random() < .3 ? GENERIC_WRONG : []);
    return pool[Math.floor(Math.random() * pool.length)];
  }

  window.Products = { PRODUCTS, renderProduct, renderDecoy, renderHoleFront, wrongLine };
})();
