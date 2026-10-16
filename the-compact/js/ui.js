// View templates: pure functions returning HTML strings. No drawn faces — avatars are initials / orbs.
import { COMPANIES, CHARS, ORIGINS, SHOP, LEVERS, LETTERS, QUARTERS, TOTAL_TURNS, SUSPECTS, ENDINGS } from './data.js';
import { art, CAMEO, emoOfTrust, EMO_OF_STANCE } from './chars.js';
import { scene as backdrop, SCENE_OF } from './scenes.js';
export { backdrop, SCENE_OF };
import { COMP, totalMcap, netWorth, getEvent, previewCompany, pickEnding } from './state.js';

export const fmtB = (b) => { const sg = b < 0 ? '−' : '', a = Math.abs(b); return a >= 1000 ? `${sg}$${(a / 1000).toFixed(2)}T` : a >= 1 ? `${sg}$${a.toFixed(1)}B` : `${sg}$${Math.round(a * 1000)}M`; };
const sgn = (n, d = 1) => `${n >= 0 ? '+' : '−'}${Math.abs(n).toFixed(d)}`;
const pct = (v, d = 1) => `${(v * 100).toFixed(d)}%`;

// ---------- icons ----------
const P = {
  map: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18"/>',
  co: '<path d="M4 20V8l8-4 8 4v12M9 20v-6h6v6M9 10h.01M15 10h.01"/>',
  wallet: '<path d="M3 7h15a3 3 0 0 1 3 3v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 7l11-3v3"/><circle cx="16.5" cy="14" r="1"/>',
  probe: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 5 5"/>',
  doc: '<path d="M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h7"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  jet: '<path d="M2 14l9-2 5-8 2 1-2 8 5 3-1 2-6-1-3 5-2-1 1-6z"/>', think: '<path d="M3 10 12 4l9 6M5 10v8M10 10v8M14 10v8M19 10v8M3 20h18"/>',
  art: '<rect x="3" y="4" width="18" height="14" rx="2"/><path d="m3 15 5-5 4 4 3-3 6 5"/>', found: '<path d="M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 20 10c0 6-8 11-8 11z"/>',
  bunker: '<path d="M3 18c2-6 6-9 9-9s7 3 9 9zM12 9V5"/>', media: '<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8 21h8M12 17v4"/>',
  sound:'<path d="M4 9v6h4l5 4V5L8 9zM16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/>', mute:'<path d="M4 9v6h4l5 4V5L8 9zM17 9l5 6M22 9l-5 6"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>', spark: '<path d="m12 3 2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/>',
};
export const ic = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${P[n] || ''}</svg>`;

// ---------- avatars ----------
const AVC = { hero_auditor: '#cbd5e1', hero_engineer: '#cbd5e1', hero_analyst: '#cbd5e1', mira: '#f0a6ca', victor: '#9db4d6', jonah: '#6fcf97', lin: '#7fc4d9', dana: '#e58a7a', aria: '#ffb259', sage: '#7aa8ff', elias: '#d9d2c0', hero: '#cbd5e1' };
const INI = { mira: 'M', victor: 'V', jonah: 'J', lin: 'L', dana: 'D', elias: 'E', hero: 'E' };
export function av(id, size = 2.4, emo) {
  const key = id.startsWith('hero') || SPEC_HAS(id) ? id : 'hero';
  const bg = AVC[id] || (CAMEO[id.replace('cm_', '')] || {}).c || '#9db4d6';
  return `<div class="av ch" style="--s:${size}rem;--c:${bg}" title="${id === 'hero' ? '' : (CHARS[id] ? CHARS[id].kr : (CAMEO[id.replace('cm_', '')] || {}).kr || '')}">${art(key, emo)}</div>`;
}
const SPEC_HAS = (id) => !!(CHARS[id] || id.startsWith('cm_'));
export const coAv = (id, size = 2.4, emo) => `<div class="av ch sq" style="--s:${size}rem;--c:${COMP[id].color}">${art(id, emo)}</div>`;
export const portrait = (id, h = 18, emo, cls = '') => `<div class="portrait ${cls}" style="--h:${h}rem;--c:${AVC[id] || (CAMEO[id.replace('cm_', '')] || {}).c || '#9db4d6'}">${art(id, emo)}</div>`;
export { AVC };
export const heroId = (s) => (s && s.origin ? 'hero_' + s.origin : 'hero');

// ---------- effect chips ----------
const SL = { gov: '정부', tech: '기술', talent: '인재', bubble: '거품', intel: '정보', audit: '감사 위험' };
export function fxChips(fx) {
  if (!fx) return '';
  const out = [];
  for (const k of ['gov', 'tech', 'talent', 'bubble', 'intel', 'audit']) if (fx[k]) { const good = k === 'bubble' || k === 'audit' ? fx[k] < 0 : fx[k] > 0; out.push(`<span class="chip ${good ? 'good' : 'bad'}">${SL[k]} ${sgn(fx[k], 0)}</span>`); }
  if (fx.liquid) out.push(`<span class="chip ${fx.liquid > 0 ? 'good' : 'warn'}">내 현금 ${fx.liquid > 0 ? '+' : '−'}${fmtB(Math.abs(fx.liquid))}</span>`);
  if (fx.trust) for (const [k, v] of Object.entries(fx.trust)) if (v) out.push(`<span class="chip ${v > 0 ? 'good' : 'bad'}">${CHARS[k].kr.split(' ')[0]} ${sgn(v, 0)}</span>`);
  if (fx.comp) for (const [id, d] of Object.entries(fx.comp)) { if (d.g) out.push(`<span class="chip ${d.g > 0 ? 'good' : 'bad'}">${COMP[id].kr} 성장 ${sgn(d.g * 100, 1)}%p</span>`); if (d.reg) out.push(`<span class="chip ${d.reg < 0 ? 'good' : 'warn'}">${COMP[id].kr} 규제 ${sgn(d.reg, 0)}</span>`); }
  if (fx.levers) out.push('<span class="chip acc">전사 방향 조정</span>');
  return out.join('');
}

// ---------- shell ----------
const NAV = [['hub', 'map', '지도'], ['company', 'co', '회사'], ['wallet', 'wallet', '지갑'], ['invest', 'probe', '수사'], ['archive', 'doc', '기록']];
export const quarterLabel = (s) => QUARTERS[Math.min(s.turn, TOTAL_TURNS) - 1];
export const totalCash = (s) => COMPANIES.reduce((a, c) => a + s.comp[c.id].cash, 0);
export function shell(s, V, inner) {
  const nq = (s.pending ? 1 : 0) + s.eventQueue.length + s.letterQueue.length;
  const dm = s.last ? s.last.dM / 1000 : 0;
  const b = Math.round(s.stats.bubble), bc = b > 92 ? 'var(--bad)' : b > 80 ? 'var(--warn)' : 'var(--good)';
  const ticks = Array.from({ length: TOTAL_TURNS }, (_, i) => `<i class="${i + 1 < s.turn ? 'on' : i + 1 === s.turn ? 'cur' : ''}"></i>`).join('');
  return `<div class="rail"><div class="logo">C</div>${NAV.map(([id, icn, lab]) => `<button class="nav ${V.screen === id ? 'on' : ''}" data-act="go" data-to="${id}">${ic(icn)}${lab}${id === 'hub' && nq ? '<span class="dot"></span>' : ''}</button>`).join('')}<div class="sp"></div><button class="mute" data-act="mute" title="사운드">${ic(V.muted ? 'mute' : 'sound')}</button></div>
