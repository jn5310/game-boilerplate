import { font } from '../config';
import { TAU } from '../utils/math';

/**
 * 네온 그래픽 도우미 — 이미지 파일 없이 도형만으로 빛나는 그래픽을 그립니다.
 *
 * 성능 팁: 모바일에서 ctx.shadowBlur는 느립니다. 그래서 도형은
 *   (1) 미리 만들어 둔 '빛 번짐 스프라이트'(drawGlow) + (2) 3겹 선(strokeNeon) 으로 빛을 흉내 냅니다.
 *   shadowBlur는 글자(neonText)에만 씁니다.
 */

let pixelsPerUnit = 1;

/** Game이 화면 크기가 바뀔 때 호출 (shadowBlur는 실제 픽셀 단위라서 보정 필요) */
export function setPixelsPerUnit(value: number): void {
  pixelsPerUnit = value;
}

const rgbCache = new Map<string, [number, number, number]>();

function hexToRgb(hex: string): [number, number, number] {
  let rgb = rgbCache.get(hex);
  if (!rgb) {
    const h = hex.replace('#', '');
    const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
    const n = parseInt(full.slice(0, 6), 16) || 0;
    rgb = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    rgbCache.set(hex, rgb);
  }
  return rgb;
}

/** '#00f0ff' + 0.5 → 'rgba(0,240,255,0.5)' */
export function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

const glowCache = new Map<string, HTMLCanvasElement>();

/** 색깔별 빛 번짐 이미지 (처음 한 번만 만들고 재사용) */
export function glowSprite(color: string): HTMLCanvasElement {
  let sprite = glowCache.get(color);
  if (!sprite) {
    const size = 128;
    sprite = document.createElement('canvas');
    sprite.width = size;
    sprite.height = size;
    const g = sprite.getContext('2d')!;
    const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0, withAlpha(color, 0.85));
    grad.addColorStop(0.22, withAlpha(color, 0.4));
    grad.addColorStop(0.55, withAlpha(color, 0.1));
    grad.addColorStop(1, withAlpha(color, 0));
    g.fillStyle = grad;
    g.fillRect(0, 0, size, size);
    glowCache.set(color, sprite);
  }
  return sprite;
}

/** (x, y)를 중심으로 반지름 radius만큼 빛 번짐 */
export function drawGlow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
  alpha = 1,
): void {
  const prevOp = ctx.globalCompositeOperation;
  const prevAlpha = ctx.globalAlpha;
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = prevAlpha * alpha;
  ctx.drawImage(glowSprite(color), x - radius, y - radius, radius * 2, radius * 2);
  ctx.globalCompositeOperation = prevOp;
  ctx.globalAlpha = prevAlpha;
}

/** 지금 만들어 둔 path를 네온 선으로 그리기 (두꺼운 반투명 선 + 색 선 + 흰 심지) */
export function strokeNeon(ctx: CanvasRenderingContext2D, color: string, width = 4): void {
  const a = ctx.globalAlpha;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = color;
  ctx.globalAlpha = a * 0.22;
  ctx.lineWidth = width * 3.2;
  ctx.stroke();
  ctx.globalAlpha = a;
  ctx.lineWidth = width;
  ctx.stroke();
  ctx.globalAlpha = a * 0.85;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(1, width * 0.35);
  ctx.stroke();
  ctx.globalAlpha = a;
}

/** 정다각형 path (sides=3 삼각형, 4 마름모, 6 육각형...) */
export function polygonPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  sides: number,
  rotation = 0,
): void {
  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    const a = rotation + (i / sides) * TAU;
    const px = x + Math.cos(a) * radius;
    const py = y + Math.sin(a) * radius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

/** 둥근 사각형 path (구형 브라우저용으로 ctx.roundRect 대신 직접 구현) */
export function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export function neonCircle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
  width = 4,
): void {
  drawGlow(ctx, x, y, radius * 2.2, color, 0.55);
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, TAU);
  strokeNeon(ctx, color, width);
}

export function neonPolygon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  sides: number,
  rotation: number,
  color: string,
  width = 4,
): void {
  drawGlow(ctx, x, y, radius * 2.2, color, 0.5);
  polygonPath(ctx, x, y, radius, sides, rotation);
  strokeNeon(ctx, color, width);
}

export interface TextOptions {
  align?: CanvasTextAlign;
  baseline?: CanvasTextBaseline;
  weight?: number | string;
  /** 빛 번짐 세기 (0이면 없음) */
  glow?: number;
  alpha?: number;
}

/** 빛나는 글자 */
export function neonText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  color: string,
  options: TextOptions = {},
): void {
  const { align = 'center', baseline = 'middle', weight = 800, glow = 1, alpha = 1 } = options;
  const prevAlpha = ctx.globalAlpha;
  ctx.globalAlpha = prevAlpha * alpha;
  ctx.font = font(size, weight);
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillStyle = color;
  if (glow > 0) {
    ctx.shadowColor = color;
    ctx.shadowBlur = Math.min(48, size * 0.45 * glow * pixelsPerUnit);
  }
  ctx.fillText(text, x, y);
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent';
  // 가운데를 살짝 하얗게 → 네온관 느낌
  ctx.globalAlpha = prevAlpha * alpha * 0.45;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, x, y);
  ctx.globalAlpha = prevAlpha;
}

/** 빛 없는 일반 글자 (작은 안내 문구용, 가장 빠름) */
export function plainText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  color: string,
  options: Omit<TextOptions, 'glow'> = {},
): void {
  const { align = 'center', baseline = 'middle', weight = 600, alpha = 1 } = options;
  const prevAlpha = ctx.globalAlpha;
  ctx.globalAlpha = prevAlpha * alpha;
  ctx.font = font(size, weight);
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.globalAlpha = prevAlpha;
}
