import { COLORS } from '../config';
import { neonPolygon } from '../gfx/neon';
import { BALANCE } from './balance';

const G = BALANCE.gem;

/** 재화(코인) 보석 — 플레이어가 가까이 오면 끌려옴 */
export class Gem {
  readonly radius = G.radius;
  life: number = G.life;
  age = 0;
  collected = false;

  constructor(
    public x: number,
    public y: number,
  ) {}

  get expired(): boolean {
    return this.life <= 0;
  }

  update(dt: number, playerX: number, playerY: number): void {
    this.age += dt;
    this.life -= dt;
    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const d = Math.hypot(dx, dy);
    if (d < G.magnetRange && d > 1) {
      const pull = G.magnetSpeed * (1 - d / G.magnetRange) * dt;
      this.x += (dx / d) * Math.min(pull, d);
      this.y += (dy / d) * Math.min(pull, d);
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    if (this.life < 1.5) ctx.globalAlpha = Math.sin(this.age * 25) > 0 ? 1 : 0.3;
    const appear = Math.min(1, this.age * 5);
    const bob = Math.sin(this.age * 4) * 4;
    const r = this.radius * appear;
    neonPolygon(ctx, this.x, this.y + bob, r, 4, -Math.PI / 2, COLORS.yellow, 3.5);
    neonPolygon(ctx, this.x, this.y + bob, r * 0.45, 4, -Math.PI / 2 + this.age * 2, COLORS.white, 2);
    ctx.restore();
  }
}
