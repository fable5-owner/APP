// Screen templates (pure functions returning HTML strings).
import { CH, aiOrb, shade } from './portraits.js';
import { COMPANIES, CHARS, ORIGINS, SHOP, LEVERS, LETTERS, EVENTS, QUARTERS, TOTAL_TURNS, SUSPECTS } from './data.js';
import { COMP, totalMcap, netWorth, getEvent, previewCompany, pickEnding } from './state.js';

// ---- art overrides: drop art/<id>.png|jpg|webp (hero, mira, victor, jonah, lin, dana, elias, aria, sage) ----
export const ART = {};
// Optional real artwork: put files in art/ and list them in art/manifest.json, e.g. {"hero":"hero.png","mira":"mira.jpg"}
export async function probeArt() {
  if (window.COMPACT_NO_ART) return;
  try {
    const r = await fetch('art/manifest.json'); if (!r.ok) return;
    const m = await r.json();
    for (const [id, file] of Object.entries(m)) ART[id] = `art/${file}`;
  } catch (e) { /* no custom art */ }
}

export const fmtB = (b) => { const sg = b < 0 ? '−' : '', a = Math.abs(b); return a >= 1000 ? `${sg}$${(a / 1000).toFixed(2)}T` : a >= 1 ? `${sg}$${a.toFixed(1)}B` : `${sg}$${Math.round(a * 1000)}M`; };
const signed = (n, d = 1) => `${n >= 0 ? '+' : '−'}${Math.abs(n).toFixed(d)}`;
const bar = (p, c) => `<div class="bar"><i style="width:${Math.max(0, Math.min(100, p))}%;background:${c || '#c9a45a'}"></i></div>`;

export function portraitSVG(id, w, h, opts = {}) {
  if (ART[id]) return `<img class="artimg" src="${ART[id]}" style="width:${w}px;height:${h}px;object-fit:cover;object-position:center 20%">`;
  if (id === 'hero') return CH.hero({ w, h, ...opts });
  const c = CHARS[id];
  if (c.orb) return aiOrb(c.orb[0], c.orb[1], id, w);
  return CH[c.preset]({ w, h, ...opts });
}
export function portFrame(id, w, label, sub, opts) {
  return `<div class="frame" style="width:${w + 8}px">${portraitSVG(id, w, w * 1.3, opts)}${label ? `<div class="cap">${label}${sub ? `<small>${sub}</small>` : ''}</div>` : ''}</div>`;
}
export function avatar(id, size, opts) {
  if (ART[id]) return `<div style="width:${size}px;height:${size}px;border-radius:50%;overflow:hidden;border:3px solid var(--gold);box-shadow:0 4px 10px #000a;flex:none"><img class="artimg" src="${ART[id]}" style="object-position:center 18%"></div>`;
  const isOrb = id !== 'hero' && CHARS[id].orb;
  const w = isOrb ? size * 1.5 : size * 1.7;
  const dx = isOrb ? -size * 0.25 : -size * 0.35, dy = isOrb ? -size * 0.38 : -size * 0.43;
  return `<div style="width:${size}px;height:${size}px;border-radius:50%;overflow:hidden;border:3px solid var(--gold);box-shadow:0 4px 10px #000a;flex:none;position:relative;background:#241810"><div style="position:absolute;left:${dx}px;top:${dy}px">${portraitSVG(id, w, w * 1.3)}</div></div>`;
}
export function seal(code, col, sz = 44) { return `<div class="seal" style="width:${sz}px;height:${sz}px;font-size:${sz * 0.34}px;background:radial-gradient(circle at 35% 30%,${col},${shade(col, 0.45)})">${code}</div>`; }

// ---- shared chrome ----
export function totalCash(s) { return COMPANIES.reduce((a, c) => a + s.comp[c.id].cash, 0); }
export function topbar(s) {
  const dm = s.last ? s.last.dM / 1000 : 0, np = s.last ? s.last.netIncome : COMPANIES.reduce((a, c) => a + s.comp[c.id].profit, 0);
  return `<div class="top"><div class="crown">♛ THE COMPACT</div>
 <div class="ledger"><div class="ic">💵</div><div><b>${fmtB(totalCash(s))}</b><small class="${np >= 0 ? 'up' : 'dn'}">${signed(np)}B / 턴</small></div></div>
 <div class="ledger"><div class="ic">📈</div><div><b>$${(totalMcap(s) / 1000).toFixed(1)}T</b><small class="${dm >= 0 ? 'up' : 'dn'}">${s.last ? (dm >= 0 ? '▲' : '▼') + Math.abs(dm).toFixed(2) + 'T' : '제국 가치'}</small></div></div>
 <div class="ledger"><div class="ic">👑</div><div><b>${fmtB(netWorth(s))}</b><small class="up">내 재산</small></div></div>
 <div class="ledger"><div class="ic">🧠</div><div><b>${Math.round(s.stats.tech)}</b><small>기술</small></div></div>
 <div class="ledger"><div class="ic">🏛️</div><div><b>${Math.round(s.stats.gov)}</b><small class="${s.stats.gov < 35 ? 'dn' : ''}">정부</small></div></div>
 <div class="ledger"><div class="ic">👥</div><div><b>${Math.round(s.stats.talent)}</b><small>인재</small></div></div>
 <div class="ledger"><div class="ic">🫧</div><div><b>${Math.round(s.stats.bubble)}%</b><small class="${s.stats.bubble > 85 ? 'dn' : ''}">거품</small></div></div>
 <div class="ledger"><div class="ic">🕵️</div><div><b>${s.intel}</b><small>정보</small></div></div>
 <div class="ledger"><div class="ic">✉️</div><div><b>${s.letters.length} / 7</b><small>편지</small></div></div>
 <div class="sp"></div><div class="date">${s.turn}턴 · ${QUARTERS[Math.min(s.turn, TOTAL_TURNS) - 1]}<small>${s.name}</small></div></div>`;
}
const TABS = [['hub', '🗺️', '세계 지도'], ['company', '🏢', '회사'], ['wallet', '👛', '내 지갑'], ['people', '👥', '인물'], ['letters', '✉️', '편지'], ['invest', '🕵️', '수사']];
export function nav(active) {
  return `<div class="nav">${TABS.map((t) => `<div class="tab ${t[0] === active ? 'on' : ''}" data-act="go" data-to="${t[0]}"><span>${t[1]}</span>${t[2]}</div>`).join('')}</div>`;
}
const trustColor = (v) => (v >= 60 ? '#6fe0a0' : v >= 40 ? '#e8b04a' : '#e86a5a');

// ---- 01 title ----
export function title(hasSave, endings) {
  return `<div class="screen s01 fade"><div class="shade"></div>
<div class="arch">${portraitSVG('hero', 548, 712, { bg: ['#8aa2cf', '#222c4a'] })}<div class="nm"><b>ETHAN RYU</b><span>컴팩트의 상속자 · 당신</span></div></div>
<div class="title"><div class="t1">THE COMPACT</div><div class="t2">열한 개의 불, 한 사람의 손</div><div class="t3">세계의 지능을 쥔 열한 개 기업이 단 한 사람에게 상속되었다.<br>회사를 키우고, 재산을 쌓고, 사람을 믿고 의심하라. 그리고 마지막 편지를 열어라.</div></div>
<div class="menu"><div class="mi on" data-act="new"><span>⚜</span>새 게임<small>NEW GAME</small></div>
<div class="mi ${hasSave ? '' : 'disabled'}" data-act="continue"><span>📜</span>이어하기<small>${hasSave ? '저장된 게임' : '저장 없음'}</small></div>
<div class="mi" data-act="endings"><span>🏅</span>엔딩 도감<small>${endings} / 12</small></div></div>
<div class="seals">${COMPANIES.map((c) => seal(c.id, c.color, 46)).join('')}</div>
<div class="env"><i>"이 열한 개의 불을 한곳에 두어라.<br>그리고 마지막 편지를 열기 전에는<br>아무도 믿지 마라."</i><br>— 엘리아스 밴스, 유언장</div>
<div class="foot">이 게임의 모든 인물과 사건은 허구이며, 기업명은 가상의 시나리오를 위해 사용되었습니다. · PROTOTYPE v0.1</div></div>`;
}

