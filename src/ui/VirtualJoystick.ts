import { COLORS } from '../config';
import type { Game } from '../core/Game';
import { drawGlow, plainText, strokeNeon, withAlpha } from '../gfx/neon';
import { approach, pointInRect, TAU, type Rect, type Vec2 } from '../utils/math';

/**
 * 플로팅 가상 조이스틱 — 화면을 누른 자리에 조이스틱이 생기고, 드래그한 방향으로 움직입니다.
 * PC에서는 마우스 드래그가 똑같이 동작합니다.
 *
 * 값은 input.setAnalog()로 넘겨지므로 게임 코드는 input.getMoveVector()만 읽으면 됩니다.
 * (방향키와 조이스틱 값이 합쳐져 나옴)
 *
 * ⚠ 버튼보다 나중에 update 해야 버튼을 누른 손가락을 조이스틱이 가로채지 않습니다.
 */
export class VirtualJoystick {
  /** 받침 반지름 (논리 단위) */
  radius = 110;
  knobRadius = 46;
  /** 이 비율 이하로 살짝 움직인 건 무시 (손 떨림 방지) */
  deadZone = 0.12;
  /** 조이스틱을 시작할 수 있는 영역. null = 화면 전체 */
  zone: Rect | null = null;
  /** 손가락이 받침 밖으로 나가면 받침이 따라옴 (방향 전환이 편해짐) */
  follow = true;
  color: string = COLORS.cyan;
  /** 터치 기기에서 아직 조작 전일 때 '여기를 드래그' 안내를 보여 줄 위치 */
  hint: Vec2 | null = null;

  /** 현재 값 (-1~1) */
  readonly value: Vec2 = { x: 0, y: 0 };

  private pointerId: number | null = null;
  private baseX = 0;
  private baseY = 0;
  private knobX = 0;
  private knobY = 0;
  private alpha = 0;
  private used = false;

  constructor(private readonly game: Game) {}

  get active(): boolean {
    return this.pointerId !== null;
  }

  update(dt: number): void {
    const input = this.game.input;

    if (this.pointerId === null) {
      for (const p of input.pointers.values()) {
        if (p.justDown && p.owner === null && (!this.zone || pointInRect(p.x, p.y, this.zone))) {
          input.claim(p, this);
          this.pointerId = p.id;
          this.baseX = this.knobX = p.x;
          this.baseY = this.knobY = p.y;
          this.used = true;
          break;
        }
      }
    }

    this.value.x = 0;
    this.value.y = 0;
    if (this.pointerId !== null) {
      const p = input.pointers.get(this.pointerId);
      if (!p || p.owner !== this || !p.isDown) {
        this.pointerId = null;
      } else {
        let dx = p.x - this.baseX;
        let dy = p.y - this.baseY;
        const d = Math.hypot(dx, dy);
        if (d > this.radius) {
          const excess = d - this.radius;
          if (this.follow) {
            this.baseX += (dx / d) * excess;
            this.baseY += (dy / d) * excess;
          }
          dx = (dx / d) * this.radius;
          dy = (dy / d) * this.radius;
        }
        this.knobX = this.baseX + dx;
        this.knobY = this.baseY + dy;

        const nx = dx / this.radius;
        const ny = dy / this.radius;
        const m = Math.hypot(nx, ny);
        if (m > this.deadZone) {
          const k = (m - this.deadZone) / (1 - this.deadZone) / m;
          this.value.x = nx * k;
          this.value.y = ny * k;
        }
        input.setAnalog(this.value.x, this.value.y);
      }
    }

    this.alpha = approach(this.alpha, this.active ? 1 : 0, dt * (this.active ? 12 : 5));
  }

  /** 모든 상태 초기화 (씬 재시작 등) */
  release(): void {
    this.pointerId = null;
    this.value.x = 0;
    this.value.y = 0;
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (this.alpha > 0.01) {
      ctx.save();
      ctx.globalAlpha = this.alpha * 0.9;
      ctx.beginPath();
      ctx.arc(this.baseX, this.baseY, this.radius, 0, TAU);
      ctx.fillStyle = withAlpha(this.color, 0.06);
      ctx.fill();
      strokeNeon(ctx, this.color, 3);
      drawGlow(ctx, this.knobX, this.knobY, this.knobRadius * 2, this.color, 0.6);
      ctx.beginPath();
      ctx.arc(this.knobX, this.knobY, this.knobRadius, 0, TAU);
      ctx.fillStyle = withAlpha(this.color, 0.18);
      ctx.fill();
      strokeNeon(ctx, this.color, 4);
      ctx.restore();
    } else if (this.hint && !this.used && this.game.input.isTouchDevice) {
      const pulse = 0.5 + 0.5 * Math.sin(this.game.time * 3);
      ctx.save();
      ctx.globalAlpha = 0.25 + 0.2 * pulse;
      ctx.beginPath();
      ctx.arc(this.hint.x, this.hint.y, this.radius, 0, TAU);
      ctx.setLineDash([14, 12]);
      strokeNeon(ctx, this.color, 2.5);
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(this.hint.x, this.hint.y, this.knobRadius, 0, TAU);
      strokeNeon(ctx, this.color, 2.5);
      ctx.restore();
      plainText(ctx, '여기를 드래그해서 이동', this.hint.x, this.hint.y + this.radius + 34, 24, COLORS.text, { alpha: 0.75 });
    }
  }
}
