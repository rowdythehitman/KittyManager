'use strict';

const CATS = [
  { id: 'chuchi', name: 'CHUCHI', accent: 'var(--chuchi)' },
  { id: 'diego', name: 'DIEGO', accent: 'var(--diego)' },
];
const STORE_KEY = 'kittymanager.v1';
const KEEP_DAYS = 60;

// ---------- storage ----------
// { days: { 'YYYY-MM-DD': { chuchi: [{ t: timestamp, n: halves }, ...], diego: [...] } } }
// One entry per button press; n is 1 for a half pouch, 2 for a full one.

function load() {
  try {
    const data = JSON.parse(localStorage.getItem(STORE_KEY));
    if (data && data.days) {
      // v1 logs stored a bare timestamp per half pouch
      for (const day of Object.values(data.days)) {
        for (const id of Object.keys(day)) {
          day[id] = day[id].map((e) => (typeof e === 'number' ? { t: e, n: 1 } : e));
        }
      }
      return data;
    }
  } catch (e) { /* fall through to a fresh log */ }
  return { days: {} };
}

function save() {
  const keys = Object.keys(state.days).sort();
  for (const k of keys.slice(0, Math.max(0, keys.length - KEEP_DAYS))) delete state.days[k];
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* storage unavailable */ }
}

