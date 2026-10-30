import { COLORS } from '../config';
import { neonPolygon } from '../gfx/neon';
import { lerp, rand, rotateToward, TAU } from '../utils/math';
import { BALANCE } from './balance';

/**
 * 적 종류. 새 적을 추가하려면:
 *   1) EnemyKind에 이름 추가  2) Enemy.spawn의 switch에 초기값  3) update / render에 동작·모양 추가
 */
export type EnemyKind = 'chaser' | 'drifter';

export class Enemy {
  x = 0;
  y = 0;
  vx = 0;
  vy = 0;
  radius = 20;
  speed = 100;
  /** 진행 방향 (chaser) */
  angle = 0;
  /** 회전 (drifter 모양용) */
  spin = 0;
  /** 남은 수명 (chaser) */
  life = Infinity;
  age = 0;
  /** true면 제거 대상 */
  dead = false;
  /** 수명이 다해서 사라짐 (폭발 대신 작게 사라지는 연출용) */
  expired = false;
  color: string = COLORS.magenta;

  constructor(readonly kind: EnemyKind) {}

  /**
   * 화면 바깥 가장자리 아무 곳에서 생성.
   * @param difficulty 0(쉬움) ~ 1(어려움)
   */
  static spawn(kind: EnemyKind, width: number, height: number, targetX: number, targetY: number, difficulty: number): Enemy {
    const e = new Enemy(kind);
    const margin = 50;
    // 둘레 위의 임의의 점 (변 길이에 비례한 확률)
    const r = rand(0, 2 * (width + height));
    if (r < width) {
      e.x = r;
      e.y = -margin;
    } else if (r < width * 2) {
      e.x = r - width;
      e.y = height + margin;
    } else if (r < width * 2 + height) {
      e.x = -margin;
      e.y = r - width * 2;
    } else {
      e.x = width + margin;
      e.y = r - width * 2 - height;
    }
    const toTarget = Math.atan2(targetY - e.y, targetX - e.x);

    switch (kind) {
      case 'chaser': {
        const c = BALANCE.chaser;
        e.radius = c.radius;
        e.speed = lerp(c.speedMin, c.speedMax, difficulty) * rand(0.9, 1.1);
        e.angle = toTarget;
        e.life = c.life;
        e.color = COLORS.magenta;
        break;
      }
      case 'drifter': {
        const d = BALANCE.drifter;
        e.radius = d.radius;
        e.speed = lerp(d.speedMin, d.speedMax, difficulty) * rand(0.9, 1.1);
        e.angle = toTarget + rand(-d.aimJitter, d.aimJitter);
        e.spin = rand(0, TAU);
        e.color = COLORS.orange;
        break;
      }
    }
    e.vx = Math.cos(e.angle) * e.speed;
    e.vy = Math.sin(e.angle) * e.speed;
    return e;
  }

  update(dt: number, targetX: number, targetY: number, width: number, height: number): void {
    this.age += dt;
    switch (this.kind) {
      case 'chaser':
        this.angle = rotateToward(this.angle, Math.atan2(targetY - this.y, targetX - this.x), BALANCE.chaser.turnRate * dt);
        this.vx = Math.cos(this.angle) * this.speed;
        this.vy = Math.sin(this.angle) * this.speed;
        this.life -= dt;
        if (this.life <= 0) {
          this.dead = true;
          this.expired = true;
        }
        break;
      case 'drifter': {
        this.spin += dt * 3;
        const m = 140;
        if (this.age > 1 && (this.x < -m || this.x > width + m || this.y < -m || this.y > height + m)) this.dead = true;
        break;
      }
    }
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    // 수명이 다해 가면 깜빡임
    if (this.life < 1.5) ctx.globalAlpha = Math.sin(this.age * 30) > 0 ? 1 : 0.35;
    switch (this.kind) {
      case 'chaser':
        neonPolygon(ctx, this.x, this.y, this.radius * 1.15, 3, this.angle, this.color, 4);
        break;
      case 'drifter':
        neonPolygon(ctx, this.x, this.y, this.radius * 1.2, 4, this.spin, this.color, 4);
        break;
    }
    ctx.restore();
  }
}