<div class="top"><div class="qtr"><b>${QUARTERS[Math.min(s.turn, TOTAL_TURNS) - 1]} <span class="muted" style="font-weight:500;font-size:.78rem">· ${s.turn}/${TOTAL_TURNS}</span></b><div class="ticks">${ticks}</div></div>
<div class="kpi"><small>제국 가치</small><b>$${(totalMcap(s) / 1000).toFixed(1)}T${s.last ? `<em class="${dm >= 0 ? 'good' : 'bad'}">${dm >= 0 ? '▲' : '▼'}${Math.abs(dm).toFixed(2)}</em>` : ''}</b></div>
<div class="kpi"><small>그룹 현금</small><b>${fmtB(totalCash(s))}</b></div>
<div class="kpi"><small>내 재산</small><b class="money">${fmtB(netWorth(s))}</b></div>
<div class="kpi"><small>거품 지수</small><b style="color:${bc}">${b}</b><div class="gauge"><i style="width:${Math.min(100, b)}%;background:${bc}"></i></div></div>
<div class="kpi"><small>정부 · 기술 · 인재</small><b>${Math.round(s.stats.gov)} · ${Math.round(s.stats.tech)} · ${Math.round(s.stats.talent)}</b></div>
<div class="kpi"><small>정보</small><b>${s.intel}</b></div>
<div class="sp"></div><button class="btn primary" data-act="end-turn">${nq ? `대화 ${nq}건 먼저` : '분기 마감'}${ic('arrow')}</button></div>
<div class="main">${inner}</div>`;
}

// ---------- hub ----------
export const HUBGROUP = { sv: ['NV', 'AP', 'GO', 'ME', 'BC', 'AN', 'OA'], sea: ['MS', 'AM'], oma: ['BK'], tw: ['TS'] };
const HUBINFO = { sv: ['실리콘밸리', '7개 기업'], sea: ['시애틀', '2개 기업'], oma: ['오마하', '버크셔'], tw: ['신주', 'TSMC'] };
export function hubNodes(s) {
  const side = { sv: 'r', sea: 'r', oma: 'r', tw: 'l' };
  return Object.keys(HUBGROUP).map((id) => ({ id, name: HUBINFO[id][0], sub: `$${(HUBGROUP[id].reduce((a, c) => a + s.comp[c].mcap, 0) / 1000).toFixed(1)}T`, side: side[id], alert: HUBGROUP[id].some((c) => s.comp[c].reg > 75) }));
}
export function queueItems(s) {
  const items = [];
  if (s.pending) items.push({ ...s.pending, cur: true });
  for (const id of s.letterQueue) items.push({ kind: 'letter', id });
  for (const id of s.eventQueue) items.push({ kind: 'event', id });
  return items;
}
export function hub(s, V) {
  const q = queueItems(s);
  const threads = q.length ? q.map((it) => {
    if (it.kind === 'letter') return `<div class="thread ${it.cur ? 'unread' : ''}" ${it.cur ? 'data-act="open-pending"' : ''}>${av('elias', 2.6)}<div class="t"><b>엘리아스 밴스 <span class="chip warn">편지</span></b><p>${LETTERS[it.id].title}</p></div>${it.cur ? '<span class="badge">1</span>' : '<span class="chip">대기</span>'}</div>`;
    const ev = getEvent(s, it.id), who = (ev.advisors || []).map((a) => a.who);
    const stack = who.length ? `<div class="stack">${who.slice(0, 3).map((w) => av(w, 2.2)).join('')}</div>` : av('mira', 2.6);
    return `<div class="thread ${it.cur ? 'unread' : ''}" ${it.cur ? 'data-act="open-pending"' : ''}>${stack}<div class="t"><b>${ev.title}</b><p>${ev.body}</p></div>${it.cur ? '<span class="badge">1</span>' : '<span class="chip">대기</span>'}</div>`;
  }).join('') : `<div class="empty-hero">${portrait(heroId(s), 8, 'happy')}<div>처리할 대화가 없습니다.<br>회사 레버와 배당을 점검한 뒤<br><b style="color:var(--text)">분기 마감</b>을 누르세요.</div></div>`;
  const goals = [
    [!s.pending && !s.eventQueue.length && !s.letterQueue.length, '대화 모두 처리', '자문단의 의견을 듣고 결정한다'],
    [V.levSeen, '회사 레버 점검', '기대치(전분기 이익 × 성장)를 넘길 수 있는지 확인'],
    [V.paySeen, '배당 비율 확인', `지금 ${s.payout}% · 40% 초과 시 감사 위험`],
  ].map(([d, t, sub]) => `<div class="goal ${d ? 'done' : ''}"><i>${d ? '✓' : ''}</i><div>${t}<small>${sub}</small></div></div>`).join('');
  const news = s.last ? `<div class="goal" style="border-top:1px solid var(--line);margin-top:.3rem"><i style="border:0"></i><div>지난 분기 ${s.last.quarter}<small>순이익 ${fmtB(s.last.netIncome)} · 제국 가치 ${sgn(s.last.dM / 1000, 2)}T${s.last.crashMsg ? ' · ' + s.last.crashMsg : ''}</small></div></div>` : '';
  const ppl = ['mira', 'victor', 'jonah', 'lin', 'dana', 'sage', 'aria'].map((k) => { const v = Math.round(s.trust[k]), c = v >= 60 ? 'var(--good)' : v >= 40 ? 'var(--warn)' : 'var(--bad)'; return `<div class="row">${av(k, 1.9, emoOfTrust(v))}<div class="nm">${CHARS[k].kr.split(' ')[0]}<small>${CHARS[k].tag}</small></div><div class="meter"><i style="width:${v}%;background:${c}"></i></div><span class="mono muted" style="width:1.6rem;text-align:right">${v}</span></div>`; }).join('');
  const hl = headlines(s).map((h) => `<span>${h}</span>`).join('');
  return `<div class="hub"><div class="mapslot" id="mapslot"><div class="ticker"><b>LIVE</b><div class="tk"><div class="tk-in">${hl}${hl}</div></div></div></div>