function dayKey(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function feeds(catId, key = dayKey()) {
  const day = state.days[key] || (state.days[key] = {});
  return day[catId] || (day[catId] = []);
}

function halvesOf(list) {
  return list.reduce((sum, e) => sum + e.n, 0);
}

const state = load();
let shownDay = dayKey();

// ---------- panels ----------

function pouchText(halves) {
  const whole = Math.floor(halves / 2);
  if (halves % 2 === 0) return String(whole);
  return whole ? `${whole}.5` : '0.5';
}

function timeText(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function agoText(ts) {
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return 'JUST NOW';
  if (mins < 60) return `${mins}M AGO`;
  return `${Math.floor(mins / 60)}H ${mins % 60}M AGO`;
}

const panels = {};

function buildPanels() {
  const tpl = document.getElementById('panelTpl');
  const host = document.getElementById('panels');
  for (const cat of CATS) {
    const el = tpl.content.firstElementChild.cloneNode(true);
    el.style.setProperty('--accent', cat.accent);
    el.querySelector('.name').textContent = cat.name;
    const pc = el.querySelector('.portrait').getContext('2d');
    drawSprite(pc, SPRITES.sit, PALETTES[cat.id], 0, 0, 4);
    el.querySelector('.feed.half').addEventListener('click', () => feed(cat.id, 1));
    el.querySelector('.feed.full').addEventListener('click', () => feed(cat.id, 2));
    el.querySelector('.undo').addEventListener('click', () => undo(cat.id));
    host.appendChild(el);
    panels[cat.id] = el;
  }
}

function render() {
  shownDay = dayKey();
  for (const cat of CATS) {
    const el = panels[cat.id];
    const list = feeds(cat.id);
    const halves = halvesOf(list);
    const last = list[list.length - 1];
    el.querySelector('.num').textContent = pouchText(halves);
    el.querySelector('.unit').textContent = halves === 2 ? 'POUCH TODAY' : 'POUCHES TODAY';
    el.querySelector('.last').textContent = last ? `FED ${timeText(last.t)}` : 'NOT FED YET';
    el.querySelector('.ago').textContent = last ? agoText(last.t) : '';
    el.querySelector('.undo').disabled = !last;

    const box = el.querySelector('.pouches');
    box.textContent = '';
    for (let i = 0; i < halves; i += 2) {
      const p = document.createElement('div');
      p.className = i + 1 < halves ? 'pouch' : 'pouch half';
      box.appendChild(p);
    }
  }
}

function feed(catId, halves) {
  feeds(catId).push({ t: Date.now(), n: halves });
  save();
  render();
  const el = panels[catId];
  el.classList.remove('pop');
  void el.offsetWidth; // restart the animation
  el.classList.add('pop');
  if (navigator.vibrate) navigator.vibrate(30);
  celebrate(catId);
}

function undo(catId) {
  feeds(catId).pop();
  save();
  render();
}

// ---------- header clock + midnight rollover ----------

function tick() {
  const now = new Date();
  document.getElementById('date').textContent =
    now.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase();
  document.getElementById('clock').textContent = timeText(now);
  applyTheme();
  render(); // also rolls over to a fresh day at midnight and refreshes "ago" times
  updateSaver();
}

// ---------- history ----------

function showHistory() {
  const rows = [];
  const d = new Date();
  for (let i = 0; i < 7; i++) {
    const key = dayKey(d);
    const label = i === 0 ? 'TODAY'
      : d.toLocaleDateString([], { weekday: 'short', day: 'numeric' }).toUpperCase();
    const cells = CATS.map((c) => `<td>${pouchText(halvesOf((state.days[key] || {})[c.id] || []))}</td>`);
    rows.push(`<tr><td>${label}</td>${cells.join('')}</tr>`);
    d.setDate(d.getDate() - 1);
  }
  document.getElementById('historyTable').innerHTML =
    `<thead><tr><th></th>${CATS.map((c) => `<th>${c.name}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody>`;

  const today = [];
  for (const c of CATS) {
    for (const e of feeds(c.id)) today.push({ t: e.t, text: `${c.name} ${e.n === 2 ? 'FULL' : 'HALF'}` });
  }
  today.sort((a, b) => a.t - b.t);
  const list = document.getElementById('todayList');
  list.textContent = '';
  for (const e of today) {
    const li = document.createElement('li');
    li.textContent = `${timeText(e.t)}  ${e.text}`;
    list.appendChild(li);
  }
  if (!today.length) list.innerHTML = '<li>NOTHING YET</li>';

  document.getElementById('history').hidden = false;
}

// ---------- garden: little cats wandering about ----------

const garden = document.getElementById('garden');
const gctx = garden.getContext('2d');
const SPRITE_W = 20;
let scale = 4;
let placed = false;
let floorY = 0;                                   // where the wall meets the floor
const roomCanvas = document.createElement('canvas'); // the room is painted once, then reused each frame

function paintRoom() {
  roomCanvas.width = garden.width;
  roomCanvas.height = garden.height;
  drawRoom(roomCanvas.getContext('2d'), garden.width, garden.height, floorY, scale, isNight);
}

// The cats live on a "stage": normally the room, or the whole screen while the screensaver is up.
const roomStage = { ctx: gctx, w: 1, h: 1, scale: 4, minY: 0 };
let stage = roomStage;

const roamers = CATS.map((cat, i) => ({
  id: cat.id,
  x: 40 + i * 120, y: 60,
  tx: 0, ty: 0,
  mode: 'sit',        // 'sit' | 'walk' | 'run'
  until: 0,           // when the current sit ends
  facingLeft: i === 1,
  hopAt: -1e9,        // time of last hop
  heartAt: -1e9,      // time the last heart appeared
}));

function resizeGarden() {
  const r = garden.getBoundingClientRect();
  garden.width = Math.max(1, Math.round(r.width));
  garden.height = Math.max(1, Math.round(r.height));
  scale = Math.max(2, Math.min(5, Math.floor(Math.min(r.width / 70, r.height / 34))));
  floorY = Math.round(garden.height * 0.52);
  // cats stay on the floorboards (y is the top of the sprite, feet are 16px lower)
  Object.assign(roomStage, { w: garden.width, h: garden.height, scale, minY: floorY - 13 * scale });
  paintRoom();
  if (!placed && r.width > 50) {
    // first real layout: spread the cats out
    placed = true;
    const b = bounds();
    roamers.forEach((c, i) => {
      c.x = b.minX + (b.maxX - b.minX) * (i ? 0.75 : 0.1);
      c.y = (b.minY + b.maxY) / 2;
      c.until = performance.now() + 1500 + i * 1200;
    });
  }
  for (const c of roamers) clampToGarden(c);
}

function bounds() {
  const w = SPRITE_W * stage.scale;
  return {
    minX: 4, maxX: Math.max(4, stage.w - w - 4),
    minY: stage.minY, maxY: Math.max(stage.minY, stage.h - 18 * stage.scale),
  };
}

function clampToGarden(c) {
  const b = bounds();
  c.x = Math.min(b.maxX, Math.max(b.minX, c.x));
  c.y = Math.min(b.maxY, Math.max(b.minY, c.y));
}

function pickTarget(c, mode) {
  const b = bounds();
  c.tx = b.minX + Math.random() * (b.maxX - b.minX);
  c.ty = b.minY + Math.random() * (b.maxY - b.minY);
  c.mode = mode || (Math.random() < 0.3 ? 'run' : 'walk');
}

function celebrate(catId) {
  const c = roamers.find((r) => r.id === catId);
  const now = performance.now();
  c.hopAt = now;
  c.heartAt = now;
  pickTarget(c, 'run');
}

function step(c, now, dt) {
  if (c.mode === 'sit') {
    if (now > c.until) pickTarget(c);
    return;
  }
  const dx = c.tx - c.x, dy = c.ty - c.y;
  const dist = Math.hypot(dx, dy);
  const speed = (c.mode === 'run' ? 34 : 13) * stage.scale * dt;
  if (dist <= speed) {
    c.x = c.tx; c.y = c.ty;
    c.mode = 'sit';
    c.until = now + 2500 + Math.random() * 6000;
    return;
  }
  c.x += (dx / dist) * speed;
  c.y += (dy / dist) * speed;
  if (Math.abs(dx) > 1) c.facingLeft = dx < 0;
}

function drawCat(c, now) {
  const gctx = stage.ctx, scale = stage.scale;
  const pal = (saverOn ? SAVER_PALETTES : PALETTES)[c.id];
  const w = SPRITE_W * scale;
  const hopT = (now - c.hopAt) / 450;
  const hop = hopT >= 0 && hopT < 1 ? Math.sin(hopT * Math.PI) * 8 * scale : 0;

  let rows;
  if (c.mode === 'sit') rows = SPRITES.sit;
  else rows = Math.floor(now / (c.mode === 'run' ? 90 : 180)) % 2 ? SPRITES.walkA : SPRITES.walkB;

  const h = rows.length * scale;
  const feetY = Math.round(c.y) + 16 * scale; // baseline shared by all poses
  const x = Math.round(c.x);

  if (!saverOn) {
    gctx.fillStyle = isNight ? 'rgba(0, 0, 0, .4)' : 'rgba(60, 35, 10, .25)';
    gctx.beginPath();
    gctx.ellipse(x + w / 2, feetY, w * 0.48, 2.2 * scale, 0, 0, Math.PI * 2);
    gctx.fill();
  }

  // sprites face right by default; the sitting pose has its tail on the right
  drawSprite(gctx, rows, pal, x, feetY - h - Math.round(hop), scale, c.facingLeft);

  const heartT = (now - c.heartAt) / 1400;
  if (heartT >= 0 && heartT < 1) {
    gctx.globalAlpha = heartT > 0.7 ? (1 - heartT) / 0.3 : 1;
    drawSprite(gctx, SPRITES.heart, pal,
      x + w / 2 - 3.5 * scale, feetY - h - (8 + heartT * 6) * scale, scale);
    gctx.globalAlpha = 1;
  }
}

let lastFrame = 0;
function frame(now) {
  requestAnimationFrame(frame);
  if (now - lastFrame < 33) return; // ~30fps is plenty for pixel cats
  const dt = Math.min(0.1, (now - lastFrame) / 1000);
  lastFrame = now;
  if (saverOn) {
    drawSaverBackdrop();
  } else {
    gctx.clearRect(0, 0, garden.width, garden.height);
    gctx.drawImage(roomCanvas, 0, 0);
  }
  for (const c of roamers) step(c, now, dt);
  for (const c of [...roamers].sort((a, b) => a.y - b.y)) drawCat(c, now);
}

// Tap a cat to make it hop
garden.addEventListener('pointerdown', (e) => {
  const r = garden.getBoundingClientRect();
  const px = e.clientX - r.left, py = e.clientY - r.top;
  const now = performance.now();
  for (const c of roamers) {
    if (px >= c.x && px <= c.x + SPRITE_W * scale && py >= c.y && py <= c.y + 16 * scale) {
      c.hopAt = now;
      c.heartAt = now;
    }
  }
});

// ---------- keep the screen on ----------

let wakeLock = null;
async function keepAwake() {
  if (!('wakeLock' in navigator) || document.visibilityState !== 'visible') return;
  try {
    wakeLock = await navigator.wakeLock.request('screen');
    wakeLock.addEventListener('release', () => { wakeLock = null; });
  } catch (e) { /* denied (e.g. battery saver); retried on next interaction */ }
}
document.addEventListener('visibilitychange', () => { keepAwake(); tick(); });
document.addEventListener('pointerdown', () => { if (!wakeLock) keepAwake(); });

// ---------- day / night theme ----------
// AUTO follows the clock; the header button cycles AUTO -> DAY -> NIGHT.

const THEME_KEY = 'kittymanager.theme';
const THEME_NIGHT_START = 19, THEME_NIGHT_END = 7;
const themeBtn = document.getElementById('themeBtn');
let themeMode = 'auto';
try { themeMode = localStorage.getItem(THEME_KEY) || 'auto'; } catch (e) { /* storage unavailable */ }
let isNight = false;

function applyTheme() {
  const h = new Date().getHours();
  const night = themeMode === 'auto' ? (h >= THEME_NIGHT_START || h < THEME_NIGHT_END) : themeMode === 'night';
  themeBtn.textContent = themeMode.toUpperCase();
  if (night === isNight && document.body.classList.contains('night') === night) return;
  isNight = night;
  document.body.classList.toggle('night', night);
  document.querySelector('meta[name=theme-color]').content = night ? '#3b4337' : '#b9c0a6';
  if (garden.width > 1) paintRoom();
}

themeBtn.addEventListener('click', () => {
  themeMode = { auto: 'day', day: 'night', night: 'auto' }[themeMode] || 'auto';
  try { localStorage.setItem(THEME_KEY, themeMode); } catch (e) { /* storage unavailable */ }
  applyTheme();
});

// ---------- screensaver ----------
// The phone is on all day, and an OLED showing the same bright panels for hours burns in.
// After a while idle the app cuts to a black screen with dim greyscale cats wandering about
// and a small status block that moves to a new spot every minute, so no pixel stays lit.
// The first tap only wakes it, so nobody feeds a cat by accident.

const SAVER_IDLE_MS = 10 * 60 * 1000;
const SAVER_IDLE_NIGHT_MS = 3 * 60 * 1000;   // kicks in sooner late at night
const SAVER_NIGHT_START = 22, SAVER_NIGHT_END = 7;
const SAVER_TEXT = '#8a8a8a';

const saver = document.getElementById('saver');
const saverStage = { ctx: saver.getContext('2d'), w: 1, h: 1, scale: 4, minY: 0 };
let saverOn = false;
let lastTouch = Date.now();
let saverSpot = { minute: -1, fx: 0.5, fy: 0.5 }; // where the status block sits this minute

function setSaver(on) {
  if (on === saverOn) return;
  saverOn = on;
  saver.hidden = !on;
  if (on) {
    saver.width = window.innerWidth;
    saver.height = window.innerHeight;
    const s = Math.max(3, Math.min(5, Math.floor(Math.min(saver.width, saver.height) / 90)));
    Object.assign(saverStage, { w: saver.width, h: saver.height, scale: s, minY: 10 * s });
  }
  stage = on ? saverStage : roomStage;
  for (const c of roamers) { clampToGarden(c); c.tx = c.x; c.ty = c.y; c.mode = 'sit'; c.until = 0; }
}

function updateSaver() {
  const h = new Date().getHours();
  const late = h >= SAVER_NIGHT_START || h < SAVER_NIGHT_END;
  if (Date.now() - lastTouch > (late ? SAVER_IDLE_NIGHT_MS : SAVER_IDLE_MS)) setSaver(true);
}

function drawSaverBackdrop() {
  const ctx = saverStage.ctx, w = saver.width, h = saver.height;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, w, h);

  const lines = CATS.map((cat) => {
    const list = feeds(cat.id);
    const last = list[list.length - 1];
    return `${cat.name} ${pouchText(halvesOf(list))}  ${last ? agoText(last.t) : 'NOT FED'}`;
  });
  const minute = Math.floor(Date.now() / 60000);
  if (minute !== saverSpot.minute) saverSpot = { minute, fx: Math.random(), fy: Math.random() };

  const small = w < 380 ? 9 : 10, big = 24, blockH = big + 16 + lines.length * (small + 10);
  ctx.textBaseline = 'top';
  ctx.fillStyle = SAVER_TEXT;
  ctx.font = `${small}px "Press Start 2P", monospace`;
  const blockW = Math.max(big * 8, ...lines.map((l) => ctx.measureText(l).width));
  const x = Math.round(12 + saverSpot.fx * Math.max(0, w - blockW - 24));
  const y = Math.round(12 + saverSpot.fy * Math.max(0, h - blockH - 24));
  lines.forEach((l, i) => ctx.fillText(l, x, y + big + 16 + i * (small + 10)));
  ctx.font = `${big}px "Press Start 2P", monospace`;
  ctx.fillText(timeText(Date.now()), x, y);
}

document.addEventListener('pointerdown', () => { lastTouch = Date.now(); }, true);
saver.addEventListener('click', () => setSaver(false));
window.addEventListener('resize', () => { if (saverOn) { setSaver(false); } });

// ---------- boot ----------

buildPanels();
render();
tick();
setInterval(tick, 5000);

document.getElementById('historyBtn').addEventListener('click', showHistory);
document.getElementById('historyClose').addEventListener('click', () => {
  document.getElementById('history').hidden = true;
});

new ResizeObserver(resizeGarden).observe(garden);
resizeGarden();
requestAnimationFrame(frame);

keepAwake();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
