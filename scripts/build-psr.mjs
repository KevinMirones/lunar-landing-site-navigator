// Builds server/data/psr_80s_120m.bin (S16): NASA's map of permanently shadowed
// regions (LOLA team, LPSR_75S_120M_201608, 120 m per pixel) cut to the area with
// real terrain (80°S to the pole), without regions under 0.1 km², one bit per cell.
// The result (about 3 MB) is committed; the 116 MB source is not.
//
// Needs the source map: npm run fetch-data -- --psr
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const SOURCE = fileURLToPath(new URL('../server/data/published/LPSR_75S_120M_201608.IMG', import.meta.url));
const OUT = fileURLToPath(new URL('../server/data/psr_80s_120m.bin', import.meta.url));
const SIZE = 7624; // from the product's .lbl: LINES = LINE_SAMPLES = 7624, LSB_INTEGER, 16 bits
const SCALE_KM = 0.12;
const MOON_RADIUS_KM = 1737.4;
const MIN_AREA_KM2 = 0.1;

if (!existsSync(SOURCE)) {
  console.error('Permanent-shadow map missing. Run: npm run fetch-data -- --psr');
  process.exit(1);
}
const raw = readFileSync(SOURCE);
if (raw.length !== SIZE * SIZE * 2) throw new Error(`Unexpected size: ${raw.length} bytes`);
const dn = new Int16Array(raw.buffer, raw.byteOffset, SIZE * SIZE);

// Crop to 80°S, keeping the pole at the centre of the grid as in the source (pixel 3811.5).
const halfKm = 2 * MOON_RADIUS_KM * Math.tan(((90 - 80) * Math.PI) / 360);
const K = Math.ceil(halfKm / SCALE_KM) + 1;
const N = 2 * K;
const first = SIZE / 2 - K;
const shadow = new Uint8Array(N * N);
for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) shadow[r * N + c] = dn[(first + r) * SIZE + first + c] > 0 ? 1 : 0; // +20000 = shadow

// Drop the specks: regions smaller than 0.1 km² (under 7 cells of 120 m), 8-connected.
const minCells = Math.ceil(MIN_AREA_KM2 / (SCALE_KM * SCALE_KM));
const seen = new Uint8Array(N * N);
const stack = new Int32Array(N * N);
const region = [];
let kept = 0;
let dropped = 0;
for (let start = 0; start < N * N; start++) {
  if (!shadow[start] || seen[start]) continue;
  let top = 0;
  stack[top++] = start;
  seen[start] = 1;
  region.length = 0;
  while (top) {
    const i = stack[--top];
    region.push(i);
    const r = (i / N) | 0;
    const c = i - r * N;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const rr = r + dr;
        const cc = c + dc;
        if (rr < 0 || cc < 0 || rr >= N || cc >= N) continue;
        const j = rr * N + cc;
        if (shadow[j] && !seen[j]) {
          seen[j] = 1;
          stack[top++] = j;
        }
      }
    }
  }
  if (region.length < minCells) {
    for (const i of region) shadow[i] = 0;
    dropped++;
  } else kept++;
}

// Header (16 bytes): "PSR1", grid side, cell size in km, reserved; then one bit per cell, row by row.
const bits = new Uint8Array(16 + Math.ceil((N * N) / 8));
const view = new DataView(bits.buffer);
bits.set([0x50, 0x53, 0x52, 0x31]);
view.setUint32(4, N, true);
view.setFloat32(8, SCALE_KM, true);
let cells = 0;
for (let i = 0; i < N * N; i++) {
  if (!shadow[i]) continue;
  bits[16 + (i >> 3)] |= 1 << (i & 7);
  cells++;
}
writeFileSync(OUT, bits);
console.log(`${N} × ${N} cells, ${kept} regions kept and ${dropped} specks dropped; ${(cells * SCALE_KM * SCALE_KM).toFixed(0)} km² in shadow; ${(bits.length / 1048576).toFixed(2)} MB written to server/data/psr_80s_120m.bin`);
