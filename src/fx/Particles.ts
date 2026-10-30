import { COLORS } from '../config';
import { lerp, rand, TAU } from '../utils/math';

/** dot = 빛나는 점, spark = 날아가는 불똥(꼬리 달린 선), ring = 퍼지는 고리 */
export type ParticleShape = 'dot' | 'spark' | 'ring';

interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  sizeEnd: number;
  drag: number;
  gravity: number;
  color: string;
  shape: ParticleShape;
}

export interface EmitOptions {
  /** 개수 (기본 12) */
  count?: number;
  /** 색 하나 또는 여러 색 중 랜덤 */
  color?: string | readonly string[];
  /** 속도 (논리 단위/초) — 숫자 하나 또는 [최소, 최대] */
  speed?: number | readonly [number, number];
  /** 날아갈 방향 (라디안). 기본: 사방으로 */
  angle?: number;
  /** 방향 퍼짐 (라디안). 기본 2π = 전방향 */
  spread?: number;
  /** 수명 [최소, 최대] 초 */
  life?: readonly [number, number];
  /** 크기 [최소, 최대]. ring이면 시작 반지름 */
  size?: readonly [number, number];
  /** 끝 크기. dot/spark는 배율(0이면 작아지며 사라짐), ring은 끝 반지름 */
  sizeEnd?: number;
  /** 중력 (아래로 +) */
  gravity?: number;
  /** 공기 저항 (클수록 빨리 멈춤) */
  drag?: number;
  shape?: ParticleShape;
}

/**
 * 미리 만들어 둔 파티클을 재사용하는 시스템 (모바일에서 버벅임의 원인인 메모리 할당을 줄임).
 *
 *   particles.emit(x, y, { count: 20, color: COLORS.cyan, shape: 'spark' });
 *   particles.burst(x, y, COLORS.magenta);   // 폭발 프리셋
 *   particles.ripple(x, y, COLORS.cyan);     // 터치 프리셋
 */
export class ParticleSystem {
  private readonly pool: Particle[];
  private cursor = 0;

  constructor(readonly capacity = 600) {
    this.pool = Array.from({ length: capacity }, () => ({
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0,
      maxLife: 1,
      size: 1,
      sizeEnd: 0,
      drag: 0,
      gravity: 0,
      color: COLORS.white,
      shape: 'dot' as ParticleShape,
    }));
  }

  get activeCount(): number {
    let n = 0;
    for (const p of this.pool) if (p.active) n++;
    return n;
  }

  emit(x: number, y: number, o: EmitOptions = {}): void {
    const count = o.count ?? 12;
    const [sMin, sMax] = typeof o.speed === 'number' ? [o.speed, o.speed] : (o.speed ?? [80, 320]);
    const [lMin, lMax] = o.life ?? [0.35, 0.8];
    const [zMin, zMax] = o.size ?? [3, 7];
    const spread = o.spread ?? TAU;
    const baseAngle = o.angle ?? 0;
    const colors = typeof o.color === 'string' ? [o.color] : (o.color ?? [COLORS.white]);

    for (let i = 0; i < count; i++) {
      const p = this.acquire();
      const a = baseAngle + (spread >= TAU ? rand(0, TAU) : rand(-spread / 2, spread / 2));
      const speed = rand(sMin, sMax);
      p.active = true;
      p.x = x;
      p.y = y;
      p.vx = Math.cos(a) * speed;
      p.vy = Math.sin(a) * speed;
      p.maxLife = p.life = rand(lMin, lMax);
      p.size = rand(zMin, zMax);
      p.sizeEnd = o.sizeEnd ?? 0;
      p.gravity = o.gravity ?? 0;
      p.drag = o.drag ?? 2.5;
      p.color = colors[(Math.random() * colors.length) | 0];
      p.shape = o.shape ?? 'dot';
    }
  }

  /** 폭발 프리셋 */
  burst(x: number, y: number, color: string, power = 1): void {
    this.emit(x, y, { count: Math.round(18 * power), color: [color, COLORS.white], shape: 'spark', speed: [200 * power, 620 * power], life: [0.25, 0.6], size: [3, 6], drag: 3 });
    this.emit(x, y, { count: Math.round(14 * power), color, shape: 'dot', speed: [40, 260 * power], life: [0.4, 0.9], size: [4, 9], drag: 2 });
    this.emit(x, y, { count: 1, color, shape: 'ring', speed: 0, life: [0.45, 0.45], size: [10, 10], sizeEnd: 90 * power });
  }

  /** 터치 피드백 프리셋 */
  ripple(x: number, y: number, color: string): void {
    this.emit(x, y, { count: 1, color, shape: 'ring', speed: 0, life: [0.4, 0.4], size: [8, 8], sizeEnd: 56 });
    this.emit(x, y, { count: 6, color: [color, COLORS.white], shape: 'spark', speed: [120, 260], life: [0.18, 0.32], size: [2, 4], drag: 4 });
  }

  update(dt: number): void {
    for (const p of this.pool) {
      if (!p.active) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        continue;
      }
      const drag = Math.exp(-p.drag * dt);
      p.vx *= drag;
      p.vy = p.vy * drag + p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter'; // 겹칠수록 밝아짐 → 네온 느낌
    for (const p of this.pool) {
      if (!p.active) continue;
      const t = p.life / p.maxLife; // 1 → 0
      ctx.globalAlpha = Math.min(1, t * 1.6);
      if (p.shape === 'ring') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, lerp(p.sizeEnd, p.size, t), 0, TAU);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1 + 4 * t;
        ctx.stroke();
      } else if (p.shape === 'spark') {
        const len = 0.045;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * len, p.y - p.vy * len);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.size * lerp(p.sizeEnd, 1, t);
        ctx.lineCap = 'round';
        ctx.stroke();
      } else {
        const r = p.size * lerp(p.sizeEnd, 1, t);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, TAU);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  clear(): void {
    for (const p of this.pool) p.active = false;
  }

  /** 빈 파티클을 찾고, 없으면 가장 오래된 자리를 재사용 */
  private acquire(): Particle {
    const n = this.pool.length;
    for (let i = 0; i < n; i++) {
      const idx = (this.cursor + i) % n;
      if (!this.pool[idx].active) {
        this.cursor = (idx + 1) % n;
        return this.pool[idx];
      }
    }
    const p = this.pool[this.cursor];
    this.cursor = (this.cursor + 1) % n;
    return p;
  }
}
