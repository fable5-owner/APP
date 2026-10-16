// Game state + economy engine. No DOM here.
import { COMPANIES, CHARS, ORIGINS, SHOP, EVENTS, SCRIPT_ORDER, FILLERS, BONUS_TURNS, TOTAL_TURNS, QUARTERS, SUSPECTS, LEVERS, ENDINGS, TECHS } from './data.js';

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const COMP = Object.fromEntries(COMPANIES.map((c) => [c.id, c]));

const CLUE_TEXT = {
  victor: ['중국계 펀드 지분 서류', 'H200 안건을 먼저 발의한 기록', '의원과의 비공개 만찬'],
  mira: ['선대 편지 일부를 보관한 흔적', '비서실 서류의 야간 열람 기록', '출처 불명의 야간 통화'],
  jonah: ['경쟁사 임원과의 접촉 기록', '실적 직전의 의심스러운 거래', '수출 안건에 대한 과도한 집착'],
  lin: ['대만 측 인사와의 비공식 접촉', '공정 정보가 외부로 흘러간 흔적', '위기 보고에서의 의도적 침묵'],
  aria: ['외부 서버로 향하는 정체불명 트래픽', '승인되지 않은 학습 데이터 유입', 'SAGE가 감지한 비정상 지시 패턴'],
};