<div class="dock"><div class="panel"><div class="ph"><span>대화함</span><span class="chip ${q.length ? 'acc' : ''}">${q.length}</span></div><div class="body">${threads}</div></div>
<div class="panel"><div class="ph"><span>이번 분기</span></div><div class="body">${goals}${news}</div></div>
<div class="panel"><div class="ph"><span>사람들 · 신뢰</span></div><div class="body">${ppl}</div></div></div>
${V.pop ? hubPop(s, V.pop) : ''}</div>`;
}
function hubPop(s, p) {
  return `<div class="pop" style="left:${p.x}px;top:${p.y}px"><div class="ph" style="padding:.4rem .6rem">${HUBINFO[p.id][0]}</div>${HUBGROUP[p.id].map((c) => `<div class="row" data-act="pick-company" data-id="${c}" data-go="1">${coAv(c, 1.9)}<div class="nm">${COMP[c].kr}<small>${COMP[c].desc}</small></div><span class="mono muted">$${(s.comp[c].mcap / 1000).toFixed(2)}T</span></div>`).join('')}</div>`;
}

// ---------- company ----------
function spark(vals, color, w = 300, h = 70) {
  const mn = Math.min(...vals), mx = Math.max(...vals), r = mx - mn || 1;
  const pts = vals.map((v, i) => [(i / (vals.length - 1)) * w, h - 6 - ((v - mn) / r) * (h - 14)]);
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('');
  return `<svg viewBox="0 0 ${w} ${h}" style="width:100%;height:${h}px"><defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".35"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs><path d="${d}L${w},${h}L0,${h}Z" fill="url(#sg)"/><path d="${d}" fill="none" stroke="${color}" stroke-width="2"/><circle cx="${pts.at(-1)[0]}" cy="${pts.at(-1)[1]}" r="3.5" fill="${color}"/></svg>`;
}
export function previewHTML(s, id) {
  const st = s.comp[id], c = COMP[id], p = previewCompany(s, id, st.lev), exp = st.profit * (1 + c.g), beat = exp !== 0 ? (p.profit - exp) / Math.abs(exp) : 0;
  const verdict = beat >= 0.02 ? ['good', '기대치 상회 예상'] : beat <= -0.02 ? ['bad', '기대치 하회 위험'] : ['warn', '기대치 부근'];
  return `<div class="fc">다음 분기 예상 · 매출 <b>${fmtB(p.rev)}</b> (${pct(p.g)} 성장)<br>이익 <b class="${p.profit >= 0 ? '' : 'bad'}">${fmtB(p.profit)}</b> · 마진 <b>${pct(p.nm)}</b> · 현금 변화 <b>${sgn(p.cash)}B</b><br>가동률 <b>${Math.round(p.cap)}%</b> · 규제 열기 <b>${Math.round(p.reg)}</b><br><span class="chip ${verdict[0]}" style="margin-top:.5rem">${verdict[1]} · 기대 ${fmtB(exp)}</span></div>`;
}
export function company(s, V) {
  const id = V.company, c = COMP[id], st = s.comp[id];
  const list = COMPANIES.map((x) => { const m = s.comp[x.id]; return `<div class="co ${x.id === id ? 'on' : ''}" data-act="pick-company" data-id="${x.id}">${coAv(x.id, 2.3)}<div><b>${x.kr}</b><small>${x.desc}</small></div><div class="v">$${(m.mcap / 1000).toFixed(2)}T<small class="${m.profit >= 0 ? 'good' : 'bad'}">${m.profit >= 0 ? '이익' : '적자'} ${fmtB(Math.abs(m.profit))}</small></div></div>`; }).join('');
  const k = (l, v, e = '') => `<div class="k"><small>${l}</small><b>${v}</b>${e}</div>`;
  const levers = LEVERS.map((l) => `<div class="lv"><div class="t">${l.kr}<span id="lv-${l.id}">${st.lev[l.id]}</span></div><input type="range" min="0" max="100" step="2" value="${st.lev[l.id]}" data-lev="${l.id}" style="--p:${st.lev[l.id]}%"><small>${l.hint}</small></div>`).join('');
  const hist = st.hist.map((h) => h.profit);
  return `<div class="view"><div class="split"><div class="panel list">${list}</div><div class="detail">