// ---- 03 origin ----
export function origin(sel, name) {
  const outfit = { auditor: { glasses: '#2a2a30', suit: '#2b3350', tie: null, stub: 0.08, bg: ['#b99a6a', '#3a2c1c'] }, engineer: { outfit: 'hoodie', suit: '#2f4a3a', tie: null, stub: 0.3, bg: ['#8aa2cf', '#222c4a'] }, analyst: { outfit: 'vest', suit: '#262b3a', shirt: '#efe8d6', tie: '#8a2432', stub: 0.12, bg: ['#7aa08a', '#1f3328'] } };
  const stat = (t, g) => `<span class="eff ${g}">${t}</span>`;
  const fxChips = (fx) => [fx.gov && stat(`🏛️ 정부 ${signed(fx.gov, 0)}`, fx.gov > 0 ? 'g' : 'r'), fx.tech && stat(`🧠 기술 ${signed(fx.tech, 0)}`, fx.tech > 0 ? 'g' : 'r'), fx.talent && stat(`👥 인재 ${signed(fx.talent, 0)}`, fx.talent > 0 ? 'g' : 'r'), fx.liquid && stat(`💵 자산 +${(fx.liquid * 1000) | 0}M`, 'g'), fx.intel && stat(`🕵️ 정보 +${fx.intel}`, 'g')].filter(Boolean).join('');
  const card = (id) => { const o = ORIGINS[id]; return `<div class="parch oc ${sel === id ? 'sel' : ''}" data-act="pick-origin" data-id="${id}">${sel === id ? '<div class="tag">✦ 선택됨</div>' : ''}<div class="pf frame">${portraitSVG('hero', 262, 340, outfit[id])}</div><h3>${o.kr}</h3><div class="sub">${o.en}</div><p>${o.blurb}</p><div class="st">${fxChips(o.fx)}</div><div class="tr"><b>특성 · ${o.trait}</b><br>${o.traitDesc}</div></div>`; };
  return `<div class="screen s03 fade"><div class="sh"></div>
<div class="hd"><div class="kick">CHARACTER ORIGIN · 당신의 과거</div><h1>당신은 누구였습니까?</h1><p>선대 엘리아스 밴스가 당신을 고른 이유는 과거에 있습니다. 이 선택이 초반 능력치와 특성을 바꿉니다.</p></div>
<div class="cards">${['auditor', 'engineer', 'analyst'].map(card).join('')}</div>
<div class="bot"><div class="parch inp"><span class="cz" style="font-size:12px;color:#7a5a2a;letter-spacing:3px">NAME</span><input id="nameinput" value="${name}" maxlength="10" style="background:none;border:none;outline:none;font:inherit;color:inherit;width:150px"><small>이름을 바꿀 수 있습니다</small></div><div class="btn ghost" data-act="to-title">← 뒤로</div><div class="btn" data-act="start-game">이 과거로 시작</div></div></div>`;
}

// ---- 02 prologue (visual novel) ----
export function vn(step, name) {
  const speaker = step.who;
  const chars = [['mira', 110, 360], ['hero', 560, 400], ['victor', 1000, 360]];
  const nameOf = { mira: ['미라 오콩코', '비서실장'], victor: ['빅터 헤일', '재무장관'], narr: ['', ''], hero: [name, '당신'] };
  const nm = nameOf[speaker];
  const seals = COMPANIES.map((c, i) => `<div style="position:absolute;left:${150 + i * 150}px;top:${12 + (i % 2) * 10}px">${seal(c.id, c.color, 50)}</div>`).join('');
  const choices = step.choices ? `<div class="choices">${step.choices.map((c, i) => `<div class="cho ${i === 0 ? 'on' : ''}" data-act="vn-choice" data-i="${i}"><span class="n">${i + 1}</span><div>${c.text}<small>${c.sub}</small></div></div>`).join('')}</div>` : '';
  return `<div class="screen s02 fade"><div class="room"></div><div class="lamp"></div><div class="win"><div class="skyline"></div></div>
<div class="chars">${chars.map(([id, x, w]) => `<div class="ch ${speaker === id ? '' : 'dim'}" style="left:${x}px;${id === 'hero' ? 'bottom:-30px' : ''}">${portraitSVG(id, id === 'hero' ? 400 : w, (id === 'hero' ? 400 : w) * 1.3)}</div>`).join('')}</div>
<div class="table">${seals}</div>
<div class="chap"><div class="kick">CHAPTER 1</div><b>오마하 · 유언장 낭독</b></div>
<div class="sys"><span data-act="skip-vn">건너뛰기 ▶▶</span></div>
${choices}
<div class="leather dlg" ${step.choices ? '' : 'data-act="vn-next"'}>${nm && nm[0] ? `<div class="name">${nm[0]}<small>${nm[1]}</small></div>` : ''}<div class="txt" ${speaker === 'narr' ? 'style="color:#cdb98c;font-style:italic"' : ''}>${step.text}</div><div class="next">▼</div></div></div>`;
}

// ---- 04 hub ----
export function hub(s) {
  const pending = !!s.pending;
  const goals = [
    [!pending, '이번 분기 결정', pending ? '미라가 회의를 소집했습니다' : '완료'],
    [false, '회사 지렛대 점검', '선택 · 🏢 회사 탭'],
    [s.payout <= 40, '배당 성향 확인', `현재 ${s.payout}% · 헌장 상한 40%`],
    [false, '정보 자원 활용', `보유 ${s.intel} · 🕵️ 수사 탭`],
  ];
  const nextL = !s.letters.includes('L3') ? '다음 편지: 인물 한 명의 신뢰도 70 이상' : !s.letters.includes('L4') ? '다음 편지: 거품 지수 80% 이상' : '남은 편지는 이야기가 진행되면 열립니다';
  const pr = (id, extra) => { const c = CHARS[id]; return `<div class="pr" data-act="go" data-to="people">${avatar(id, 42)}<div class="nm"><b>${c.kr}</b><small>${c.role}</small></div><div class="tv">신뢰 ${Math.round(s.trust[id])}${bar(s.trust[id], trustColor(s.trust[id]))}</div></div>`; };
  const P = s.pending;
  const e = P && P.kind === 'event' ? getEvent(s, P.id) : null;
  const toast = P ? `<div class="toast" data-act="open-pending">${avatar('mira', 44)}<div>${P.kind === 'letter' ? '선대의 편지가 도착했습니다' : '미라가 당신을 호출합니다'}<small>${P.kind === 'letter' ? '봉투를 열어 보시겠습니까?' : e.title}</small></div></div>` : '';
  const nextHint = pending ? '결정 대기 1건' : '턴을 종료할 수 있습니다';
  return `<div class="screen s04 fade">${topbar(s)}${nav('hub')}
<div class="parch lp"><div class="row">${avatar('hero', 84)}<div><h3>${s.name}</h3><div class="sub">컴팩트 상속자 · ${ORIGINS[s.origin].kr} 출신</div><div style="margin-top:6px"><span class="eff">⚜ ${ORIGINS[s.origin].trait}</span></div></div></div>
 <div class="kick" style="margin:14px 0 4px">THIS QUARTER · 이번 분기 목표</div>
 ${goals.map((g) => `<div class="goal"><i>${g[0] ? '✔' : ''}</i><div>${g[1]}<small>${g[2]}</small></div></div>`).join('')}
 <div style="margin-top:10px;font-family:'Noto Sans KR';font-size:12px;font-weight:700">컴팩트 결속도 <span class="up">${Math.round(60 + s.stats.gov * 0.2 + s.trust.mira * 0.1)}%</span></div></div>
<div class="leather rp"><h3>PEOPLE · 인물과 신뢰</h3>${['mira', 'victor', 'jonah', 'lin', 'dana', 'aria', 'sage'].map((id) => pr(id)).join('')}</div>
<div class="leather letters"><div class="kick" style="color:#cdb98c">LETTERS · 선대의 편지 ${s.letters.length} / 7</div><div class="env">${[1, 2, 3, 4, 5, 6, 7].map((i) => `<div class="ev ${s.letters.includes('L' + i) ? '' : 'lock'}">${s.letters.includes('L' + i) ? i : '🔒'}</div>`).join('')}</div><div style="font-family:'Noto Sans KR';font-size:11.5px;color:#cdb98c;margin-top:8px">${nextL}</div></div>
${toast}<div class="endt ${pending ? 'wait' : ''}" data-act="end-turn">END TURN<small>${nextHint}</small></div></div>`;
}

