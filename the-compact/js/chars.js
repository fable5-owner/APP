// Original chibi cast v2 — shaded, outlined, expressive (no real people depicted).
// art(id, emo) → inline SVG string. emo: neutral | happy | angry | worried | smug | shock
const INK = '#23182b';
let UID = 0;

// ---------- face parts ----------
function brows(emo, hair, y = 45) {
  const L = { neutral: 'M31 43q6-3 12-1', happy: 'M31 41q6-5 12-2', angry: 'M31 39l12 5', worried: 'M31 44l12-5', smug: 'M31 42q6-2 12 0', shock: 'M31 38q6-5 12-2' }[emo];
  const R = { neutral: 'M57 42q6-2 12 1', happy: 'M57 39q6-3 12 2', angry: 'M57 44l12-5', worried: 'M57 39l12 5', smug: 'M57 38q6-5 12-1', shock: 'M57 36q6-3 12 2' }[emo];
  const t = `translate(0 ${y - 43})`;
  return `<g transform="${t}" stroke="${hair}" stroke-width="2.6" stroke-linecap="round" fill="none"><path d="${L}"/><path d="${R}"/></g>`;
}
function eyes(emo, iris, y = 57, o = {}) {
  if (emo === 'happy') return `<g stroke="${INK}" stroke-width="2.8" fill="none" stroke-linecap="round"><path d="M30 ${y + 2}q6-9 12 0"/><path d="M58 ${y + 2}q6-9 12 0"/></g>`;
  const ry = emo === 'angry' ? 5.6 : emo === 'shock' ? 8.6 : 7.8, rx = emo === 'shock' ? 5.4 : 6.4;
  const one = (cx, side) => `<g class="eye"><ellipse cx="${cx}" cy="${y}" rx="${rx + .7}" ry="${ry + .7}" fill="#fff"/><ellipse cx="${cx}" cy="${y + .8}" rx="${rx}" ry="${ry}" fill="url(#ir__U__)"/><ellipse cx="${cx}" cy="${y + 1.4}" rx="${rx * .52}" ry="${ry * .58}" fill="${INK}"/><ellipse cx="${cx}" cy="${y + ry * .55}" rx="${rx * .7}" ry="${ry * .28}" fill="#fff" opacity=".28"/><circle cx="${cx + 2.2}" cy="${y - 2.6}" r="2.5" fill="#fff"/><circle cx="${cx - 2}" cy="${y + 3}" r="1.2" fill="#fff"/><path d="M${cx - rx - 2} ${y - ry * .5}q${rx + 2}-${ry * 1.05} ${(rx + 2) * 2} 0" stroke="${INK}" stroke-width="2.6" fill="none" stroke-linecap="round"/>${o.fem ? `<path d="M${cx + side * (rx + 1.6)} ${y - ry * .55}l${side * 3.4}-2.6" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>` : ''}${emo === 'angry' ? `<path d="M${cx - rx - 1} ${y - ry - 1}h${rx * 2 + 2}v${ry * .7}h-${rx * 2 + 2}z" fill="url(#sk__U__)"/>` : ''}</g>`;
  return `<defs><radialGradient id="ir__U__" cx="50%" cy="30%" r="75%"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset=".25" stop-color="${iris}"/><stop offset=".8" stop-color="${iris}"/><stop offset="1" stop-color="${INK}"/></radialGradient></defs>${one(36, -1)}${one(64, 1)}`;
}
function mouth(emo) {
  return {
    neutral: '<path d="M45.5 70q2.2 3 4.5 0q2.3 3 4.5 0" stroke="#7a2f3a" stroke-width="2" fill="none" stroke-linecap="round"/>',
    happy: '<path d="M42 65.5q8 1.4 16 0q-1 9-8 9t-8-9z" fill="#8a2a3c" stroke="#5a1a28" stroke-width="1.2"/><path d="M43.6 66.4q6.4 1 12.8 0v1.6q-6.4 1-12.8 0z" fill="#fff"/><path d="M46 72q4 2.4 8 0q-1 2.4-4 2.4t-4-2.4z" fill="#ff8aa0"/>',
    angry: '<path d="M43 71q3-4 7-2t7 2" stroke="#7a2f3a" stroke-width="2.4" fill="none" stroke-linecap="round"/>',
    worried: '<path d="M44 70q2-2.4 4 0t4 0 4 0" stroke="#7a2f3a" stroke-width="2" fill="none" stroke-linecap="round"/>',
    smug: '<path d="M44.5 70q7 3 12-3" stroke="#7a2f3a" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M56 65.2l1.6 1" stroke="#7a2f3a" stroke-width="1.6" stroke-linecap="round"/>',
    shock: '<ellipse cx="50" cy="70" rx="3.6" ry="4.4" fill="#5a1a28"/><ellipse cx="50" cy="71.6" rx="2.2" ry="1.8" fill="#ff8aa0"/>',
  }[emo];
}
function fxMark(emo) {
  if (emo === 'worried') return '<path d="M79 36q4 6 0 9-4-3 0-9z" fill="#9fd8ff" stroke="#3a7ab8" stroke-width="1"/>';
  if (emo === 'angry') return '<g stroke="#ff4d6d" stroke-width="2.2" stroke-linecap="round" transform="translate(76 26)"><path d="M0 3q3 0 3-3M6 0q0 3 3 3M9 6q-3 0-3 3M3 9q0-3-3-3"/></g>';
  if (emo === 'happy') return '<g fill="#fff6b0" opacity=".95"><path d="M82 30l1.4 3 3 .4-2.2 2 .6 3-2.8-1.6-2.8 1.6.6-3-2.2-2 3-.4z"/><circle cx="18" cy="36" r="1.4"/></g>';
  if (emo === 'shock') return '<g stroke="#ffd24a" stroke-width="2" stroke-linecap="round"><path d="M16 30l-5-4M14 38h-6M84 30l5-4M86 38h6"/></g>';
  return '';
}