<div class="panel dh">${coAv(id, 3.6)}<div><h2>${c.kr}</h2><span class="muted">${c.en} · ${c.desc}${c.pub ? '' : ' · 비상장'}</span></div><div class="big">$${(st.mcap / 1000).toFixed(2)}T<small>시가총액</small></div></div>
<div class="kpis">${k('매출/분기', fmtB(st.rev))}${k('순이익', fmtB(st.profit))}${k('마진', pct(st.nm + st.nmb, 0))}${k('성장', pct(st.g + st.gb))}${k('현금', fmtB(st.cash))}${k('가동률', Math.round(st.cap) + '%')}${k('사기', Math.round(st.morale))}${k('규제', Math.round(st.reg))}</div>
<div class="cols"><div class="panel"><div class="ph"><span>경영 레버</span><button class="chip" data-act="reset-levers">초기화</button></div><div class="lev">${levers}</div></div>
<div style="display:flex;flex-direction:column;gap:1rem"><div class="panel"><div class="ph"><span>이익 추이 · 8분기</span></div><div style="padding:0 1.1rem 1rem">${spark(hist, c.color)}</div></div><div class="panel"><div class="ph"><span>다음 분기 시뮬레이션</span></div><div id="prev">${previewHTML(s, id)}</div></div></div></div></div></div></div>`;
}

// ---------- wallet ----------
export function wallet(s) {
  const eq = totalMcap(s) / 1000 * 0.65, nw = netWorth(s);
  const parts = [['현금', s.me.liquid, '#f3c978'], ['개인 펀드', s.me.fund, '#86aefc'], ['컴팩트 지분(신탁)', eq, '#62d6a1'], ['자산', s.me.assetsValue, '#c79bff']];
  const pubProfit = COMPANIES.filter((c) => c.pub).reduce((a, c) => a + Math.max(0, s.comp[c.id].profit), 0);
  const estDiv = pubProfit * s.payout / 100 * 0.0033;
  const audit = Math.min(100, s.audit);
  const shop = SHOP.map((it) => { const own = s.me.assets.includes(it.id), can = s.me.liquid >= it.cost; return `<div class="asset"><div class="ic">${ic(it.id)}</div><div><b>${it.kr}</b><small>${it.desc}</small></div>${own ? '<span class="chip good">보유</span>' : `<button class="btn ${can ? '' : 'off'}" style="height:2rem;padding:0 .9rem" data-act="buy" data-id="${it.id}">${fmtB(it.cost)}</button>`}</div>`; }).join('');
  return `<div class="view"><div class="wallet">
<div class="col"><div class="panel nw"><small>내 순자산</small><div class="n">${fmtB(nw)}</div><div class="stackbar">${parts.map(([, v, c]) => `<i style="flex:${Math.max(v, 0.01)};background:${c}"></i>`).join('')}</div><div class="leg">${parts.map(([l, v, c]) => `<span><i style="background:${c}"></i>${l}</span><span>${fmtB(v)}</span>`).join('')}</div></div>
<div class="panel"><div class="ph"><span>지난 분기 수입</span></div>${s.last ? `<div class="leg" style="padding:0 1.2rem 1.1rem;margin:0"><span>급여</span><span>${fmtB(s.last.take.salary)}</span><span>배당</span><span>${fmtB(s.last.take.div)}</span><span>성과보수</span><span>${fmtB(s.last.take.carry)}</span><span>펀드 손익</span><span>${fmtB(s.last.take.fund)}</span></div>` : '<div style="padding:0 1.2rem 1.1rem;color:var(--muted);font-size:.84rem">첫 분기 마감 후 표시됩니다.</div>'}</div></div>
<div class="col"><div class="panel pay"><div class="ph" style="padding:0">배당 · 현금 환원</div><div style="display:flex;align-items:baseline;gap:.8rem;margin-top:.4rem"><span class="mono" style="font-size:2.4rem;font-weight:600" id="payv">${s.payout}%</span><span class="muted">상장사 순이익 중 주주에게 분배</span></div>
<div class="cap"><div class="zone"></div><input type="range" min="0" max="80" step="2" value="${s.payout}" data-payout="1" style="--p:${s.payout / 80 * 100}%"><div class="capmark"></div></div><div class="muted" style="font-size:.72rem;display:flex;justify-content:space-between"><span>0%</span><span style="color:var(--bad);margin-left:20%">헌장 상한 40%</span><span>80%</span></div>
<div class="leg" style="margin-top:1rem"><span>예상 내 배당 / 분기</span><span class="money">${fmtB(estDiv)}</span></div></div>
<div class="panel"><div class="ph"><span>리스크</span></div><div class="risk-row"><span>감사 위험</span><div class="meter" style="width:100%"><i style="width:${audit}%;background:${audit > 60 ? 'var(--bad)' : audit > 30 ? 'var(--warn)' : 'var(--good)'}"></i></div><span class="mono">${Math.round(s.audit)}</span></div><div class="risk-row"><span>정부 관계</span><div class="meter" style="width:100%"><i style="width:${s.stats.gov}%;background:var(--accent)"></i></div><span class="mono">${Math.round(s.stats.gov)}</span></div><div class="risk-row"><span>거품 지수</span><div class="meter" style="width:100%"><i style="width:${Math.min(100, s.stats.bubble)}%;background:${s.stats.bubble > 92 ? 'var(--bad)' : 'var(--warn)'}"></i></div><span class="mono">${Math.round(s.stats.bubble)}</span></div><div style="height:.6rem"></div></div></div>
<div class="col"><div class="panel"><div class="ph"><span>자산 · 투자</span><span class="chip warn">현금 ${fmtB(s.me.liquid)}</span></div>${shop}</div></div></div></div>`;
}

// ---------- investigation ----------
const POS = { victor: [50, 14], mira: [84, 38], jonah: [72, 82], lin: [28, 82], aria: [16, 38] };
export function invest(s, V) {
  const sel = V.suspect, ck = SUSPECTS.map((k) => s.clues[k]);
  const lines = SUSPECTS.map((k) => `<line x1="50" y1="50" x2="${POS[k][0]}" y2="${POS[k][1]}" stroke="${k === sel ? '#86aefc' : '#fff'}" stroke-opacity="${k === sel ? 0.8 : 0.08 + Math.min(0.5, s.clues[k] * 0.07)}" stroke-width="${0.25 + Math.min(1.2, s.clues[k] * 0.15)}" ${s.clues[k] ? '' : 'stroke-dasharray="1.2 1.4"'} vector-effect="non-scaling-stroke"/>`).join('');
  const nodes = SUSPECTS.map((k) => `<button class="gnode ${k === sel ? 'on' : ''}" style="left:${POS[k][0]}%;top:${POS[k][1]}%" data-act="pick-suspect" data-id="${k}">${av(k, 3.4, k === sel ? 'worried' : emoOfTrust(s.trust[k]))}<b>${CHARS[k].kr.split(' ')[0]}</b><small>${CHARS[k].role} · 단서 ${s.clues[k]}</small></button>`).join('');
  const logs = s.clueLog.filter((l) => l.who === sel);
  const can = s.intel >= 1;
  return `<div class="view"><div class="graph"><div class="gwrap"><svg viewBox="0 0 100 100" preserveAspectRatio="none" style="position:absolute;inset:0;width:100%;height:100%">${lines}</svg>
