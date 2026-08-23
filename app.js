import { countdownConfig, formatRemaining, getRemaining } from './countdown.js';
import { createSprites } from './sprites.js';

const shell = document.querySelector('.countdown-shell');
const countdown = document.querySelector('#countdown');
const targetLabel = document.querySelector('#target-label');
const timezone = document.querySelector('#timezone');
const liveAnnouncement = document.querySelector('#live-announcement');
const dawnMessage = document.querySelector('#dawn-message');
const fullscreenToggle = document.querySelector('#fullscreen-toggle');
const motionToggle = document.querySelector('#motion-toggle');
const canvas = document.querySelector('#winter-scene');
const context = canvas.getContext('2d');

const sprites = createSprites();

const NIGHT = {
  sky: ['#0a0e21', '#111731', '#182142', '#203055', '#2a4066', '#365479'],
  ridge: '#141c38',
  house: '#0e1430',
  snowFar: '#b9c6de',
  snowMid: '#cbd7ea',
  snowNear: '#dbe5f4',
  pine: '#0d1330'
};

const DAWN = {
  sky: ['#33305e', '#5a4372', '#8f5b7c', '#c4736f', '#eda06a', '#ffcb8e'],
  ridge: '#3d3f63',
  house: '#332f52',
  snowFar: '#e3cdc6',
  snowMid: '#eccfc2',
  snowNear: '#f2dcc9',
  pine: '#2c2c50'
};

const LANES = {
  far: { y: 0.695, scale: 0.55 },
  mid: { y: 0.765, scale: 0.78 },
  near: { y: 0.845, scale: 1 }
};

const TYPES = {
  my: { frames: sprites.my, size: 0.58, speed: 2.4, frameMs: 150, lanes: ['mid', 'far'] },
  tooticky: { frames: sprites.tooticky, size: 0.7, speed: 1.7, frameMs: 180, lanes: ['near', 'mid'] },
  ancestor: { frames: sprites.ancestor, size: 0.62, speed: 1.2, frameMs: 210, lanes: ['mid', 'far'] },
  groke: { frames: sprites.groke, size: 1, speed: 0.55, frameMs: 340, lanes: ['near'], frost: true }
};

const state = {
  W: 0,
  H: 0,
  u: 4,
  dpr: 1,
  reduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  dawnAt: null,
  announced: false,
  last: 0
};

const troll = { x: 0, dir: 1, frame: 0, frameAt: 0 };
const walkers = [];
let spawnIn = 2;

