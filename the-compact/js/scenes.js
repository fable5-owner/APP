// Cinematic procedural backdrops (SVG + CSS bokeh): moody night alley with neon, brick, string lights; city-window office.
const rnd = (i, k) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
const bokeh = (n, pal, seed = 1) => Array.from({ length: n }, (_, i) => {
  const s = 1.2 + rnd(i, seed) * 5.5, c = pal[i % pal.length];
  return `<i style="left:${rnd(i, seed + 1) * 100}%;top:${rnd(i, seed + 2) * 70}%;width:${s}rem;height:${s}rem;background:radial-gradient(circle,${c} 0,${c.replace(/[\d.]+\)$/, '0)')} 70%);animation-delay:${-rnd(i, seed + 3) * 6}s;animation-duration:${4 + rnd(i, seed + 4) * 5}s"></i>`;
}).join('');
const bricks = (id, c1, c2) => `<pattern id="${id}" width="16" height="8" patternUnits="userSpaceOnUse"><rect width="16" height="8" fill="${c1}"/><rect x=".5" y=".5" width="7" height="3" fill="${c2}"/><rect x="8.5" y=".5" width="7" height="3" fill="${c2}" opacity=".85"/><rect x="4.5" y="4.5" width="7" height="3" fill="${c2}" opacity=".9"/><rect x="-3.5" y="4.5" width="7" height="3" fill="${c2}"/><rect x="12.5" y="4.5" width="7" height="3" fill="${c2}"/></pattern>`;
function alley() {
  const lights = Array.from({ length: 22 }, (_, i) => { const x = 14 + i * 6.6, y = 2.2 + Math.sin(i / 22 * 3.14) * 3 + (i % 2) * 0.6; return `<circle cx="${x}" cy="${y}" r="1.1" fill="#ffe2a8"/><circle cx="${x}" cy="${y}" r="3.6" fill="#ffd08a" opacity=".16"/>`; }).join('');
  return `<svg class="sc-svg" viewBox="0 0 160 90" preserveAspectRatio="xMidYMid slice"><defs>
${bricks('bl', '#1a0f12', '#5a2a22')}${bricks('br', '#160c0f', '#6a3126')}
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#06121c"/><stop offset=".6" stop-color="#0d1f2c"/><stop offset="1" stop-color="#14202a"/></linearGradient>
<linearGradient id="gr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a1b22"/><stop offset="1" stop-color="#07080c"/></linearGradient>
<radialGradient id="glowp" cx="50%" cy="50%"><stop offset="0" stop-color="#ff3d7f" stop-opacity=".55"/><stop offset="1" stop-color="#ff3d7f" stop-opacity="0"/></radialGradient>
<radialGradient id="glowg" cx="50%" cy="50%"><stop offset="0" stop-color="#7dffd0" stop-opacity=".4"/><stop offset="1" stop-color="#7dffd0" stop-opacity="0"/></radialGradient>
<linearGradient id="fade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".55"/><stop offset=".4" stop-color="#000" stop-opacity="0"/></linearGradient></defs>
<rect width="160" height="90" fill="url(#sky)"/>
<rect x="60" y="14" width="38" height="52" fill="#0a1822"/><rect x="66" y="22" width="26" height="40" fill="#101f2b"/>
<g opacity=".9"><rect x="64" y="20" width="30" height="2" fill="#0a0f16"/>${[0, 1, 2, 3, 4].map((i) => `<rect x="${66 + i * 5.4}" y="26" width="3.6" height="${10 + (i % 3) * 5}" fill="#ffcf8a" opacity=".5"/>`).join('')}</g>
<path d="M0 0h58l-4 14L50 70 40 90H0z" fill="url(#bl)"/><path d="M0 0h58l-4 14L50 70 40 90H0z" fill="url(#fade)"/>
<path d="M104 0h56v90h-70l8-24 4-52z" fill="url(#br)"/>
<ellipse cx="29" cy="30" rx="22" ry="30" fill="url(#glowp)"/>
<g fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="23" y="12" width="12" height="38" rx="4" stroke="#ff2f6e" stroke-width="2.4" opacity=".35"/><rect x="23" y="12" width="12" height="38" rx="4" stroke="#ffd0dd" stroke-width=".9"/>
<g stroke="#ffb3c8" stroke-width="1.1">${[0, 1, 2, 3, 4].map((i) => `<path d="M26 ${17 + i * 6.5}h6"/>`).join('')}</g></g>
<ellipse cx="82" cy="12" rx="16" ry="8" fill="url(#glowg)"/><rect x="66" y="4" width="32" height="15" rx="1" fill="#04090c" stroke="#18303a" stroke-width=".6"/>
<text x="82" y="10.3" text-anchor="middle" font-family="Inter,sans-serif" font-weight="800" font-size="3" fill="#bfffe9" letter-spacing=".4">THE LAST BID</text><text x="82" y="15" text-anchor="middle" font-family="Inter,sans-serif" font-weight="700" font-size="2" fill="#bfffe9" letter-spacing=".5">COCKTAIL BAR</text>
<path d="M14 2Q50 8 82 3T150 4" stroke="#2a2118" stroke-width=".35" fill="none"/>${lights}
<g opacity=".8" fill="none" stroke-width="1.6" stroke-linecap="round"><path d="M112 24q8-8 16 0t14 14" stroke="#a66bd9"/><path d="M110 48q10 10 22 0t18 12" stroke="#4fc7c0"/><path d="M120 66q10-10 22 2" stroke="#e86a9a"/></g>
<path d="M0 66L56 58 104 60 160 70V90H0z" fill="url(#gr)"/>
<g opacity=".5"><ellipse cx="30" cy="76" rx="22" ry="3.2" fill="#ff2f6e"/><ellipse cx="82" cy="70" rx="14" ry="2.2" fill="#7dffd0"/><ellipse cx="120" cy="82" rx="26" ry="2.6" fill="#ffd08a" opacity=".6"/></g>
<g><rect x="62" y="56" width="26" height="11" fill="#06090c"/><text x="75" y="63.2" text-anchor="middle" font-family="Inter,sans-serif" font-weight="800" font-size="2.2" fill="#c9a24a" letter-spacing=".3">THE LAST BID</text>${[58, 90].map((x) => `<rect x="${x}" y="56" width=".7" height="11" fill="#b99a5c"/><circle cx="${x + .35}" cy="55.5" r="1" fill="#d6b86a"/>`).join('')}</g>
</svg>`;
}
function office() {
  const tow = Array.from({ length: 16 }, (_, i) => { const h = 18 + rnd(i, 2) * 38, x = 4 + i * 9.6; return `<rect x="${x}" y="${72 - h}" width="8" height="${h}" fill="#0b1626"/>${Array.from({ length: Math.floor(h / 4) }, (_, j) => rnd(i * 9 + j, 3) > 0.45 ? `<rect x="${x + 1 + (j % 2) * 3.4}" y="${72 - h + 2 + j * 4}" width="2.2" height="1.6" fill="#ffd28a" opacity="${0.35 + rnd(i + j, 5) * 0.5}"/>` : '').join('')}`; }).join('');
  return `<svg class="sc-svg" viewBox="0 0 160 90" preserveAspectRatio="xMidYMid slice"><defs>
<linearGradient id="dsk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff9a52"/><stop offset=".35" stop-color="#b64a5a"/><stop offset=".7" stop-color="#2a2150"/><stop offset="1" stop-color="#0b1022"/></linearGradient>
<linearGradient id="fl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b1620"/><stop offset="1" stop-color="#07060a"/></linearGradient></defs>
<rect width="160" height="90" fill="url(#dsk)"/><circle cx="118" cy="46" r="9" fill="#ffd9a0" opacity=".9"/><circle cx="118" cy="46" r="22" fill="#ff9a52" opacity=".22"/>${tow}
<rect x="0" y="0" width="160" height="90" fill="none"/>
<g fill="#050609"><rect x="0" y="0" width="7" height="90"/><rect x="153" y="0" width="7" height="90"/><rect x="0" y="0" width="160" height="6"/><rect x="78" y="0" width="3" height="72"/><rect x="38" y="0" width="2.4" height="72"/><rect x="118" y="0" width="2.4" height="72"/></g>
<path d="M0 72h160v18H0z" fill="url(#fl)"/><path d="M26 72h108l10 18H16z" fill="#ffb472" opacity=".12"/>
<g fill="#0a0709"><rect x="40" y="62" width="80" height="6" rx="2"/><rect x="46" y="68" width="3" height="22"/><rect x="111" y="68" width="3" height="22"/></g>
<g><rect x="76" y="56" width="8" height="6" rx=".6" fill="#16213a"/><rect x="77" y="57" width="6" height="4" fill="#7aa8ff" opacity=".7"/><circle cx="64" cy="59" r="2.4" fill="#ffd28a" opacity=".6"/><rect x="63" y="59" width="2" height="3" fill="#2a1d12"/></g>
</svg>`;
}
const T = (s) => s; // template marker
const svgOpen = '<svg class="sc-svg" viewBox="0 0 160 90" preserveAspectRatio="xMidYMid slice">';
const lin = (id, stops, v = true) => `<linearGradient id="${id}" x1="0" y1="0" x2="${v ? 0 : 1}" y2="${v ? 1 : 0}">${stops.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join('')}</linearGradient>`;
const rad = (id, stops, cx = '50%', cy = '50%', r = '50%') => `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join('')}</radialGradient>`;
const skyline = (y0, col, lit, seed = 1, n = 22) => Array.from({ length: n }, (_, i) => { const w = 5 + rnd(i, seed) * 6, x = i * (160 / n) + rnd(i, seed + 1) * 2, h = 10 + rnd(i, seed + 2) * 30; return `<rect x="${x}" y="${y0 - h}" width="${w}" height="${h}" fill="${col}"/>${Array.from({ length: Math.floor(h / 3.2) }, (_, j) => rnd(i * 13 + j, seed + 3) > 0.62 ? `<rect x="${x + 1 + (j % 2) * (w / 2 - 1)}" y="${y0 - h + 1.6 + j * 3.2}" width="1.4" height="1.1" fill="${lit}" opacity="${0.35 + rnd(i + j, seed + 4) * 0.55}"/>` : '').join('')}`; }).join('');