// ---------- hair ----------
const HAIR = {
  side: 'M19 53C15 24 38 13 60 16c16 3 23 17 21 37-3-11-8-16-14-18-6 6-24 8-34 2-2 5-3 10-4 16z',
  bun: 'M19 56C14 25 35 15 50 15s37 9 31 41c-3-12-10-21-21-23-4 3-12 4-20 1-8 4-15 10-21 22z',
  slick: 'M19 54C16 22 42 13 57 16c18 3 26 18 24 38-2-13-8-19-15-21-14 5-31 3-47 21z',
  spiky: 'M18 53l-5-18 12 5 1-16 13 11 8-18 8 18 13-11 1 16 12-5-5 18c-5-11-13-16-29-16S23 42 18 53z',
  bob: 'M18 58C12 26 30 13 50 13s39 13 32 45c-2-12-6-19-12-23-10 5-25 6-38 0-6 4-11 12-14 23z',
  short: 'M19 54C15 24 37 12 52 14s31 12 28 40c-4-14-11-21-29-21S25 40 19 54z',
  bald: '',
  wave: 'M17 60C10 22 34 12 52 13c20 1 34 16 30 47-2-9-4-14-7-17 1-6-2-10-6-12-8 7-26 9-38 3-5 5-11 14-14 26z',
};
const BACK = {
  bob: 'M17 58c-4 10-3 20 2 26 5-2 8-6 9-12M83 58c4 10 3 20-2 26-5-2-8-6-9-12',
  bun: 'M40 15a10 10 0 1 1 20 0a10 10 0 1 1-20 0z',
  wave: 'M16 58c-6 14-2 30 8 36 3-6 4-14 2-22M84 58c6 14 2 30-8 36-3-6-4-14-2-22',
};