function mulberry32(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(20260828);
const stars = Array.from({ length: 110 }, () => ({
  fx: rng(),
  fy: rng() * 0.55,
  ph: rng() * Math.PI * 2,
  sp: 0.0008 + rng() * 0.0018,
  r: rng() < 0.18 ? 2 : 1
}));

const flakes = [
  ...Array.from({ length: 62 }, () => ({ fx: rng(), fy: rng(), sp: 0.03 + rng() * 0.03, ph: rng() * 7, near: false })),
  ...Array.from({ length: 38 }, () => ({ fx: rng(), fy: rng(), sp: 0.07 + rng() * 0.05, ph: rng() * 7, near: true }))
];

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mixHex(a, b, t) {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  return `rgb(${Math.round(r1 + (r2 - r1) * t)},${Math.round(g1 + (g2 - g1) * t)},${Math.round(b1 + (b2 - b1) * t)})`;
}

function smoothstep(t) {
  return t * t * (3 - 2 * t);
}

function dawnT(now) {
  if (!state.dawnAt) return 0;
  if (state.reduced) return 1;
  return smoothstep(Math.min(1, (now - state.dawnAt) / 9000));
}

function resizeCanvas() {
  state.dpr = Math.min(window.devicePixelRatio || 1, 2);
  state.W = window.innerWidth;
  state.H = window.innerHeight;
  state.u = Math.max(3, Math.round(state.H / 80));
  canvas.width = Math.floor(state.W * state.dpr);
  canvas.height = Math.floor(state.H * state.dpr);
  canvas.style.width = `${state.W}px`;
  canvas.style.height = `${state.H}px`;
  context.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
  context.imageSmoothingEnabled = false;
  troll.x = state.W / 2;
}

function quantize(y) {
  return Math.round(y / state.u) * state.u;
}

function ridgeEdge(x, H) {
  return H * 0.565 + Math.sin(x * 0.0018 + 1.5) * H * 0.028 + Math.sin(x * 0.0007 + 0.4) * H * 0.02;
}

function stripEdge(kind, x, H) {
  if (kind === 'far') return H * 0.615 + Math.sin(x * 0.003 + 0.5) * H * 0.02 + Math.sin(x * 0.0011) * H * 0.03;
  if (kind === 'mid') return H * 0.72 + Math.sin(x * 0.004 + 2) * H * 0.018 + Math.sin(x * 0.0009 + 1) * H * 0.026;
  return H * 0.81 + Math.sin(x * 0.005 + 4) * H * 0.016 + Math.sin(x * 0.0013 + 3) * H * 0.022;
}

function drawSteppedStrip(edgeFn, color) {
  const { W, H, u } = state;
  context.fillStyle = color;
  for (let x = 0; x < W + u; x += u) {
    const top = quantize(edgeFn(x, H));
    context.fillRect(x, top, u, H - top);
  }
}

function drawTriCells(cx, top, halfW, h, color) {
  context.fillStyle = color;
  for (let r = 0; r < h; r++) {
    const w = Math.max(1, Math.round((halfW * (r + 1)) / h));
    context.fillRect(Math.round(cx - w), top + r, w * 2, 1);
  }
}

function drawCellEll(cx, cy, rx, ry, color, alpha = 1) {
  context.globalAlpha = alpha;
  context.fillStyle = color;
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x + 0.5 - cx) / rx;
      const dy = (y + 0.5 - cy) / ry;
      if (dx * dx + dy * dy <= 1) context.fillRect(x, y, 1, 1);
    }
  }
  context.globalAlpha = 1;
}