function boardroom() {
  return `${svgOpen}<defs>${lin('bs__U__', [[0, '#0a1430'], [.7, '#1a2a55'], [1, '#2b2350']])}${lin('tb__U__', [[0, '#2a1f1a'], [1, '#0c0807']])}${rad('pl__U__', [[0, '#ffe4b0', .55], [1, '#ffe4b0', 0]])}${lin('fl__U__', [[0, '#120e14'], [1, '#050407']])}</defs>
<rect width="160" height="90" fill="url(#bs__U__)"/>${skyline(62, '#0a1124', '#9cc4ff', 3, 26)}${skyline(66, '#070c1a', '#ffd28a', 7, 18)}
<g fill="#04060c">${[0, 32, 64, 96, 128, 156].map((x) => `<rect x="${x}" y="0" width="4" height="66"/>`).join('')}<rect y="0" width="160" height="5"/></g>
<path d="M0 66h160v24H0z" fill="url(#fl__U__)"/>
${[30, 58, 80, 102, 130].map((x) => `<ellipse cx="${x}" cy="12" rx="12" ry="7" fill="url(#pl__U__)"/><rect x="${x - 5}" y="5" width="10" height="1.4" rx=".7" fill="#ffe4b0"/>`).join('')}
<path d="M30 70h100l22 20H8z" fill="url(#tb__U__)" stroke="#3a2a22" stroke-width=".4"/><path d="M34 71h92l10 9H24z" fill="#fff" opacity=".05"/>
${[[22, 74], [40, 72], [120, 72], [138, 74]].map(([x, y]) => `<path d="M${x - 4} ${y + 16}v-10q0-6 4-6t4 6v10z" fill="#08070a"/>`).join('')}
<g opacity=".5">${[50, 80, 110].map((x) => `<ellipse cx="${x}" cy="78" rx="7" ry="1.2" fill="#ffe4b0" opacity=".25"/>`).join('')}</g></svg>`;
}
function senate() {
  const cols = [10, 34, 126, 150].map((x) => `<rect x="${x - 4}" y="8" width="8" height="62" fill="url(#cl__U__)"/><rect x="${x - 6}" y="6" width="12" height="3" fill="#d8d0c0"/><rect x="${x - 6}" y="68" width="12" height="3" fill="#bdb4a2"/>${[-2.4, 0, 2.4].map((d) => `<path d="M${x + d} 10v58" stroke="#a89f8e" stroke-width=".4"/>`).join('')}`).join('');
  return `${svgOpen}<defs>${lin('sw__U__', [[0, '#3a2414'], [1, '#160d08']])}${lin('cl__U__', [[0, '#a69c88'], [.5, '#ece4d4'], [1, '#9a907c']], false)}${rad('sp__U__', [[0, '#fff1c8', .5], [1, '#fff1c8', 0]], '50%', '0%', '90%')}</defs>
<rect width="160" height="90" fill="url(#sw__U__)"/><g opacity=".35">${Array.from({ length: 16 }, (_, i) => `<rect x="${i * 10 + 1}" y="10" width="8" height="40" fill="none" stroke="#6a4a2a" stroke-width=".6"/>`).join('')}</g>
<circle cx="80" cy="26" r="13" fill="#1d140c" stroke="#c9a24a" stroke-width="1.2"/><circle cx="80" cy="26" r="10" fill="none" stroke="#c9a24a" stroke-width=".5"/><path d="M80 18l2 5 5 .4-4 3.2 1.4 5-4.4-2.8-4.4 2.8 1.4-5-4-3.2 5-.4z" fill="#c9a24a"/>
${[56, 104].map((x) => `<path d="M${x} 8v40" stroke="#c9a24a" stroke-width=".6"/><path d="M${x} 9h12v14h-12z" fill="#2b3f7a"/>${[0, 1, 2, 3, 4, 5].map((k) => `<rect x="${x}" y="${23 + k * 3}" width="12" height="1.5" fill="${k % 2 ? '#f2efe8' : '#b23a3a'}"/>`).join('')}<path d="M${x} 9h12v17h-12z" fill="none"/>`).join('')}
${cols}<path d="M0 0h160L120 90H40z" fill="url(#sp__U__)"/>
<path d="M20 58h120v12H20z" fill="#2a1a10" stroke="#5a3a20" stroke-width=".6"/><path d="M14 70h132v20H14z" fill="#1a110a"/>
${[40, 60, 80, 100, 120].map((x) => `<rect x="${x - 4}" y="60" width="8" height="3" rx="1" fill="#0c0805"/><path d="M${x} 60v-4" stroke="#2a2a2a" stroke-width=".6"/><circle cx="${x}" cy="55.5" r=".9" fill="#ff5a5a"/>`).join('')}</svg>`;
}
function fab() {
  const tools = Array.from({ length: 6 }, (_, i) => { const k = i / 6, x0 = 4 + k * 46, w = 14 - k * 9, y = 40 + k * 3, h = 34 - k * 22; return `<rect x="${x0}" y="${y}" width="${w}" height="${h}" fill="#e7e2cc" stroke="#9a9070" stroke-width=".4"/><rect x="${x0 + 1}" y="${y + 2}" width="${w - 2}" height="${h * .25}" fill="#3a3a32"/><circle cx="${x0 + w / 2}" cy="${y + h * .62}" r="${w * .12}" fill="#ffae2a"/><rect x="${160 - x0 - w}" y="${y}" width="${w}" height="${h}" fill="#e7e2cc" stroke="#9a9070" stroke-width=".4"/><rect x="${161 - x0 - w}" y="${y + 2}" width="${w - 2}" height="${h * .25}" fill="#3a3a32"/><circle cx="${160 - x0 - w / 2}" cy="${y + h * .62}" r="${w * .12}" fill="#5aff9a"/>`; }).reverse().join('');
  return `${svgOpen}<defs>${lin('fy__U__', [[0, '#f2d36a'], [1, '#a8822a']])}${rad('wf__U__', [[0, '#ffffff'], [.3, '#b8f0ff'], [.6, '#c78bff'], [1, '#ff9ad0', .0]])}</defs>
<rect width="160" height="90" fill="url(#fy__U__)"/><g stroke="#fff5c8" stroke-width=".5" opacity=".6">${Array.from({ length: 12 }, (_, i) => `<path d="M${i * 14} 0L80 40"/>`).join('')}${Array.from({ length: 6 }, (_, i) => `<path d="M0 ${i * 7}H160"/>`).join('')}</g>
<path d="M0 90L80 46l80 44z" fill="#d9c27a"/><g stroke="#b79a4a" stroke-width=".4">${Array.from({ length: 10 }, (_, i) => `<path d="M80 46L${i * 18 - 2} 90"/>`).join('')}</g>
${tools}<circle cx="80" cy="34" r="9" fill="url(#wf__U__)"/><circle cx="80" cy="34" r="6" fill="none" stroke="#fff" stroke-width=".3" stroke-dasharray=".8 .8"/>
<g fill="#fff" opacity=".85">${[[30, 56], [128, 58], [96, 52]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="2.6" ry="2.2"/><rect x="${x - 3}" y="${y + 1.6}" width="6" height="7" rx="2"/><rect x="${x - 1.6}" y="${y - .6}" width="3.2" height="1.2" fill="#3a7aff"/>`).join('')}</g></svg>`;
}
function trading() {
  const candles = (x0, y0, w, h, seed) => { let y = y0 + h / 2; return Array.from({ length: 14 }, (_, i) => { const d = (rnd(i, seed) - 0.47) * h * 0.4, up = d < 0, y1 = y, y2 = y + d; y = Math.max(y0 + 2, Math.min(y0 + h - 2, y2)); return `<path d="M${x0 + 2 + i * (w - 4) / 14} ${Math.min(y1, y2) - 1.5}v${Math.abs(d) + 3}" stroke="${up ? '#3cf0a0' : '#ff5a7a'}" stroke-width=".3"/><rect x="${x0 + 1.4 + i * (w - 4) / 14}" y="${Math.min(y1, y2)}" width="1.3" height="${Math.max(.6, Math.abs(d))}" fill="${up ? '#3cf0a0' : '#ff5a7a'}"/>`; }).join(''); };
  const scr = [[6, 8], [42, 8], [78, 8], [114, 8], [6, 32], [42, 32], [78, 32], [114, 32]].map(([x, y], i) => `<rect x="${x}" y="${y}" width="34" height="21" rx="1" fill="#06101e" stroke="#1a3a5a" stroke-width=".6"/>${candles(x, y, 34, 21, i + 2)}<rect x="${x}" y="${y}" width="34" height="21" fill="url(#gl__U__)"/>`).join('');
  return `${svgOpen}<defs>${lin('tf__U__', [[0, '#020812'], [1, '#0b1626']])}${lin('gl__U__', [[0, '#7ab8ff', .12], [1, '#7ab8ff', 0]])}</defs>