// ---------- accessories ----------
const ACC = {
  glasses: `<g fill="rgba(220,240,255,.10)" stroke="#4a3a5a" stroke-width="1.8"><rect x="25" y="47" width="23" height="20" rx="8"/><rect x="52" y="47" width="23" height="20" rx="8"/><path d="M48 55h4" fill="none"/></g><path d="M31 50l5-2M57 50l5-2" stroke="#fff" stroke-width="1.4" opacity=".7"/>`,
  roundglasses: `<g fill="rgba(255,240,200,.15)" stroke="#8a6a2a" stroke-width="2"><circle cx="36" cy="57" r="11"/><circle cx="64" cy="57" r="11"/><path d="M47 57h6" fill="none"/></g>`,
  monocle: '<g fill="rgba(255,240,200,.15)" stroke="#d9b24c" stroke-width="2.4"><circle cx="63" cy="54" r="9.4"/><path d="M71 60q6 14 1 26" fill="none"/></g><path d="M58 49l4-2" stroke="#fff" stroke-width="1.4"/>',
  headband: `<path d="M18 37q32-15 64 0v7q-32-14-64 0z" fill="#3ec27a" stroke="${INK}" stroke-width="1.4"/><rect x="44" y="29" width="12" height="10" rx="2" fill="#163b28" stroke="#9dffc4" stroke-width="1"/><path d="M47 32v4M50 32v4M53 32v4" stroke="#9dffc4" stroke-width="1.1"/>`,
  goggles: `<path d="M17 37q33-13 66 0v9q-33-12-66 0z" fill="#33424f" stroke="${INK}" stroke-width="1.4"/><circle cx="36" cy="39" r="7.4" fill="#7fe7ff" stroke="#e8f6ff" stroke-width="2.2"/><circle cx="64" cy="39" r="7.4" fill="#7fe7ff" stroke="#e8f6ff" stroke-width="2.2"/><path d="M32 36l3-2M60 36l3-2" stroke="#fff" stroke-width="1.6"/>`,
  pin: '<circle cx="67" cy="88" r="4.4" fill="#ffd84d" stroke="#a37a00" stroke-width="1.2"/><path d="M65 88h4M67 86v4" stroke="#a37a00" stroke-width="1"/>',
  beard: `<path d="M24 62q3 32 26 32t26-32q-9 13-26 13T24 62z" fill="#f4f1ea" stroke="#cfc8b8" stroke-width="1.2"/><path d="M38 74q12 6 24 0" stroke="#d8d2c4" stroke-width="2" fill="none"/><path d="M40 68q10-4 20 0" stroke="#e0dbcf" stroke-width="4" fill="none" stroke-linecap="round"/>`,
  sun: `<g fill="#0e1118" stroke="${INK}" stroke-width="1.2"><rect x="24" y="47" width="22" height="13" rx="5"/><rect x="54" y="47" width="22" height="13" rx="5"/><rect x="45" y="50" width="10" height="3"/></g><path d="M27 50l7-1.4M57 50l7-1.4" stroke="#fff" stroke-width="1.6" opacity=".7"/>`,
  earring: '<circle cx="19" cy="64" r="2.2" fill="#ffd84d"/><circle cx="81" cy="64" r="2.2" fill="#ffd84d"/>',
  headset: `<path d="M17 52q0-34 33-34t33 34" fill="none" stroke="#2a2f3a" stroke-width="3"/><rect x="12" y="50" width="8" height="12" rx="3" fill="#2a2f3a"/><path d="M16 62q2 10 14 10" stroke="#2a2f3a" stroke-width="2" fill="none"/><circle cx="31" cy="72" r="2" fill="#ff5a6a"/>`,
  chefhat: `<path d="M28 30q-8-12 4-16 4-10 18-6 14-4 18 6 12 4 4 16z" fill="#fff" stroke="#cfd6e0" stroke-width="1.4"/><rect x="29" y="26" width="42" height="9" rx="3" fill="#f2f4f8" stroke="#cfd6e0" stroke-width="1.2"/>`,
};