<div class="gnode" style="left:50%;top:50%"><div class="kes">KESTREL</div></div>${nodes}</div>
<div class="panel" style="display:flex;flex-direction:column;overflow:hidden"><div class="ph"><span>용의자 파일</span><span class="chip warn">정보 ${s.intel}</span></div>
<div style="display:flex;gap:1rem;align-items:center;padding:.4rem 1.1rem 1rem">${av(sel, 3.6)}<div><b style="font-size:1.1rem">${CHARS[sel].kr}</b><div class="muted" style="font-size:.78rem">${CHARS[sel].role} · 신뢰 ${Math.round(s.trust[sel])}</div></div></div>
<div style="padding:0 1.1rem 1rem"><button class="btn ${can ? 'primary' : 'off'}" style="width:100%" data-act="investigate" data-id="${sel}">정보 1 사용 — 조사한다</button>${V.note ? `<div class="sys res" style="margin-top:.8rem;text-align:left">${V.note}</div>` : ''}</div>
<div class="ph"><span>수집한 단서</span><span class="chip">${logs.length}</span></div><div style="overflow:auto;flex:1">${logs.length ? logs.map((l) => `<div class="clue"><i>●</i><div>${l.text}<small>${QUARTERS[l.turn - 1]}</small></div></div>`).join('') : '<div class="clue muted">아직 단서가 없습니다.</div>'}</div></div></div></div>`;
}

// ---------- archive ----------
export function archive(s, V) {
  const tab = V.arch || 'letters';
  const tabs = `<div style="display:flex;gap:.4rem;padding:.2rem .4rem .6rem"><button class="chip ${tab === 'letters' ? 'acc' : ''}" data-act="arch" data-t="letters">편지 ${s.letters.length}/7</button><button class="chip ${tab === 'people' ? 'acc' : ''}" data-act="arch" data-t="people">인물</button></div>`;
  if (tab === 'people') {
    return `<div class="view"><div style="margin-bottom:1rem">${tabs}</div><div class="people">${Object.keys(CHARS).filter((k) => k !== 'elias').map((k) => `<div class="panel pcard">${av(k, 4.4, emoOfTrust(s.trust[k]))}<div style="flex:1"><h3>${CHARS[k].kr}</h3><div class="muted" style="font-size:.78rem">${CHARS[k].role}</div><p>${CHARS[k].tag}</p><div class="meter" style="width:100%;margin-top:.7rem"><i style="width:${s.trust[k]}%;background:var(--accent)"></i></div></div><span class="mono muted">${Math.round(s.trust[k])}</span></div>`).join('')}</div></div>`;
  }
  const sel = V.letter && s.letters.includes(V.letter) ? V.letter : s.letters[0];
  const items = Array.from({ length: 7 }, (_, i) => { const id = 'L' + (i + 1), L = LETTERS[id], open = s.letters.includes(id); return `<div class="doc-i ${open ? '' : 'lock'} ${id === sel ? 'on' : ''}" ${open ? `data-act="read-letter" data-id="${id}"` : ''}>${av('elias', 2.2)}<div><b style="font-size:.86rem">${open && L ? L.title : '봉인된 편지 ' + (i + 1)}</b><div class="muted" style="font-size:.7rem">${open ? '열람 가능' : '아직 열 수 없음'}</div></div></div>`; }).join('');
  const L = sel && LETTERS[sel];
  return `<div class="view"><div class="docs"><div class="panel" style="padding:.7rem;overflow:auto">${tabs}${items}</div><div class="panel reader">${L ? `<div class="eyebrow">LETTER ${L.n}</div><h2>${L.title}</h2><div class="tx">${L.text}</div><div class="sig">— ${L.sig}</div>` : '<div class="muted">아직 열어 본 편지가 없습니다.</div>'}</div></div></div>`;
}

// ---------- full screens ----------
export function title(hasSave, endings, muted) {
  return `<div class="screen"><button class="mute float" data-act="mute">${ic(muted ? 'mute' : 'sound')}</button><div class="full-map" id="mapslot"></div><div class="shade"></div>
