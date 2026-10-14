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
export function scene(kind) {
  const pal = kind === 'alley' ? ['rgba(255,60,120,.5)', 'rgba(255,214,150,.55)', 'rgba(120,255,210,.4)', 'rgba(255,170,90,.5)'] : ['rgba(255,170,90,.5)', 'rgba(255,214,150,.45)', 'rgba(255,120,120,.35)'];
  return `<div class="sc-bg ${kind}">${kind === 'alley' ? alley() : office()}<div class="bokeh">${bokeh(kind === 'alley' ? 34 : 22, pal, kind === 'alley' ? 4 : 9)}</div>${kind === 'alley' ? '<div class="rain"></div>' : ''}<div class="grain"></div><div class="sc-vig"></div></div>`;
}