// ---------- body / outfits ----------
function body(o) {
  const out = o.outfit, sh = o.outfit2 || shade(out, -0.28);
  let d = `<path d="M16 101q1-18 20-21h28q19 3 20 21z" fill="url(#ou__U__)" stroke="${INK}" stroke-width="1.6"/>`;
  if (o.kind === 'suit' || o.kind === 'blazer') d += `<path d="M38 75l12 15 12-15" fill="${o.shirt || '#f4f6fa'}" stroke="${INK}" stroke-width="1.2"/><path d="M32 76l14 24M68 76l-14 24" stroke="${sh}" stroke-width="3" fill="none"/>${o.tie ? `<path d="M47.5 79h5l-1 3 2.6 16-4.1 3-4.1-3 2.6-16z" fill="${o.tie}" stroke="${INK}" stroke-width="1"/>` : ''}`;
  if (o.kind === 'hoodie') d += `<path d="M30 77q20 14 40 0" stroke="${sh}" stroke-width="4" fill="none"/><path d="M44 83v10M56 83v10" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>`;
  if (o.kind === 'lab') d += `<path d="M38 75l12 12 12-12" fill="#7aa8ff" stroke="${INK}" stroke-width="1.2"/><path d="M38 75l-4 26M62 75l4 26" stroke="#c9d3e0" stroke-width="2"/><rect x="62" y="88" width="9" height="6" rx="1" fill="#cfe3ff" stroke="#8aa0c0" stroke-width=".8"/>`;
  if (o.kind === 'cardigan') d += `<path d="M40 75l10 10 10-10" fill="#efe6d4" stroke="${INK}" stroke-width="1.2"/><path d="M50 86v15" stroke="${sh}" stroke-width="2"/><circle cx="50" cy="90" r="1.3" fill="#d9c9a0"/><circle cx="50" cy="96" r="1.3" fill="#d9c9a0"/>`;
  if (o.kind === 'chef') d += `<path d="M38 75l12 8 12-8" fill="#fff" stroke="${INK}" stroke-width="1.2"/><circle cx="44" cy="90" r="1.6" fill="#c9ced8"/><circle cx="56" cy="90" r="1.6" fill="#c9ced8"/><path d="M40 77l-8 6M60 77l8 6" stroke="#e44" stroke-width="3"/>`;
  return d;
}
function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16), f = (c) => Math.max(0, Math.min(255, Math.round(c + (k < 0 ? c * k : (255 - c) * k))));
  return '#' + [n >> 16 & 255, n >> 8 & 255, n & 255].map(f).map((v) => v.toString(16).padStart(2, '0')).join('');
}