<div class="title-wrap"><div class="eyebrow">A STORY OF POWER &amp; MONEY</div><div class="wordmark">THE<br>COMPACT</div><div class="tagline">열한 개의 불, 한 사람의 손</div>
<p class="lede">세계의 지능을 쥔 열한 개 기업이 단 한 사람에게 상속되었다.<br>회사를 키우고, 재산을 쌓고, 사람을 믿고 의심하라. 그리고 마지막 편지를 열어라.</p>
<div class="title-actions"><button class="btn primary big" data-act="new">새 게임 ${ic('arrow')}</button><button class="btn big ${hasSave ? '' : 'off'}" data-act="continue">이어하기</button></div>
<div class="dots11">${COMPANIES.map((c) => coAv(c.id, 2.5)).join('')}</div></div>
<div class="lineup">${['mira', 'victor', 'hero', 'jonah', 'lin', 'aria', 'sage'].map((k, i) => `<div class="lu ${k === 'hero' ? 'star' : ''}" style="animation-delay:${i * 120 + 600}ms">${portrait(k, k === 'hero' ? 20 : 14)}<small>${k === 'hero' ? '에단 류' : CHARS[k].kr.split(' ')[0]}</small></div>`).join('')}</div>
<div class="quote-side" style="display:none">"이 열한 개의 불을 한곳에 두어라.<br>마지막 편지를 열기 전에는 아무도 믿지 마라."<br><span class="muted">— 엘리아스 밴스, 유언장</span></div>
<div class="fine">모든 인물과 사건은 허구이며, 기업명은 가상의 시나리오를 위해 사용되었습니다. · 엔딩 ${endings}/5</div></div>`;
}
export function origin(sel, name) {
  const o = ORIGINS[sel];
  const opts = Object.entries(ORIGINS).map(([k, v]) => `<button class="opt ${k === sel ? 'on' : ''}" data-act="pick-origin" data-id="${k}"><b>${v.kr}</b> <span class="muted" style="font-size:.7rem;letter-spacing:.14em">${v.en}</span><small>${v.blurb}</small></button>`).join('');
  return `<div class="screen"><div class="full-map" id="mapslot"></div><div class="shade"></div><div class="origin"><div><div class="eyebrow">CHAPTER 0 · 당신은 누구였나</div><h2>상속자의 과거</h2><p class="muted" style="line-height:1.8">유언장에는 당신의 이름만 적혀 있었다. 열한 개의 불을 쥐기 전, 당신은 어떤 사람이었는가?</p>
<div class="field"><label>이름</label><input id="nameinput" value="${name}" maxlength="12"></div>${opts}</div>
<div style="align-self:end;position:relative"><div class="origin-hero">${portrait('hero_' + sel, 22, 'smug')}</div><div class="panel trait"><div class="eyebrow">TRAIT</div><h3>${o.trait}</h3><p>${o.traitDesc}</p></div><div style="margin-top:1.2rem;display:flex;gap:.7rem"><button class="btn" data-act="to-title">뒤로</button><button class="btn primary big" style="flex:1" data-act="start-game">이 사람으로 시작 ${ic('arrow')}</button></div></div></div></div>`;
}
export function scene(step, name, idx, total) {
  const who = step.who;
  const emo = step.emo;
  const sp = who === 'narr' ? '' : `<div class="speaker">${av(who, 2.4, emo)}<span>${CHARS[who].kr}</span><small>${CHARS[who].role}</small></div>`;
  const ch = step.choices ? `<div class="choices">${step.choices.map((c, i) => `<button class="choice" style="animation-delay:${i * 90}ms" data-act="vn-choice" data-i="${i}">${c.text}<small>${c.sub}</small></button>`).join('')}</div>` : '';
  const pt = who === 'narr' ? '' : portrait(who, 26, emo, 'big');
  const me = step.choices ? `<div class="scene-me">${portrait('hero_' + (window.__origin || 'engineer'), 20, 'worried')}</div>` : '';
  return `<div class="screen"><div class="scene">${backdrop(idx < 3 ? 'office' : 'alley')}${pt}${me}<div class="loc">PROLOGUE · 오마하 · ${idx + 1}/${total}</div><button class="btn skip" data-act="skip-vn">건너뛰기</button>
<div class="stage-text" ${step.choices ? '' : 'data-act="vn-next"'}>${sp}<div class="line ${who === 'narr' ? 'narr' : ''}" key="${idx}">${step.text}</div>${ch}${step.choices ? '' : '<div class="hintc">클릭하거나 Enter · 계속</div>'}</div></div></div>`;
}
export function letterModal(id, ctx) {
  const L = LETTERS[id];
  return `<div class="modal letter-modal" data-act="close-letter"><div class="letter-wrap"><div class="letter-elias">${portrait('elias', 15, 'neutral')}<small>엘리아스 밴스<br><span>1951 — 2026</span></small></div>
