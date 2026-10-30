import { COLORS, font } from '../config';
import type { SafeArea } from '../core/Viewport';
import { drawIcon } from '../gfx/icons';
import { neonText, plainText, roundRectPath, strokeNeon, withAlpha } from '../gfx/neon';
import { approach, clamp, easeOutBack } from '../utils/math';

/**
 * 상단 HUD: 체력바(왼쪽) · 점수(가운데) · 보유 재화(오른쪽).
 * 노치·펀치홀을 피해서 배치하고, 값이 바뀌면 살짝 튀는 애니메이션이 들어갑니다.
 *
 *   hud.setHp(3, 5);  hud.score = 1234;  hud.setCoins(12);  hud.bumpScore();
 */
export class Hud {
  hp = 5;
  maxHp = 5;
  score = 0;
  best = 0;
  coins = 0;

  private ghostHp = 5;
  private ghostDelay = 0;
  private hpFlash = 0;
  private scorePop = 0;
  private coinPop = 0;
  private time = 0;

  // 배치 (layout에서 계산)
  private left = 24;
  private top = 24;
  private barW = 220;
  private centerX = 360;
  private coinRight = 600;

  /**
   * @param rightReserved 오른쪽 위에 다른 버튼(일시정지 등)이 차지하는 폭
   */
  layout(width: number, _height: number, safe: SafeArea, rightReserved: number): void {
    this.left = safe.left + 24;
    this.top = safe.top + 20;
    this.barW = clamp(width * 0.28, 150, 300);
    this.centerX = width / 2;
    this.coinRight = width - safe.right - 24 - rightReserved;
  }

  /** 오른쪽 위 버튼(일시정지 등)을 놓을 때 쓰는 기준 y */
  get rowTop(): number {
    return this.top;
  }

  setHp(hp: number, maxHp: number = this.maxHp): void {
    if (hp < this.hp) {
      this.hpFlash = 1;
      this.ghostDelay = 0.35;
    }
    if (hp > this.hp) this.ghostHp = hp;
    this.hp = hp;
    this.maxHp = maxHp;
  }

  setCoins(coins: number): void {
    if (coins > this.coins) this.coinPop = 1;
    this.coins = coins;
  }

  /** 점수가 크게 올랐을 때 점수판을 튀게 */
  bumpScore(): void {
    this.scorePop = 1;
  }

  update(dt: number): void {
    this.time += dt;
    this.ghostDelay -= dt;
    if (this.ghostDelay <= 0) this.ghostHp = approach(this.ghostHp, this.hp, dt * 3);
    this.hpFlash = Math.max(0, this.hpFlash - dt * 2.5);
    this.scorePop = Math.max(0, this.scorePop - dt * 3);
    this.coinPop = Math.max(0, this.coinPop - dt * 3);
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.renderHp(ctx);
    this.renderScore(ctx);
    this.renderCoins(ctx);
  }

  private renderHp(ctx: CanvasRenderingContext2D): void {
    const ratio = this.maxHp > 0 ? this.hp / this.maxHp : 0;
    const color = ratio > 0.5 ? COLORS.green : ratio > 0.25 ? COLORS.yellow : COLORS.red;
    const danger = ratio <= 0.25 && this.hp > 0;
    const shakeX = this.hpFlash > 0 ? Math.sin(this.time * 80) * 6 * this.hpFlash : 0;
    const x = this.left + shakeX;
    const iconY = this.top + 26;

    // 위험할 때 하트가 두근두근
    const beat = danger ? 1 + 0.15 * Math.max(0, Math.sin(this.time * 9)) : 1;
    drawIcon(ctx, 'heart', x + 18, iconY, 34 * beat, danger ? COLORS.red : COLORS.magenta);

    const barX = x + 46;
    const barY = this.top + 13;
    const barH = 26;
    const gap = 5;
    const n = Math.max(1, this.maxHp);
    const segW = (this.barW - gap * (n - 1)) / n;

    for (let i = 0; i < n; i++) {
      const sx = barX + i * (segW + gap);
      roundRectPath(ctx, sx, barY, segW, barH, 6);
      if (i < this.hp) {
        ctx.fillStyle = withAlpha(color, 0.75);
        ctx.fill();
        strokeNeon(ctx, color, 2);
      } else if (i < Math.ceil(this.ghostHp)) {
        // 방금 잃은 체력: 하얗게 남았다가 줄어듦
        ctx.fillStyle = withAlpha(COLORS.white, 0.55 * clamp(this.ghostHp - i, 0, 1));
        ctx.fill();
      } else {
        ctx.strokeStyle = withAlpha(COLORS.textDim, 0.5);
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
    if (this.hpFlash > 0) {
      roundRectPath(ctx, barX - 4, barY - 4, this.barW + 8, barH + 8, 8);
      ctx.globalAlpha = this.hpFlash;
      strokeNeon(ctx, COLORS.red, 2);
      ctx.globalAlpha = 1;
    }
  }

  private renderScore(ctx: CanvasRenderingContext2D): void {
    const pop = 1 + 0.25 * easeOutBack(this.scorePop);
    neonText(ctx, Math.floor(this.score).toLocaleString(), this.centerX, this.top + 28, 50 * pop, COLORS.cyan);
    plainText(ctx, `BEST ${Math.max(this.best, Math.floor(this.score)).toLocaleString()}`, this.centerX, this.top + 70, 20, COLORS.textDim, {
      weight: 700,
    });
  }

  private renderCoins(ctx: CanvasRenderingContext2D): void {
    const pop = 1 + 0.35 * this.coinPop;
    const y = this.top + 26;
    const text = this.coins.toLocaleString();
    neonText(ctx, text, this.coinRight, y, 32 * pop, COLORS.yellow, { align: 'right', glow: 0.6 });
    ctx.font = font(32 * pop, 800);
    const w = ctx.measureText(text).width;
    drawIcon(ctx, 'gem', this.coinRight - w - 24, y, 30 * pop, COLORS.yellow);
  }
}
