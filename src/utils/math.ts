/** 자주 쓰는 수학 함수 모음 */

export interface Vec2 {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const TAU = Math.PI * 2;

export const clamp = (v: number, min: number, max: number): number => (v < min ? min : v > max ? max : v);

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** 프레임레이트와 무관하게 부드럽게 따라가기. rate가 클수록 빠름 */
export const damp = (current: number, target: number, rate: number, dt: number): number =>
  lerp(current, target, 1 - Math.exp(-rate * dt));

/** current를 target 쪽으로 최대 step만큼 이동 */
export const approach = (current: number, target: number, step: number): number =>
  current < target ? Math.min(current + step, target) : Math.max(current - step, target);

export const rand = (min: number, max: number): number => min + Math.random() * (max - min);

export const randInt = (min: number, max: number): number => Math.floor(rand(min, max + 1));

export const pick = <T>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)];

export const dist2 = (ax: number, ay: number, bx: number, by: number): number => {
  const dx = bx - ax;
  const dy = by - ay;
  return dx * dx + dy * dy;
};

export const circlesOverlap = (ax: number, ay: number, ar: number, bx: number, by: number, br: number): boolean => {
  const r = ar + br;
  return dist2(ax, ay, bx, by) < r * r;
};

export const pointInRect = (px: number, py: number, r: Rect, pad = 0): boolean =>
  px >= r.x - pad && px <= r.x + r.w + pad && py >= r.y - pad && py <= r.y + r.h + pad;

/** 각도 a를 b 쪽으로 최대 maxStep 라디안만큼 회전 */
export const rotateToward = (a: number, b: number, maxStep: number): number => {
  let diff = ((b - a + Math.PI) % TAU + TAU) % TAU - Math.PI;
  diff = clamp(diff, -maxStep, maxStep);
  return a + diff;
};

// ── 이징 (0~1 → 0~1) ──
export const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);
export const easeOutBack = (t: number): number => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
