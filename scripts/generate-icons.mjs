// PWA 앱 아이콘(PNG)을 코드로 생성합니다. 외부 프로그램·패키지 없이 Node.js만 있으면 됩니다.
// 실행: npm run icons   → public/icons/ 에 PNG 파일 생성
// 색이나 모양을 바꾸고 싶으면 아래 COLORS와 shade() 함수를 수정하세요.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons');

const COLORS = {
  bgCenter: [38, 12, 74],
  bgEdge: [5, 5, 15],
  ring: [0, 240, 255],
  ship: [255, 43, 214],
};

// ── 아주 작은 PNG 인코더 ──────────────────────────────────────
const CRC_TABLE = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePNG(size, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // 비트 깊이
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // 필터 없음
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── 거리 함수(SDF)로 네온 도형 그리기 ───────────────────────────
const smooth = (edge0, edge1, x) => {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

function sdTriangle(px, py, r) {
  // 위를 향한 정삼각형 (Inigo Quilez)
  const k = Math.sqrt(3);
  px = Math.abs(px) - r;
  py = -py + r / k;
  if (px + k * py > 0) {
    const nx = (px - k * py) / 2;
    const ny = (-k * px - py) / 2;
    px = nx;
    py = ny;
  }
  px -= Math.min(Math.max(px, -2 * r), 0);
  return -Math.hypot(px, py) * Math.sign(py);
}

function sdRoundSquare(px, py, half, radius) {
  const qx = Math.abs(px) - half + radius;
  const qy = Math.abs(py) - half + radius;
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - radius;
}

/** 픽셀 하나의 색. u, v = -1 ~ 1 */
function shade(u, v, aa) {
  const d = Math.hypot(u, v);
  const t = Math.min(1, d / 1.3);
  let r = COLORS.bgCenter[0] * (1 - t) + COLORS.bgEdge[0] * t;
  let g = COLORS.bgCenter[1] * (1 - t) + COLORS.bgEdge[1] * t;
  let b = COLORS.bgCenter[2] * (1 - t) + COLORS.bgEdge[2] * t;

  const add = (color, lineDist, width, glowFalloff, glowStrength) => {
    const core = smooth(width + aa, width - aa, lineDist);
    const glow = Math.exp(-Math.max(0, lineDist - width) * glowFalloff) * glowStrength;
    r += color[0] * (core + glow) + 255 * core * 0.55;
    g += color[1] * (core + glow) + 255 * core * 0.55;
    b += color[2] * (core + glow) + 255 * core * 0.55;
  };

  add(COLORS.ring, Math.abs(d - 0.6), 0.04, 9, 0.85);
  add(COLORS.ship, Math.abs(sdTriangle(u, v + 0.04, 0.27)), 0.035, 11, 0.9);

  return [Math.min(255, r), Math.min(255, g), Math.min(255, b)];
}

/**
 * @param shape 'rounded' = 모서리 투명한 둥근 사각형 (일반 아이콘)
 *              'full'    = 꽉 찬 사각형 (maskable / iOS — OS가 알아서 모양을 자름)
 * @param contentScale 내용 크기 (maskable은 안전 영역 안에 들어오게 작게)
 */
function renderIcon(size, shape, contentScale) {
  const rgba = Buffer.alloc(size * size * 4);
  const aa = 2 / size / contentScale;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = ((x + 0.5) / size) * 2 - 1;
      const ny = ((y + 0.5) / size) * 2 - 1;
      const [r, g, b] = shade(nx / contentScale, ny / contentScale, aa);
      let a = 1;
      if (shape === 'rounded') a = smooth(2 / size, -2 / size, sdRoundSquare(nx, ny, 0.96, 0.36));
      const i = (y * size + x) * 4;
      rgba[i] = Math.round(r);
      rgba[i + 1] = Math.round(g);
      rgba[i + 2] = Math.round(b);
      rgba[i + 3] = Math.round(a * 255);
    }
  }
  return encodePNG(size, rgba);
}

const ICONS = [
  ['icon-192.png', 192, 'rounded', 1],
  ['icon-512.png', 512, 'rounded', 1],
  ['icon-maskable-512.png', 512, 'full', 0.8],
  ['apple-touch-icon.png', 180, 'full', 0.9],
  ['favicon-32.png', 32, 'rounded', 1],
];

mkdirSync(OUT_DIR, { recursive: true });
for (const [name, size, shape, scale] of ICONS) {
  const png = renderIcon(size, shape, scale);
  writeFileSync(join(OUT_DIR, name), png);
  console.log(`✔ public/icons/${name} (${size}×${size}, ${(png.length / 1024).toFixed(1)} KB)`);
}