function person(o, emo) {
  const skin = o.skin, hair = o.hair;
  const defs = `<defs><radialGradient id="sk__U__" cx="40%" cy="35%" r="75%"><stop offset="0" stop-color="${shade(skin, .22)}"/><stop offset=".7" stop-color="${skin}"/><stop offset="1" stop-color="${shade(skin, -.14)}"/></radialGradient>
<linearGradient id="hr__U__" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(hair, .25)}"/><stop offset="1" stop-color="${shade(hair, -.25)}"/></linearGradient>
<linearGradient id="ou__U__" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${shade(o.outfit, .18)}"/><stop offset="1" stop-color="${shade(o.outfit, -.22)}"/></linearGradient></defs>`;
  const hairPath = HAIR[o.style];
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" class="chsvg">${defs}
${o.style === 'bun' ? `<path d="${BACK.bun}" fill="url(#hr__U__)" stroke="${INK}" stroke-width="1.6"/>` : ''}${BACK[o.back] ? `<path d="${BACK[o.back]}" fill="url(#hr__U__)" stroke="${INK}" stroke-width="1.6"/>` : ''}
${body(o)}
<path d="M43 70h14v10q-7 4-14 0z" fill="${shade(skin, -.12)}"/>
<g transform="translate(50 64) scale(1.16) translate(-50 -64)">
<circle cx="19.5" cy="56" r="6.2" fill="url(#sk__U__)" stroke="${INK}" stroke-width="1.5"/><circle cx="80.5" cy="56" r="6.2" fill="url(#sk__U__)" stroke="${INK}" stroke-width="1.5"/>
<path d="M19 54C19 34 32 25 50 25s31 9 31 29c0 18-13 30-31 30S19 72 19 54z" fill="url(#sk__U__)" stroke="${INK}" stroke-width="1.7"/>
${o.beard ? ACC.beard : ''}
<ellipse cx="29" cy="68" rx="7" ry="4" fill="#ff6f9a" opacity="${emo === 'angry' ? .65 : .45}"/><ellipse cx="71" cy="68" rx="7" ry="4" fill="#ff6f9a" opacity="${emo === 'angry' ? .65 : .45}"/><g stroke="#fff" stroke-width="1" opacity=".6" stroke-linecap="round"><path d="M26 67l1.6 3M29.4 66.4l1.6 3M71 66.4l1.6 3M74.4 67l1.6 3"/></g>
${o.sun ? '' : eyes(emo, o.iris || '#4a3426', 57, o)}
${o.sun ? '' : brows(emo, shade(hair, -.3))}
<g transform="translate(0 2.5)">${mouth(emo)}</g>
${hairPath ? `<path d="${hairPath}" fill="url(#hr__U__)" stroke="${INK}" stroke-width="1.7" stroke-linejoin="round"/><path d="M28 34q12-11 30-10" stroke="#fff" stroke-width="2.6" opacity=".28" fill="none" stroke-linecap="round"/>` : `<path d="M22 48q-1-8 4-14M78 48q1-8-4-14" stroke="${hair}" stroke-width="6" stroke-linecap="round" fill="none"/>`}
${(o.acc || []).map((a) => ACC[a]).join('')}${o.fem ? '<path d="M50 24q-4-9 3-11q-2 4 0 11z" fill="url(#hr__U__)" stroke="'+INK+'" stroke-width="1.2"/>' : ''}${fxMark(emo)}
</g></svg>`;
}

function orb(o, emo) {
  const e = emo === 'happy' ? 'happy' : emo === 'angry' ? 'angry' : emo === 'worried' ? 'worried' : 'star';
  const face = e === 'happy' ? `<g stroke="${o.eye}" stroke-width="3" fill="none" stroke-linecap="round"><path d="M33 58q5-7 10 0"/><path d="M57 58q5-7 10 0"/></g>`
    : e === 'angry' ? `<g fill="${o.eye}"><path d="M31 52l12 4v5H31z"/><path d="M69 52l-12 4v5h12z"/></g>`
      : e === 'worried' ? `<g fill="${o.eye}"><ellipse cx="38" cy="58" rx="4" ry="5"/><ellipse cx="62" cy="58" rx="4" ry="5"/></g><path d="M30 50l10-3M70 50l-10-3" stroke="${o.eye}" stroke-width="2" stroke-linecap="round"/>`
        : [38, 62].map((x) => `<path class="eye" d="M${x} 50l2.2 4.8 5.2.6-3.9 3.4 1.2 5.1-4.7-2.7-4.7 2.7 1.2-5.1-3.9-3.4 5.2-.6z" fill="${o.eye}"/>`).join('');
  const mo = e === 'angry' ? `<path d="M43 72q7-4 14 0" stroke="${o.eye}" stroke-width="2.4" fill="none" stroke-linecap="round"/>` : e === 'worried' ? `<path d="M44 72q3-2 6 0t6 0" stroke="${o.eye}" stroke-width="2" fill="none"/>` : `<path d="M43 69q7 6 14 0" stroke="${o.eye}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" class="chsvg"><defs><radialGradient id="ob__U__" cx="34%" cy="26%" r="80%"><stop offset="0" stop-color="#fff"/><stop offset=".22" stop-color="${o.c1}"/><stop offset=".85" stop-color="${o.c2}"/><stop offset="1" stop-color="${shade(o.c2, -.4)}"/></radialGradient>
<radialGradient id="sc__U__" cx="50%" cy="40%"><stop offset="0" stop-color="#16243c"/><stop offset="1" stop-color="#070b14"/></radialGradient></defs>
${o.ears ? `<path d="M20 40l-6-26 24 12zM80 40l6-26-24 12z" fill="${o.c2}" stroke="${INK}" stroke-width="1.6"/><path d="M20 34l-2-12 10 6zM80 34l2-12-10 6z" fill="${o.c1}"/>` : `<path d="M50 24V10" stroke="${shade(o.c2, -.2)}" stroke-width="3.4" stroke-linecap="round"/><path d="M50 1l2.6 5.4 6 .8-4.4 4 1.2 6-5.4-3-5.4 3 1.2-6-4.4-4 6-.8z" fill="#fff3a0" stroke="#d9a52a" stroke-width=".8"/>`}
<path d="M10 101q2-18 18-22h44q16 4 18 22z" fill="${shade(o.c2, -.25)}" stroke="${INK}" stroke-width="1.6"/><path d="M38 86h24" stroke="${o.c1}" stroke-width="3" stroke-linecap="round" opacity=".8"/>
<circle cx="50" cy="56" r="34" fill="url(#ob__U__)" stroke="${INK}" stroke-width="1.8"/>
<ellipse cx="50" cy="59" rx="25" ry="20" fill="url(#sc__U__)" stroke="${shade(o.c2, -.35)}" stroke-width="1.4"/>
<path d="M30 46q8-8 18-8" stroke="#fff" stroke-width="2" opacity=".18" fill="none"/>${face}${mo}
${o.leaf ? '<path d="M70 24q18-6 23 11-17 3-23-11z" fill="#7be08a" stroke="#2c8a45" stroke-width="1.2"/><path d="M72 27q10 2 17 7" stroke="#2c8a45" fill="none" stroke-width="1.3"/>' : ''}
<path d="M24 40q6-14 22-18" stroke="#fff" stroke-width="3" opacity=".5" fill="none" stroke-linecap="round"/>${fxMark(emo === 'neutral' ? '' : emo)}
</svg>`;
}

const EARS = {
  cat: (c) => `<path d="M20 42L15 12l25 15zM80 42l5-30-25 15z" fill="${c}" stroke="${INK}" stroke-width="1.6"/><path d="M22 35l-2-14 11 7zM78 35l2-14-11 7z" fill="#ffb3c6"/>`,
  bear: (c) => `<circle cx="24" cy="27" r="11" fill="${c}" stroke="${INK}" stroke-width="1.6"/><circle cx="76" cy="27" r="11" fill="${c}" stroke="${INK}" stroke-width="1.6"/><circle cx="24" cy="27" r="5.4" fill="#ffd0dc"/><circle cx="76" cy="27" r="5.4" fill="#ffd0dc"/>`,
  bunny: (c) => `<ellipse cx="34" cy="15" rx="7.4" ry="19" fill="${c}" stroke="${INK}" stroke-width="1.6"/><ellipse cx="66" cy="15" rx="7.4" ry="19" fill="${c}" stroke="${INK}" stroke-width="1.6"/><ellipse cx="34" cy="15" rx="3.4" ry="13" fill="#ffb3c6"/><ellipse cx="66" cy="15" rx="3.4" ry="13" fill="#ffb3c6"/>`,
  dog: (c) => `<path d="M20 32q-12 10-7 34 15-3 15-25zM80 32q12 10 7 34-15-3-15-25z" fill="${c}" stroke="${INK}" stroke-width="1.6"/>`,
};
function mascot(id, o, emo) {
  const c = o.color;
  const ey = emo === 'happy' ? `<g stroke="${INK}" stroke-width="2.8" fill="none" stroke-linecap="round"><path d="M31 51q5-6 10 0"/><path d="M59 51q5-6 10 0"/></g>`
    : [35, 65].map((x) => `<g class="eye"><ellipse cx="${x}" cy="50" rx="6.4" ry="7.6" fill="${INK}"/><ellipse cx="${x}" cy="54" rx="4" ry="2.6" fill="#5a4a8a" opacity=".6"/><circle cx="${x + 2.2}" cy="47" r="2.6" fill="#fff"/><circle cx="${x - 2}" cy="53" r="1.3" fill="#fff"/></g>`).join('');
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" class="chsvg"><defs><radialGradient id="ms__U__" cx="38%" cy="30%" r="80%"><stop offset="0" stop-color="${shade(c, .35)}"/><stop offset=".7" stop-color="${c}"/><stop offset="1" stop-color="${shade(c, -.25)}"/></radialGradient></defs>
${EARS[o.ears](o.dark || c)}
<path d="M14 101q2-22 24-25h24q22 3 24 25z" fill="url(#ms__U__)" stroke="${INK}" stroke-width="1.6"/><circle cx="50" cy="88" r="9.4" fill="#fff" stroke="${INK}" stroke-width="1.2"/><text x="50" y="91.4" text-anchor="middle" font-size="9" font-weight="800" fill="${shade(c, -.2)}" font-family="Inter,sans-serif">${id}</text>
<ellipse cx="50" cy="53" rx="34" ry="29" fill="url(#ms__U__)" stroke="${INK}" stroke-width="1.7"/><ellipse cx="50" cy="61" rx="22" ry="16" fill="#fff" opacity=".9"/>
${ey}<ellipse cx="50" cy="58" rx="3.8" ry="2.7" fill="${INK}"/><path d="M50 61v2.6M44 65q6 5 12 0" stroke="${INK}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
<ellipse cx="27" cy="61" rx="6.4" ry="3.8" fill="#ff6f9a" opacity=".6"/><ellipse cx="73" cy="61" rx="6.4" ry="3.8" fill="#ff6f9a" opacity=".6"/>${o.hat || ''}
<path d="M26 38q8-10 20-11" stroke="#fff" stroke-width="2.4" opacity=".35" fill="none" stroke-linecap="round"/>
</svg>`;
}

