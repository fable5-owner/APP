// Procedural soundtrack: 12 distinct tracks (Web Audio, zero asset files) + SFX. Starts on first user gesture.
let ac = null, master, verb, dry, delay, timer = 0, step = 0, nextT = 0, started = false, B = null, cur = null, curName = '', pend = '';
let muted = false; try { muted = localStorage.getItem('compact_mute') === '1'; } catch (e) { /* ignore */ }
const N = (n) => 440 * Math.pow(2, (n - 69) / 12);
const R = (i, k = 1) => { const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return x - Math.floor(x); };

function impulse(sec) {
  const n = ac.sampleRate * sec, b = ac.createBuffer(2, n, ac.sampleRate);
  for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.6); }
  return b;
}
function init() {
  ac = new (window.AudioContext || window.webkitAudioContext)();
  master = ac.createGain(); master.gain.value = muted ? 0 : 0.55;
  const comp = ac.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
  master.connect(comp); comp.connect(ac.destination);
  dry = ac.createGain(); dry.gain.value = 0.8; dry.connect(master);
  verb = ac.createConvolver(); verb.buffer = impulse(3.2); const vg = ac.createGain(); vg.gain.value = 0.55; verb.connect(vg); vg.connect(master);
  delay = ac.createDelay(1); delay.delayTime.value = 0.36; const fb = ac.createGain(); fb.gain.value = 0.38; delay.connect(fb); fb.connect(delay); const dg = ac.createGain(); dg.gain.value = 0.35; delay.connect(dg); dg.connect(verb); dg.connect(master);
}
function mkBus() {
  const g = ac.createGain(); g.gain.value = 0; g.connect(dry);
  const vs = ac.createGain(); vs.gain.value = 0.45; g.connect(vs); vs.connect(verb);
  const ds = ac.createGain(); ds.gain.value = 0.5; g.connect(ds); ds.connect(delay);
  return { g, ds };
}
function env(g, t, a, d, peak, sus = 0) { g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(Math.max(sus, 0.0001), t + a + d); }

