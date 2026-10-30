import { COLORS } from '../config';
import { drawGlow, neonCircle, polygonPath, strokeNeon } from '../gfx/neon';
import { clamp, damp, type Vec2 } from '../utils/math';
import { BALANCE } from './balance';

const P = BALANCE.player;
const TRAIL_LENGTH = 10;

/** 플레이어 (네온 원 + 진행 방향을 가리키는 삼각형) */
export class Player {
  x: number;
  y: number;
  vx = 0;
  vy = 0;
  readonly radius = P.radius;
  hp: number = P.maxHp;
  readonly maxHp: number = P.maxHp;
  alive = true;
  /** 진행 방향 (라디안) */
  facing = -Math.PI / 2;
  dashCooldown = 0;

  private invuln = 0;
  private dashTime = 0;
  private dashDirX = 0;
  private dashDirY = -1;
  private time = 0;
  private readonly trail: Vec2[] = [];

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  get isDashing(): boolean {
    return this.dashTime > 0;
  }

  get isInvulnerable(): boolean {
    return this.invuln > 0 || this.isDashing;
  }

  /** 대시 쿨다운 진행도 0~1 (1 = 사용 가능) */
  get dashReady(): number {
    return 1 - clamp(this.dashCooldown / P.dashCooldown, 0, 1);
  }

  update(dt: number, move: Vec2, width: number, height: number): void {
    this.time += dt;
    this.invuln = Math.max(0, this.invuln - dt);
    this.dashTime = Math.max(0, this.dashTime - dt);
    this.dashCooldown = Math.max(0, this.dashCooldown - dt);

    if (this.isDashing) {
      this.vx = this.dashDirX * P.dashSpeed;
      this.vy = this.dashDirY * P.dashSpeed;
    } else {
      this.vx = damp(this.vx, move.x * P.speed, P.accel, dt);
      this.vy = damp(this.vy, move.y * P.speed, P.accel, dt);
    }
    if (Math.hypot(move.x, move.y) > 0.1) this.facing = Math.atan2(move.y, move.x);

    this.x = clamp(this.x + this.vx * dt, this.radius, width - this.radius);
    this.y = clamp(this.y + this.vy * dt, this.radius, height - this.radius);

    this.trail.unshift({ x: this.x, y: this.y });
    if (this.trail.length > TRAIL_LENGTH) this.trail.pop();
  }

  /** 대시 시도. 쿨다운 중이면 false */
  tryDash(move: Vec2): boolean {
    if (!this.alive || this.dashCooldown > 0) return false;
    const len = Math.hypot(move.x, move.y);
    if (len > 0.1) {
      this.dashDirX = move.x / len;
      this.dashDirY = move.y / len;
    } else {
      this.dashDirX = Math.cos(this.facing);
      this.dashDirY = Math.sin(this.facing);
    }
    this.dashTime = P.dashTime;
    this.dashCooldown = P.dashCooldown;
    return true;
  }

  /** 피격. 실제로 데미지를 입었으면 true */
  hit(): boolean {
    if (!this.alive || this.isInvulnerable) return false;
    this.hp -= 1;
    this.invuln = P.invulnTime;
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
    }
    return true;
  }

  /** 화면 크기가 바뀌었을 때 화면 안으로 */
  clampTo(width: number, height: number): void {
    this.x = clamp(this.x, this.radius, width - this.radius);
    this.y = clamp(this.y, this.radius, height - this.radius);
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.alive) return;
    ctx.save();

    // 대시 잔상
    if (this.isDashing || this.dashCooldown > P.dashCooldown - 0.25) {
      for (let i = this.trail.length - 1; i >= 1; i--) {
        const t = this.trail[i];
        ctx.globalAlpha = (1 - i / this.trail.length) * 0.5;
        ctx.beginPath();
        ctx.arc(t.x, t.y, this.radius * (1 - i / (this.trail.length * 1.5)), 0, Math.PI * 2);
        ctx.strokeStyle = COLORS.magenta;
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    // 무적 중 깜빡임
    if (this.invuln > 0 && !this.isDashing) ctx.globalAlpha = Math.sin(this.time * 40) > 0 ? 1 : 0.25;

    const color = this.isDashing ? COLORS.magenta : COLORS.cyan;
    drawGlow(ctx, this.x, this.y, this.radius * 3, color, 0.5);
    neonCircle(ctx, this.x, this.y, this.radius, color, 4);

    // 진행 방향 삼각형
    polygonPath(ctx, this.x, this.y, this.radius * 0.55, 3, this.facing);
    strokeNeon(ctx, COLORS.white, 3);
    ctx.restore();
  }
}