// ---- 08 council / event ----
export function eventScreen(s, ev, evId, st) {
  const stances = { y: ['st-y', '찬성'], n: ['st-n', '반대·중단'], h: ['st-h', '보류'] };
  const adv = ev.advisors || [];
  const cardW = adv.length > 4 ? 330 : 360, gap = 22;
  const totalW = adv.length * cardW + (adv.length - 1) * gap, left0 = (1920 - totalW) / 2;
  const advHTML = adv.map((a, i) => { const c = CHARS[a.who]; const stn = stances[a.stance]; const reveal = a.initiator && s.revealed[evId]; return `<div class="leather adv" style="left:${left0 + i * (cardW + gap)}px;width:${cardW}px"><div class="pf frame" style="width:178px">${portraitSVG(a.who, 170, 221)}</div><h4>${c.kr}</h4><div class="rl">${c.role}</div><div class="stance ${stn[0]}">${a.label || stn[1]}</div><div class="q">${a.quote}</div><div class="meta"><span>신뢰 ${Math.round(s.trust[a.who])}</span><span>${a.tag || ''}</span></div>${reveal ? '<div style="position:absolute;top:8px;right:10px;font-size:20px" title="발의자">🎯</div>' : ''}</div>`; }).join('');
  let right = '';
  if (ev.intelAction) {
    const used = s.revealed[evId], can = s.intel >= ev.intelAction.cost;
    right = `<div class="leather side"><b>🕵 정보 자원 ${s.intel}</b><br>${used ? ev.intelAction.reveal : `<span ${can ? 'data-act="intel" style="color:#f3d98f;text-decoration:underline;cursor:pointer"' : 'style="opacity:.5"'}>• ${ev.intelAction.label}</span>`}<div style="margin-top:6px;color:#e8b04a">⚠ 의견이 한쪽으로 쏠리면 반대편 신뢰도가 떨어집니다.</div></div>`;
  } else {
    right = `<div class="leather side"><b>🕵 정보 자원 ${s.intel}</b><br>정보는 매 분기 +1 (제트기 보유 시 +2). 수사 탭에서 용의자를 조사하는 데 쓰세요.<div style="margin-top:6px;color:#e8b04a">⚠ 모든 선택에는 대가가 있습니다.</div></div>`;
  }
  let optsHTML = '';
  if (st.result) {
    optsHTML = `<div class="parch res"><b style="display:block;font-size:18px;color:#3a2410;margin-bottom:6px">▶ ${st.result.label}</b><div style="font-size:14px;line-height:1.7;color:#3b2a18">${st.result.text}</div><div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:6px">${chips(st.result.fx)}</div></div><div style="display:flex;justify-content:flex-end"><div class="btn" data-act="event-continue">계속 ▶</div></div>`;
  } else {
    optsHTML = ev.options.map((o, i) => `<div class="parch opt ${i === 0 ? 'hot' : ''} ${o.needIntel && s.intel < o.needIntel ? 'disabled' : ''}" data-act="choose" data-i="${i}"><span class="n">${['I', 'II', 'III', 'IV'][i]}</span><b>${o.label}</b><span class="who">${o.who || ''}</span><span class="chs">${chips(o.fx)}</span></div>`).join('');
  }
  const bubble = st.result ? '' : `<div class="bub">"${s.flags.auditEye && evId === 'audit' ? '숫자가 맞지 않는 곳이 보여.' : '의견이 갈리는군. 신중해야 해.'}"<small>선택은 되돌릴 수 없습니다. 분기마다 한 번뿐입니다.</small></div>`;
  return `<div class="screen s08 fade"><div class="room"></div><div class="lamp"></div>
<div class="parch hd"><div class="kick">${ev.kicker}</div><b>${ev.title}</b><small>${st.result ? '결과' : '응답 시한 0턴'}</small></div>
<div class="parch" style="position:absolute;left:380px;right:380px;top:150px;padding:14px 26px;font-size:15px;line-height:1.65;font-weight:600;color:#3b2a18;${adv.length ? 'display:none' : ''}">${ev.body}</div>
${advHTML}<div class="tbl"></div>
<div class="me">${portFrame('hero', 190, s.name.toUpperCase(), '결정권자 · 당신')}</div>
${adv.length ? `<div class="parch" style="position:absolute;left:330px;top:552px;width:1100px;padding:10px 20px;font-size:14px;line-height:1.6;font-weight:600;color:#3b2a18">${ev.body}</div>` : ''}
${st.result ? '' : bubble.replace('class="bub"', 'class="bub" style="top:742px;left:1450px;width:420px;display:none"')}
<div class="opts" style="top:622px">${optsHTML}</div>${right}</div>`;
}
const CHIP_META = { gov: ['🏛️', '정부'], tech: ['🧠', '기술'], talent: ['👥', '인재'], bubble: ['🫧', '거품'], liquid: ['💰', '내 자산'], intel: ['🕵️', '정보'] };
export function chips(fx) {
  if (!fx) return '';
  const out = [];
  const add = (txt, good) => out.push(`<span class="eff ${good ? 'g' : 'r'}">${txt}</span>`);
  for (const k of ['gov', 'tech', 'talent']) if (fx[k]) add(`${CHIP_META[k][0]} ${signed(fx[k], 0)}`, fx[k] > 0);
  if (fx.bubble) add(`🫧 ${signed(fx.bubble, 0)}`, fx.bubble < 0);
  if (fx.liquid) add(`💰 ${fx.liquid > 0 ? '+' : '−'}${Math.round(Math.abs(fx.liquid) * 1000)}M`, fx.liquid > 0);
  if (fx.intel) add(`🕵️ ${signed(fx.intel, 0)}`, fx.intel > 0);
  if (fx.comp) for (const [id, d] of Object.entries(fx.comp)) {
    const nm = COMP[id].kr;
    if (d.g) add(`${nm} 성장 ${signed(d.g * 100, 1)}%p`, d.g > 0);
    if (d.nm) add(`${nm} 마진 ${signed(d.nm * 100, 1)}%p`, d.nm > 0);
    if (d.cash) add(`${nm} 현금 ${signed(d.cash, 0)}B`, d.cash > 0);
    if (d.reg) add(`${nm} 규제 ${signed(d.reg, 0)}`, d.reg < 0);
  }
  if (fx.all) { if (fx.all.g) add(`전 기업 성장 ${signed(fx.all.g * 100, 1)}%p`, fx.all.g > 0); if (fx.all.nm) add(`전 기업 마진 ${signed(fx.all.nm * 100, 1)}%p`, fx.all.nm > 0); if (fx.all.reg) add(`전 기업 규제 ${signed(fx.all.reg, 0)}`, fx.all.reg < 0); if (fx.all.morale) add(`전 기업 사기 ${signed(fx.all.morale, 0)}`, fx.all.morale > 0); }
  if (fx.trust) for (const [id, v] of Object.entries(fx.trust)) add(`${CHARS[id].kr.split(' ')[0]} 신뢰 ${signed(v, 0)}`, v > 0);
  if (fx.fundFromBK) add(`버크셔 현금 −${fx.fundFromBK}B`, false);
  if (fx.fundExternal) add(`외부 자본 +${fx.fundExternal}B (지분 희석)`, true);
  if (fx.cutTarget) add('지출 삭감 · 성장 둔화', false);
  if (fx.forcePayout) add(`배당 성향 ${fx.forcePayout}%로`, true);
  if (fx.levers) out.push(`<span class="eff">⚙ 전 기업 운영 방침 변경</span>`);
  if (fx.audit) add(`감사 위험 ${signed(fx.audit, 0)}`, fx.audit < 0);
  if (fx.sec) add(`SEC 위험 ${signed(fx.sec, 0)}`, fx.sec < 0);
  return out.join('');
}
export function accuseScreen(s, st) {
  const names = SUSPECTS;
  const left0 = (1920 - (names.length * 330 + (names.length - 1) * 22)) / 2;
  const cards = names.map((id, i) => { const c = CHARS[id]; const n = s.clues[id]; return `<div class="leather adv" style="left:${left0 + i * 352}px"><div class="pf frame" style="width:178px">${portraitSVG(id, 170, 221)}</div><h4>${c.kr}</h4><div class="rl">${c.role}</div><div class="stance st-h">단서 ${n}개</div><div class="q" style="font-size:12px">${s.clueLog.filter((x) => x.who === id).map((x) => '• ' + x.text).join('<br>') || '확인된 단서가 없습니다.'}</div><div class="btn" style="margin-top:10px;height:42px;font-size:14px;letter-spacing:1px" data-act="accuse" data-who="${id}">지목한다</div></div>`; }).join('');
  const result = st.result ? `<div class="parch res"><b style="display:block;font-size:18px;margin-bottom:6px">${st.result.correct === true ? '✔ 정답' : st.result.correct === false ? '✘ 오판' : '… 보류'}</b><div style="font-size:14px;line-height:1.7">${st.result.text}</div></div><div style="display:flex;justify-content:flex-end"><div class="btn" data-act="event-continue">계속 ▶</div></div>` : `<div class="parch opt" data-act="accuse" data-who=""><span class="n">—</span><b>아무도 지목하지 않는다</b><span class="who">증거가 부족하다고 판단</span></div>`;
  return `<div class="screen s08 fade"><div class="room"></div><div class="lamp"></div>
<div class="parch hd"><div class="kick">INVESTIGATION · 수사</div><b>켈스트럴의 첩자를 지목하라</b><small>${st.result ? '결과' : '틀리면 그 인물은 적이 됩니다'}</small></div>
${st.result ? '' : cards}<div class="tbl"></div><div class="me">${portFrame('hero', 190, s.name.toUpperCase(), '결정권자 · 당신')}</div>
<div class="opts" style="top:${st.result ? 560 : 640}px;left:330px;width:1100px">${result}</div>
<div class="leather side"><b>🕵 단서 요약</b><br>가장 단서가 많은 사람이 첩자라는 보장은 없습니다. 누명을 위한 위장일 수 있습니다.</div></div>`;
}

