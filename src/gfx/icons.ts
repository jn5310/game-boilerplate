import { TAU } from '../utils/math';
import { polygonPath, strokeNeon } from './neon';

/** 이미지 없이 선으로 그리는 아이콘 */
export type IconName =
  | 'pause'
  | 'play'
  | 'sound-on'
  | 'sound-off'
  | 'home'
  | 'retry'
  | 'install'
  | 'heart'
  | 'gem'
  | 'settings';

/** (x, y) 중심, size = 아이콘 한 변 길이 */
export function drawIcon(
  ctx: CanvasRenderingContext2D,
  name: IconName,
  x: number,
  y: number,
  size: number,
  color: string,
): void {
  const s = size / 2;
  const w = Math.max(2.5, size * 0.09);
  ctx.save();
  switch (name) {
    case 'pause':
      ctx.beginPath();
      ctx.moveTo(x - s * 0.38, y - s * 0.62);
      ctx.lineTo(x - s * 0.38, y + s * 0.62);
      ctx.moveTo(x + s * 0.38, y - s * 0.62);
      ctx.lineTo(x + s * 0.38, y + s * 0.62);
      strokeNeon(ctx, color, w * 1.3);
      break;
    case 'play':
      ctx.beginPath();
      ctx.moveTo(x - s * 0.45, y - s * 0.65);
      ctx.lineTo(x + s * 0.65, y);
      ctx.lineTo(x - s * 0.45, y + s * 0.65);
      ctx.closePath();
      strokeNeon(ctx, color, w);
      break;
    case 'sound-on':
    case 'sound-off':
      speakerPath(ctx, x - s * 0.25, y, s);
      strokeNeon(ctx, color, w);
      ctx.beginPath();
      if (name === 'sound-on') {
        ctx.arc(x + s * 0.05, y, s * 0.42, -0.8, 0.8);
        ctx.moveTo(x + s * 0.05 + Math.cos(-0.8) * s * 0.75, y + Math.sin(-0.8) * s * 0.75);
        ctx.arc(x + s * 0.05, y, s * 0.75, -0.8, 0.8);
      } else {
        ctx.moveTo(x + s * 0.25, y - s * 0.3);
        ctx.lineTo(x + s * 0.85, y + s * 0.3);
        ctx.moveTo(x + s * 0.85, y - s * 0.3);
        ctx.lineTo(x + s * 0.25, y + s * 0.3);
      }
      strokeNeon(ctx, color, w);
      break;
    case 'home':
      ctx.beginPath();
      ctx.moveTo(x - s * 0.75, y - s * 0.05);
      ctx.lineTo(x, y - s * 0.72);
      ctx.lineTo(x + s * 0.75, y - s * 0.05);
      ctx.moveTo(x - s * 0.52, y - s * 0.22);
      ctx.lineTo(x - s * 0.52, y + s * 0.65);
      ctx.lineTo(x + s * 0.52, y + s * 0.65);
      ctx.lineTo(x + s * 0.52, y - s * 0.22);
      strokeNeon(ctx, color, w);
      break;
    case 'retry': {
      ctx.beginPath();
      ctx.arc(x, y, s * 0.6, -Math.PI * 0.35, Math.PI * 1.45);
      strokeNeon(ctx, color, w);
      const a = -Math.PI * 0.35;
      const ax = x + Math.cos(a) * s * 0.6;
      const ay = y + Math.sin(a) * s * 0.6;
      ctx.beginPath();
      ctx.moveTo(ax - s * 0.38, ay - s * 0.08);
      ctx.lineTo(ax + s * 0.04, ay + s * 0.04);
      ctx.lineTo(ax - s * 0.06, ay + s * 0.42);
      strokeNeon(ctx, color, w);
      break;
    }
    case 'install':
      ctx.beginPath();
      ctx.moveTo(x, y - s * 0.72);
      ctx.lineTo(x, y + s * 0.2);
      ctx.moveTo(x - s * 0.38, y - s * 0.18);
      ctx.lineTo(x, y + s * 0.2);
      ctx.lineTo(x + s * 0.38, y - s * 0.18);
      ctx.moveTo(x - s * 0.72, y + s * 0.3);
      ctx.lineTo(x - s * 0.72, y + s * 0.68);
      ctx.lineTo(x + s * 0.72, y + s * 0.68);
      ctx.lineTo(x + s * 0.72, y + s * 0.3);
      strokeNeon(ctx, color, w);
      break;
    case 'heart':
      ctx.beginPath();
      ctx.moveTo(x, y + s * 0.7);
      ctx.bezierCurveTo(x - s * 1.1, y - s * 0.05, x - s * 0.55, y - s * 0.95, x, y - s * 0.35);
      ctx.bezierCurveTo(x + s * 0.55, y - s * 0.95, x + s * 1.1, y - s * 0.05, x, y + s * 0.7);
      ctx.closePath();
      strokeNeon(ctx, color, w);
      break;
    case 'gem':
      polygonPath(ctx, x, y, s * 0.8, 4, -TAU / 4);
      strokeNeon(ctx, color, w);
      break;
    case 'settings': {
      // 톱니바퀴: 8개의 톱니 + 가운데 구멍
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU;
        ctx.moveTo(x + Math.cos(a) * s * 0.5, y + Math.sin(a) * s * 0.5);
        ctx.lineTo(x + Math.cos(a) * s * 0.78, y + Math.sin(a) * s * 0.78);
      }
      strokeNeon(ctx, color, w * 1.2);
      ctx.beginPath();
      ctx.arc(x, y, s * 0.5, 0, TAU);
      strokeNeon(ctx, color, w);
      ctx.beginPath();
      ctx.arc(x, y, s * 0.2, 0, TAU);
      strokeNeon(ctx, color, w * 0.8);
      break;
    }
  }
  ctx.restore();
}

function speakerPath(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  ctx.beginPath();
  ctx.moveTo(x - s * 0.55, y - s * 0.22);
  ctx.lineTo(x - s * 0.25, y - s * 0.22);
  ctx.lineTo(x + s * 0.15, y - s * 0.58);
  ctx.lineTo(x + s * 0.15, y + s * 0.58);
  ctx.lineTo(x - s * 0.25, y + s * 0.22);
  ctx.lineTo(x - s * 0.55, y + s * 0.22);
  ctx.closePath();
}
