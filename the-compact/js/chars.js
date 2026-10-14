// Original cute chibi characters + company mascots, generated as inline SVG (no real people depicted).
const OUT = '#1a1426';
const eyes = (o = {}) => {
  const c = o.eye || OUT, dx = o.wide || 13, y = o.ey || 54;
  if (o.shape === 'star') return [-1, 1].map((s) => `<path class="eye" d="M${50 + s * dx} ${y - 7}l2 4.6 5 .5-3.8 3.2 1.2 4.9-4.4-2.6-4.4 2.6 1.2-4.9-3.8-3.2 5-.5z" fill="#fff6c8"/>`).join('');
  if (o.shape === 'happy') return [-1, 1].map((s) => `<path d="M${50 + s * dx - 5} ${y + 2}q5-8 10 0" stroke="${c}" stroke-width="3" fill="none" stroke-linecap="round"/>`).join('');
  return [-1, 1].map((s) => `<g class="eye"><ellipse cx="${50 + s * dx}" cy="${y}" rx="4.6" ry="5.8" fill="${c}"/><circle cx="${50 + s * dx + 1.6}" cy="${y - 2}" r="1.8" fill="#fff"/><circle cx="${50 + s * dx - 1.4}" cy="${y + 2}" r=".9" fill="#fff"/></g>`).join('');
};
const mouth = (m = 'smile') => ({
  smile: '<path d="M43 67q7 7 14 0" stroke="#7a3a3a" stroke-width="2.6" fill="none" stroke-linecap="round"/>',
  smirk: '<path d="M44 68q8 3 13-3" stroke="#7a3a3a" stroke-width="2.6" fill="none" stroke-linecap="round"/>',
  open: '<path d="M43 66q7 10 14 0z" fill="#8a3040"/><path d="M46 70q4 3 8 0" fill="#ff8aa0"/>',
  flat: '<path d="M45 68h10" stroke="#7a3a3a" stroke-width="2.6" stroke-linecap="round"/>',
}[m]);
const blush = '<ellipse cx="33" cy="63" rx="5.5" ry="3.4" fill="#ff7b9c" opacity=".38"/><ellipse cx="67" cy="63" rx="5.5" ry="3.4" fill="#ff7b9c" opacity=".38"/>';
const HAIR = {
  side: (c) => `<path d="M20 52C16 24 40 14 62 18c14 3 20 16 18 34-4-12-12-17-26-17-14 0-26 5-34 17z" fill="${c}"/><path d="M26 40q14-16 38-12" stroke="#ffffff22" stroke-width="3" fill="none"/>`,
  bun: (c) => `<circle cx="50" cy="12" r="10" fill="${c}"/><path d="M19 56C14 24 36 16 50 16s37 8 31 40c-4-14-12-24-31-24S23 42 19 56z" fill="${c}"/>`,
  slick: (c) => `<path d="M19 54C16 22 42 14 56 17c18 3 27 17 25 37-3-14-9-20-17-22-13 4-30 3-45 22z" fill="${c}"/>`,
  spiky: (c) => `<path d="M18 52l-4-18 12 6 2-16 12 12 8-18 8 18 12-12 2 16 12-6-4 18c-6-12-14-16-30-16S24 40 18 52z" fill="${c}"/>`,
  bob: (c) => `<path d="M17 74C10 30 28 14 50 14s40 16 33 60c-3-8-5-18-6-28-8 4-18 4-27-6-8 10-18 14-27 14-1 8-3 18-6 20z" fill="${c}"/>`,
  short: (c) => `<path d="M19 54C15 24 38 12 52 15s31 12 28 39c-5-15-12-22-30-22S25 40 19 54z" fill="${c}"/><circle cx="26" cy="38" r="8" fill="${c}"/><circle cx="74" cy="38" r="8" fill="${c}"/>`,
  bald: (c) => `<path d="M20 50C22 40 28 34 36 31M80 50c-2-10-8-16-16-19" stroke="${c}" stroke-width="7" fill="none" stroke-linecap="round"/>`,
};
const ACC = {
  glasses: '<g fill="none" stroke="#2a2a3a" stroke-width="2.4"><circle cx="37" cy="54" r="8.5"/><circle cx="63" cy="54" r="8.5"/><path d="M45.5 54h9"/></g>',
  monocle: '<g fill="none" stroke="#d9b24c" stroke-width="2.4"><circle cx="63" cy="54" r="9"/><path d="M70 60q6 14 2 24"/></g>',
  headband: '<path d="M19 36q31-14 62 0v7q-31-13-62 0z" fill="#58d68d"/><rect x="45" y="29" width="10" height="9" rx="2" fill="#1d6b43"/><path d="M48 31v5M52 31v5" stroke="#9dffc4" stroke-width="1.4"/>',
  goggles: '<path d="M18 36q32-12 64 0v9q-32-12-64 0z" fill="#3a4a5a"/><circle cx="36" cy="38" r="7" fill="#7fe7ff" stroke="#fff" stroke-width="2"/><circle cx="64" cy="38" r="7" fill="#7fe7ff" stroke="#fff" stroke-width="2"/>',
  pin: '<circle cx="66" cy="88" r="4.5" fill="#ffd84d" stroke="#a37a00" stroke-width="1.2"/>',
  beard: '<path d="M26 64q4 28 24 28t24-28q-8 12-24 12T26 64z" fill="#f4f1ea"/><path d="M40 72q10 6 20 0" stroke="#d8d2c4" stroke-width="2" fill="none"/>',
  sun: '<g fill="#10131c"><rect x="22" y="48" width="23" height="13" rx="5"/><rect x="55" y="48" width="23" height="13" rx="5"/><rect x="44" y="51" width="12" height="3"/></g><path d="M26 51l6-1" stroke="#fff6" stroke-width="2"/>',
};
function person(o) {
  const skin = o.skin, hair = o.hair, out = o.outfit;
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" class="chsvg">
<path d="M12 100q2-24 22-26h32q20 2 22 26z" fill="${out}"/>${o.tie ? `<path d="M46 76l4 4 4-4 3 22H43z" fill="${o.tie}"/>` : ''}<path d="M38 74l12 12 12-12" fill="#fff" opacity="${o.lab ? 1 : 0.9}"/>
<rect x="43" y="70" width="14" height="10" rx="4" fill="${skin}"/>
${o.hairBack ? HAIR[o.hairBack](hair) : ''}
<circle cx="19.5" cy="56" r="6" fill="${skin}"/><circle cx="80.5" cy="56" r="6" fill="${skin}"/>
<ellipse cx="50" cy="54" rx="31" ry="29" fill="${skin}"/>
${o.beard ? ACC.beard : ''}
${HAIR[o.style](hair)}
${blush}${o.sun ? '' : eyes(o)}${mouth(o.mouth)}
${o.acc ? ACC[o.acc] : ''}${o.extra || ''}
</svg>`;
}
function orb(o) {
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" class="chsvg"><defs><radialGradient id="o${o.id}" cx="35%" cy="28%"><stop offset="0" stop-color="#fff"/><stop offset=".28" stop-color="${o.c1}"/><stop offset="1" stop-color="${o.c2}"/></radialGradient></defs>
${o.ears ? `<path d="M22 36l-4-22 20 12zM78 36l4-22-20 12z" fill="${o.c2}"/>` : `<path d="M50 20V8" stroke="${o.c2}" stroke-width="3"/><path d="M50 -1l3 6 6 1-4.5 4 1.5 6-6-3.5-6 3.5 1.5-6-4.5-4 6-1z" fill="#fff3a0"/>`}
<circle cx="50" cy="58" r="36" fill="url(#o${o.id})"/><ellipse cx="50" cy="58" rx="27" ry="23" fill="#0c1424" opacity=".9"/>
${eyes({ eye: o.eye, shape: o.shape, wide: 12, ey: 56 })}${mouth('smile').replace('#7a3a3a', o.eye)}
${o.leaf ? '<path d="M70 24q18-4 22 12-16 2-22-12z" fill="#7be08a"/><path d="M72 28q10 2 16 8" stroke="#2c8a45" fill="none" stroke-width="1.6"/>' : ''}${o.rings ? '<circle cx="38" cy="56" r="10" fill="none" stroke="#bfe3ff" stroke-width="2"/><circle cx="62" cy="56" r="10" fill="none" stroke="#bfe3ff" stroke-width="2"/>' : ''}
</svg>`;
}
const EARS = {
  cat: (c) => `<path d="M20 40L16 12l24 14zM80 40l4-28-24 14z" fill="${c}"/><path d="M22 34l-1-12 11 7zM78 34l1-12-11 7z" fill="#ffb3c6"/>`,
  bear: (c) => `<circle cx="24" cy="26" r="11" fill="${c}"/><circle cx="76" cy="26" r="11" fill="${c}"/><circle cx="24" cy="26" r="5.5" fill="#ffffff55"/><circle cx="76" cy="26" r="5.5" fill="#ffffff55"/>`,
  bunny: (c) => `<ellipse cx="34" cy="14" rx="7" ry="19" fill="${c}"/><ellipse cx="66" cy="14" rx="7" ry="19" fill="${c}"/><ellipse cx="34" cy="14" rx="3.5" ry="13" fill="#ffb3c6"/><ellipse cx="66" cy="14" rx="3.5" ry="13" fill="#ffb3c6"/>`,
  dog: (c) => `<path d="M18 30q-10 10-6 34 14-4 14-26zM82 30q10 10 6 34-14-4-14-26z" fill="${c}" opacity=".85"/>`,
};
function mascot(id, o) {
  const c = o.color;
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" class="chsvg">${EARS[o.ears](o.dark || c)}
<path d="M16 100q2-22 22-24h24q20 2 22 24z" fill="${c}"/><circle cx="50" cy="86" r="9" fill="#fff" opacity=".9"/><text x="50" y="90" text-anchor="middle" font-size="9.5" font-weight="800" fill="${c}" font-family="Inter,sans-serif">${id}</text>
<ellipse cx="50" cy="54" rx="33" ry="28" fill="${c}"/><ellipse cx="50" cy="60" rx="22" ry="17" fill="#fff" opacity=".88"/>
${eyes({ wide: 14, ey: 50, shape: o.shape })}<ellipse cx="50" cy="58" rx="3.6" ry="2.6" fill="#2a1a2e"/><path d="M50 61v3M44 66q6 5 12 0" stroke="#2a1a2e" stroke-width="2.2" fill="none" stroke-linecap="round"/>
<ellipse cx="30" cy="60" rx="5" ry="3.2" fill="#ff7b9c" opacity=".45"/><ellipse cx="70" cy="60" rx="5" ry="3.2" fill="#ff7b9c" opacity=".45"/>${o.hat || ''}
</svg>`;
}
export const SPEC = {
  hero: () => person({ skin: '#f7d8bd', hair: '#1c2233', style: 'side', outfit: '#2c3b6b', tie: '#d94b5c', mouth: 'smirk', extra: '<path d="M70 36l3-5 3 5 5 1-4 3 1 5-5-3-5 3 1-5-4-3z" fill="#fff" opacity=".0"/>' }),
  mira: () => person({ skin: '#e6b08a', hair: '#2b1b30', hairBack: 'bob', style: 'bun', outfit: '#c9689b', acc: 'glasses', mouth: 'smile' }),
  victor: () => person({ skin: '#f2d2b4', hair: '#a7b0c0', style: 'slick', outfit: '#2c313f', tie: '#7aa8ff', acc: 'monocle', mouth: 'smirk' }),
  jonah: () => person({ skin: '#d7a077', hair: '#3a2716', style: 'spiky', outfit: '#2f8f5b', acc: 'headband', mouth: 'open', shape: 'star' }),
  lin: () => person({ skin: '#f4d9c2', hair: '#14141c', hairBack: 'bob', style: 'bob', outfit: '#e6edf5', acc: 'goggles', mouth: 'smile', lab: true }),
  dana: () => person({ skin: '#b27a58', hair: '#1f1a1a', style: 'short', outfit: '#a63b46', acc: 'pin', mouth: 'flat', tie: null }),
  elias: () => person({ skin: '#f1d5bb', hair: '#f1efe9', style: 'bald', outfit: '#5b4b3a', acc: 'glasses', beard: true, mouth: 'smile' }),
  aria: () => orb({ id: 'a', c1: '#ffb259', c2: '#d9531e', eye: '#ffe9a6', shape: 'star' }),
  sage: () => orb({ id: 's', c1: '#8fc1ff', c2: '#2a5fb0', eye: '#d9efff', ears: true, leaf: true, rings: true }),
  NV: () => mascot('NV', { color: '#76b900', ears: 'cat', dark: '#4e7d00', hat: '<rect x="30" y="42" width="40" height="9" rx="4.5" fill="#0d1a05" opacity=".85"/><rect x="33" y="44" width="34" height="3" rx="1.5" fill="#9dff3a"/>' }),
  AP: () => mascot('AP', { color: '#9aa3b0', ears: 'bunny', hat: '<path d="M54 22q10-12 18-6-4 10-18 6z" fill="#6bd16b"/>' }),
  GO: () => mascot('GO', { color: '#f2b705', ears: 'bear', hat: '<path d="M26 34q24-22 48 0z" fill="#4285f4"/><circle cx="36" cy="30" r="3" fill="#ea4335"/><circle cx="50" cy="26" r="3" fill="#34a853"/><circle cx="64" cy="30" r="3" fill="#fff"/>' }),
  MS: () => mascot('MS', { color: '#1b95d4', ears: 'dog', hat: '<g transform="translate(40 26)"><rect width="9" height="9" fill="#f25022"/><rect x="10" width="9" height="9" fill="#7fba00"/><rect y="10" width="9" height="9" fill="#00a4ef"/><rect x="10" y="10" width="9" height="9" fill="#ffb900"/></g>' }),
  AM: () => mascot('AM', { color: '#f08a00', ears: 'cat', dark: '#b36200', hat: '<path d="M32 44q18 6 36 0" stroke="#2a1a2e" stroke-width="0" fill="none"/>' }),
  TS: () => mascot('TS', { color: '#8a47c0', ears: 'bear', hat: '<rect x="42" y="24" width="16" height="12" rx="2" fill="#2a1a40"/><path d="M45 27h10M45 30h10M45 33h10" stroke="#d9a8ff" stroke-width="1.4"/>' }),
  ME: () => mascot('ME', { color: '#2f6bff', ears: 'bunny', hat: '<path d="M32 50q9-9 18 0 9 9 18 0" stroke="#fff" stroke-width="3.4" fill="none"/>' }),
  BC: () => mascot('BC', { color: '#d23a36', ears: 'dog', hat: '' }),
  BK: () => mascot('BK', { color: '#8a2735', ears: 'bear', hat: '<rect x="34" y="14" width="32" height="18" rx="3" fill="#15101a"/><rect x="26" y="30" width="48" height="6" rx="3" fill="#15101a"/><rect x="34" y="26" width="32" height="4" fill="#d9b24c"/>' }),
  AN: () => mascot('AN', { color: '#d4693f', ears: 'cat', dark: '#9b4426', shape: 'happy', hat: '<path d="M70 28l2 5 5 1-4 3 1 5-4-3-4 3 1-5-4-3 5-1z" fill="#ffe08a"/>' }),
  OA: () => mascot('OA', { color: '#17a37a', ears: 'bunny', hat: '<path d="M50 24a6 6 0 1 1 6 6" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round"/>' }),
};
const cache = {};
export const art = (id) => cache[id] || (cache[id] = (SPEC[id] || SPEC.hero)());
// supporting cast (cameos) — original characters
export const CAMEO = {
  anchor: { kr: '앵커 마이크', role: '경제 속보', spec: () => person({ skin: '#efc6a2', hair: '#2a2a33', style: 'slick', outfit: '#3a4a6a', tie: '#ffd24a', mouth: 'open' }), c: '#ffd24a' },
  intern: { kr: '인턴 토리', role: '비서실 막내', spec: () => person({ skin: '#f8dcc4', hair: '#7a3a2a', style: 'short', outfit: '#6a7aa8', mouth: 'open', shape: 'star' }), c: '#ff9a8a' },
  chef: { kr: '셰프 오마하', role: '버크셔 구내식당', spec: () => person({ skin: '#e6b890', hair: '#fff', style: 'short', outfit: '#f2f2f2', mouth: 'smile' }), c: '#ffffff' },
  quant: { kr: '퀀트 소피', role: '개인 펀드 분석', spec: () => person({ skin: '#f1d2b6', hair: '#4a2a6a', hairBack: 'bob', style: 'bob', outfit: '#3a2a5a', acc: 'glasses', mouth: 'smirk' }), c: '#c79bff' },
  guard: { kr: '경호원 곰돌', role: '경호팀장', spec: () => person({ skin: '#c99870', hair: '#111', style: 'short', outfit: '#15171c', acc: 'sun', sun: true, mouth: 'flat' }), c: '#8c98ad' },
};
cache.__ = 0;
for (const [k, v] of Object.entries(CAMEO)) SPEC['cm_' + k] = v.spec;