// ---- 05 company ----
export function company(s, id) {
  const c = COMP[id], st = s.comp[id];
  const pv = previewCompany(s, id, st.lev);
  const rev = st.hist.map((h) => h.rev), pf = st.hist.map((h) => h.profit);
  const maxR = Math.max(...rev) * 1.12;
  const mgs = st.hist.map((h) => h.profit / h.rev);
  const mMin = Math.min(...mgs), mMax = Math.max(...mgs), mr = Math.max(0.02, mMax - mMin);
  let ch = '<svg width="754" height="240" viewBox="0 0 754 240" style="font-family:Noto Sans KR">';
  for (let i = 0; i < 5; i++) { const y = 30 + i * 42; ch += `<line x1="40" x2="720" y1="${y}" y2="${y}" stroke="#a88c5a" stroke-opacity=".4" stroke-dasharray="3 4"/>`; }
  const n = st.hist.length;
  rev.forEach((v, i) => { const x = 60 + i * 84, h = (v / maxR) * 160; ch += `<rect x="${x}" y="${198 - h}" width="46" height="${h}" rx="3" fill="${c.color}" opacity="${i === n - 1 ? 1 : 0.7}"/><text x="${x + 23}" y="${192 - h}" text-anchor="middle" font-size="11" font-weight="700" fill="#3a2410">${v >= 10 ? Math.round(v) : v.toFixed(1)}B</text><text x="${x + 23}" y="222" text-anchor="middle" font-size="10" fill="#7a5a2a">${i === n - 1 ? '현재' : `−${n - 1 - i}분기`}</text>`; });
  ch += `<polyline fill="none" stroke="#8a1d14" stroke-width="2.6" points="${mgs.map((m, i) => `${83 + i * 84},${190 - ((m - mMin) / mr) * 120}`).join(' ')}"/>` + mgs.map((m, i) => `<circle cx="${83 + i * 84}" cy="${190 - ((m - mMin) / mr) * 120}" r="3.4" fill="#8a1d14"/>`).join('') + `<text x="720" y="16" text-anchor="end" font-size="11" fill="#8a1d14" font-weight="700">━ 순이익률 ${(mgs[n - 1] * 100).toFixed(0)}%</text><text x="60" y="16" font-size="11" fill="#4a3418" font-weight="700">▮ 분기 매출 ($B)</text></svg>`;
  const kp = (l, v, d, cl) => `<div class="parch k"><small>${l}</small><b>${v}</b><span class="${cl || ''}">${d || ''}</span></div>`;
  const ceo = c.ceo ? portFrame(c.ceo, 256, CHARS[c.ceo].kr.toUpperCase(), CHARS[c.ceo].role) : c.ai ? portFrame(c.ai, 256, CHARS[c.ai].kr, CHARS[c.ai].role) : `<div class="frame" style="width:264px;height:343px;display:flex;align-items:center;justify-content:center;background:linear-gradient(#34231a,#1d130d)">${seal(c.id, c.color, 150)}<div class="cap">${c.en}<small>${c.desc}</small></div></div>`;
  const quote = c.ceo === 'jonah' ? '"회장님, 지금 투자를 줄이면 시장은 사라집니다. 경쟁사는 기다려 주지 않아요."' : c.ceo === 'lin' ? '"라인은 한정되어 있어요. 어느 쪽이든 누군가는 기다려야 합니다."' : c.ai === 'aria' ? '"더 많은 컴퓨트를요! 멈추면 뒤처져요."' : c.ai === 'sage' ? '"속도보다 방향입니다. 검증 없는 확장은 위험합니다."' : `"${c.kr}의 경영진은 당신의 지시를 기다리고 있습니다."`;
  const lev = LEVERS.map((l) => `<div class="lr"><div class="t">${l.icon} ${l.kr}<span id="lv-${l.id}">${st.lev[l.id]}</span></div><input type="range" min="0" max="100" value="${st.lev[l.id]}" data-lev="${l.id}"><small>${l.hint}</small></div>`).join('');
  const tabs = COMPANIES.map((x) => `<div data-act="pick-company" data-id="${x.id}" style="opacity:${x.id === id ? 1 : 0.55};transform:scale(${x.id === id ? 1.12 : 1})">${seal(x.id, x.color, 34)}</div>`).join('');
  return `<div class="screen s05 fade"><div class="wall"></div>${topbar(s)}${nav('company')}
<div class="col ceo">${ceo}<div class="parch q">${quote}<small>${c.ceo ? `신뢰도 ${Math.round(s.trust[c.ceo])}` : '경영진'} · ${c.desc}</small></div>
 <div class="kpis">${kp('분기 매출', fmtB(st.rev), `${signed((st.rev / (st.prevRev || st.rev) - 1) * 100)}%`, 'up')}${kp(c.pub ? '순이익률' : '순이익률', `${(st.profit / st.rev * 100).toFixed(0)}%`, '', st.profit >= 0 ? 'up' : 'dn')}${kp('성장률', `${(pv.g * 100).toFixed(1)}%`, '예상', '')}${kp('가동 용량', `${Math.round(st.cap)}%`, st.cap > 94 ? '⚠ 병목' : '', st.cap > 94 ? 'dn' : '')}${kp('사기', Math.round(st.morale), '', '')}${kp('규제 열기', Math.round(st.reg), st.reg > 70 ? '⚠' : '', st.reg > 70 ? 'dn' : '')}${kp('평판', Math.round(st.rep), '', '')}${kp('현금', fmtB(st.cash), '', st.cash < 8 ? 'dn' : '')}</div></div>
<div class="col mid"><div class="leather hdr">${seal(c.id, c.color, 58)}<div style="min-width:0"><h2 style="white-space:nowrap;font-size:24px">${c.kr}</h2><small style="white-space:nowrap">${c.desc} · 시총 ${fmtB(st.mcap)}</small></div><div style="margin-left:auto;display:flex;gap:6px;align-items:center">${tabs}</div></div>
 <div class="parch ch">${ch}</div>
 <div class="parch alloc"><div class="kick" style="margin-bottom:4px">NEXT QUARTER FORECAST · 다음 분기 예상</div><div class="ar"><div class="l">예상 매출</div><div class="b">${bar(Math.min(100, pv.rev / maxR * 90))}</div><div class="v" style="width:120px">${fmtB(pv.rev)}</div></div><div class="ar"><div class="l">예상 순이익</div><div class="b">${bar(Math.max(4, Math.min(100, Math.abs(pv.profit) / Math.max(1, st.rev * 0.8) * 100)), pv.profit >= 0 ? '#2f8a4a' : '#9b2a1d')}</div><div class="v" style="width:120px">${fmtB(pv.profit)}</div></div><div class="ar"><div class="l">가동 용량</div><div class="b">${bar(pv.cap, pv.cap > 94 ? '#9b2a1d' : '#c9a45a')}</div><div class="v" style="width:120px">${Math.round(pv.cap)}%</div></div></div></div>
<div class="col right"><div class="leather lv"><h3>MANAGEMENT LEVERS · 경영 지렛대</h3>${lev}
 <div class="prev" id="prev">${previewHTML(s, id)}</div>
 <div style="display:flex;gap:12px;margin-top:14px;justify-content:flex-end"><div class="btn ghost" data-act="reset-levers">기본값(50)</div></div></div></div></div>`;
}
export function previewHTML(s, id) {
  const st = s.comp[id], pv = previewCompany(s, id, st.lev);
  const base = previewCompany(s, id, { capex: 50, rnd: 50, hire: 50, price: 50, lobby: 50, mkt: 50 });
  const dg = (pv.g - base.g) * 100, dp = pv.profit - base.profit;
  return `<b class="gold">기본 대비 변화 (다음 분기)</b><br>성장률 <b class="${dg >= 0 ? 'up' : 'dn'}">${signed(dg, 1)}%p</b> · 이익 <b class="${dp >= 0 ? 'up' : 'dn'}">${signed(dp, 1)}B</b> · 규제 열기 <b class="${pv.reg > st.reg ? 'dn' : 'up'}">${signed(pv.reg - st.reg, 0)}</b><br><span style="color:#b9a67c">${st.cap > 94 || pv.cap > 96 ? '⚠ 가동 용량이 96%를 넘으면 납기 지연으로 성장이 깎입니다.' : '지렛대를 움직이면 예상 결과가 바로 갱신됩니다.'}</span>`;
}

