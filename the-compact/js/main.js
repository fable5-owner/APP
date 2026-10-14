// App controller: routing, input handling, turn flow.
import { renderMap } from './map.js';
import { PROLOGUE, EVENTS, ORIGINS, TOTAL_TURNS, SHOP, CHARS } from './data.js';
import * as S from './state.js';
import * as UI from './ui.js';

const stage = document.getElementById('stage');
const screenEl = document.getElementById('screen');
const bg = document.getElementById('bg');
const loading = document.getElementById('loading');

let G = null;
const V = { screen: 'title', origin: 'engineer', name: '에단 류', steps: [], idx: 0, company: 'NV', suspect: 'victor', es: { result: null }, modal: null, note: null, vnLetter: null };

function fit() {
  const sc = Math.min(innerWidth / 1920, innerHeight / 1080);
  stage.style.transform = `scale(${sc})`;
  stage.style.left = `${(innerWidth - 1920 * sc) / 2}px`;
  stage.style.top = `${(innerHeight - 1080 * sc) / 2}px`;
}
addEventListener('resize', fit); fit();

const BGMODE = { title: 'dim', origin: 'dim', hub: 'none', ending: 'dim' };

function render() {
  let html = '';
  switch (V.screen) {
    case 'title': html = UI.title(!!S.loadGame(), S.endingsUnlocked()); break;
    case 'origin': html = UI.origin(V.origin, V.name); break;
    case 'vn': html = UI.vn(V.steps[V.idx], V.name); break;
    case 'hub': html = UI.hub(G); break;
    case 'company': html = UI.company(G, V.company); break;
    case 'wallet': html = UI.wallet(G); break;
    case 'people': html = UI.people(G); break;
    case 'letters': html = UI.letters(G); break;
    case 'invest': html = UI.invest(G, V.suspect, V.note); break;
    case 'event': {
      const p = G.pending;
      html = p.id === 'accuse' ? UI.accuseScreen(G, V.es) : UI.eventScreen(G, S.getEvent(G, p.id), p.id, V.es);
      break;
    }
    case 'earnings': html = UI.earnings(G); break;
    case 'ending': html = UI.ending(G); break;
  }
  screenEl.innerHTML = html + (V.modal || '');
  bg.className = BGMODE[V.screen] || 'hide';
  postRender();
}