<rect width="160" height="90" fill="url(#tf__U__)"/>${scr}
<rect x="0" y="56" width="160" height="5" fill="#0a0f18"/><text x="4" y="59.8" font-family="JetBrains Mono,monospace" font-size="2.6" fill="#ffd24a" class="tick">NV ▲2.4%  AP ▼0.6%  GO ▲1.1%  MS ▲0.8%  AM ▼1.9%  TS ▲3.2%  ME ▲0.4%  BC ▲5.0%  BK ▼0.1%  KESTREL ?.?%  NV ▲2.4%  AP ▼0.6%</text>
<path d="M0 62h160v28H0z" fill="#070a10"/>${[10, 34, 58, 82, 106, 130].map((x, i) => `<rect x="${x}" y="${66 + (i % 2) * 2}" width="20" height="9" rx=".6" fill="#0e1828" stroke="#1d3350" stroke-width=".5"/><rect x="${x + 1.5}" y="${67.5 + (i % 2) * 2}" width="17" height="6" fill="${i % 3 ? '#0f3a2a' : '#3a0f1a'}" opacity=".9"/><path d="M${x - 2} ${78 + (i % 2) * 2}h24" stroke="#1a2230" stroke-width="2"/>`).join('')}</svg>`;
}
function datacenter() {
  const racks = (side) => Array.from({ length: 8 }, (_, i) => { const k = i / 8, w = 26 - k * 22, x = side < 0 ? k * 72 : 160 - k * 72 - w, y = 8 + k * 30, h = 76 - k * 58; return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#0a1220" stroke="#18304e" stroke-width=".4"/>${Array.from({ length: 8 }, (_, j) => `<rect x="${x + w * .12}" y="${y + 2 + j * (h - 4) / 8}" width="${w * .76}" height="${(h - 4) / 8 - .8}" fill="#0f1c30"/><circle cx="${x + w * (.2 + rnd(i * 9 + j, side + 5) * .6)}" cy="${y + 2.6 + j * (h - 4) / 8}" r="${.35 + (1 - k) * .3}" fill="${rnd(i + j, 3) > .8 ? '#ff7a4a' : '#4ab8ff'}" class="led" style="animation-delay:${-rnd(i, j) * 2}s"/>`).join('')}`; }).reverse().join('');
  return `${svgOpen}<defs>${lin('dk__U__', [[0, '#030812'], [1, '#08142a']])}${rad('mist__U__', [[0, '#5ab0ff', .35], [1, '#5ab0ff', 0]])}</defs>
<rect width="160" height="90" fill="url(#dk__U__)"/><path d="M0 90L80 40l80 50z" fill="#0b1830"/><g stroke="#1d3a66" stroke-width=".35">${Array.from({ length: 12 }, (_, i) => `<path d="M80 40L${i * 16 - 8} 90"/>`).join('')}${Array.from({ length: 6 }, (_, i) => `<path d="M${80 - (i + 1) * 13} ${40 + (i + 1) * 8.3}h${(i + 1) * 26}"/>`).join('')}</g>
${racks(-1)}${racks(1)}<ellipse cx="80" cy="44" rx="40" ry="16" fill="url(#mist__U__)"/><g stroke="#4ab8ff" stroke-width=".4" opacity=".6">${[0, 1, 2].map((i) => `<path d="M${50 + i * 30} 0v${10 + i * 3}"/>`).join('')}</g></svg>`;
}
function strait() {
  return `${svgOpen}<defs>${lin('ns__U__', [[0, '#05070f'], [.55, '#141a33'], [1, '#2a2440']])}${lin('sea__U__', [[0, '#0a1222'], [1, '#02040a']])}${rad('mn__U__', [[0, '#f6f0dc'], [.2, '#f6f0dc'], [.25, '#f6f0dc', .25], [1, '#f6f0dc', 0]])}</defs>
<rect width="160" height="90" fill="url(#ns__U__)"/><circle cx="118" cy="20" r="26" fill="url(#mn__U__)"/>
<g fill="#0b0e1a" opacity=".9"><ellipse cx="40" cy="16" rx="30" ry="6"/><ellipse cx="70" cy="22" rx="26" ry="4"/><ellipse cx="140" cy="12" rx="24" ry="4"/></g>
<path d="M0 50q20-3 40-1t40-2 40 2 40-1v6H0z" fill="#0a0f1c"/>${Array.from({ length: 30 }, (_, i) => `<circle cx="${i * 5.4 + 2}" cy="${49.6 + rnd(i, 4)}" r=".4" fill="#ffd28a" opacity="${.3 + rnd(i, 5) * .6}"/>`).join('')}
<rect y="52" width="160" height="38" fill="url(#sea__U__)"/><path d="M110 52l8 38h-16z" fill="#f6f0dc" opacity=".12"/>
<g stroke="#9ab4e0" stroke-width=".35" opacity=".5">${Array.from({ length: 22 }, (_, i) => `<path d="M${rnd(i, 1) * 150} ${55 + i * 1.5}h${4 + rnd(i, 2) * 10}"/>`).join('')}</g>
${[[30, 60, 1], [72, 57, .7], [134, 64, 1.2]].map(([x, y, k]) => `<g transform="translate(${x} ${y}) scale(${k})"><path d="M-8 0h16l-3 3h-10z" fill="#1a1f2a"/><rect x="-2" y="-4" width="5" height="4" fill="#232a38"/><path d="M0 -4v-4" stroke="#232a38" stroke-width=".6"/><circle cx="0" cy="-8" r=".7" fill="#ff4a4a" class="led"/></g>`).join('')}</svg>`;
}
function gala() {
  const ch = (x, s) => `<g transform="translate(${x} 0) scale(${s})"><path d="M0 0v8" stroke="#c9a24a" stroke-width=".5"/>${[-8, -4, 0, 4, 8].map((d) => `<path d="M0 8q${d} 2 ${d} 6" stroke="#c9a24a" stroke-width=".4" fill="none"/><circle cx="${d}" cy="14" r="1.1" fill="#fff4d0"/><circle cx="${d}" cy="14" r="3.6" fill="#ffd88a" opacity=".22"/>`).join('')}<ellipse cx="0" cy="9" rx="10" ry="2" fill="none" stroke="#e8c870" stroke-width=".5"/></g>`;
  return `${svgOpen}<defs>${lin('gw__U__', [[0, '#2a0f18'], [1, '#12060a']])}${lin('gc__U__', [[0, '#e8d8b8'], [.5, '#fff4dc'], [1, '#c8b898']], false)}</defs>
<rect width="160" height="90" fill="url(#gw__U__)"/><g opacity=".5">${Array.from({ length: 9 }, (_, i) => `<path d="M${8 + i * 18} 20q9-12 18 0v48h-18z" fill="#3a1420" stroke="#6a3040" stroke-width=".5"/>`).join('')}</g>
${[0, 36, 124, 160].map((x) => `<rect x="${x - 4}" y="10" width="8" height="62" fill="url(#gc__U__)"/>`).join('')}${ch(52, 1.1)}${ch(108, 1.1)}${ch(80, 1.5)}
<path d="M0 70h160v20H0z" fill="#1a0a0e"/><path d="M66 70h28l14 20H52z" fill="#8a1a2a"/><path d="M68 70h24l12 20H56z" fill="#a32234" opacity=".7"/>
${[20, 40, 120, 140].map((x) => `<path d="M${x} 74v-8M${x - 2} 66h4" stroke="#c9a24a" stroke-width=".6"/><circle cx="${x}" cy="64" r="2" fill="#fff4d0" opacity=".25"/>`).join('')}</svg>`;
}
function interrogate() {
  return `${svgOpen}<defs>${rad('lc__U__', [[0, '#ffe8b0', .55], [1, '#ffe8b0', 0]], '50%', '0%', '100%')}${lin('iw__U__', [[0, '#121418'], [1, '#07080a']])}</defs>
<rect width="160" height="90" fill="url(#iw__U__)"/><rect x="18" y="10" width="54" height="34" fill="#4a3424" stroke="#2a1a10" stroke-width="1"/>
${[[24, 14], [40, 18], [58, 13], [30, 30], [52, 32], [64, 26]].map(([x, y]) => `<rect x="${x}" y="${y}" width="7" height="8" fill="#e8e2d0" transform="rotate(${(x % 7) - 3} ${x} ${y})"/><circle cx="${x + 3.5}" cy="${y + .8}" r=".7" fill="#e33"/>`).join('')}
<path d="M27.5 14.8L43.5 18.8L61.5 13.8M33.5 30.8L55.5 32.8L67.5 26.8M43.5 18.8L55.5 32.8" stroke="#e33" stroke-width=".4" fill="none"/>
<text x="45" y="42" text-anchor="middle" font-family="JetBrains Mono,monospace" font-size="2.4" fill="#e8e2d0" opacity=".7" letter-spacing=".4">KESTREL ?</text>
<path d="M100 0v18" stroke="#333" stroke-width=".5"/><path d="M95 18h10l-2-3h-6z" fill="#2a2a2a"/><path d="M95 18L70 90h60L105 18z" fill="url(#lc__U__)"/><circle cx="100" cy="18.6" r="1.4" fill="#fff4d0"/>
<path d="M76 66h48l4 6H72z" fill="#1a1612"/><path d="M78 72v18M122 72v18" stroke="#0e0c0a" stroke-width="2"/><rect x="92" y="63" width="9" height="3" fill="#e8e2d0" transform="rotate(-6 92 63)"/></svg>`;
}
const SCENES = { alley, office, boardroom, senate, fab, trading, datacenter, strait, gala, interrogate };
const PAL = {
  alley: ['rgba(255,60,120,.5)', 'rgba(255,214,150,.55)', 'rgba(120,255,210,.4)', 'rgba(255,170,90,.5)'],
  office: ['rgba(255,170,90,.5)', 'rgba(255,214,150,.45)', 'rgba(255,120,120,.35)'],
  boardroom: ['rgba(150,190,255,.45)', 'rgba(255,214,150,.45)'], senate: ['rgba(255,226,170,.45)', 'rgba(255,190,120,.35)'],
  fab: ['rgba(255,240,180,.5)', 'rgba(255,200,90,.4)'], trading: ['rgba(60,240,160,.35)', 'rgba(255,90,122,.35)', 'rgba(255,210,74,.35)'],
  datacenter: ['rgba(74,184,255,.45)', 'rgba(140,200,255,.35)'], strait: ['rgba(255,210,140,.35)', 'rgba(160,190,255,.3)'],
  gala: ['rgba(255,214,140,.55)', 'rgba(255,240,200,.45)', 'rgba(255,120,140,.3)'], interrogate: ['rgba(255,232,176,.3)'],
};
let SUID = 0;
export function scene(kind, opts = {}) {
  const fn = SCENES[kind] || SCENES.office, u = 's' + (++SUID);
  const svg = fn().replace(/__U__/g, u);
  const pal = PAL[kind] || PAL.office;
  return `<div class="sc-bg ${kind}">${svg}<div class="bokeh">${bokeh(opts.bokeh ?? 22, pal, kind.length * 3)}</div>${kind === 'alley' || kind === 'strait' ? '<div class="rain"></div>' : ''}<div class="grain"></div><div class="sc-vig"></div></div>`;
}
export const SCENE_OF = { focus: 'boardroom', h200: 'boardroom', gpu: 'datacenter', ipo: 'trading', senator: 'senate', taiwan: 'strait', short: 'trading', audit: 'office', hire: 'alley', rumor: 'alley', fund: 'office', crossroads: 'boardroom', accuse: 'interrogate', resolution: 'office', power: 'datacenter', leak: 'datacenter', strike: 'fab', gala: 'gala' };