<div class="card letter-card"><div class="seal">EV</div><div class="eyebrow">LETTER ${L.n} / 7</div><h2>${L.title}</h2><div class="tx">${L.text}</div><div class="sig">— ${L.sig}</div><button class="btn primary" data-act="close-letter">편지를 접는다</button></div></div></div>`;
}
export function helpModal() {
  return `<div class="modal"><div class="help-wrap"><div class="help-mira">${portrait('mira', 17, 'happy')}<div class="speech">"처음이시죠? 제가 순서를 알려 드릴게요."</div></div><div class="card"><div class="eyebrow">HOW TO PLAY · 미라의 안내</div><h2>분기마다 이렇게 진행됩니다</h2><ol><li><b>대화함</b>의 이야기를 열고 자문단의 의견을 들은 뒤 결정합니다.</li><li><b>회사</b> 탭에서 레버(투자·연구·가격…)를 조정합니다. 기대치를 넘기면 시장이 반응합니다.</li><li><b>지갑</b> 탭에서 배당과 자산을 정합니다. 40%를 넘기면 감사 위험이 쌓입니다.</li><li><b>수사</b> 탭에서 정보를 써 켈스트럴의 첩자를 추적합니다.</li><li>준비되면 오른쪽 위 <b>분기 마감</b>. 12분기 뒤에 결말이 결정됩니다.</li></ol><button class="btn primary big" style="margin-top:1.2rem" data-act="close-help">시작한다</button></div></div></div>`;
}
export function earnings(s) {
  const r = s.last;
  const rows = r.rows.map((x, i) => { const w = Math.max(6, Math.min(100, 50 + x.beat * 250)), v = x.beat >= 0.02 ? ['good', 'BEAT'] : x.beat <= -0.02 ? ['bad', 'MISS'] : ['warn', 'IN LINE']; return `<div class="cr" style="animation-delay:${i * 60}ms"><span class="crn">${coAv(x.id, 1.7, x.beat >= 0.02 ? 'happy' : x.beat <= -0.02 ? 'worried' : 'neutral')}${COMP[x.id].kr}</span><div class="bt"><i style="width:${w}%;color:var(--${v[0]});background:var(--${v[0]})"></i><u></u></div><span class="mono">${fmtB(x.profit)}</span><span class="chip ${v[0]}">${v[1]}</span></div>`; }).join('');
  return `<div class="sheet ${r.crashMsg && r.crashMsg.includes('💥') ? 'crash' : ''}"><div><h2>EARNINGS DAY · ${r.quarter}</h2><h1>${r.crashMsg ? r.crashMsg : '분기 실적 발표'}</h1>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:1.6rem"><div class="bign"><small>그룹 매출</small><span data-count="${r.revenue}">${fmtB(r.revenue)}</span></div><div class="bign"><small>순이익</small><span data-count="${r.netIncome}">${fmtB(r.netIncome)}</span></div></div>
<div class="bign" style="margin-top:1.4rem"><small>제국 가치 ${sgn(r.dM / 1000, 2)}T</small>$${(r.mcap / 1000).toFixed(2)}T</div>
<div style="margin-top:1.6rem" class="muted">막대 가운데 선 = 시장 기대치</div>${rows}</div>
<div style="position:relative"><div class="earn-hero">${portrait(heroId(s), 13, r.crashMsg && r.crashMsg.includes('💥') ? 'shock' : r.take.total > 0.3 ? 'happy' : 'smug')}</div><h2>YOUR TAKE</h2><h1>이번 분기 내 몫</h1><div class="leg" style="font-size:.95rem;gap:.7rem 1rem"><span>급여</span><span>${fmtB(r.take.salary)}</span><span>배당 (${r.payout}%)</span><span>${fmtB(r.take.div)}</span><span>성과보수</span><span>${fmtB(r.take.carry)}</span><span>개인 펀드 손익</span><span class="${r.take.fund >= 0 ? 'good' : 'bad'}">${fmtB(r.take.fund)}</span>${r.take.short ? `<span>공매도 수익</span><span class="good">${fmtB(r.take.short)}</span>` : ''}</div>
<div class="take"><div class="bign"><small>이번 분기 합계</small><span data-count="${r.take.total}">${fmtB(r.take.total)}</span></div></div>
<div class="bign" style="margin-top:2rem"><small>내 순자산</small>${fmtB(r.nwBefore)} → <span class="money">${fmtB(r.nwAfter)}</span></div>
<button class="btn primary big" style="margin-top:2.4rem" data-act="next-turn">${s.turn >= TOTAL_TURNS ? '결말을 본다' : '다음 분기로'} ${ic('arrow')}</button></div></div>`;
}
const END_SCENE = { soft: 'office', emperor: 'boardroom', crash: 'trading', alone: 'gala', prototype: 'alley' };
export function ending(s) {
  const r = pickEnding(s), e = r.e;
  const sc = (l, v, g) => `<div class="panel score"><small>${l}</small><b>${v}<em>${g}</em></b></div>`;
  const hist = s.history;
  const cast = ['mira', 'victor', 'jonah', 'lin', 'sage', 'aria'].map((k, i) => { const mood = k === s.mole && s.flags.mole_found ? 'angry' : emoOfTrust(s.trust[k]); return `<div class="lu" style="animation-delay:${400 + i * 140}ms">${portrait(k, 12, mood)}<small>${CHARS[k].kr.split(' ')[0]} · ${Math.round(s.trust[k])}</small></div>`; }).join('');
  const heroMood = r.key === 'soft' ? 'happy' : r.key === 'crash' ? 'shock' : r.key === 'alone' ? 'worried' : 'smug';
  return `<div class="ending">${backdrop(END_SCENE[r.key] || 'office', { bokeh: 30 })}<div class="end-shade"></div><div class="end-in"><div class="en">ENDING ${e.n} / 5</div><h1>${e.title}</h1><div class="sub2">${e.en}</div>
