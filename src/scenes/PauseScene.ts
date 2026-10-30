import { COLORS } from '../config';
import type { Game } from '../core/Game';
import { Scene } from '../core/Scene';
import { neonText, roundRectPath, strokeNeon, withAlpha } from '../gfx/neon';
import { Button } from '../ui/Button';
import { UILayer } from '../ui/UILayer';
import { easeOutBack } from '../utils/math';
import { TitleScene } from './TitleScene';

/** 일시정지 팝업 — 아래의 게임 화면은 멈춘 채로 보입니다 (isOverlay = true) */
export class PauseScene extends Scene {
  override readonly isOverlay = true;

  private readonly ui = new UILayer(this.game);
  private readonly resumeButton: Button;
  private readonly soundButton: Button;
  private readonly quitButton: Button;
  private t = 0;
  private panel = { x: 0, y: 0, w: 0, h: 0 };

  constructor(game: Game) {
    super(game);
    this.resumeButton = this.ui.add(
      new Button(game, { label: '계속하기', icon: 'play', color: COLORS.cyan, hotkey: 'pause', onClick: () => game.scenes.pop() }),
    );
    this.soundButton = this.ui.add(
      new Button(game, {
        color: COLORS.yellow,
        onClick: () => {
          game.toggleSound();
          this.refreshSoundLabel();
        },
      }),
    );
    this.quitButton = this.ui.add(
      new Button(game, { label: '타이틀로', icon: 'home', color: COLORS.magenta, onClick: () => game.scenes.change(new TitleScene(game)) }),
    );
    this.refreshSoundLabel();
  }

  override onResize(width: number, height: number): void {
    const w = Math.min(width - 64, 520);
    const buttonH = 88;
    const gap = 20;
    const h = 130 + buttonH * 3 + gap * 2 + 44;
    this.panel = { x: (width - w) / 2, y: (height - h) / 2, w, h };
    const bw = w - 72;
    let y = this.panel.y + 130;
    for (const b of [this.resumeButton, this.soundButton, this.quitButton]) {
      b.setRect(this.panel.x + 36, y, bw, buttonH);
      y += buttonH + gap;
    }
  }

  update(dt: number): void {
    this.t += dt;
    this.ui.update(dt);
  }

  render(ctx: CanvasRenderingContext2D): void {
    const { width, height } = this.game.view;
    const appear = Math.min(1, this.t * 5);

    ctx.fillStyle = `rgba(2, 2, 10, ${0.65 * appear})`;
    ctx.fillRect(0, 0, width, height);

    const p = this.panel;
    const scale = 0.85 + 0.15 * easeOutBack(appear);
    ctx.save();
    ctx.globalAlpha = appear;
    ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
    ctx.scale(scale, scale);
    ctx.translate(-(p.x + p.w / 2), -(p.y + p.h / 2));

    roundRectPath(ctx, p.x, p.y, p.w, p.h, 28);
    ctx.fillStyle = withAlpha('#0b0b24', 0.94);
    ctx.fill();
    strokeNeon(ctx, COLORS.purple, 3);

    neonText(ctx, '일시정지', p.x + p.w / 2, p.y + 70, 46, COLORS.purple);
    this.ui.render(ctx);
    ctx.restore();
  }

  private refreshSoundLabel(): void {
    const on = this.game.save.data.settings.soundEnabled;
    this.soundButton.label = on ? '사운드 켜짐' : '사운드 꺼짐';
    this.soundButton.icon = on ? 'sound-on' : 'sound-off';
  }
}