function postRender() {
  if (V.screen === 'earnings') {
    screenEl.querySelectorAll('[data-count]').forEach((el) => {
      const target = parseFloat(el.dataset.count), fmt = el.dataset.fmt; const t0 = performance.now();
      const step = (now) => {
        const k = Math.min(1, (now - t0) / 1300), v = target * (1 - Math.pow(1 - k, 3));
        el.textContent = fmt === 'M' ? `+${UI.fmtB(v)}` : UI.fmtB(v);
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
    const cv = document.getElementById('coins');
    if (cv) {
      const c = cv.getContext('2d'); const rnd = S.makeRng(G.turn * 97 + 5);
      for (let i = 0; i < 160; i++) {
        const x = rnd() * 1920, y = rnd() * 1080, r = 6 + rnd() * 9;
        if (y > 470 && y < 700 && x > 540 && x < 1380) continue;
        c.save(); c.translate(x, y); c.rotate(rnd() * 6); c.scale(1, 0.4 + rnd() * 0.6);
        const g = c.createRadialGradient(-r * 0.3, -r * 0.3, 1, 0, 0, r); g.addColorStop(0, '#fff3b0'); g.addColorStop(0.6, '#e0b030'); g.addColorStop(1, '#8a5a10');
        c.fillStyle = g; c.globalAlpha = 0.55 + rnd() * 0.45; c.shadowColor = 'rgba(255,210,90,.6)'; c.shadowBlur = 10; c.beginPath(); c.arc(0, 0, r, 0, 7); c.fill(); c.restore();
      }
    }
  }
}

function go(screen) { V.screen = screen; V.modal = null; V.note = null; render(); }

function openPending() {
  const p = G.pending;
  if (!p) { go('hub'); return; }
  if (p.kind === 'letter') { V.screen = 'hub'; V.letterCtx = 'pending'; V.modal = UI.letterModal(p.id); render(); return; }
  V.es = { result: null }; V.screen = 'event'; V.modal = null; render();
}

function afterEvent() {
  S.nextPending(G);
  if (G.pending) openPending(); else go('hub');
}

function finishPrologue() {
  S.beginTurn(G); S.saveGame(G);
  V.screen = 'hub'; V.modal = UI.helpModal(); V.help = true; render();
}

function startGame() {
  G = S.newGame({ name: V.name.trim() || '에단 류', origin: V.origin });
  V.steps = PROLOGUE.map((x) => ({ ...x })); V.idx = 0; V.company = 'NV'; V.suspect = 'victor';
  go('vn');
}

function nextTurn() {
  if (G.turn >= TOTAL_TURNS) { S.unlockEnding(S.pickEnding(G).key); go('ending'); return; }
  S.advanceTurn(G); S.saveGame(G);
  V.screen = 'hub'; render();
  openPending();
}

const actions = {
  new() { V.screen = 'origin'; render(); },
  continue() { const g = S.loadGame(); if (!g) return; G = g; V.screen = 'hub'; render(); if (G.pending) openPending(); },
  endings() { /* shown on the ending screen collection */ },
  'to-title'() { go('title'); },
  'pick-origin'(d) { V.origin = d.id; const inp = document.getElementById('nameinput'); if (inp) V.name = inp.value; render(); },
  'start-game'() { const inp = document.getElementById('nameinput'); if (inp) V.name = inp.value; startGame(); },
  'vn-next'() {
    const st = V.steps[V.idx];
    if (st.letter && !V.vnLetterOpened) { V.modal = UI.letterModal(st.letter); V.letterCtx = 'vn'; V.vnLetterOpened = true; render(); return; }
    V.vnLetterOpened = false; V.idx += 1;
    if (V.idx >= V.steps.length) finishPrologue(); else render();
  },
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
  'close-help'() { V.modal = null; V.help = false; openPending(); },
  'read-letter'(d) { V.letterCtx = 'view'; V.modal = UI.letterModal(d.id); render(); },
  go(d) { if (d.to === 'hub' || G) go(d.to); },
  'open-pending'() { openPending(); },
  'end-turn'() {
    if (G.pending) { openPending(); return; }
    S.endTurn(G); V.screen = 'earnings'; render();
  },
  'next-turn'() { nextTurn(); },
  choose(d) {
    const p = G.pending; const ev = S.getEvent(G, p.id); const opt = ev.options[+d.i];
    const r = S.chooseOption(G, p.id, +d.i);
    if (!r.ok) return;
    V.es = { result: { label: opt.label, text: r.result, fx: opt.fx } }; G.pending = p; render();
  },
  intel() { const p = G.pending; S.useIntelAction(G, p.id); render(); },
  accuse(d) {
    const res = S.accuse(G, d.who || null);
    V.es = { result: res }; render();
  },
  'event-continue'() { G.pending = null; afterEvent(); },
  'pick-company'(d) { V.company = d.id; render(); },
  'reset-levers'() { for (const k of Object.keys(G.comp[V.company].lev)) G.comp[V.company].lev[k] = 50; render(); },
  buy(d) { if (S.buyItem(G, d.id)) render(); },
  'pick-suspect'(d) { V.suspect = d.id; V.note = null; render(); },
  investigate(d) { const r = S.investigate(G, d.id); V.note = r.text; render(); },
};

stage.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]'); if (!el) return;
  if (el.dataset.act === 'close-letter' && e.target.closest('.letterbox') && !e.target.closest('.btn')) return;
  const fn = actions[el.dataset.act]; if (fn) fn({ ...el.dataset });
});
stage.addEventListener('input', (e) => {
  const t = e.target;
  if (t.dataset.lev) {
    G.comp[V.company].lev[t.dataset.lev] = +t.value;
    const lab = document.getElementById(`lv-${t.dataset.lev}`); if (lab) lab.textContent = t.value;
    const prev = document.getElementById('prev'); if (prev) prev.innerHTML = UI.previewHTML(G, V.company);
  } else if (t.dataset.payout) {
    G.payout = +t.value;
    const pv = document.getElementById('payv'); if (pv) pv.textContent = `${t.value}%`;
  }
});
stage.addEventListener('change', (e) => { if (e.target.dataset.payout) render(); else if (e.target.dataset.lev) render(); });
addEventListener('keydown', (e) => {
  if ((e.key === 'Enter' || e.key === ' ') && V.screen === 'vn' && !V.steps[V.idx].choices && !V.modal) { e.preventDefault(); actions['vn-next'](); }
});

// test/debug hook
window.__compact = { get G() { return G; }, V, S, actions, render };

async function boot() {
  await Promise.all([UI.probeArt(), renderMap(document.getElementById('bg'))]);
  loading.remove();
  render();
}
boot();