// ---- 06 wallet ----
export function wallet(s) {
  const nw = netWorth(s);
  const last = s.last ? s.last.take : null;
  const inc = last ? [['급여·보너스', last.salary], ['배당', last.div], ['성과 보수', last.carry], ['개인 펀드', last.fund], ['기타', last.short || 0]] : [['급여·보너스', 0.02], ['배당', 0], ['성과 보수', 0], ['개인 펀드', 0], ['기타', 0]];
  let tot = 0; const max = Math.max(0.05, inc.reduce((a, b) => a + Math.max(0, b[1]), 0));
  let svg = '<svg width="720" height="200" viewBox="0 0 720 200" style="font-family:Noto Sans KR">';
  inc.forEach((r, i) => { const x = 24 + i * 112, h = Math.max(2, (Math.max(0, r[1]) / max) * 120), y = 150 - (tot / max) * 120 - h; svg += `<rect x="${x}" y="${y}" width="76" height="${h}" rx="3" fill="${i === 1 ? '#c9a45a' : '#8fa86a'}"/><text x="${x + 38}" y="${y - 6}" text-anchor="middle" font-size="12" font-weight="700" fill="#3a2410">${r[1] >= 0 ? '+' : '−'}${fmtB(Math.abs(r[1]))}</text><text x="${x + 38}" y="172" text-anchor="middle" font-size="11" fill="#6a4a1a">${r[0]}</text>`; if (i < 4) svg += `<line x1="${x + 76}" x2="${x + 112}" y1="${y}" y2="${y}" stroke="#8a6f3e" stroke-dasharray="3 3"/>`; tot += Math.max(0, r[1]); });
  const T = inc.reduce((a, b) => a + b[1], 0);
  svg += `<rect x="${24 + 5 * 112}" y="${150 - (tot / max) * 120}" width="76" height="${(tot / max) * 120}" rx="3" fill="#8a1d14"/><text x="${24 + 5 * 112 + 38}" y="${144 - (tot / max) * 120}" text-anchor="middle" font-size="13" font-weight="900" fill="#8a1d14">+${fmtB(T)}</text><text x="${24 + 5 * 112 + 38}" y="172" text-anchor="middle" font-size="11" font-weight="700" fill="#8a1d14">${s.last ? '지난 분기 합계' : '아직 소득 없음'}</text><line x1="14" x2="706" y1="150" y2="150" stroke="#6b5330"/></svg>`;
  const shop = SHOP.map((it) => { const own = s.me.assets.includes(it.id), can = s.me.liquid >= it.cost; return `<div class="parch it ${own ? 'own' : ''} ${!own && !can ? 'cant' : ''}" ${!own && can ? `data-act="buy" data-id="${it.id}"` : ''} style="${!own && !can ? 'opacity:.55' : ''}"><div class="ic">${it.icon}</div><div><b>${it.kr}</b><small>${it.desc}</small><div class="pr">${own ? '✔ 보유 중' : fmtB(it.cost) + (can ? ' · 구매' : ' · 자금 부족')}</div></div></div>`; }).join('');
  const rk = (l, p, c, e) => `<div class="r"><span>${l}</span><div class="b">${bar(p, c)}</div><em>${e}</em></div>`;
  const pool = COMPANIES.filter((c) => c.pub).reduce((a, c) => a + Math.max(0, s.comp[c.id].profit), 0);
  const myDiv = pool * s.payout / 100 * 0.0033, keep = pool * (1 - s.payout / 100);
  const over = s.payout > 40;
  const funds = [['소형 AI 스타트업 6곳', '벤처', s.me.fund * 0.19], ['전력·원전 섹터', '롱', s.me.fund * 0.125], ['에너지 선물', '롱', s.me.fund * 0.08], ['국채·현금성', '안전', s.me.fund * 0.605]];
  return `<div class="screen s06 fade"><div class="wall"></div>${topbar(s)}${nav('내 지갑' && 'wallet')}
<div class="col me">${portFrame('hero', 300, s.name.toUpperCase(), '컴팩트 상속자 · 개인 자산')}
 <div class="parch nw"><div class="kick">PERSONAL NET WORTH · 내 순자산</div><div class="big">${fmtB(nw)}</div><div class="rk">유동 자산 <b>${fmtB(s.me.liquid)}</b> · 펀드 <b>${fmtB(s.me.fund)}</b></div>
  <div class="ms">${nw < 50 ? `다음 이정표 · <b>$50B 클럽</b>${bar(nw / 50 * 100)}` : nw < 100 ? `다음 이정표 · <b>$100B 클럽</b>${bar(nw / 100 * 100)}` : '<b>$100B 클럽 달성</b>'}</div></div></div>
<div class="col mid"><div class="parch pn"><div class="kick">QUARTERLY INCOME · ${s.last ? '지난 분기 내 소득' : '소득 (첫 분기 후 표시)'}</div>${svg}</div>
 <div class="parch pn dv" style="margin-top:12px"><div style="display:flex;justify-content:space-between;align-items:baseline"><b style="font-size:16px">배당 성향 (회사 → 내 지갑)</b><span class="eff ${over ? 'r' : ''}">현재 <b id="payv">${s.payout}%</b> · 컴팩트 헌장 상한 40%</span></div>
  <div style="position:relative;margin:18px 0 6px"><input type="range" min="0" max="100" value="${s.payout}" data-payout="1"><div style="position:absolute;left:40%;top:-7px;width:3px;height:24px;background:#8a1d14;pointer-events:none"></div></div>
  <div style="display:flex;justify-content:space-between;font-size:11.5px;color:#6a4a1a"><span>0% 전액 재투자 · 제국 성장 ↑</span><span style="color:#8a1d14;font-weight:700">▲ 40% 초과 = 감사 위험 ↑ · 헌장 위반</span><span>100%</span></div>
  <div id="payinfo" style="margin-top:8px;font-size:13px">예상 내 몫 <b class="up">+${fmtB(myDiv)}</b> · 회사 유보 <b>${fmtB(keep)}</b> · 감사 위험 <b class="${s.audit > 20 ? 'dn' : ''}">${Math.round(s.audit)}</b></div></div>
 <div class="parch pn" style="margin-top:12px"><div class="kick">PERSONAL FUND · 개인 펀드 포지션</div><table>${'<tr><th>종목·테마</th><th>구분</th><th>평가액</th></tr>'}${funds.map((f) => `<tr><td>${f[0]}</td><td>${f[1]}</td><td>${fmtB(f[2])}</td></tr>`).join('')}</table></div></div>
<div class="col right"><div class="leather pn" style="padding:16px 20px"><div class="kick" style="color:#f3d98f;margin-bottom:8px">LIFESTYLE &amp; ASSETS · 소비는 곧 효과 (유동 ${fmtB(s.me.liquid)})</div><div class="shop">${shop}</div>
 <div class="rk2" style="margin-top:14px"><div class="kick" style="color:#cdb98c;margin-bottom:4px">RISK · 탐욕의 대가</div>${rk('감사 위험', s.audit, s.audit > 30 ? '#e86a5a' : '#6fe0a0', Math.round(s.audit))}${rk('SEC 수사 위험', s.sec, s.sec > 20 ? '#e86a5a' : '#6fe0a0', Math.round(s.sec))}${rk('정부 관계', s.stats.gov, s.stats.gov < 35 ? '#e8b04a' : '#6fe0a0', Math.round(s.stats.gov))}${rk('헌장 준수', over ? 40 : 100, over ? '#e86a5a' : '#6fe0a0', over ? '위반' : '양호')}</div></div></div></div>`;
}