// ---------- instruments (connect to current bus B) ----------
function osc(type, f, t, dur, peak, a = 0.01, filt = 0, det = 0, toDelay = false) {
  const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.value = f; o.detune.value = det;
  let n = o; if (filt) { const bq = ac.createBiquadFilter(); bq.type = 'lowpass'; bq.frequency.value = filt; o.connect(bq); n = bq; }
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  n.connect(g); g.connect(B.g); if (toDelay) g.connect(B.ds); o.start(t); o.stop(t + dur + 0.05);
}
const pluck = (t, n, v = 0.07) => osc('triangle', N(n), t, 0.5, v, 0.004, 3200, 0, true);
const piano = (t, n, v = 0.1, len = 1.8) => { osc('sine', N(n), t, len, v, 0.005); osc('triangle', N(n) * 2, t, len * 0.5, v * 0.35, 0.004); osc('sine', N(n) * 3, t, 0.25, v * 0.18, 0.002); };
const rhodes = (t, n, v = 0.06, len = 1.4) => { osc('sine', N(n), t, len, v, 0.006); osc('sine', N(n) * 4, t, 0.18, v * 0.5, 0.002); osc('triangle', N(n) * 0.5, t, len, v * 0.4, 0.01); };
const vibes = (t, n, v = 0.07) => { osc('sine', N(n), t, 1.6, v, 0.004); osc('sine', N(n) * 4, t, 0.3, v * 0.3, 0.003); };
const bassSaw = (t, n, len = 0.4, v = 0.2, f = 260) => osc('sawtooth', N(n - 12), t, len, v, 0.008, f);
const bassSine = (t, n, len = 0.6, v = 0.26) => { osc('sine', N(n - 12), t, len, v, 0.01); osc('triangle', N(n - 12) * 2, t, len * 0.5, v * 0.2, 0.01); };
const brass = (t, notes, len = 0.3, v = 0.05) => notes.forEach((n) => { osc('sawtooth', N(n), t, len, v, 0.02, 2400, -6); osc('sawtooth', N(n), t, len, v, 0.02, 2400, 7); });
function strings(t, notes, dur, v = 0.026) {
  for (const n of notes) for (const det of [-10, 9]) {
    const o = ac.createOscillator(), f = ac.createBiquadFilter(), g = ac.createGain();
    o.type = 'sawtooth'; o.frequency.value = N(n); o.detune.value = det; f.type = 'lowpass'; f.frequency.setValueAtTime(400, t); f.frequency.linearRampToValueAtTime(1500, t + dur * 0.55); f.frequency.linearRampToValueAtTime(500, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + dur * 0.4); g.gain.linearRampToValueAtTime(0.0001, t + dur);
    o.connect(f); f.connect(g); g.connect(B.g); o.start(t); o.stop(t + dur + 0.1);
  }
}
const drone = (t, n, dur, v = 0.12) => { osc('sine', N(n), t, dur, v, dur * 0.3); osc('sawtooth', N(n), t, dur, v * 0.35, dur * 0.3, 180); };
function kick(t, v = 0.9, low = 42) { const o = ac.createOscillator(), g = ac.createGain(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(low, t + 0.14); env(g, t, 0.002, 0.28, v); o.connect(g); g.connect(B.g); o.start(t); o.stop(t + 0.35); }
function timp(t, n = 38, v = 0.5) { const o = ac.createOscillator(), g = ac.createGain(); o.frequency.setValueAtTime(N(n) * 1.5, t); o.frequency.exponentialRampToValueAtTime(N(n), t + 0.2); env(g, t, 0.004, 1.1, v); o.connect(g); g.connect(B.g); o.start(t); o.stop(t + 1.3); noise(t, 0.12, 200, v * 0.3); }
function noise(t, dur, hp, vol, lp = 0) {
  const n = ac.sampleRate * dur, b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  const s = ac.createBufferSource(); s.buffer = b; const f = ac.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp; const g = ac.createGain(); env(g, t, 0.002, dur, vol);
  s.connect(f); let nn = f; if (lp) { const l = ac.createBiquadFilter(); l.type = 'lowpass'; l.frequency.value = lp; f.connect(l); nn = l; } nn.connect(g); g.connect(B.g); s.start(t);
}
const snare = (t, v = 0.22) => { noise(t, 0.18, 1800, v); osc('triangle', 190, t, 0.1, v * 0.5, 0.002); };
const clap = (t, v = 0.18) => { for (let i = 0; i < 3; i++) noise(t + i * 0.012, 0.09, 1400, v * 0.6); };
const hat = (t, v = 0.06, open = false) => noise(t, open ? 0.2 : 0.04, 7500, v);
const rim = (t, v = 0.08) => osc('square', 880, t, 0.04, v, 0.001, 3000);
const brush = (t, v = 0.07) => noise(t, 0.22, 3000, v, 9000);
const crackle = (t) => { if (Math.random() < 0.5) noise(t + Math.random() * 0.1, 0.015, 3000, 0.03); };
const riser = (t, dur, v = 0.1) => { const n = ac.sampleRate * dur, b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; const s = ac.createBufferSource(); s.buffer = b; const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 2; f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(7000, t + dur); const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + dur * 0.95); g.gain.linearRampToValueAtTime(0.0001, t + dur); s.connect(f); f.connect(g); g.connect(B.g); s.start(t); };
const chord = (root, iv) => iv.map((i) => root + i);
const MIN = [0, 3, 7, 12], MAJ = [0, 4, 7, 12], M9 = [0, 3, 7, 10, 14], D9 = [0, 4, 7, 10, 14], MA9 = [0, 4, 7, 11, 14], MIN7 = [0, 3, 7, 10];
const pick = (arr, i, k) => arr[Math.floor(R(i, k) * arr.length)];

