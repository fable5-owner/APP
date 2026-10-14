// Full-screen particle layer: embers, coin/confetti bursts, crash sparks, screen flash.
const cv = document.createElement('canvas');
cv.id = 'fx'; cv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:300';
document.body.appendChild(cv);
const c = cv.getContext('2d');
let W = 0, H = 0, dpr = 1, ps = [], embers = true, raf = 0, last = 0;
function resize() { dpr = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; }
addEventListener('resize', resize); resize();
const R = (a, b) => a + Math.random() * (b - a);
for (let i = 0; i < 40; i++) ps.push(ember(true));
function ember(init) { return { k: 'e', x: R(0, W), y: init ? R(0, H) : H + 10, vx: R(-6, 6), vy: R(-22, -60), r: R(.6, 2.2), a: R(.2, .8), ph: R(0, 6), life: 1, col: Math.random() < .3 ? '243,201,120' : '134,174,252' }; }

export const FX = {
  embers(on) { embers = on; },
  burst(kind, x = W / 2, y = H / 2, n = 120) {
    for (let i = 0; i < n; i++) {
      const a = R(0, 6.283), sp = R(120, kind === 'crash' ? 700 : 520);
      const col = kind === 'crash' ? ['255,123,139', '255,170,90', '255,255,255'][i % 3] : kind === 'coin' ? ['243,201,120', '255,236,160', '255,255,255'][i % 3] : ['134,174,252', '98,214,161', '243,201,120', '199,155,255', '255,255,255'][i % 5];
      ps.push({ k: kind === 'coin' ? 'c' : 'p', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (kind === 'crash' ? 0 : 180), r: R(2, kind === 'coin' ? 6 : 4), a: 1, life: R(1.1, 2.2), age: 0, ph: R(0, 6), rot: R(0, 6), col, g: kind === 'crash' ? 300 : 620 });
    }
    start();
  },
  flash(col = '255,255,255', ms = 420) { ps.push({ k: 'f', col, a: .55, life: ms / 1000, age: 0 }); start(); },
};
function start() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); } }
function tick(now) {
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, W, H);
  c.globalCompositeOperation = 'lighter';
  if (embers && ps.filter((p) => p.k === 'e').length < 40) ps.push(ember(false));
  for (const p of ps) {
    if (p.k === 'e') {
      p.x += (p.vx + Math.sin(now / 900 + p.ph) * 10) * dt; p.y += p.vy * dt;
      if (p.y < -10) p.life = 0;
      const al = p.a * (0.5 + 0.5 * Math.sin(now / 500 + p.ph)) * (embers ? 1 : 0);
      c.fillStyle = `rgba(${p.col},${al * .8})`; c.beginPath(); c.arc(p.x, p.y, p.r, 0, 6.3); c.fill(); c.fillStyle = `rgba(${p.col},${al * .15})`; c.beginPath(); c.arc(p.x, p.y, p.r * 4, 0, 6.3); c.fill();
    } else if (p.k === 'f') {
      p.age += dt; const a = p.a * Math.max(0, 1 - p.age / p.life); c.fillStyle = `rgba(${p.col},${a})`; c.fillRect(0, 0, W, H); if (p.age >= p.life) p.life = 0;
    } else {
      p.age += dt; p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.992;
      const a = Math.max(0, 1 - p.age / p.life);
      c.fillStyle = `rgba(${p.col},${a})`; 
      if (p.k === 'c') { c.save(); c.translate(p.x, p.y); c.scale(Math.abs(Math.cos(p.age * 8 + p.ph)), 1); c.beginPath(); c.arc(0, 0, p.r, 0, 6.3); c.fill(); c.restore(); }
      else { c.save(); c.translate(p.x, p.y); c.rotate(p.rot + p.age * 6); c.fillRect(-p.r, -p.r * .4, p.r * 2, p.r * .8); c.restore(); }
      if (p.age >= p.life) p.life = 0;
    }
  }
  c.globalCompositeOperation = 'source-over';
  ps = ps.filter((p) => p.k === 'e' ? p.life > 0 : p.life > 0 && p.age < p.life);
  raf = requestAnimationFrame(tick);
}
start();