// ---- people / letters / investigate ----
const BIO = {
  mira: '선대의 제자였고, 후계 경쟁에서 밀렸다. 충성과 서운함이 공존한다. 편지의 비밀을 일부 알고 있다.',
  victor: '노련한 재무장관. 화려한 언변 뒤에 숨은 계산이 있다. 중국계 펀드 지분 소문이 따라다닌다.',
  jonah: '천재적 칩 설계자. 독단적이고 야심에 차 있다. 회사의 성장을 위해서라면 선을 넘는다.',
  lin: '대만 파운드리의 총괄. 조국과 회사 사이에서 침묵하는 쪽을 택해 왔다.',
  dana: '반독점을 앞세운 상원의원. 적이 아니라 가장 정직한 견제자다.',
  aria: 'OpenAI의 AI. 빠르고 낙관적이며 인정받고 싶어 한다. 조나의 칩 위에서 돌아간다.',
  sage: 'Anthropic의 AI. 신중하고 불편한 질문을 한다. 미라와 함께 선대의 의도를 일부 안다.',
  elias: '컴팩트를 만든 전설적 투자자. 편지로만 말한다.',
};
export function people(s) {
  const cards = ['mira', 'victor', 'jonah', 'lin', 'dana', 'aria', 'sage'].map((id) => { const c = CHARS[id]; const t = Math.round(s.trust[id]); return `<div class="leather" style="padding:14px;display:flex;gap:16px;align-items:center;height:210px">${portFrame(id, 120, null)}<div style="font-family:'Noto Sans KR';flex:1"><div style="font-size:19px;font-weight:700;color:#f0e5c8;font-family:'Noto Serif KR'">${c.kr}</div><div style="font-size:12px;color:#b9a67c">${c.role} · ${c.tag}</div><div style="margin:8px 0 4px;font-size:12px;color:#cdb98c">신뢰 ${t}</div>${bar(t, trustColor(t))}<div style="margin-top:10px;font-size:12.5px;line-height:1.55;color:#d8caa6">${BIO[id]}</div></div></div>`; }).join('');
  return `<div class="screen s05 fade"><div class="wall"></div>${topbar(s)}${nav('people')}<div style="position:absolute;left:40px;right:40px;top:90px;display:grid;grid-template-columns:1fr 1fr;gap:18px">${cards}<div class="leather" style="padding:14px;display:flex;gap:16px;align-items:center;height:210px">${portFrame('elias', 120, null)}<div style="font-family:'Noto Sans KR';flex:1"><div style="font-size:19px;font-weight:700;color:#f0e5c8;font-family:'Noto Serif KR'">${CHARS.elias.kr}</div><div style="font-size:12px;color:#b9a67c">${CHARS.elias.role}</div><div style="margin-top:10px;font-size:12.5px;line-height:1.55;color:#d8caa6">${BIO.elias}<br><b class="gold">열린 편지 ${s.letters.length} / 7</b></div></div></div></div></div>`;
}
export function letters(s) {
  const cards = [1, 2, 3, 4, 5, 6, 7].map((i) => { const id = 'L' + i, open = s.letters.includes(id), L = LETTERS[id]; return `<div class="parch" ${open ? `data-act="read-letter" data-id="${id}"` : ''} style="height:220px;padding:22px 24px;${open ? '' : 'opacity:.5;filter:grayscale(.8)'}"><div class="kick">LETTER ${i}</div><div style="font-weight:900;font-size:21px;margin-top:6px;color:#3a2410">${open ? L.title : '🔒 아직 열리지 않았습니다'}</div><div style="font-family:'Noto Sans KR';font-size:13px;line-height:1.7;margin-top:10px;color:#4a3418">${open ? L.text.split('\n').filter(Boolean)[0] : i <= 4 ? '이야기가 진행되면 열립니다.' : '정식 버전에서 열립니다.'}</div></div>`; }).join('');
  return `<div class="screen s05 fade"><div class="wall"></div>${topbar(s)}${nav('letters')}<div style="position:absolute;left:40px;right:40px;top:90px"><div style="font-family:Cinzel;font-weight:800;letter-spacing:5px;color:#f3d98f;margin-bottom:10px">LETTERS FROM ELIAS · 선대의 일곱 편지</div><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:18px">${cards}</div></div></div>`;
}
export function invest(s, selId, note) {
  const pos = { victor: [90, 134, -3], mira: [440, 122, 2], jonah: [796, 142, -2], lin: [212, 670, 2], aria: [622, 680, -3] };
  const pol = SUSPECTS.map((id) => { const c = CHARS[id]; const [x, y, r] = pos[id]; return `<div class="pol ${selId === id ? 'sel' : ''}" data-act="pick-suspect" data-id="${id}" style="left:${x}px;top:${y}px;transform:rotate(${r}deg)"><div class="pin"></div><div class="ph">${portraitSVG(id, 212, 276)}</div><div class="nm">${c.kr}</div><div class="rl">${c.role}</div><div class="sus"><span>단서 ${s.clues[id]}</span><span>${s.clues[id] >= 3 ? '의심 높음' : s.clues[id] >= 1 ? '의심' : '—'}</span></div></div>`; }).join('');
  const P = { victor: [208, 238], mira: [558, 226], jonah: [914, 244], lin: [330, 772], aria: [740, 782] }, C = [620, 440];
  let str = '<svg class="strings" viewBox="0 0 1920 1080">';
  for (const k of SUSPECTS) { const w = 2 + Math.min(3, s.clues[k]); str += `<path d="M${P[k][0]} ${P[k][1]} Q ${(P[k][0] + C[0]) / 2} ${(P[k][1] + C[1]) / 2 + 40} ${C[0]} ${C[1]}" fill="none" stroke="#c62a20" stroke-width="${w}" stroke-opacity="${0.35 + Math.min(0.6, s.clues[k] * 0.15)}"/>`; }
  str += '</svg>';
  const c = CHARS[selId], log = s.clueLog.filter((x) => x.who === selId);
  const cl = log.length ? log.map((x) => `<div class="cl"><i>✔</i><div>${x.text}<small>${x.turn}턴에 확인</small></div></div>`).join('') : '<div class="cl"><i>?</i><div>확인된 단서가 없습니다<small>정보를 써서 조사하세요</small></div></div>';
  return `<div class="screen s09 fade"><div class="cork"></div><div class="frameb"></div>${topbar(s)}${nav('invest')}${str}
<div class="title"><b>첩자를 찾아라</b><small>켈스트럴 · 신디케이트의 내부 첩자 (후보 5명 중 1명)</small></div>${pol}
<div class="cen" style="left:470px"><h3>KESTREL</h3><div class="sil">🕴️</div><small>얼굴 없는 지휘자<br>첩자 1명 · 단서가 많다고 범인은 아닙니다</small></div>
<div class="parch rp"><div class="kick">SUSPECT FILE · 선택된 용의자</div><h2>${c.kr} <span class="eff ${s.clues[selId] >= 3 ? 'r' : ''}" style="vertical-align:middle">단서 ${s.clues[selId]}</span></h2>
 <div class="gauge">${CHARS[selId].role} · 신뢰 ${Math.round(s.trust[selId])}${bar(s.clues[selId] * 20, '#8a1d14')}</div>${cl}
 ${note ? `<div style="margin-top:8px;font-family:'Noto Sans KR';font-size:13px;font-weight:700;color:#7b1710">${note}</div>` : ''}
 <div class="act"><div data-act="investigate" data-id="${selId}" class="${s.intel < 1 ? 'disabled' : ''}">🔎 정보 사용: ${c.kr.split(' ')[0]} 조사<span>정보 −1 (보유 ${s.intel})</span></div><div class="disabled">🗣 직접 추궁은 10턴 '지목'에서 가능합니다<span>—</span></div></div>
 <div style="margin-top:10px;font-family:'Noto Sans KR';font-size:12.5px;line-height:1.6;color:#4a3418"><b>⚖ 힌트:</b> 진짜 첩자는 조사하면 항상 흔적이 나오지만, 결백한 사람도 가끔 오해받을 만한 정황이 나옵니다.</div></div></div>`;
}

