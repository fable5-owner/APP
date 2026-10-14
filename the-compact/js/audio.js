// Procedural soundtrack + SFX (Web Audio, zero asset files). Starts on first user gesture.
let ac = null, master, verb, dry, delay, timer = 0, step = 0, nextT = 0, started = false;
let muted = false; try { muted = localStorage.getItem('compact_mute') === '1'; } catch (e) { /* ignore */ }
const M = { mode: 'minor', inten: 1, bpm: 84 };
const NOTE = (n) => 440 * Math.pow(2, (n - 69) / 12);
const PROG = { minor: [[57, 0], [53, 0], [48, 0], [55, 0]], major: [[48, 1], [55, 1], [57, 0], [53, 1]], dark: [[57, 0], [58, 0], [56, 0], [55, 0]] };
const TRI = { 0: [0, 3, 7, 12], 1: [0, 4, 7, 12] };

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
function env(g, t, a, d, peak, sus = 0) { g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(Math.max(sus, 0.0001), t + a + d); }
function pad(t, notes, dur) {
  for (const n of notes) for (const det of [-9, 8]) {
    const o = ac.createOscillator(), f = ac.createBiquadFilter(), g = ac.createGain();
    o.type = 'sawtooth'; o.frequency.value = NOTE(n); o.detune.value = det; f.type = 'lowpass'; f.frequency.setValueAtTime(380, t); f.frequency.linearRampToValueAtTime(1100 + M.inten * 350, t + dur * 0.6); f.frequency.linearRampToValueAtTime(420, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.028, t + dur * 0.35); g.gain.linearRampToValueAtTime(0.0001, t + dur);
    o.connect(f); f.connect(g); g.connect(verb); g.connect(dry); o.start(t); o.stop(t + dur + 0.1);
  }
}
function pluck(t, n, vol = 0.07) {
  const o = ac.createOscillator(), g = ac.createGain(), f = ac.createBiquadFilter();
  o.type = 'triangle'; o.frequency.value = NOTE(n); f.type = 'lowpass'; f.frequency.value = 3200; env(g, t, 0.004, 0.45, vol);
  o.connect(f); f.connect(g); g.connect(dry); g.connect(delay); o.start(t); o.stop(t + 0.6);
}
function bass(t, n, len = 0.4) {
  const o = ac.createOscillator(), g = ac.createGain(), f = ac.createBiquadFilter();
  o.type = 'sawtooth'; o.frequency.value = NOTE(n - 12); f.type = 'lowpass'; f.frequency.value = 260; env(g, t, 0.01, len, 0.2);
  o.connect(f); f.connect(g); g.connect(dry); o.start(t); o.stop(t + len + 0.1);
}
function kick(t) {
  const o = ac.createOscillator(), g = ac.createGain();
  o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.14); env(g, t, 0.002, 0.28, 0.9);
  o.connect(g); g.connect(dry); o.start(t); o.stop(t + 0.35);
}
function noise(t, dur, hp, vol, dest) {
  const n = ac.sampleRate * dur, b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  const s = ac.createBufferSource(); s.buffer = b; const f = ac.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp; const g = ac.createGain(); env(g, t, 0.002, dur, vol);
  s.connect(f); f.connect(g); g.connect(dest || dry); s.start(t);
}

function schedule() {
  if (!ac || ac.state !== 'running') return;
  const spb = 60 / M.bpm, s16 = spb / 4;
  while (nextT < ac.currentTime + 0.25) {
    const bar = Math.floor(step / 16), pos = step % 16, ch = PROG[M.mode][bar % 4], root = ch[0], tri = TRI[ch[1]];
    const t = nextT;
    if (pos === 0) pad(t, [root + 12, root + 12 + tri[1], root + 12 + tri[2], root + 24], spb * 4.2);
    if (pos % 2 === 0 && M.inten >= 1) { const idx = [0, 2, 1, 3, 2, 1, 3, 2][(pos / 2) | 0]; pluck(t, root + 24 + tri[idx], pos % 4 === 0 ? 0.075 : 0.05); }
    if (M.inten >= 2 && pos % 4 === 0) bass(t, root, spb * 0.9);
    if (M.inten >= 2 && pos % 4 === 0) kick(t);
    if (M.inten >= 3 && pos % 8 === 4) noise(t, 0.18, 1800, 0.22);
    if (M.inten >= 2 && pos % 4 === 2) noise(t, 0.05, 7000, 0.08);
    if (M.inten >= 3 && pos % 2 === 1) noise(t, 0.03, 9000, 0.05);
    if (M.inten >= 1 && pos === 0 && bar % 4 === 0) { const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; o.frequency.value = NOTE(root - 12); env(g, t, 0.05, spb * 3, 0.22); o.connect(g); g.connect(dry); o.start(t); o.stop(t + spb * 3.5); }
    nextT += s16; step += 1;
  }
}
function start() {
  if (started) return; started = true;
  if (!ac) init();
  if (ac.state === 'suspended') ac.resume();
  nextT = ac.currentTime + 0.1; timer = setInterval(schedule, 60);
}
function tone(freq, dur, type = 'sine', vol = 0.12, slide = 0) {
  if (!ac || muted) return; const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t); if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, t + dur); env(g, t, 0.005, dur, vol);
  o.connect(g); g.connect(dry); g.connect(verb); o.start(t); o.stop(t + dur + 0.05);
}
export const Audio = {
  unlock() { try { start(); } catch (e) { /* no audio */ } },
  mood(mode, inten, bpm) { M.mode = mode; M.inten = inten; M.bpm = bpm; },
  toggle() { muted = !muted; try { localStorage.setItem('compact_mute', muted ? '1' : '0'); } catch (e) { /* ignore */ } if (master) master.gain.setTargetAtTime(muted ? 0 : 0.55, ac.currentTime, 0.1); return muted; },
  get muted() { return muted; },
  sfx(name) {
    if (!ac) return;
    if (name === 'click') tone(660, 0.09, 'triangle', 0.07, 1.5);
    else if (name === 'open') { tone(220, 0.5, 'sawtooth', 0.05, 3); noise(ac.currentTime, 0.45, 900, 0.07); }
    else if (name === 'msg') { tone(880, 0.12, 'sine', 0.06); tone(1320, 0.18, 'sine', 0.04); }
    else if (name === 'choose') { tone(392, 0.2, 'triangle', 0.1); tone(587, 0.35, 'triangle', 0.1); }
    else if (name === 'coin') { [988, 1319, 1760].forEach((f, i) => setTimeout(() => tone(f, 0.25, 'square', 0.05), i * 70)); }
    else if (name === 'win') { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.6, 'triangle', 0.1), i * 110)); }
    else if (name === 'crash') { tone(90, 1.4, 'sawtooth', 0.25, 0.3); noise(ac.currentTime, 1.2, 200, 0.25); }
    else if (name === 'warn') { tone(180, 0.5, 'square', 0.08, 0.6); }
  },
};
addEventListener('pointerdown', () => Audio.unlock(), { once: true });
addEventListener('keydown', () => Audio.unlock(), { once: true });