// ---------- tracks: each has bpm, len (steps/bar), vol, step(t,pos,bar,s16,spb) ----------
const TRACKS = {
  // 1. epic cinematic (title)
  epic: { bpm: 74, len: 16, vol: 1.35, step(t, pos, bar, s16, spb) {
    const r = [57, 53, 48, 55][bar % 4], ch = chord(r + 12, MIN);
    if (pos === 0) { strings(t, ch, spb * 4.2); if (bar % 2 === 0) timp(t, r - 14, 0.55); }
    if (pos === 0) osc('sine', N(r - 12), t, spb * 4, 0.24, 0.05);
    if (pos % 2 === 0) piano(t, ch[[0, 1, 2, 3, 2, 1, 3, 2][pos / 2]] + 12, pos % 4 === 0 ? 0.085 : 0.05, 1.2);
    if (bar % 4 === 3 && pos === 0) riser(t, spb * 4, 0.12);
    if (bar % 4 === 0 && pos === 8) timp(t, r - 14, 0.35);
  } },
  // 2. lofi (calm hub / ledger)
  lofi: { bpm: 74, len: 16, vol: 1.2, swing: 0.16, step(t, pos, bar, s16, spb) {
    const r = [50, 55, 48, 57][bar % 4], iv = [M9, D9, MA9, M9][bar % 4], ch = chord(r, iv);
    if (pos === 0) { ch.forEach((n, i) => rhodes(t + i * 0.025, n + 12, 0.045, spb * 2.2)); }
    if (pos === 10) ch.slice(1, 4).forEach((n, i) => rhodes(t + i * 0.02, n + 12, 0.035, spb * 1.2));
    if (pos === 0 || pos === 10) kick(t, 0.55, 48);
    if (pos === 8) rim(t, 0.05), noise(t, 0.12, 1500, 0.1);
    if (pos % 2 === 0) hat(t, pos % 4 === 0 ? 0.035 : 0.05);
    if ([0, 6, 12].includes(pos)) bassSine(t, r, spb * 0.9, 0.3);
    crackle(t);
    if (R(bar * 16 + pos, 7) > 0.8 && pos % 2 === 0) rhodes(t, pick([0, 2, 4, 7, 9], bar + pos, 3) + r + 24, 0.04, 1.1);
  } },
  // 3. pulse (tense hub / trading)
  pulse: { bpm: 118, len: 16, vol: 0.95, step(t, pos, bar, s16, spb) {
    const r = [52, 48, 50, 47][bar % 4], ch = chord(r + 12, MIN);
    if (pos === 0) strings(t, ch, spb * 4.2, 0.018);
    if (pos % 4 === 0) kick(t, 0.85);
    if (pos % 2 === 0) bassSaw(t, r, s16 * 1.6, pos % 4 === 0 ? 0.2 : 0.14, 320 + (bar % 4) * 60);
    if (pos % 4 === 2) hat(t, 0.06, true);
    if (pos === 4 || pos === 12) clap(t, 0.16);
    pluck(t, ch[[0, 2, 1, 3, 2, 3, 1, 2, 0, 3, 2, 1, 3, 2, 1, 0][pos]] + 12, 0.055);
    if (bar % 4 === 3 && pos === 8) riser(t, spb * 2, 0.1);
  } },
  // 4. crisis (bubble peak / crash / strait)
  crisis: { bpm: 90, len: 16, vol: 1, step(t, pos, bar, s16, spb) {
    const r = [45, 46, 44, 43][bar % 4];
    if (pos === 0) { drone(t, r - 12, spb * 4.1, 0.14); strings(t, [r + 12, r + 13, r + 18], spb * 4.1, 0.02); kick(t, 1, 36); }
    if (pos === 3) kick(t, 0.6, 40);
    if (pos === 8) { noise(t, 0.4, 5000, 0.07); osc('square', N(r + 36), t, 0.08, 0.05, 0.002, 4000); }
    if (pos === 12 && bar % 2 === 1) { osc('sine', N(r + 48), t, 0.18, 0.07, 0.002); osc('sine', N(r + 48), t + 0.22, 0.18, 0.07, 0.002); }
    if (pos % 4 === 2 && bar % 2 === 0) hat(t, 0.04);
    if (bar % 4 === 3 && pos === 0) riser(t, spb * 4, 0.14);
    if (pos === 0 && bar % 4 === 0) timp(t, r - 14, 0.6);
  } },
  // 5. tense (negotiation / boardroom chats)
  tense: { bpm: 100, len: 16, vol: 1.7, step(t, pos, bar, s16, spb) {
    const r = [50, 50, 46, 48][bar % 4];
    if (pos === 0) { drone(t, r - 12, spb * 4.1, 0.13); strings(t, chord(r + 12, MIN7).slice(0, 3), spb * 4.1, 0.016); }
    if (pos % 2 === 0) { const iv = [0, 0, 7, 0, 5, 0, 3, 0][pos / 2]; osc('triangle', N(r + 12 + iv), t, 0.1, 0.075, 0.003, 2200, 0, true); }
    if (pos % 4 === 0) osc('sine', 1200, t, 0.03, 0.05, 0.001);
    if (pos === 8) noise(t, 0.05, 5000, 0.05);
    if (bar % 4 === 3 && pos === 12) { osc('triangle', N(r + 24), t, 0.4, 0.06, 0.02, 2000, 0, true); }
  } },
  // 6. piano (prologue / archive / office)
  piano: { bpm: 64, len: 16, vol: 1.5, step(t, pos, bar, s16, spb) {
    const r = [57, 53, 48, 55][bar % 4], ch = chord(r, MIN);
    if (pos === 0) { strings(t, [r + 12, r + 19], spb * 4.2, 0.014); ch.forEach((n, i) => piano(t + i * 0.07, n + (i === 0 ? 0 : 12), 0.09, 2.8)); }
    if (pos === 8) [1, 2, 3].forEach((i, k) => piano(t + k * 0.12, ch[i] + 12, 0.055, 2));
    if (pos % 4 === 2 && R(bar * 16 + pos, 4) > 0.55) piano(t, pick([0, 2, 4, 7, 9, 12], bar + pos, 9) + r + 24, 0.06, 2.2);
  } },
  // 7. noir (investigation / alley)
  noir: { bpm: 90, len: 16, vol: 1.15, swing: 0.2, step(t, pos, bar, s16, spb) {
    const r = [50, 53, 48, 49][bar % 4], ch = chord(r, MIN7), walk = [0, 3, 7, 5];
    if (pos % 4 === 0) bassSine(t, r + walk[(pos / 4) | 0] + (pos === 12 ? 0 : 0), spb * 0.9, 0.3);
    if (pos === 0 || pos === 8) ch.forEach((n, i) => vibes(t + i * 0.02, n + 24, 0.045));
    if (pos === 4 || pos === 12) brush(t, 0.09);
    if (pos % 4 === 2) hat(t, 0.035);
    if (pos === 0) kick(t, 0.35, 55);
    if (bar % 2 === 1 && pos === 6) osc('sawtooth', N(r + 31), t, spb * 1.2, 0.05, 0.12, 1300, 5);
    if (R(bar * 16 + pos, 2) > 0.86 && pos % 2 === 0) vibes(t, pick([0, 3, 5, 7, 10], bar + pos, 5) + r + 24, 0.05);
  } },
  // 8. funk (earnings win)
  funk: { bpm: 112, len: 16, vol: 0.95, swing: 0.1, step(t, pos, bar, s16, spb) {
    const r = [48, 53, 55, 48][bar % 4], ch = chord(r + 12, MAJ);
    if (pos % 4 === 0) kick(t, 0.8);
    if ([0, 3, 6, 10, 12, 14].includes(pos)) bassSaw(t, r + ([0, 7, 12, 0, 10, 7][[0, 3, 6, 10, 12, 14].indexOf(pos)]) % 12, s16 * 1.4, 0.2, 380);
    if (pos === 4 || pos === 12) clap(t, 0.2);
    hat(t, pos % 2 ? 0.035 : 0.06);
    if ([0, 6, 10].includes(pos)) brass(t, ch.slice(0, 3), 0.22, 0.04);
    if (pos % 4 === 0 && bar % 2 === 1) pluck(t, ch[pos / 4 % 4] + 12, 0.07);
    if (bar % 4 === 3 && pos === 12) riser(t, spb, 0.1);
  } },
  // 9. news (quarter cutscene)
  news: { bpm: 126, len: 16, vol: 0.95, step(t, pos, bar, s16, spb) {
    const r = [52, 52, 50, 47][bar % 4];
    if (pos % 2 === 0) bassSaw(t, r, s16 * 1.6, 0.18, 340);
    if (pos % 4 === 0) kick(t, 0.8);
    if ([0, 6, 8].includes(pos)) brass(t, chord(r + 12, MIN).slice(0, 3), 0.18, 0.05);
    if (pos >= 12) snare(t, 0.1 + (pos - 12) * 0.03);
    if (pos === 0) timp(t, r - 14, 0.35);
    if (pos % 2 === 1) hat(t, 0.045);
  } },
  // 10. synth (data center / fab)
  synth: { bpm: 104, len: 16, vol: 0.9, step(t, pos, bar, s16, spb) {
    const r = [57, 53, 60, 55][bar % 4], ch = chord(r + 12, MIN);
    if (pos === 0) strings(t, ch, spb * 4.2, 0.02);
    if (pos % 4 === 0) kick(t, 0.8);
    if (pos === 8) snare(t, 0.2);
    osc('sawtooth', N(ch[[0, 1, 2, 3, 2, 1, 3, 2, 0, 2, 1, 3, 2, 3, 1, 2][pos]] + 12), t, s16 * 1.7, 0.05, 0.004, 700 + 1400 * (0.5 + 0.5 * Math.sin((bar * 16 + pos) / 9)), 0, true);
    if (pos % 2 === 0) bassSaw(t, r, s16 * 1.6, 0.13, 240);
    if (pos % 4 === 2) hat(t, 0.045);
  } },
  // 11. march (senate)
  march: { bpm: 100, len: 16, vol: 0.95, step(t, pos, bar, s16, spb) {
    const r = [46, 51, 53, 46][bar % 4];
    if (pos === 0 || pos === 8) timp(t, r - 8, 0.45);
    if ([0, 3, 4, 7, 8, 11, 12, 14, 15].includes(pos)) snare(t, 0.09);
    if (pos === 0 || pos === 8) brass(t, chord(r + 12, MAJ).slice(0, 3), spb * 1.6, 0.045);
    if (pos === 4 || pos === 12) brass(t, chord(r + 12, MAJ).slice(1, 3), spb * 0.6, 0.04);
    if (pos % 4 === 0) bassSine(t, r, spb * 0.8, 0.25);
    if (pos === 0 && bar % 2 === 0) strings(t, chord(r + 12, MAJ), spb * 8.2, 0.016);
  } },
  // 12. waltz (gala)
  waltz: { bpm: 142, len: 12, vol: 1.5, step(t, pos, bar, s16, spb) {
    const r = [53, 50, 55, 48][bar % 4], ch = chord(r + 12, bar % 4 === 1 ? MIN : MAJ);
    if (pos === 0) { bassSine(t, r, spb * 1.2, 0.3); strings(t, [ch[0], ch[2]], spb * 3.1, 0.016); }
    if (pos === 4 || pos === 8) ch.slice(0, 3).forEach((n) => piano(t, n + 12, 0.05, 0.7));
    if (pos % 4 === 0 && R(bar * 12 + pos, 6) > 0.35) piano(t, ch[(bar + pos / 4) % 4] + 24, 0.065, 1.1);
    if (pos === 0 && bar % 2 === 0) pluck(t, ch[2] + 24, 0.05);
  } },
  // 13. warm (soft ending)
  warm: { bpm: 70, len: 16, vol: 1.3, step(t, pos, bar, s16, spb) {
    const r = [48, 55, 57, 53][bar % 4], ch = chord(r, MAJ);
    if (pos === 0) { strings(t, chord(r + 12, MAJ), spb * 4.2, 0.03); bassSine(t, r, spb * 3.8, 0.28); }
    if (pos % 2 === 0) piano(t, ch[[0, 1, 2, 3, 2, 1, 3, 2][pos / 2]] + 12 + (pos > 7 ? 12 : 0), 0.07, 1.8);
    if (bar % 4 === 3 && pos === 8) timp(t, r - 14, 0.3);
  } },
  // 14. sad (dark ending)
  sad: { bpm: 56, len: 16, vol: 1.9, step(t, pos, bar, s16, spb) {
    const r = [45, 41, 36, 43][bar % 4], ch = chord(r + 12, MIN);
    if (pos === 0) { drone(t, r - 12, spb * 4.2, 0.1); strings(t, ch.slice(0, 3), spb * 4.2, 0.016); piano(t, r + 12, 0.1, 3.5); }
    if (pos === 8) piano(t, ch[2] + 12, 0.07, 3);
    if (pos % 8 === 4 && R(bar * 16 + pos, 8) > 0.4) piano(t, pick([0, 3, 7, 10], bar + pos, 5) + r + 24, 0.055, 2.5);
  } },
};
// moods → track (stable names for main.js)
export const TRACK_NAMES = Object.keys(TRACKS);

