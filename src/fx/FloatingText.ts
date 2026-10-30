import { COLORS } from '../config';
import { neonText } from '../gfx/neon';
import { easeOutBack } from '../utils/math';

interface Floater {
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

/** "+50" 처럼 떠오르며 사라지는 글자 */
export class FloatingTextLayer {
  private readonly items: Floater[] = [];

  add(x: number, y: number, text: string, color: string = COLORS.yellow, size = 30): void {
    if (this.items.length > 40) this.items.shift();
    this.items.push({ x, y, vy: -120, text, color, size, life: 0.9, maxLife: 0.9 });
  }

  update(dt: number): void {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const f = this.items[i];
      f.life -= dt;
      if (f.life <= 0) {
        this.items.splice(i, 1);
        continue;
      }
      f.y += f.vy * dt;
      f.vy *= Math.exp(-3 * dt);
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    for (const f of this.items) {
      const age = 1 - f.life / f.maxLife; // 0 → 1
      const pop = easeOutBack(Math.min(1, age * 5));
      neonText(ctx, f.text, f.x, f.y, f.size * (0.5 + 0.5 * pop), f.color, {
        alpha: Math.min(1, (f.life / f.maxLife) * 2.5),
        glow: 0.6,
      });
    }
  }

  clear(): void {
    this.items.length = 0;
  }
}