function drawGlow(x, y, radius, alpha) {
  const g = context.createRadialGradient(x, y, 0, x, y, radius);
  g.addColorStop(0, `rgba(255,190,110,${alpha})`);
  g.addColorStop(1, 'rgba(255,190,110,0)');
  context.fillStyle = g;
  context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

function drawShadow(cx, footY, widthPx) {
  context.globalAlpha = 0.16;
  context.fillStyle = '#10162e';
  context.beginPath();
  context.ellipse(cx, footY + 1, widthPx / 2, state.u * 0.9, 0, 0, Math.PI * 2);
  context.fill();
  context.globalAlpha = 1;
}

function drawSprite(frames, frameIndex, x, footY, cs, dir) {
  const sprite = frames[frameIndex % frames.length];
  const w = sprite.width * cs;
  const h = sprite.height * cs;
  context.save();
  context.translate(Math.round(x), Math.round(footY));
  if (dir < 0) context.scale(-1, 1);
  context.drawImage(sprite.canvas, Math.round(-w / 2), Math.round(-h), w, h);
  context.restore();
  return sprite;
}

function drawSky(t, dt) {
  const { W, H } = state;
  const d = dawnT(t);
  const stops = [0.2, 0.36, 0.51, 0.65, 0.78, 1];
  let top = 0;
  NIGHT.sky.forEach((nightColor, i) => {
    const bottom = Math.floor(H * stops[i]);
    context.fillStyle = mixHex(nightColor, DAWN.sky[i], d);
    context.fillRect(0, top, W, bottom - top);
    top = bottom;
  });

  const starAlpha = (1 - d) * (state.reduced ? 0.85 : 0.55 + 0.45 * Math.sin(t * 0.002 + stars[0].ph));
  context.fillStyle = '#dfe6ff';
  for (const star of stars) {
    const twinkle = state.reduced ? 0.8 : 0.55 + 0.45 * Math.sin(t * star.sp + star.ph);
    context.globalAlpha = starAlpha * twinkle;
    context.fillRect(Math.round(star.fx * W), Math.round(star.fy * H), star.r, star.r);
  }
  context.globalAlpha = 1;

  const moonA = 1 - d;
  if (moonA > 0.02) {
    const mx = W * 0.78;
    const my = H * 0.16;
    const mr = state.u * 4.2;
    drawCellEll(mx, my, mr, mr, '#e9edda', moonA * 0.95);
    drawCellEll(mx - mr * 0.3, my - mr * 0.2, mr * 0.22, mr * 0.22, '#c9cfba', moonA * 0.8);
    drawCellEll(mx + mr * 0.25, my + mr * 0.35, mr * 0.16, mr * 0.16, '#c9cfba', moonA * 0.8);
    drawCellEll(mx + mr * 0.1, my - mr * 0.45, mr * 0.12, mr * 0.12, '#c9cfba', moonA * 0.8);
    drawGlow(mx, my, mr * 3.4, 0.08 * moonA);
  }

  if (d > 0.01) {
    const sx = W * 0.3;
    const sy = H * 0.66 - smoothstep(d) * H * 0.19;
    const sr = state.u * 4.6;
    drawGlow(sx, sy, sr * 4, 0.22 * d);
    drawCellEll(sx, sy, sr, sr, '#fff3cf', Math.min(1, d * 1.4));
  }
}

function drawLand(t, now, d) {
  const { W, H, u } = state;
  drawSteppedStrip(ridgeEdge, mixHex(NIGHT.ridge, DAWN.ridge, d));

  const hx = W * 0.74;
  const gy = quantize(ridgeEdge(hx, H)) + u;
  const houseColor = mixHex(NIGHT.house, DAWN.house, d);
  context.fillStyle = houseColor;
  context.fillRect(hx - 3 * u, gy - 7 * u, 6 * u, 7 * u);
  drawTriCells(hx, gy - 11 * u, 3.2 * u, 4 * u, houseColor);
  context.fillStyle = houseColor;
  context.fillRect(hx + 3 * u, gy - 5 * u, 4 * u, 5 * u);
  drawTriCells(hx + 5 * u, gy - 7 * u, 2.2 * u, 2 * u, houseColor);

  const flicker = state.reduced ? 0.75 : 0.65 + 0.3 * Math.sin(now * 0.006 + 1.3);
  context.globalAlpha = flicker * (1 - d * 0.5);
  context.fillStyle = '#ffca6e';
  context.fillRect(hx - 2 * u, gy - 5 * u, u, u);
  context.fillRect(hx + 1 * u, gy - 4 * u, u, u);
  context.fillRect(hx + 4 * u, gy - 3 * u, u, u);
  context.globalAlpha = 1;

  drawSteppedStrip((x, h) => stripEdge('far', x, h), mixHex(NIGHT.snowFar, DAWN.snowFar, d));

  const pines = [
    { fx: 0.06, s: 0.95 },
    { fx: 0.13, s: 0.7 },
    { fx: 0.31, s: 1 },
    { fx: 0.46, s: 0.72 },
    { fx: 0.585, s: 0.92 },
    { fx: 0.67, s: 0.68 },
    { fx: 0.93, s: 0.88 }
  ];
  const pineColor = mixHex(NIGHT.pine, DAWN.pine, d);
  for (const pine of pines) {
    const px = pine.fx * W;
    const base = quantize(stripEdge('mid', px, H)) + u;
    const h = Math.round(pine.s * 8 * u);
    const halfW = Math.round(pine.s * 2.6 * u);
    context.fillStyle = pineColor;
    context.fillRect(Math.round(px - u * 0.4), base - Math.round(u * 1.4), Math.max(1, Math.round(u * 0.8)), Math.round(u * 1.4));
    drawTriCells(px, base - Math.round(u * 1.4) - h, halfW, h, pineColor);
    drawTriCells(px, base - Math.round(u * 1.4) - Math.round(h * 0.62), Math.round(halfW * 0.74), Math.round(h * 0.62), pineColor);
  }

  drawSteppedStrip((x, h) => stripEdge('mid', x, h), mixHex(NIGHT.snowMid, DAWN.snowMid, d));
  drawSteppedStrip((x, h) => stripEdge('near', x, h), mixHex(NIGHT.snowNear, DAWN.snowNear, d));
}

function laneFootY(lane) {
  return state.H * LANES[lane].y;
}

function walkerCellSize(typeName, lane) {
  return Math.max(2, Math.round(state.u * TYPES[typeName].size * LANES[lane].scale));
}

function spawnWalker(now) {
  const available = Object.keys(TYPES).filter((name) => !walkers.some((w) => w.type === name));
  if (available.length === 0) return false;
  const typeName = available[Math.floor(rng() * available.length)];
  const type = TYPES[typeName];
  const lane = type.lanes[Math.floor(rng() * type.lanes.length)];
  walkers.push({
    type: typeName,
    lane,
    dir: -1,
    x: state.W * 1.08,
    frameOffset: rng() * 1000,
    trail: [],
    trailAt: 0
  });
  return true;
}

function updateWalkers(dtSec, now, t) {
  if (state.reduced) return;
  spawnIn -= dtSec;
  if (spawnIn <= 0) {
    if (spawnWalker(now)) spawnIn = 4 + rng() * 5;
    else spawnIn = 2;
  }
  for (let i = walkers.length - 1; i >= 0; i--) {
    const walker = walkers[i];
    const speedPx = TYPES[walker.type].speed * state.u;
    walker.x += speedPx * walker.dir * dtSec;
    if (walker.x < -state.W * 0.12) walkers.splice(i, 1);
    if (TYPES[walker.type].frost) {
      if (now - walker.trailAt > 90) {
        walker.trail.push({ x: walker.x - walker.dir * state.u * 2, y: laneFootY(walker.lane), t: now });
        walker.trailAt = now;
        if (walker.trail.length > 42) walker.trail.shift();
      }
    }
  }
}

function drawFrostTrail(trail, now) {
  for (const drop of trail) {
    const age = (now - drop.t) / 2600;
    if (age >= 1) continue;
    context.globalAlpha = (1 - age) * 0.45;
    context.fillStyle = '#bcd7ff';
    const jx = ((drop.x * 13) | 0) % 3;
    context.fillRect(drop.x + jx, drop.y - ((jx * 5) % 4) * state.u * 0.4, state.u, state.u * 0.5);
  }
  context.globalAlpha = 1;
}

function drawWalker(walker, now, t) {
  const type = TYPES[walker.type];
  const cs = walkerCellSize(walker.type, walker.lane);
  const frame = state.reduced ? 0 : Math.floor((t + walker.frameOffset) / type.frameMs);
  const footY = laneFootY(walker.lane);
  const sprite = type.frames[0];
  const wPx = sprite.width * cs;
  drawShadow(walker.x, footY, wPx * 0.8);
  if (type.frost) drawFrostTrail(walker.trail, now);
  const drawn = drawSprite(type.frames, frame, walker.x, footY, cs, walker.dir);
  if (walker.type === 'tooticky' || walker.type === 'ancestor') {
    const anchor = walker.type === 'tooticky' ? { x: 13, y: 15.5 } : { x: 15.5, y: 13 };
    const gx = walker.x + walker.dir * (anchor.x - drawn.width / 2) * cs;
    const gy = footY - (drawn.height - anchor.y) * cs;
    const flicker = state.reduced ? 0.16 : 0.13 + 0.05 * Math.sin(now * 0.011 + walker.frameOffset);
    drawGlow(gx, gy, cs * 7, flicker);
  }
}

function updateTroll(dtSec, now, t) {
  if (!state.reduced) troll.frame = Math.floor(t / 150);
}

function drawTroll(now, t, d) {
  const cs = Math.max(3, Math.round(state.u));
  const footY = state.H * 0.875;
  const frames = sprites.troll;
  drawShadow(troll.x, footY, frames[0].width * cs * 0.85);
  drawSprite(frames, state.reduced ? 0 : troll.frame, troll.x, footY, cs, troll.dir);
}

function drawSnowfall(dtSec, t, d) {
  const { W, H, u } = state;
  for (const flake of flakes) {
    if (!state.reduced) {
      flake.fy += flake.sp * dtSec;
      if (flake.fy > 1.02) {
        flake.fy = -0.02;
        flake.fx = rng();
      }
    }
    const sway = state.reduced ? 0 : Math.sin(t * 0.001 + flake.ph) * u * 1.6;
    const x = Math.round(flake.fx * W + sway);
    const y = Math.round(flake.fy * H);
    const size = flake.near ? Math.max(2, Math.round(u * 0.7)) : 1;
    context.globalAlpha = (flake.near ? 0.75 : 0.45) * (1 - d * 0.35);
    context.fillStyle = flake.near ? '#f4f7ff' : '#ccd6ee';
    context.fillRect(x, y, size, size);
  }
  context.globalAlpha = 1;
}

function drawVignette() {
  const { W, H } = state;
  const g = context.createRadialGradient(W / 2, H * 0.55, Math.min(W, H) * 0.35, W / 2, H * 0.55, Math.max(W, H) * 0.75);
  g.addColorStop(0, 'rgba(4,6,18,0)');
  g.addColorStop(1, 'rgba(4,6,18,0.34)');
  context.fillStyle = g;
  context.fillRect(0, 0, W, H);
}

function drawScene(now, t, dtSec) {
  const d = dawnT(t);
  context.clearRect(0, 0, state.W, state.H);
  drawSky(t, dtSec);
  drawLand(t, now, d);
  for (const walker of walkers.filter((w) => w.lane === 'far')) drawWalker(walker, now, t);
  for (const walker of walkers.filter((w) => w.lane === 'mid')) drawWalker(walker, now, t);
  for (const walker of walkers.filter((w) => w.lane === 'near')) drawWalker(walker, now, t);
  updateTroll(dtSec, now, t);
  drawTroll(now, t, d);
  drawSnowfall(dtSec, t, d);
  drawVignette();
}

function animate(now) {
  const dtMs = Math.min(50, now - state.last || 16);
  const dtSec = dtMs / 1000;
  updateWalkers(dtSec, now, now);
  drawScene(now, now, dtSec);
  state.last = now;
  requestAnimationFrame(animate);
}

function updateCountdown(now = new Date()) {
  const remaining = getRemaining(now);
  countdown.textContent = formatRemaining(remaining);

  if (remaining.complete) {
    shell.classList.add('is-dawn');
    dawnMessage.hidden = false;
    countdown.setAttribute('aria-label', 'Countdown complete');
    if (!state.announced) {
      liveAnnouncement.textContent = 'The dawn is here. Countdown complete.';
      state.announced = true;
    }
    if (!state.dawnAt) state.dawnAt = performance.now();
    return true;
  }

  shell.classList.remove('is-dawn');
  dawnMessage.hidden = true;
  countdown.setAttribute('aria-label', `${formatRemaining(remaining)} remaining`);
  return false;
}

function scheduleCountdown() {
  if (updateCountdown()) return;
  const delay = 1000 - (Date.now() % 1000) + 20;
  window.setTimeout(scheduleCountdown, delay);
}

function setMotion(reduced) {
  state.reduced = reduced;
  motionToggle.setAttribute('aria-pressed', String(reduced));
  motionToggle.textContent = reduced ? 'Motion: off' : 'Motion: on';
}

timezone.textContent = countdownConfig.timezoneLabel;
targetLabel.textContent = 'Until 28 August 2026 · 18:00 HKT';

if (!state.reduced) spawnWalker(performance.now());

fullscreenToggle.addEventListener('click', async () => {
  if (!document.fullscreenElement) {
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      fullscreenToggle.textContent = 'Fullscreen unavailable';
    }
  } else {
    await document.exitFullscreen();
  }
});

document.addEventListener('fullscreenchange', () => {
  fullscreenToggle.textContent = document.fullscreenElement ? 'Exit fullscreen' : 'Enter fullscreen';
});

motionToggle.addEventListener('click', () => setMotion(!state.reduced));

window.addEventListener('resize', resizeCanvas, { passive: true });

setMotion(state.reduced);
resizeCanvas();
scheduleCountdown();
requestAnimationFrame(animate);