<div class="story">${e.text.map((t) => `<p>${t}</p>`).join('')}</div><div class="q">${e.quote}</div>
<div class="scores">${sc('제국 가치', '$' + r.empire.toFixed(1) + 'T', r.grades.empire)}${sc('내 재산', fmtB(r.wealth), r.grades.wealth)}${sc('유산', Math.round(r.legacy), r.grades.legacy)}</div>
<div class="panel" style="max-width:46rem;margin:1.4rem 0;padding:1rem 1.3rem"><div class="muted" style="font-size:.7rem;letter-spacing:.1em;text-transform:uppercase;font-weight:700">제국 가치 추이</div>${spark(hist.map((h) => h / 1000), '#86aefc', 600, 90)}</div>
<div class="after">${['mira', 'victor', 'jonah', 'lin', 'sage', 'aria'].map((k) => `<div>${av(k, 2.6, k === s.mole && s.flags.mole_found ? 'angry' : emoOfTrust(s.trust[k]))}<span><b>${CHARS[k].kr.split(' ')[0]}</b>신뢰 ${Math.round(s.trust[k])}${k === s.mole ? ' · 첩자' : ''}</span></div>`).join('')}</div><div class="mole-line">${s.flags.mole_found ? `켈스트럴의 첩자는 <b>${CHARS[s.mole].kr}</b>였고, 당신이 밝혀냈다.` : `켈스트럴의 첩자는 <b>${CHARS[s.mole].kr}</b>였다. ${s.flags.mole_wrong ? '당신은 엉뚱한 사람을 지목했다.' : '끝내 아무도 몰랐다.'}`}</div>
<button class="btn primary big" data-act="to-title">처음으로</button></div>
<div class="end-hero">${portrait(heroId(s), 24, heroMood)}</div><div class="lineup end-cast">${cast}</div></div>`;
}

// ---------- headlines / interstitial / chat banner ----------
const FLAVOR = ['실리콘밸리 임대료 또 사상 최고', '"AI가 내 일자리를?" 여론조사 61% 우려', '오마하 스테이크하우스, 억만장자 단골 늘어', '반도체 장비 수출 규제 논의 재점화', '신주 공항, 전세기 이착륙 3배 증가', '월가 애널리스트 "컴팩트, 실체는 있는가"', '전력망 운영사 "AI 수요 예측 불가"', '대학가 AI 전공 지원자 사상 최다'];
export function headlines(s) {
  const h = [];
  if (s.last) {
    const d = s.last.dM / 1000;
    h.push(d >= 0 ? `컴팩트 제국 가치 ${sgn(d, 2)}T — 시장 "아직 배고프다"` : `컴팩트 제국 가치 ${sgn(d, 2)}T 증발 — 투자자 불안`);
    const best = [...s.last.rows].sort((a, b) => b.beat - a.beat)[0], worst = [...s.last.rows].sort((a, b) => a.beat - b.beat)[0];
    h.push(`${COMP[best.id].kr} 실적 서프라이즈, 시간외 강세`);
    if (worst.beat < -0.02) h.push(`${COMP[worst.id].kr} 기대치 하회 — "투자 부담 커졌다"`);
    if (s.last.crashMsg) h.push(s.last.crashMsg.replace(/[💥📉] ?/, '') + ' — 긴급 속보');
  }
  if (s.stats.bubble > 92) h.push(`AI 거품 경고음 — 거품 지수 ${Math.round(s.stats.bubble)}`); else if (s.stats.bubble > 80) h.push('"AI 랠리 어디까지?" 낙관과 경계 교차');
  if (s.stats.gov < 30) h.push('워싱턴, 컴팩트 겨냥 반독점 청문회 검토');
  if (s.audit > 30) h.push('감사위원회, 배당 정책에 의문 제기');
  if (s.log.length) { const L = s.log[s.log.length - 1]; h.push(`[${QUARTERS[L.turn - 1]}] ${L.choice}`); }
  for (let i = 0; h.length < 6; i++) h.push(FLAVOR[(s.turn * 3 + i) % FLAVOR.length]);
  return h;
}
const INTER_SCENE = ['boardroom', 'trading', 'datacenter', 'strait', 'senate', 'fab', 'office', 'gala', 'trading', 'boardroom', 'interrogate', 'office'];
export function interstitial(s) {
  const q = QUARTERS[Math.min(s.turn, TOTAL_TURNS) - 1], hl = headlines(s).slice(0, 3);
  const mood = s.stats.bubble > 92 ? 'worried' : s.last && s.last.dM < 0 ? 'angry' : 'smug';
  return `<div class="inter" data-act="inter-next">${backdrop(INTER_SCENE[(s.turn - 1) % INTER_SCENE.length], { bokeh: 26 })}<div class="inter-shade"></div>
<div class="inter-in"><div class="eyebrow">QUARTER ${s.turn} / ${TOTAL_TURNS}</div><div class="inter-q">${q}</div><div class="inter-bar"><i style="width:${s.turn / TOTAL_TURNS * 100}%"></i></div>
<div class="inter-hl">${hl.map((t, i) => `<div style="animation-delay:${600 + i * 220}ms"><span>${i === 0 ? 'BREAKING' : 'NEWS'}</span>${t}</div>`).join('')}</div><div class="hintc">클릭하여 계속</div></div>
<div class="inter-hero">${portrait(heroId(s), 30, mood)}</div></div>`;
}
export function chatBanner(ev, id, emo = {}) {
  const who = id === 'accuse' ? SUSPECTS : (ev.advisors || []).map((a) => a.who);
  const kind = SCENE_OF[id] || 'office';
  if (id === 'accuse') for (const k of SUSPECTS) emo[k] = emo[k] || 'worried';
  const sz = who.length > 3 ? 8.2 : 10.5;
  const cast = who.map((w, i) => `<div class="actor" data-who="${w}" style="--i:${i};animation-delay:${200 + i * 160}ms">${portrait(w, sz, emo[w] || 'neutral')}<small>${CHARS[w].kr.split(' ')[0]}</small></div>`).join('');
  return `<div class="banner">${backdrop(kind, { bokeh: 16 })}<div class="bn-shade"></div><div class="cast">${cast}</div><div class="bn-t"><small>${ev.kicker}</small><b>${ev.title}</b></div></div>`;
}