// ---- 07 earnings ----
export function earnings(s) {
  const e = s.last;
  const rows = e.rows.map((r) => { const c = COMP[r.id]; const beat = r.beat >= 0; const w = Math.min(100, Math.max(6, 50 + r.beat * 200)); return `<div class="cr"><div class="n">${c.kr}</div><div class="bt"><i style="width:${w}%;background:${beat ? c.color : '#a43a2a'}"></i><u style="left:50%"></u></div><div class="a">${fmtB(r.profit)}</div><div class="r" style="color:${beat ? '#6fe0a0' : '#ff8a7a'}">${beat ? '▲' : '▼'}${Math.abs(r.beat * 100).toFixed(1)}%</div></div>`; }).join('');
  const beats = e.rows.filter((r) => r.beat >= 0).length;
  const pts = s.history.slice(-9), mn = Math.min(...pts) * 0.97, mx = Math.max(...pts) * 1.03;
  const P = pts.map((v, i) => [16 + i * (448 / Math.max(1, pts.length - 1)), 200 - (v - mn) / (mx - mn) * 160]);
  const sv = `<svg width="480" height="230" viewBox="0 0 480 230"><defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3d98f" stop-opacity=".45"/><stop offset="1" stop-color="#f3d98f" stop-opacity="0"/></linearGradient></defs><polygon fill="url(#ag)" points="16,214 ${P.map((p) => p.join(',')).join(' ')} ${P[P.length - 1][0]},214"/><polyline fill="none" stroke="#f3d98f" stroke-width="3" points="${P.map((p) => p.join(',')).join(' ')}"/>${P.map((p) => `<circle cx="${p[0]}" cy="${p[1]}" r="3" fill="#fff"/>`).join('')}</svg>`;
  const up = e.dM >= 0;
  const notes = [];
  notes.push(`<div class="parch pp"><b>📈 시장 반응</b>합산 시총 <b class="${up ? 'up' : 'dn'}">${up ? '+' : '−'}${fmtB(Math.abs(e.dM))}</b> (${(e.dM / e.prevMcap * 100).toFixed(1)}%)</div>`);
  const miss = e.rows.filter((r) => r.beat < -0.02).sort((a, b) => a.beat - b.beat)[0];
  notes.push(`<div class="parch pp"><b>${miss ? '⚠ 예상 미달' : '✔ 전반적 호조'}</b>${miss ? `${COMP[miss.id].kr}이(가) 예상을 ${Math.abs(miss.beat * 100).toFixed(1)}% 밑돌았습니다.` : '대부분의 기업이 예상을 상회했습니다.'}</div>`);
  notes.push(`<div class="parch pp"><b>${e.crashMsg ? '💥 시장 충격' : '🫧 거품 지수'}</b>${e.crashMsg || `현재 ${Math.round(e.bubble)}% ${e.bubble > 88 ? '— 위험 수위에 가까워지고 있습니다.' : ''}`}</div>`);
  const last = s.turn >= TOTAL_TURNS;
  return `<div class="screen s07 fade"><div class="stage"></div><div class="rays"></div><canvas id="coins" width="1920" height="1080" style="position:absolute;inset:0;pointer-events:none"></canvas>
<div class="hd"><div class="kick">QUARTERLY EARNINGS DAY</div><h1>${e.quarter.replace("'", '’')} EARNINGS</h1><p>11개 기업 합산 실적 · 컨센서스 대비 (흰 선 = 예상)</p></div>
<div class="leather list"><div class="kick" style="color:#f3d98f;margin-bottom:6px">CONSENSUS BEAT · 기업별 분기 순이익</div>${rows}<div style="margin-top:8px;font-family:'Noto Sans KR';font-size:12px;color:#cdb98c">예상 상회 ${beats} · 미달 ${11 - beats}</div></div>
<div class="leather chart"><div class="kick" style="color:#f3d98f;margin-bottom:4px">VALUE TREND · 합산 시총 추이</div>${sv}<div style="font-family:'Noto Sans KR';font-size:12px;color:#cdb98c">현재 ${fmtB(e.mcap)}</div></div>
<div class="big"><div class="parch bn"><div class="l">연결 매출 · REVENUE</div><div class="v" data-count="${e.revenue}" data-fmt="B">$0</div><div class="d up">${(e.revenue / (e.rows.reduce((a, r) => a + (s.comp[r.id].prevRev || r.rev), 0)) * 100 - 100).toFixed(1)}% 전 분기 대비</div></div><div class="parch bn"><div class="l">연결 순이익 · NET INCOME</div><div class="v" data-count="${e.netIncome}" data-fmt="B">$0</div><div class="d ${e.netIncome >= 0 ? 'up' : 'dn'}">${e.netIncome >= 0 ? '흑자' : '적자'}</div></div></div>
<div class="take"><div style="font-size:84px">💰</div><div><div class="t">나의 몫 · YOUR TAKE THIS QUARTER</div><div class="m" data-count="${e.take.total}" data-fmt="M">+$0M</div></div><div class="s">급여 <b>${fmtB(e.take.salary)}</b> · 배당 <b>${fmtB(e.take.div)}</b> (성향 ${e.payout}%)<br>성과 보수 <b>${fmtB(e.take.carry)}</b> · 개인 펀드 <b>${fmtB(e.take.fund)}</b>${e.take.short ? `<br>폭락 베팅 수익 <b>${fmtB(e.take.short)}</b>` : ''}<br><span style="color:#f3d98f">순자산 ${fmtB(e.nwBefore)} → <b style="font-size:16px">${fmtB(e.nwAfter)}</b></span></div></div>
<div class="pop">${notes.join('')}</div>
<div class="rt">${portFrame('hero', 170, s.name.toUpperCase(), up ? '"숫자는 좋군. 얼마나 갈까."' : '"…이건 좋지 않아."', { smile: up })}</div>
<div class="ft"><div class="btn" data-act="next-turn">${last ? '결과 보기 ▶' : '다음 분기로 ▶'}</div></div></div>`;
}