function schedule() {
  if (!ac || ac.state !== 'running' || !cur) return;
  const T = TRACKS[curName], spb = 60 / T.bpm, s16 = spb / (T.len / 4);
  while (nextT < ac.currentTime + 0.25) {
    const pos = step % T.len, bar = Math.floor(step / T.len);
    const sw = T.swing && pos % 2 === 1 ? T.swing * s16 : 0;
    T.step(nextT + sw, pos, bar, s16, spb);
    nextT += s16; step += 1;
  }
}
function setTrack(name) {
  if (!TRACKS[name] || name === curName) return;
  const old = cur, now = ac.currentTime;
  if (old) { old.g.gain.cancelScheduledValues(now); old.g.gain.setValueAtTime(old.g.gain.value, now); old.g.gain.linearRampToValueAtTime(0, now + 1.4); const o = old; setTimeout(() => { try { o.g.disconnect(); } catch (e) { /* gone */ } }, 4500); }
  B = mkBus(); cur = B; curName = name; step = 0; nextT = now + 0.12;
  B.g.gain.setValueAtTime(0, now); B.g.gain.linearRampToValueAtTime(TRACKS[name].vol, now + 1.6);
}
function start() {
  if (started) return; started = true;
  if (!ac) init();
  if (ac.state === 'suspended') ac.resume();
  setTrack(pend || 'epic'); timer = setInterval(schedule, 60);
}
function tone(freq, dur, type = 'sine', vol = 0.12, slide = 0) {
  if (!ac || muted) return; const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t); if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, t + dur); env(g, t, 0.005, dur, vol);
  o.connect(g); g.connect(dry); g.connect(verb); o.start(t); o.stop(t + dur + 0.05);
}
function sfxNoise(t, dur, hp, vol) { const bb = B; if (!bb) return; noise(t, dur, hp, vol); }
export const Audio = {
  unlock() { try { start(); } catch (e) { /* no audio */ } },
  track(name) { pend = name; if (started && ac) { try { setTrack(name); } catch (e) { /* ignore */ } } },
  get current() { return curName || pend; },
  mood() { /* legacy no-op */ },
  toggle() { muted = !muted; try { localStorage.setItem('compact_mute', muted ? '1' : '0'); } catch (e) { /* ignore */ } if (master) master.gain.setTargetAtTime(muted ? 0 : 0.55, ac.currentTime, 0.1); return muted; },
  get muted() { return muted; },
  get started() { return started; },
  sfx(name) {
    if (!ac) return;
    if (name === 'click') tone(660, 0.09, 'triangle', 0.07, 1.5);
    else if (name === 'open') { tone(220, 0.5, 'sawtooth', 0.05, 3); sfxNoise(ac.currentTime, 0.45, 900, 0.07); }
    else if (name === 'msg') { tone(880, 0.12, 'sine', 0.06); tone(1320, 0.18, 'sine', 0.04); }
    else if (name === 'choose') { tone(392, 0.2, 'triangle', 0.1); tone(587, 0.35, 'triangle', 0.1); }
    else if (name === 'coin') { [988, 1319, 1760].forEach((f, i) => setTimeout(() => tone(f, 0.25, 'square', 0.05), i * 70)); }
    else if (name === 'win') { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.6, 'triangle', 0.1), i * 110)); }
    else if (name === 'crash') { tone(90, 1.4, 'sawtooth', 0.25, 0.3); sfxNoise(ac.currentTime, 1.2, 200, 0.25); }
    else if (name === 'letter') { sfxNoise(ac.currentTime, 0.35, 2500, 0.06); [659, 784, 988].forEach((f, i) => setTimeout(() => tone(f, 0.9, 'sine', 0.06), 200 + i * 160)); }
    else if (name === 'warn') { tone(180, 0.5, 'square', 0.08, 0.6); }
  },
};
addEventListener('pointerdown', () => Audio.unlock(), { once: true });
addEventListener('keydown', () => Audio.unlock(), { once: true });
