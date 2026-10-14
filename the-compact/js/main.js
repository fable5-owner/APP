// App controller: routing, conversation playback, input handling, turn flow.
import { createMap } from './map.js';
import { PROLOGUE, ORIGINS, TOTAL_TURNS, CHARS, SUSPECTS, LETTERS } from './data.js';
import * as S from './state.js';
import * as UI from './ui.js';

const app = document.getElementById('app');
const loading = document.getElementById('loading');
const map = createMap();

let G = null;
const V = { screen: 'title', origin: 'engineer', name: '에단 류', steps: [], idx: 0, company: 'NV', suspect: 'victor', note: null, modal: null, pop: null, chat: null, earn: false, letter: null, arch: 'letters', fast: false, levSeen: false, paySeen: false };
const wait = (ms) => new Promise((r) => setTimeout(r, V.fast ? 0 : ms));
const STANCE = { y: ['y', '찬성'], n: ['n', '반대'], h: ['h', '보류'] };
const REACT = {
  mira: ['"…알겠습니다. 선생님을 믿겠어요."', '"그 선택, 오래 기억하겠습니다."'], victor: ['"현명한 판단이십니다."', '"…그렇게 결정하셨군요."'],
  jonah: ['"좋습니다, 바로 움직이죠!"', '"…제 의견은 안중에도 없으신가 보네요."'], lin: ['"감사합니다. 신중한 결정입니다."', '"…유감입니다."'],
  dana: ['"기록해 두겠습니다."', '"의회는 이 일을 잊지 않을 겁니다."'], aria: ['"좋아요! 더 빨리 가요!"', '"…느려요. 너무 느려요."'], sage: ['"고맙습니다."', '"…다시 한번 생각해 주시기를."'],
};

const fullScreens = new Set(['title', 'origin', 'scene', 'ending']);

function render() {
  let html = '';
  const s = G;
  switch (V.screen) {
    case 'title': html = UI.title(!!S.loadGame(), S.endingsUnlocked()); break;
    case 'origin': html = UI.origin(V.origin, V.name); break;
    case 'scene': html = UI.scene(V.steps[V.idx], V.name, V.idx, V.steps.length); break;
    case 'ending': html = UI.ending(s); break;
    default: {
      const inner = { hub: UI.hub, company: UI.company, wallet: UI.wallet, invest: UI.invest, archive: UI.archive }[V.screen](s, V);
      html = UI.shell(s, V, inner + (V.chat ? chatHTML() : ''));
    }
  }
  if (V.earn && s) html += UI.earnings(s);
  html += V.modal || '';
  app.className = fullScreens.has(V.screen) ? 'full' : '';
  app.innerHTML = html;
  const slot = document.getElementById('mapslot');
  if (slot) {
    slot.appendChild(map.el);
    map.setNodes(V.screen === 'hub' && s ? UI.hubNodes(s) : [], onNode);
    map.start(); map.resize();
  } else map.stop();
  if (V.earn) countUp();
  const lg = document.getElementById('chatlog'); if (lg) lg.scrollTop = lg.scrollHeight;
}

function onNode(id) {
  const pin = document.querySelector(`[data-node="${id}"]`), hubEl = document.querySelector('.hub');
  if (!pin || !hubEl) return;
  const a = pin.getBoundingClientRect(), b = hubEl.getBoundingClientRect(), k = parseFloat(getComputedStyle(document.documentElement).fontSize);
  const x = Math.min(Math.max(a.left + a.width / 2 - b.left, 9 * k), b.width - 9 * k), y = Math.min(a.top + a.height / 2 - b.top, b.height * 0.55);
  V.pop = { id, x, y }; render();
}