// ---- 10 ending ----
export function ending(s) {
  const r = pickEnding(s), e = r.e;
  const unlocked = (() => { try { return JSON.parse(localStorage.getItem('compact_endings') || '[]'); } catch (x) { return []; } })();
  const keys = ['soft', 'emperor', 'crash', 'alone', 'prototype'];
  const sr = (l, p, col, v, g) => `<div class="sr"><div class="l">${l}</div><div class="b">${bar(p, col)}</div><div class="v">${v}</div><div class="grade">${g}</div></div>`;
  const aft = [['mira', s.flags.mole_wrong && s.trust.mira < 40 ? '당신을 떠났다.' : (s.flags.soft && !s.crashed) ? '공공 신탁의 초대 이사장이 되었다.' : '말없이 곁에 남았다.'], ['victor', s.flags.short_own ? '당신의 베팅을 알고 있었다.' : s.mole === 'victor' ? '켈스트럴과의 관계가 드러났다.' : '끝내 속을 알 수 없는 사람으로 남았다.'], ['jonah', s.flags.h200_lobby ? '수출로 막대한 부를 쌓았다.' : '새로운 칩을 만들고 있다.'], ['dana', s.flags.deal_dana ? '당신의 증언을 토대로 규제법을 통과시켰다.' : s.flags.fight_dana ? '여전히 당신을 지켜보고 있다.' : '의회의 한구석에서 조용히 일한다.']];
  return `<div class="screen s10 fade"><div class="sh"></div>
<div class="book"><div class="pg l"><div class="en">ENDING ${String(e.n).padStart(2, '0')} / 12</div><h1>${e.title}</h1><div class="sub">${e.en} · ${QUARTERS[Math.min(s.turn, TOTAL_TURNS) - 1] || ''}</div>
 <div class="txt">${e.text.map((t) => `<p>${t}</p>`).join('')}</div><div class="quote">${e.quote}</div></div>
 <div class="pg r"><div class="ph"><div style="width:238px;flex:none">${portFrame('hero', 230, s.name.toUpperCase(), '컴팩트의 마지막 소유자', { hairCol: '#8a8a94', age: 1, smile: false })}</div>
  <div class="sc"><div class="kick" style="margin-bottom:4px">FINAL SCORE · 최종 점수</div>${sr('제국', r.empire / 50 * 100, '#2f8a4a', '$' + r.empire.toFixed(1) + 'T', r.grades.empire)}${sr('재산', r.wealth / 70 * 100, '#c9a45a', fmtB(r.wealth), r.grades.wealth)}${sr('유산', r.legacy, '#8a1d14', Math.round(r.legacy) + '점', r.grades.legacy)}</div></div>
  <div class="sum"><b>플레이 기록</b> · ${Math.min(s.turn, TOTAL_TURNS)}턴 · 열린 편지 ${s.letters.length} / 7 · 첩자: <b>${CHARS[s.mole].kr}</b> (${s.flags.mole_found ? '정체 폭로 성공' : s.flags.mole_wrong ? '오판' : '미지목'})<br><b>핵심 선택</b> · ${s.log.filter((x) => ['h200', 'senator', 'crossroads'].includes(x.event)).map((x) => x.choice).join(' · ') || '—'}<br><b>개인 자산</b> · ${fmtB(r.wealth)} (감사 위험 ${Math.round(s.audit)} · SEC ${Math.round(s.sec)})</div>
  <div class="kick" style="margin-top:14px">AFTERMATH · 그 후</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px 22px;margin-top:6px;font-family:'Noto Sans KR';font-size:13px;line-height:1.55">${aft.map((a) => `<div style="display:flex;gap:10px;align-items:center">${avatar(a[0], 46)}<div><b>${CHARS[a[0]].kr}</b><br><span style="color:#5a4426">${a[1]}</span></div></div>`).join('')}</div></div></div>
<div class="coll"><div class="t">ENDINGS ${unlocked.length} / 12</div>${keys.map((k) => `<div class="${k === r.key ? 'cur' : ''}">${unlocked.includes(k) ? seal(k.slice(0, 2).toUpperCase(), '#8a2432', 46) : '<div class="lock">🔒</div>'}</div>`).join('')}${Array.from({ length: 7 }, () => '<div class="lock">🔒</div>').join('')}</div>
<div class="btns"><div class="btn ghost" data-act="to-title">타이틀로</div><div class="btn" data-act="new">다시 도전 ↻</div></div></div>`;
}
export function letterModal(id) {
  const L = LETTERS[id];
  return `<div class="modal fade" data-act="close-letter"><div class="parch letterbox"><div class="seal2">${L.n}</div><div class="kick">LETTER ${L.n} / 7</div><h2>${L.title}</h2>${L.text}<div class="sig">— ${L.sig}</div><div style="text-align:center;margin-top:18px"><div class="btn" data-act="close-letter">편지를 접는다</div></div></div></div>`;
}

export function helpModal() {
  return `<div class="modal fade"><div class="parch letterbox" style="width:880px;font-size:16px"><div class="kick">HOW TO PLAY · 조작 안내</div><h2>열한 개의 불을 쥔 첫 분기</h2>
<div style="font-family:'Noto Sans KR';font-weight:400;line-height:1.85;white-space:normal">
<b>① 분기마다 회의</b> — 미라가 소집하는 회의에서 한 가지를 결정합니다. 인물들의 조언은 서로 어긋나고, 일부는 숨은 의도를 갖고 있습니다.<br>
<b>② 🏢 회사 탭</b> — 기업별 지렛대(설비투자·R&amp;D·채용·가격·로비·마케팅)를 조정해 성장과 이익, 거품을 다룹니다.<br>
<b>③ 👛 내 지갑 탭</b> — 배당 성향을 정해 내 몫을 늘리되, 헌장 상한(40%)을 넘기면 감사 위험이 쌓입니다. 번 돈은 쓸 수도 있습니다.<br>
<b>④ 🕵️ 수사 탭</b> — 정보로 용의자를 조사해 첩자를 찾으세요. 10분기에 지목할 수 있습니다.<br>
<b>⑤ END TURN</b> — 결정을 마치면 분기를 끝내고 실적 발표(어닝스 데이)를 봅니다. 12분기 동안 어떤 결말에 닿을지는 당신의 선택에 달렸습니다.</div>
<div style="text-align:center;margin-top:22px"><div class="btn" data-act="close-help">시작하기</div></div></div></div>`;
}