export function makeRng(seed) {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export function newGame({ name = '에단 류', origin = 'engineer', seed = Date.now() % 100000 } = {}) {
  const rng = makeRng(seed);
  const s = {
    seed, rngCalls: 0, name, origin,
    turn: 1, phase: 'event',
    stats: { tech: 62, gov: 34, talent: 70, bubble: 88 },
    intel: 3, audit: 0, sec: 0,
    trust: Object.fromEntries(Object.entries(CHARS).map(([k, v]) => [k, v.trust])),
    comp: {},
    me: { liquid: 4.0, fund: 11.2, assets: [], assetsValue: 0.2, salary: 0.02 },
    payout: 36,
    valMul: 1, crashed: false,
    flags: {}, clues: Object.fromEntries(SUSPECTS.map((k) => [k, 0])), clueIdx: Object.fromEntries(SUSPECTS.map((k) => [k, 0])), clueLog: [],
    mole: SUSPECTS[Math.floor(makeRng((seed * 2654435761) >>> 0)() * SUSPECTS.length)],
    letters: [], letterQueue: [],
    done: [], pending: null, eventQueue: [], log: [],
    last: null, history: [], revealed: {},
    tech: { done: [], cur: null, prog: 0 },
  };
  for (const c of COMPANIES) {
    s.comp[c.id] = { rev: c.rev, nm: c.nm, g: c.g, gb: 0, nmb: 0, cash: c.cash, morale: 70, reg: 50, rep: 70, cap: 82, profit: c.rev * c.nm, hist: Array.from({ length: 8 }, (_, k) => { const r = c.rev / Math.pow(1 + c.g, 7 - k); return { rev: r, profit: r * c.nm }; }), lev: { capex: 50, rnd: 50, hire: 50, price: 50, lobby: 50, mkt: 50 }, mcap: 0 };
  }
  // origin effects
  const o = ORIGINS[origin];
  applyFx(s, o.fx);
  s.flags[o.flag] = true;
  recomputeMcap(s);
  s.history.push(totalMcap(s));
  s.rng = rng;
  return s;
}

// ---------- valuation ----------
export function sentiment(s) { return 1 + (s.stats.bubble - 88) / 100 * 0.5; }
function mcapFor(s, id, gEff) {
  const c = COMP[id], st = s.comp[id];
  const ge = gEff ?? st.g;
  const sent = sentiment(s) * s.valMul;
  const repAdj = 1 + (st.rep - 70) * 0.002;
  const regAdj = st.reg > 80 ? 0.96 : 1;
  if (c.pub) return st.rev * Math.max(0.02, st.nm + st.nmb * 0.5) * 4 * c.pe * sent * (1 + (ge - c.g) * 4) * repAdj * regAdj;
  return st.rev * 4 * c.mult * sent * (1 + (ge - c.g) * 3) * repAdj * regAdj;
}
export function recomputeMcap(s, gEffs = {}) {
  for (const c of COMPANIES) s.comp[c.id].mcap = mcapFor(s, c.id, gEffs[c.id]);
}
export function totalMcap(s) { return COMPANIES.reduce((a, c) => a + s.comp[c.id].mcap, 0); }
export function netWorth(s) { return s.me.liquid + s.me.fund + totalMcap(s) / 1000 * 0.65 + s.me.assetsValue; }
export function empireValueT(s) { return totalMcap(s) / 1000; }

// ---------- effects ----------
const COMP_KEYS = { g: 'gb', nm: 'nmb', reg: 'reg', rep: 'rep', morale: 'morale', cash: 'cash' };
function applyCompFx(st, d) {
  for (const [k, v] of Object.entries(d)) {
    const key = COMP_KEYS[k]; if (!key) continue;
    st[key] += v;
    if (['reg', 'rep', 'morale'].includes(key)) st[key] = clamp(st[key], 0, 100);
  }
}
export function applyFx(s, fx) {
  if (!fx) return;
  for (const k of ['gov', 'tech', 'talent']) if (fx[k]) s.stats[k] = clamp(s.stats[k] + fx[k], 0, 100);
  if (fx.bubble) s.stats.bubble = clamp(s.stats.bubble + fx.bubble, 0, 110);
  if (fx.liquid) s.me.liquid = Math.max(0, s.me.liquid + fx.liquid);
  if (fx.intel) s.intel = Math.max(0, s.intel + fx.intel);
  if (fx.audit) s.audit = Math.max(0, s.audit + fx.audit);
  if (fx.sec) s.sec = Math.max(0, s.sec + fx.sec);
  if (fx.trust) for (const [k, v] of Object.entries(fx.trust)) s.trust[k] = clamp(s.trust[k] + v, 0, 100);
  if (fx.trustAll) for (const k of Object.keys(s.trust)) if (k !== 'elias') s.trust[k] = clamp(s.trust[k] + fx.trustAll, 0, 100);
  if (fx.comp) for (const [id, d] of Object.entries(fx.comp)) if (s.comp[id]) applyCompFx(s.comp[id], d);
  if (fx.all) for (const id of Object.keys(s.comp)) applyCompFx(s.comp[id], fx.all);
  if (fx.levers) for (const id of Object.keys(s.comp)) Object.assign(s.comp[id].lev, fx.levers);
  if (fx.flag) s.flags[fx.flag] = true;
  if (fx.permG) for (const id of Object.keys(s.comp)) s.comp[id].g += fx.permG;
  if (fx.permNm) for (const id of Object.keys(s.comp)) s.comp[id].nm += fx.permNm;
  if (fx.permComp) for (const [id, d] of Object.entries(fx.permComp)) { if (s.comp[id]) { if (d.g) s.comp[id].g += d.g; if (d.nm) s.comp[id].nm += d.nm; } }
  if (fx.clue) addClue(s, fx.clue.who, fx.clue.n || 1);
  if (fx.clueMole) {
    const real = s.rng() < 0.55;
    const who = real ? s.mole : SUSPECTS.filter((k) => k !== s.mole)[Math.floor(s.rng() * 4)];
    addClue(s, who, 2);
  }
  if (fx.forcePayout) s.payout = fx.forcePayout;
  if (fx.fundFromBK && s.fundTarget) { s.comp.BK.cash -= fx.fundFromBK; s.comp[s.fundTarget].cash += fx.fundFromBK; }
  if (fx.fundExternal && s.fundTarget) s.comp[s.fundTarget].cash += fx.fundExternal;
  if (fx.cutTarget && s.fundTarget) { s.comp[s.fundTarget].cash += 8; s.comp[s.fundTarget].gb -= 0.015; }
}
function addClue(s, who, n) {
  if (!s.clues[who] && s.clues[who] !== 0) return;
  for (let i = 0; i < n; i++) {
    s.clues[who] += 1;
    const t = CLUE_TEXT[who][s.clueIdx[who] % CLUE_TEXT[who].length]; s.clueIdx[who] += 1;
    s.clueLog.push({ who, text: t, turn: s.turn });
  }
}

// ---------- events ----------
export function resolutionEvent(s) {
  if (s.flags.soft) return { kicker: 'AFTERMATH · 그 후', title: '연착륙이 시작되었다', body: '시장은 잠시 얼어붙었지만, 어떤 고리도 헐값에 팔려 나가지 않았습니다. 켈스트럴은 기다렸지만 주울 것이 없었습니다.', advisors: [{ who: 'sage', stance: 'y', quote: '"고맙습니다. 어렵지만 옳은 길이었습니다."', tag: '질문 ❓' }, { who: 'mira', stance: 'y', quote: '"선생님이 보셨다면… 웃으셨을 거예요."', tag: '선대의 뜻' }], options: [{ label: '계속', fx: { gov: 3, trust: { sage: 3, mira: 3 } }, result: '숨 고르기의 분기가 시작됩니다.' }] };
  if (s.flags.accel) return { kicker: 'WARNING · 경보', title: '숫자는 아직 오르고 있다', body: '거품 지수가 한계에 닿았습니다. 어느 분기에 터질지는 아무도 모릅니다. 켈스트럴이 움직이는 소리가 들립니다.', advisors: [{ who: 'sage', stance: 'n', quote: '"…지금도 늦지 않았습니다."', tag: '질문 ❓' }, { who: 'aria', stance: 'y', quote: '"더 빨리요! 지금 멈추면 다 잃어요!"', tag: '요구 ↑' }], options: [{ label: '계속', fx: { bubble: 8, trust: { aria: 2 } }, result: '시장은 위태롭게 흔들립니다.' }] };
  return { kicker: 'AFTERMATH · 그 후', title: '소란 속의 분기', body: '시장은 흔들렸고, 당신은 정면으로 대응하지 않았습니다. 사태는 스스로 방향을 찾아갑니다.', advisors: [], options: [{ label: '계속', fx: {}, result: '시간이 흘렀습니다.' }] };
}

export function lowCashTarget(s) {
  for (const c of COMPANIES) if (!c.pub && s.comp[c.id].cash < 8) return c.id;
  return null;
}

export function beginTurn(s) {
  const br = makeRng(((s.seed * 131 + s.turn * 7919) ^ 0x9e3779b9) >>> 0); br(); br();
  s.phase = 'event';
  s.intel += 1 + (s.flags.jet ? 1 : 0);
  s.eventQueue = [];
  // letters
  const maxTrust = Math.max(...SUSPECTS.map((k) => s.trust[k]), s.trust.sage);
  if (!s.letters.includes('L3') && !s.letterQueue.includes('L3') && s.turn >= 4 && maxTrust >= 70) s.letterQueue.push('L3');
  if (!s.letters.includes('L4') && !s.letterQueue.includes('L4') && s.turn >= 7 && (s.stats.bubble >= 80 || s.turn >= 9)) s.letterQueue.push('L4');
  // dynamic funding
  const lc = lowCashTarget(s);
  if (lc) { s.fundTarget = lc; s.eventQueue.push('fund'); }
  // scripted / filler
  let id = null;
  if (s.turn === 11) id = 'resolution';
  else if (s.turn === 12) id = null;
  else {
    id = SCRIPT_ORDER[s.turn - 1];
    if (id === null) {
      if (s.audit >= 30) id = 'audit';
      else { const pool = FILLERS.filter((f) => !s.done.includes(f)); id = pool.length ? pool[Math.floor(br() * pool.length)] : 'rumor'; }
    }
  }
  if (id) s.eventQueue.push(id);
  if (BONUS_TURNS.includes(s.turn)) { const pool = FILLERS.filter((f) => !s.done.includes(f) && f !== id && !s.eventQueue.includes(f)); if (pool.length) s.eventQueue.push(pool[Math.floor(br() * pool.length)]); }
  // mole clue drift
  if (br() < 0.3) addClue(s, s.mole, 1);
  if (br() < 0.45) addClue(s, SUSPECTS.filter((k) => k !== s.mole)[Math.floor(br() * 4)], 1);
  s.pending = null;
  nextPending(s);
}

export function getEvent(s, id) {
  if (id === 'resolution') return resolutionEvent(s);
  const e = EVENTS[id];
  if (id === 'fund' && s.fundTarget) return { ...e, title: `자금 압박 — ${COMP[s.fundTarget].kr}`, body: `${COMP[s.fundTarget].kr}의 현금이 바닥나고 있습니다. 비상금 창구인 버크셔에서 끌어오면 해결되지만, 컴팩트 전체의 안전판이 얇아집니다.` };
  return e;
}

export function nextPending(s) {
  if (s.letterQueue.length) { s.pending = { kind: 'letter', id: s.letterQueue.shift() }; return; }
  if (s.eventQueue.length) { const id = s.eventQueue.shift(); s.pending = { kind: 'event', id }; return; }
  s.pending = null;
}

export function chooseOption(s, evId, idx) {
  const ev = getEvent(s, evId);
  const opt = ev.options[idx];
  if (opt.needIntel && s.intel < opt.needIntel) return { ok: false, msg: `정보가 ${opt.needIntel} 필요합니다.` };
  applyFx(s, opt.fx);
  s.done.push(evId);
  s.log.push({ turn: s.turn, event: evId, choice: opt.label, result: opt.result });
  if (evId === 'h200' && !s.letters.includes('L2') && !s.letterQueue.includes('L2')) s.letterQueue.push('L2');
  recomputeMcap(s);
  s.pending = null;
  return { ok: true, result: opt.result, opt };
}

export function useIntelAction(s, evId) {
  const ev = EVENTS[evId]; const a = ev.intelAction;
  if (!a || s.revealed[evId] || s.intel < a.cost) return false;
  s.intel -= a.cost; s.revealed[evId] = true;
  if (a.clue) addClue(s, a.clue.who, a.clue.n);
  return true;
}

export function openLetter(s, id) { if (!s.letters.includes(id)) s.letters.push(id); }

export function accuse(s, who) {
  if (!who) { s.flags.no_accuse = true; return { ok: true, correct: null, text: '당신은 아무도 지목하지 않았습니다. 첩자는 계속 숨어 있습니다.' }; }
  s.done.push('accuse');
  if (who === s.mole) {
    s.flags.mole_found = true; s.trust.mira = clamp(s.trust.mira + 5, 0, 100); s.stats.gov += 3;
    return { ok: true, correct: true, text: `${CHARS[who].kr}이(가) 켈스트럴과 내통하고 있었습니다. 증거 앞에서 그는(그녀는) 고개를 숙였습니다.` };
  }
  s.flags.mole_wrong = true; s.trust[who] = clamp(s.trust[who] - 30, 0, 100); s.stats.talent -= 4;
  return { ok: true, correct: false, text: `${CHARS[who].kr}은(는) 결백했습니다. 억울함 속에 신뢰는 무너졌고, 진짜 첩자는 계속 웃고 있습니다.` };
}

export function buyItem(s, id) {
  const it = SHOP.find((x) => x.id === id);
  if (!it || s.me.assets.includes(id) || s.me.liquid < it.cost) return false;
  s.me.liquid -= it.cost; s.me.assets.push(id); s.me.assetsValue += it.cost * (it.keep ?? 0.5);
  applyFx(s, it.fx); s.flags[it.flag] = true;
  return true;
}

// ---------- research ----------
export const techOf = (id) => TECHS.find((t) => t.id === id);
export function techState(s, id) {
  const t = techOf(id); if (s.tech.done.includes(id)) return 'done'; if (s.tech.cur === id) return 'cur';
  return t.req.every((r) => s.tech.done.includes(r)) ? 'open' : 'locked';
}
export function researchRate(s) {
  const rnd = COMPANIES.reduce((a, c) => a + s.comp[c.id].lev.rnd / 50, 0);
  return Math.round((rnd * 0.3 + s.stats.tech / 60) * (1 + (s.flags.fieldSense ? 0.15 : 0)) * 10) / 10;
}
export function pickTech(s, id) { if (techState(s, id) === 'open' || techState(s, id) === 'cur') { s.tech.cur = id; return true; } return false; }
function advanceResearch(s) {
  const rate = researchRate(s); const out = { rate, done: null };
  if (!s.tech.cur) return out;
  s.tech.prog += rate;
  const t = techOf(s.tech.cur);
  if (s.tech.prog >= t.cost) { s.tech.prog -= t.cost; s.tech.done.push(t.id); applyFx(s, t.fx); out.done = t; s.tech.cur = null; }
  return out;
}

// ---------- turn processing ----------
export function endTurn(s) {
  const rng = s.rng;
  const prevM = totalMcap(s), prevNW = netWorth(s);
  const rows = []; let totRev = 0, totProfit = 0, divPool = 0;
  const gEffs = {};
  let capexSum = 0;
  for (const c of COMPANIES) {
    const st = s.comp[c.id];
    const x = Object.fromEntries(LEVERS.map((l) => [l.id, (st.lev[l.id] - 50) / 50]));
    capexSum += x.capex;
    const rndEff = 1 + (s.flags.fieldSense ? 0.15 : 0);
    const capPen = st.cap > 96 ? (st.cap - 96) * 0.004 : 0;
    const gEff = st.g + st.gb + 0.012 * x.capex + 0.008 * x.rnd * rndEff + 0.006 * x.hire + 0.004 * x.mkt - 0.015 * x.price - capPen - (st.cash < 0 ? 0.02 : 0);
    const nmEff = st.nm + st.nmb + 0.02 * x.price + (st.morale - 70) * 0.0004 - (st.reg > 75 ? 0.01 : 0);
    const noise = (rng() - 0.5) * 0.01;
    const revNew = st.rev * (1 + gEff + noise);
    const delta = revNew * (0.08 * x.capex + 0.06 * x.rnd + 0.03 * x.hire + 0.004 * x.lobby + 0.01 * x.mkt);
    const profit = revNew * nmEff - delta;
    const expProfit = st.profit * (1 + c.g);
    const beat = expProfit !== 0 ? (profit - expProfit) / Math.abs(expProfit) : 0;
    const pay = c.pub && profit > 0 ? profit * s.payout / 100 : 0;
    divPool += pay;
    st.cash += profit - pay;
    st.cap = clamp(st.cap + gEff * 40 - 2.4 * (1 + x.capex * 0.9), 40, 100);
    st.morale = clamp(st.morale + 2 * x.hire - (st.cap > 92 ? 2 : 0) + (70 - st.morale) * 0.15, 20, 100);
    st.reg = clamp(st.reg + 1.0 * x.price - 1.4 * x.lobby + (50 - st.reg) * 0.08 + (c.id === 'NV' || c.id === 'GO' || c.id === 'MS' ? 0.6 : 0), 0, 100);
    st.rep = clamp(st.rep + 0.8 * x.mkt - (st.reg > 70 ? 1 : 0) + (70 - st.rep) * 0.1, 0, 100);
    gEffs[c.id] = gEff;
    st.prevRev = st.rev; st.rev = revNew; st.profit = profit; st.hist.push({ rev: revNew, profit }); if (st.hist.length > 8) st.hist.shift();
    st.gb *= 0.65; st.nmb *= 0.8;
    totRev += revNew; totProfit += profit;
    rows.push({ id: c.id, rev: revNew, profit, exp: expProfit, beat, pub: c.pub });
  }
  // bubble drift
  const avgCapex = capexSum / COMPANIES.length;
  s.stats.bubble = clamp(s.stats.bubble + 1.3 + 4 * avgCapex, 0, 110);
  if (s.turn < 6) s.stats.bubble = Math.min(s.stats.bubble, 99);
  let crashMsg = null;
  if (s.stats.bubble >= 100 && !s.flags.soft && !s.crashed && s.turn >= 6) {
    s.crashed = true; s.valMul = 0.62; s.stats.bubble = 48;
    for (const c of COMPANIES) s.comp[c.id].gb -= 0.02;
    crashMsg = '💥 거품이 터졌습니다. 시장 가치가 급락했습니다.';
  } else if (s.stats.bubble >= 96 && s.flags.soft && !s.flags.softUsed) {
    s.flags.softUsed = true; s.valMul = 0.9; s.stats.bubble -= 15;
    crashMsg = '📉 시장이 조정을 받았지만, 충격은 완만했습니다.';
  }
  recomputeMcap(s, gEffs);
  const newM = totalMcap(s);
  // audit
  if (s.payout > 40) s.audit += (s.payout - 40) * 0.8 * (s.flags.auditEye ? 0.8 : 1);
  else s.audit = Math.max(0, s.audit - 4);
  // personal income
  const salary = s.me.salary;
  const div = divPool * 0.0033;
  const carry = 0.00005 * Math.max(0, newM - prevM);
  const r = (0.004 + (rng() - 0.5) * 0.02) * (1 + (s.flags.probEye ? 0.15 : 0));
  const fundGain = s.me.fund * r; s.me.fund += fundGain;
  let shortGain = 0;
  if (s.flags.short_own && crashMsg && s.crashed) { shortGain = 1.4; s.flags.short_paid = true; }
  const rs = advanceResearch(s); recomputeMcap(s, gEffs);
  const take = salary + div + carry + fundGain + shortGain;
  s.me.liquid += salary + div + carry + shortGain;
  const nw = netWorth(s);
  const res = {
    turn: s.turn, quarter: QUARTERS[s.turn - 1], revenue: totRev, netIncome: totProfit, rows,
    prevMcap: prevM, mcap: newM, dM: newM - prevM,
    take: { salary, div, carry, fund: fundGain, short: shortGain, total: take }, nwBefore: prevNW, nwAfter: nw,
    crashMsg, payout: s.payout, bubble: s.stats.bubble, research: rs,
  };
  s.last = res; s.history.push(newM);
  s.phase = 'earnings';
  return res;
}

export function advanceTurn(s) {
  s.turn += 1;
  if (s.turn > TOTAL_TURNS) { s.phase = 'ended'; return false; }
  beginTurn(s);
  return true;
}

export function pickEnding(s) {
  let key = 'prototype';
  if (s.flags.soft && !s.crashed) key = 'soft';
  else if (s.crashed) key = (s.flags.short_own && netWorth(s) > 40) ? 'alone' : 'crash';
  else if (s.flags.accel) key = 'emperor';
  const e = ENDINGS[key];
  const grade = (v, t) => (v >= t[0] ? 'S' : v >= t[1] ? 'A' : v >= t[2] ? 'B' : v >= t[3] ? 'C' : 'D');
  const empire = empireValueT(s), wealth = netWorth(s);
  const trusts = SUSPECTS.map((k) => s.trust[k]).concat([s.trust.sage]);
  const legacy = clamp(trusts.reduce((a, b) => a + b, 0) / trusts.length * 0.6 + s.stats.gov * 0.2 + (s.flags.soft ? 20 : 0) + (s.flags.mole_found ? 10 : 0) + (s.flags.unwind ? 12 : 0) - (s.flags.short_own ? 15 : 0) - (s.flags.mole_wrong ? 8 : 0), 0, 100);
  return { key, e, empire, wealth, legacy, grades: { empire: grade(empire, [34, 30, 25, 18]), wealth: grade(wealth, [60, 45, 35, 25]), legacy: grade(legacy, [80, 65, 50, 35]) } };
}

// What would this company do next quarter with the given lever settings? (no mutation)
export function previewCompany(s, id, lev) {
  const c = COMP[id], st = s.comp[id];
  const x = Object.fromEntries(LEVERS.map((l) => [l.id, (lev[l.id] - 50) / 50]));
  const rndEff = 1 + (s.flags.fieldSense ? 0.15 : 0);
  const capPen = st.cap > 96 ? (st.cap - 96) * 0.004 : 0;
  const gEff = st.g + st.gb + 0.012 * x.capex + 0.008 * x.rnd * rndEff + 0.006 * x.hire + 0.004 * x.mkt - 0.015 * x.price - capPen - (st.cash < 0 ? 0.02 : 0);
  const nmEff = st.nm + st.nmb + 0.02 * x.price + (st.morale - 70) * 0.0004 - (st.reg > 75 ? 0.01 : 0);
  const revNew = st.rev * (1 + gEff);
  const delta = revNew * (0.08 * x.capex + 0.06 * x.rnd + 0.03 * x.hire + 0.004 * x.lobby + 0.01 * x.mkt);
  const profit = revNew * nmEff - delta;
  return { g: gEff, rev: revNew, profit, nm: nmEff, cash: -delta, cap: clamp(st.cap + gEff * 40 - 2.4 * (1 + x.capex * 0.9), 40, 100), reg: st.reg + 1.0 * x.price - 1.4 * x.lobby };
}

// Spend 1 intel to look into a suspect. The real mole always yields a trace; others only sometimes (and often benign).
export function investigate(s, who) {
  if (s.intel < 1) return { ok: false, text: '정보가 부족합니다.' };
  s.intel -= 1;
  if (who === s.mole) { addClue(s, who, 1); return { ok: true, found: true, text: '의심스러운 흔적이 발견되었습니다.' }; }
  if (s.rng() < 0.35) { addClue(s, who, 1); return { ok: true, found: true, text: '석연치 않은 정황이 발견되었습니다. (오해일 수도 있습니다)' }; }
  return { ok: true, found: false, text: '특이사항이 없습니다.' };
}

export function saveGame(s) {
  try { const { rng, ...rest } = s; localStorage.setItem('compact_save', JSON.stringify(rest)); } catch (e) { /* ignore */ }
}
export function loadGame() {
  try {
    const raw = localStorage.getItem('compact_save'); if (!raw) return null;
    const s = JSON.parse(raw); s.rng = makeRng((s.seed + s.turn * 7919) >>> 0); return s;
  } catch (e) { return null; }
}
export function unlockEnding(key) {
  try { const set = new Set(JSON.parse(localStorage.getItem('compact_endings') || '[]')); set.add(key); localStorage.setItem('compact_endings', JSON.stringify([...set])); return set.size; } catch (e) { return 1; }
}
export function endingsUnlocked() { try { return JSON.parse(localStorage.getItem('compact_endings') || '[]').length; } catch (e) { return 0; } }