function countUp() {
  app.querySelectorAll('[data-count]').forEach((el) => {
    const target = parseFloat(el.dataset.count), t0 = performance.now();
    const step = (now) => { const k = V.fast ? 1 : Math.min(1, (now - t0) / 1200), v = target * (1 - Math.pow(1 - k, 3)); el.textContent = UI.fmtB(v); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  });
}

function go(screen) { V.screen = screen; V.modal = null; V.note = null; V.pop = null; if (screen === 'company') V.levSeen = true; if (screen === 'wallet') V.paySeen = true; render(); }

// ---------- conversation ----------
function chatHTML() {
  const c = V.chat;
  return `<div class="scrim"><div class="chat"><div class="chat-h">${c.stack}<div class="ti"><small>${c.kicker}</small><b>${c.title}</b></div><button class="xbtn" data-act="close-chat" aria-label="닫기">${UI.ic('close')}</button></div>
<div class="log" id="chatlog">${c.msgs.join('')}</div><div class="replies" id="replies">${c.replies || ''}</div></div></div>`;
}
function addMsg(html) {
  V.chat.msgs.push(html);
  const lg = document.getElementById('chatlog'); if (!lg) return;
  lg.insertAdjacentHTML('beforeend', html); lg.scrollTop = lg.scrollHeight;
}
function setReplies(html) {
  V.chat.replies = html;
  const r = document.getElementById('replies'); if (r) r.innerHTML = html;
  const lg = document.getElementById('chatlog'); if (lg) lg.scrollTop = lg.scrollHeight;
}
const msgHTML = (who, text, extra = '') => `<div class="msg">${UI.av(who, 2.5)}<div><div class="who"><b>${CHARS[who].kr}</b>${CHARS[who].role}${extra}</div><div class="bub">${text}</div></div></div>`;
const optHTML = (opts, s) => opts.map((o, i) => { const lock = o.needIntel && s.intel < o.needIntel; return `<button class="reply ${lock ? 'off' : ''}" data-act="choose" data-i="${i}" style="animation-delay:${i * 70}ms"><div class="l"><span class="num">${i + 1}</span>${o.label}<small>${o.who || ''}${lock ? ` · 정보 ${o.needIntel} 필요` : ''}</small></div><div class="chips">${UI.fxChips(o.fx)}</div></button>`; }).join('');

async function startChat(id) {
  const ev = S.getEvent(G, id), tok = Symbol();
  const who = (ev.advisors || []).map((a) => a.who);
  V.chat = { id, tok, kicker: ev.kicker, title: `${UI.quarterLabel(G)} · 자문 회의`, stack: who.length ? `<div class="stack">${who.slice(0, 3).map((w) => UI.av(w, 2.6)).join('')}</div>` : UI.av('mira', 2.6), msgs: [], replies: '', ev };
  V.screen = V.screen === 'hub' || !G ? 'hub' : V.screen; V.modal = null;
  render();
  const alive = () => V.chat && V.chat.tok === tok;
  addMsg(`<div class="brief"><small>${ev.kicker}</small><h3>${ev.title}</h3><p>${ev.body}</p></div>`);
  await wait(500);
  for (const a of ev.advisors || []) {
    if (!alive()) return;
    const st = STANCE[a.stance] || STANCE.h;
    const typing = `<div class="typing" id="typing">${UI.av(a.who, 2.5)}<div class="dots"><i></i><i></i><i></i></div></div>`;
    const lg = document.getElementById('chatlog'); if (lg) { lg.insertAdjacentHTML('beforeend', typing); lg.scrollTop = lg.scrollHeight; }
    await wait(700);
    if (!alive()) return;
    document.getElementById('typing')?.remove();
    addMsg(msgHTML(a.who, a.quote, `<span class="stance ${st[0]}">${a.label || st[1]}</span>`));
    await wait(180);
  }
  if (!alive()) return;
  showChoices(ev);
}
function showChoices(ev) {
  const id = V.chat.id;
  let html = '';
  if (ev.intelAction && !G.revealed[id]) {
    const can = G.intel >= ev.intelAction.cost;
    html += `<div class="hint">당신의 차례 — 선택하거나, 먼저 정보를 쓸 수 있습니다</div><button class="reply ${can ? '' : 'off'}" data-act="intel" style="border-style:dashed"><div class="l">${UI.ic('probe').replace('<svg', '<svg style="width:1.1rem;height:1.1rem;color:var(--accent)"')} ${ev.intelAction.label}<small>정보 ${G.intel}</small></div></button>`;
  } else html += '<div class="hint">당신의 차례</div>';
  if (id === 'accuse') {
    html += SUSPECTS.map((k, i) => `<button class="reply" data-act="accuse" data-who="${k}"><div class="l"><span class="num">${i + 1}</span>${CHARS[k].kr} 지목<small>단서 ${G.clues[k]}</small></div></button>`).join('')
      + '<button class="reply" data-act="accuse"><div class="l"><span class="num">6</span>지목하지 않는다<small>첩자는 계속 숨는다</small></div></button>';
  } else html += optHTML(ev.options, G);
  setReplies(html);
}
const contBtn = (label = '계속') => `<button class="reply" data-act="chat-continue" style="align-items:center"><div class="l" style="justify-content:center;width:100%">${label} ${UI.ic('arrow').replace('<svg', '<svg style="width:1rem;height:1rem"')}</div></button>`;

async function afterChoice(label, resultText, fx) {
  setReplies('');
  addMsg(`<div class="msg me"><div class="bub">${label}</div></div>`);
  await wait(450);
  // trust reactions
  const tr = fx && fx.trust ? Object.entries(fx.trust).filter(([k, v]) => v && REACT[k]).slice(0, 2) : [];
  for (const [k, v] of tr) {
    addMsg(msgHTML(k, REACT[k][v > 0 ? 0 : 1], `<span class="chip ${v > 0 ? 'good' : 'bad'}" style="height:1.2rem">${v > 0 ? '+' : '−'}${Math.abs(v)}</span>`));
    await wait(450);
  }
  addMsg(`<div class="sys res">${resultText}<div class="chips">${UI.fxChips(fx)}</div></div>`);
  await wait(200);
  setReplies(contBtn());
}

function openPending() {
  const p = G.pending;
  if (!p) { V.chat = null; render(); return; }
  if (p.kind === 'letter') { V.chat = null; V.modal = UI.letterModal(p.id); V.letterCtx = 'pending'; render(); return; }
  startChat(p.id);
}
function afterEvent() { S.nextPending(G); V.chat = null; S.saveGame(G); if (G.pending) openPending(); else render(); }

// ---------- prologue / flow ----------
function finishPrologue() { S.beginTurn(G); S.saveGame(G); V.screen = 'hub'; V.modal = UI.helpModal(); render(); }
function startGame() {
  G = S.newGame({ name: V.name.trim() || '에단 류', origin: V.origin });
  V.steps = PROLOGUE.map((x) => ({ ...x })); V.idx = 0; V.company = 'NV'; V.suspect = 'victor'; V.levSeen = false; V.paySeen = false; V.chat = null; V.earn = false;
  V.screen = 'scene'; render();
}
function advanceScene() {
  const st = V.steps[V.idx];
  if (st.letter && !V.vnLetterOpened) { V.modal = UI.letterModal(st.letter); V.letterCtx = 'vn'; V.vnLetterOpened = true; render(); return; }
  V.vnLetterOpened = false; V.idx += 1;
  if (V.idx >= V.steps.length) finishPrologue(); else render();
}

const actions = {
  new() { V.screen = 'origin'; render(); },
  continue() { const g = S.loadGame(); if (!g) return; G = g; V.chat = null; V.earn = G.phase === 'earnings' && !!G.last && false; V.screen = 'hub'; render(); if (G.pending) openPending(); },
  'to-title'() { V.screen = 'title'; V.chat = null; V.earn = false; render(); },
  'pick-origin'(d) { const inp = document.getElementById('nameinput'); if (inp) V.name = inp.value; V.origin = d.id; render(); },
  'start-game'() { const inp = document.getElementById('nameinput'); if (inp) V.name = inp.value; startGame(); },
  'vn-next'() { advanceScene(); },
  'vn-choice'(d) {
    const st = V.steps[V.idx], ch = st.choices[+d.i];
    S.applyFx(G, ch.fx);
    V.steps[V.idx] = { ...st, choices: null };
    V.steps.splice(V.idx + 1, 0, ch.reply);
    V.idx += 1; render();
  },
  'skip-vn'() { for (const st of V.steps) if (st.letter) S.openLetter(G, st.letter); finishPrologue(); },
  'close-letter'() {
    const ctx = V.letterCtx; V.modal = null;
    if (ctx === 'vn') { const st = V.steps[V.idx]; if (st.letter) S.openLetter(G, st.letter); V.vnLetterOpened = false; V.idx += 1; if (V.idx >= V.steps.length) finishPrologue(); else render(); return; }
    if (ctx === 'pending') { const p = G.pending; if (p && p.kind === 'letter') { S.openLetter(G, p.id); afterEvent(); return; } }
    render();
  },
  'close-help'() { V.modal = null; openPending(); },
  'read-letter'(d) { V.letter = d.id; render(); },
  arch(d) { V.arch = d.t; render(); },
  go(d) { if (G) go(d.to); },
  'open-pending'() { openPending(); },
  'close-chat'() { V.chat = null; render(); },
  'end-turn'() {
    if (G.pending) { openPending(); return; }
    S.endTurn(G); S.saveGame(G); V.earn = true; V.chat = null; render();
  },
  'next-turn'() {
    V.earn = false;
    if (G.turn >= TOTAL_TURNS) { S.unlockEnding(S.pickEnding(G).key); V.screen = 'ending'; render(); return; }
    S.advanceTurn(G); S.saveGame(G); V.screen = 'hub'; render(); openPending();
  },
  choose(d) {
    const p = G.pending; if (!p) return;
    const ev = V.chat.ev, opt = ev.options[+d.i];
    const r = S.chooseOption(G, p.id, +d.i);
    if (!r.ok) return;
    afterChoice(opt.label, r.result, opt.fx);
  },
  intel() {
    const p = G.pending; if (!p) return;
    const ev = V.chat.ev;
    if (!S.useIntelAction(G, p.id)) return;
    addMsg(`<div class="sys res">${ev.intelAction.reveal}</div>`);
    showChoices(ev);
  },
  accuse(d) {
    const res = S.accuse(G, d.who || null);
    setReplies('');
    addMsg(`<div class="msg me"><div class="bub">${d.who ? CHARS[d.who].kr + ' — 당신입니다.' : '지금은 아무도 지목하지 않겠습니다.'}</div></div>`);
    addMsg(`<div class="sys res">${res.text}</div>`);
    setReplies(contBtn());
  },
  'chat-continue'() { G.pending = null; afterEvent(); },
  'pick-company'(d) { V.company = d.id; V.pop = null; V.levSeen = true; if (d.go) { V.screen = 'company'; } render(); },
  'reset-levers'() { for (const k of Object.keys(G.comp[V.company].lev)) G.comp[V.company].lev[k] = 50; render(); },
  buy(d) { if (S.buyItem(G, d.id)) render(); },
  'pick-suspect'(d) { V.suspect = d.id; V.note = null; render(); },
  investigate(d) { const r = S.investigate(G, d.id); V.note = r.text; render(); },
};

app.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el) { if (V.pop && !e.target.closest('.pop') && !e.target.closest('[data-node]')) { V.pop = null; render(); } return; }
  if (el.dataset.act === 'close-letter' && el.classList.contains('modal') && e.target.closest('.card')) return;
  const fn = actions[el.dataset.act]; if (fn) fn({ ...el.dataset });
});
app.addEventListener('input', (e) => {
  const t = e.target;
  if (t.dataset.lev) {
    G.comp[V.company].lev[t.dataset.lev] = +t.value; V.levSeen = true;
    t.style.setProperty('--p', `${t.value}%`);
    const lab = document.getElementById(`lv-${t.dataset.lev}`); if (lab) lab.textContent = t.value;
    const prev = document.getElementById('prev'); if (prev) prev.innerHTML = UI.previewHTML(G, V.company);
  } else if (t.dataset.payout) {
    G.payout = +t.value; V.paySeen = true;
    t.style.setProperty('--p', `${t.value / 80 * 100}%`);
    const pv = document.getElementById('payv'); if (pv) pv.textContent = `${t.value}%`;
  }
});
app.addEventListener('change', (e) => { if (e.target.dataset.payout) render(); });
addEventListener('keydown', (e) => {
  if ((e.key === 'Enter' || e.key === ' ') && V.screen === 'scene' && !V.steps[V.idx].choices && !V.modal) { e.preventDefault(); advanceScene(); }
  if (e.key === 'Escape' && V.chat) actions['close-chat']();
});

window.__compact = { get G() { return G; }, V, S, actions, render };
loading.classList.add('gone'); setTimeout(() => loading.remove(), 500);
render();