// ---------- cast ----------
const P = {
  hero: { skin: '#f7d6b8', hair: '#1c2233', style: 'side', outfit: '#2a3a6c', kind: 'suit', tie: '#d94b5c', iris: '#3a5aa8', base: 'smug' },
  hero_auditor: { skin: '#f7d6b8', hair: '#1c2233', style: 'side', outfit: '#4a5262', kind: 'suit', tie: '#2a3a6c', acc: ['glasses'], iris: '#3a5aa8', base: 'smug' },
  hero_engineer: { skin: '#f7d6b8', hair: '#1c2233', style: 'spiky', outfit: '#2b3445', kind: 'hoodie', acc: ['headband'], iris: '#3a5aa8', base: 'smug' },
  hero_analyst: { skin: '#f7d6b8', hair: '#1c2233', style: 'slick', outfit: '#1e2a44', kind: 'blazer', shirt: '#f4f6fa', tie: '#8a2432', iris: '#3a5aa8', base: 'smug' },
  mira: { fem: true, skin: '#e8b08a', hair: '#2b1b30', back: 'bob', style: 'bun', outfit: '#c9689b', kind: 'blazer', shirt: '#fff3f8', acc: ['glasses', 'earring'], iris: '#5a3a2a' },
  victor: { skin: '#f2d2b4', hair: '#a7b0c0', style: 'slick', outfit: '#2c313f', kind: 'suit', tie: '#7aa8ff', acc: ['monocle'], iris: '#5a6a7a', base: 'smug' },
  jonah: { skin: '#cf956b', hair: '#3a2716', style: 'spiky', outfit: '#2f8f5b', kind: 'hoodie', acc: ['headband'], iris: '#3a7a4a', base: 'happy' },
  lin: { fem: true, skin: '#f8dcc8', hair: '#14141c', back: 'bob', style: 'bob', outfit: '#e9eef5', kind: 'lab', acc: ['goggles'], iris: '#3a3030' },
  dana: { fem: true, skin: '#b87c58', hair: '#1f1a1a', back: 'wave', style: 'wave', outfit: '#a63b46', kind: 'blazer', shirt: '#fff', acc: ['pin'], iris: '#3a2a1a' },
  elias: { skin: '#f1d5bb', hair: '#e8e4dc', style: 'bald', outfit: '#6b5a44', kind: 'cardigan', acc: ['roundglasses'], beard: true, iris: '#5a6a7a', base: 'happy' },
};
const CAMEO_P = {
  anchor: { skin: '#efc6a2', hair: '#2a2a33', style: 'slick', outfit: '#34466e', kind: 'suit', tie: '#ffd24a', acc: ['headset'], iris: '#4a3426', base: 'shock' },
  intern: { fem: true, skin: '#fbe0cc', hair: '#8a3a22', style: 'short', outfit: '#6a7aa8', kind: 'cardigan', iris: '#6a4a2a', base: 'worried' },
  chef: { skin: '#e3b48a', hair: '#ffffff', style: 'bald', outfit: '#f2f2f2', kind: 'chef', acc: ['chefhat'], iris: '#3a2a1a', base: 'happy' },
  quant: { fem: true, skin: '#f5d8c0', hair: '#4a2a6a', back: 'bob', style: 'bob', outfit: '#3a2a5a', kind: 'blazer', acc: ['glasses'], iris: '#6a3aa8', base: 'smug' },
  guard: { skin: '#c99870', hair: '#111', style: 'short', outfit: '#15171c', kind: 'suit', tie: '#15171c', acc: ['sun'], sun: true, base: 'neutral' },
};
export const CAMEO = {
  anchor: { kr: '앵커 마이크', role: '경제 속보', c: '#ffd24a' },
  intern: { kr: '인턴 토리', role: '비서실 막내', c: '#ff9a8a' },
  chef: { kr: '셰프 오마하', role: '버크셔 구내식당', c: '#ffffff' },
  quant: { kr: '퀀트 소피', role: '개인 펀드 분석', c: '#c79bff' },
  guard: { kr: '경호원 곰돌', role: '경호팀장', c: '#8c98ad' },
};
const ORB = { aria: { c1: '#ffc27a', c2: '#e0601f', eye: '#ffe9a6' }, sage: { c1: '#9cc8ff', c2: '#2a5fb0', eye: '#d9efff', ears: true, leaf: true } };
const MASCOT = {
  NV: { color: '#76b900', ears: 'cat', dark: '#4e7d00', hat: `<rect x="29" y="41" width="42" height="10" rx="5" fill="#0d1a05" stroke="${INK}" stroke-width="1.2"/><rect x="33" y="44" width="34" height="3" rx="1.5" fill="#9dff3a"/>` },
  AP: { color: '#a9b1bd', ears: 'bunny', hat: '<path d="M54 22q10-13 19-6-4 11-19 6z" fill="#6bd16b" stroke="#2c7a2c" stroke-width="1.2"/>' },
  GO: { color: '#f2b705', ears: 'bear', hat: `<path d="M25 35q25-24 50 0z" fill="#4285f4" stroke="${INK}" stroke-width="1.2"/><circle cx="36" cy="30" r="3" fill="#ea4335"/><circle cx="50" cy="26" r="3" fill="#34a853"/><circle cx="64" cy="30" r="3" fill="#fff"/>` },
  MS: { color: '#1b95d4', ears: 'dog', hat: '<g transform="translate(40 24)"><rect width="9" height="9" fill="#f25022"/><rect x="10" width="9" height="9" fill="#7fba00"/><rect y="10" width="9" height="9" fill="#00a4ef"/><rect x="10" y="10" width="9" height="9" fill="#ffb900"/></g>' },
  AM: { color: '#f08a00', ears: 'cat', dark: '#b36200', hat: '<path d="M38 72q12 6 24-2" stroke="#2a1a2e" stroke-width="0"/><path d="M60 26l8-6 2 9z" fill="#5a3a1a"/>' },
  TS: { color: '#8a47c0', ears: 'bear', hat: `<rect x="41" y="23" width="18" height="13" rx="2" fill="#2a1a40" stroke="${INK}" stroke-width="1"/><path d="M44 26h12M44 29.5h12M44 33h12" stroke="#d9a8ff" stroke-width="1.4"/>` },
  ME: { color: '#2f6bff', ears: 'bunny', hat: '<path d="M30 50q10-10 20 0 10 10 20 0" stroke="#fff" stroke-width="3.4" fill="none" opacity=".9"/>' },
  BC: { color: '#d23a36', ears: 'dog', hat: '<path d="M38 28h24l-3 8H41z" fill="#2a1a1a"/><circle cx="50" cy="32" r="2.4" fill="#ffd24a"/>' },
  BK: { color: '#8a2735', ears: 'bear', hat: `<rect x="33" y="12" width="34" height="19" rx="3" fill="#15101a" stroke="${INK}" stroke-width="1.2"/><rect x="24" y="29" width="52" height="7" rx="3" fill="#15101a"/><rect x="33" y="25" width="34" height="4" fill="#d9b24c"/>` },
  AN: { color: '#d4693f', ears: 'cat', dark: '#9b4426', hat: '<path d="M70 26l2.4 5 5.4.6-4 3.6 1.2 5.4-5-2.8-5 2.8 1.2-5.4-4-3.6 5.4-.6z" fill="#ffe08a" stroke="#c98a2a" stroke-width=".8"/>' },
  OA: { color: '#17a37a', ears: 'bunny', hat: '<path d="M50 23a6.4 6.4 0 1 1 6.4 6.4" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round"/>' },
};

const cache = {};
function build(id, emo) {
  const cm = id.startsWith('cm_') ? CAMEO_P[id.slice(3)] : null;
  if (ORB[id]) return orb(ORB[id], emo || 'neutral');
  if (MASCOT[id]) return mascot(id, MASCOT[id], emo || 'neutral');
  const p = cm || P[id] || P.hero;
  return person(p, emo || p.base || 'neutral');
}
export function art(id, emo) {
  const k = id + '|' + (emo || '');
  const t = cache[k] || (cache[k] = build(id, emo));
  const u = 'u' + (++UID);
  return t.replace(/__U__/g, u);
}
export const EMO_OF_STANCE = { y: 'happy', n: 'angry', h: 'worried' };
export const emoOfTrust = (v) => (v >= 62 ? 'happy' : v >= 42 ? 'neutral' : v >= 28 ? 'worried' : 'angry');
