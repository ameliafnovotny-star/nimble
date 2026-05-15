/**
 * Generates placeholder app icons as solid-color PNGs using only Node built-ins.
 * Run: node scripts/generate-icon.js
 * Replace assets/icon.png with your real design before submitting to Play Store.
 */
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc & 1) ? (0xEDB88320 ^ (crc >>> 1)) : (crc >>> 1);
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function makeChunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcInput = Buffer.concat([typeBytes, data]);
  const crcVal = Buffer.alloc(4);
  crcVal.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([len, typeBytes, data, crcVal]);
}

function createPNG(width, height, r, g, b) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 2;  // RGB
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;

  // One row of pixels + filter byte
  const rowSize = 1 + width * 3;
  const raw = Buffer.alloc(height * rowSize);
  for (let y = 0; y < height; y++) {
    raw[y * rowSize] = 0; // filter = None
    for (let x = 0; x < width; x++) {
      const i = y * rowSize + 1 + x * 3;
      raw[i]     = r;
      raw[i + 1] = g;
      raw[i + 2] = b;
    }
  }

  const compressed = zlib.deflateSync(raw, { level: 9 });

  return Buffer.concat([
    sig,
    makeChunk('IHDR', ihdrData),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);
}

const assetsDir = path.join(__dirname, '..', 'assets');

// Primary blue #007AFF
fs.writeFileSync(path.join(assetsDir, 'icon.png'), createPNG(1024, 1024, 0, 122, 255));
console.log('✓ assets/icon.png');

// Adaptive icon foreground (same color, slightly smaller feel via padding handled by Android)
fs.writeFileSync(path.join(assetsDir, 'adaptive-icon.png'), createPNG(1024, 1024, 0, 122, 255));
console.log('✓ assets/adaptive-icon.png');

// Splash screen — white background
fs.writeFileSync(path.join(assetsDir, 'splash.png'), createPNG(1284, 2778, 255, 255, 255));
console.log('✓ assets/splash.png');

console.log('\nPlaceholder icons created. Replace with real designs before submitting to Play Store.');
