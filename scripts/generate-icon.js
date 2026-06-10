/**
 * Generates the Nimble app icon — sage-green square with a white dumbbell-N.
 * Run: node scripts/generate-icon.js
 */
const zlib = require('zlib');
const fs   = require('fs');
const path = require('path');

// ─── PNG encoder ──────────────────────────────────────────────────────────────
function crc32(b) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < b.length; i++) {
    c ^= b[i];
    for (let j = 0; j < 8; j++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
  }
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function chunk(t, d) {
  const tb = Buffer.from(t, 'ascii'), lb = Buffer.alloc(4), cb = Buffer.alloc(4);
  lb.writeUInt32BE(d.length);
  cb.writeUInt32BE(crc32(Buffer.concat([tb, d])));
  return Buffer.concat([lb, tb, d, cb]);
}
function toPNG(w, h, rgba) {
  const sig  = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  const rowLen = 1 + w * 4, raw = Buffer.alloc(h * rowLen);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const s = (y * w + x) * 4, d = y * rowLen + 1 + x * 4;
    raw[d] = rgba[s]; raw[d+1] = rgba[s+1]; raw[d+2] = rgba[s+2]; raw[d+3] = rgba[s+3];
  }
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 6 })), chunk('IEND', Buffer.alloc(0))]);
}

// ─── Canvas ───────────────────────────────────────────────────────────────────
const S = 1024;
const buf = new Uint8Array(S * S * 4);

const set = (x, y, r, g, b) => {
  if (x < 0 || x >= S || y < 0 || y >= S) return;
  const i = (y * S + x) * 4;
  buf[i] = r; buf[i+1] = g; buf[i+2] = b; buf[i+3] = 255;
};

function fillAll(r, g, b) {
  for (let i = 0; i < S * S; i++) {
    buf[i*4] = r; buf[i*4+1] = g; buf[i*4+2] = b; buf[i*4+3] = 255;
  }
}

function fillRR(x, y, w, h, rad, r, g, b) {
  for (let py = y; py < y + h; py++) for (let px = x; px < x + w; px++) {
    let ok = true;
    if      (px < x+rad   && py < y+rad)   ok = Math.hypot(px-(x+rad),   py-(y+rad))   <= rad;
    else if (px >= x+w-rad && py < y+rad)   ok = Math.hypot(px-(x+w-rad), py-(y+rad))   <= rad;
    else if (px < x+rad   && py >= y+h-rad) ok = Math.hypot(px-(x+rad),   py-(y+h-rad)) <= rad;
    else if (px >= x+w-rad && py >= y+h-rad)ok = Math.hypot(px-(x+w-rad), py-(y+h-rad)) <= rad;
    if (ok) set(px, py, r, g, b);
  }
}

function line(x0, y0, x1, y1, thick, r, g, b) {
  const dx = x1-x0, dy = y1-y0, len = Math.hypot(dx, dy), h2 = thick / 2;
  const bx0 = Math.floor(Math.min(x0,x1) - h2), bx1 = Math.ceil(Math.max(x0,x1) + h2);
  const by0 = Math.floor(Math.min(y0,y1) - h2), by1 = Math.ceil(Math.max(y0,y1) + h2);
  for (let py = by0; py <= by1; py++) for (let px = bx0; px <= bx1; px++) {
    const t = Math.max(0, Math.min(1, ((px-x0)*dx + (py-y0)*dy) / (len*len)));
    if (Math.hypot(px-x0-t*dx, py-y0-t*dy) <= h2) set(px, py, r, g, b);
  }
}

// ─── Draw icon ────────────────────────────────────────────────────────────────
// Background: sage green #6B9478
fillAll(107, 148, 120);

// N geometry (1024×1024 space)
const LX = 310, RX = 714;      // left/right column x centers
const TY = 228, BY = 796;      // top/bottom y
const SW = 80;                 // stroke width
const HW = 108, HH = 108, HR = 18;  // dumbbell head: width, height, corner radius

// Strokes first, heads on top
line(LX, TY, LX, BY, SW, 255, 255, 255);   // left vertical
line(LX, TY, RX, BY, SW, 255, 255, 255);   // diagonal
line(RX, TY, RX, BY, SW, 255, 255, 255);   // right vertical

// Dumbbell heads at the 4 corners of the N
for (const [hx, hy] of [
  [LX - HW/2, TY - HH/2],   // top-left
  [RX - HW/2, TY - HH/2],   // top-right
  [LX - HW/2, BY - HH/2],   // bottom-left
  [RX - HW/2, BY - HH/2],   // bottom-right
]) fillRR(Math.round(hx), Math.round(hy), HW, HH, HR, 255, 255, 255);

// ─── Write files ──────────────────────────────────────────────────────────────
const assets = path.join(__dirname, '..', 'assets');
const icon = toPNG(S, S, buf);

fs.writeFileSync(path.join(assets, 'icon.png'), icon);
console.log('✓ assets/icon.png  (1024×1024)');

fs.writeFileSync(path.join(assets, 'adaptive-icon.png'), icon);
console.log('✓ assets/adaptive-icon.png  (1024×1024)');
