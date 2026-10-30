import { COLORS } from '../config';
import { rand } from '../utils/math';

interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  phase: number;
}

/**
 * 움직이는 네온 배경 (그라데이션 + 흐르는 격자 + 반짝이는 별 + 비네트).
 * 모든 씬이 같은 배경 객체를 공유하므로 화면이 바뀌어도 배경이 끊기지 않습니다.
 */
export class NeonBackground {
  /** 격자가 흐르는 속도 (논리 단위/초) — 게임 중에 빠르게 하면 속도감이 생김 */
  scrollSpeed = 24;
  /** 격자 색 */
  gridColor: string = COLORS.cyan;

  private width = 1;
  private height = 1;
  private offset = 0;
  private time = 0;
  private stars: Star[] = [];
  private gradient: CanvasGradient | null = null;
  private vignette: CanvasGradient | null = null;
  private readonly cell = 80;

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.gradient = null;
    this.vignette = null;
    const count = Math.round((width * height) / 9000);
    this.stars = Array.from({ length: count }, () => ({
      x: rand(0, width),
      y: rand(0, height),
      size: rand(1, 3),
      speed: rand(6, 28),
      phase: rand(0, 10),
    }));
  }

  update(dt: number): void {
    this.time += dt;
    this.offset = (this.offset + this.scrollSpeed * dt) % this.cell;
    for (const s of this.stars) {
      s.y += s.speed * dt;
      if (s.y > this.height) {
        s.y -= this.height;
        s.x = rand(0, this.width);
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const { width: w, height: h } = this;
    if (!this.gradient) {
      this.gradient = ctx.createLinearGradient(0, 0, 0, h);
      this.gradient.addColorStop(0, COLORS.bgTop);
      this.gradient.addColorStop(1, COLORS.bgBottom);
    }
    ctx.fillStyle = this.gradient;
    ctx.fillRect(-50, -50, w + 100, h + 100); // 화면 흔들림 때 가장자리가 비지 않게 여유 있게

    // 흐르는 격자 (선 전부를 하나의 path로 → 한 번에 그림)
    ctx.beginPath();
    for (let x = (w / 2) % this.cell; x < w; x += this.cell) {
      ctx.moveTo(x, -this.cell);
      ctx.lineTo(x, h + this.cell);
    }
    for (let y = this.offset - this.cell; y < h + this.cell; y += this.cell) {
      ctx.moveTo(-this.cell, y);
      ctx.lineTo(w + this.cell, y);
    }
    ctx.strokeStyle = this.gridColor;
    ctx.globalAlpha = 0.07;
    ctx.lineWidth = 2;
    ctx.stroke();

    // 별
    ctx.fillStyle = '#ffffff';
    for (const s of this.stars) {
      ctx.globalAlpha = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(this.time * 2 + s.phase));
      ctx.fillRect(s.x, s.y, s.size, s.size);
    }
    ctx.globalAlpha = 1;

    // 가장자리를 어둡게 (비네트)
    if (!this.vignette) {
      const r = Math.hypot(w, h) / 2;
      this.vignette = ctx.createRadialGradient(w / 2, h / 2, r * 0.35, w / 2, h / 2, r);
      this.vignette.addColorStop(0, 'rgba(0,0,0,0)');
      this.vignette.addColorStop(1, 'rgba(0,0,0,0.6)');
    }
    ctx.fillStyle = this.vignette;
    ctx.fillRect(-50, -50, w + 100, h + 100);
  }
}
