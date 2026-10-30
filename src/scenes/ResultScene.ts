import { COLORS, font } from '../config';
import type { Game } from '../core/Game';
import { Scene } from '../core/Scene';
import { ParticleSystem } from '../fx/Particles';
import { drawIcon } from '../gfx/icons';
import { neonText, plainText } from '../gfx/neon';
import { Button } from '../ui/Button';
import { UILayer } from '../ui/UILayer';
import { easeOutBack, easeOutCubic, rand } from '../utils/math';
import { GameScene } from './GameScene';
import { TitleScene } from './TitleScene';

export interface ResultData {
  score: number;
  best: number;
  isNewRecord: boolean;
  coinsEarned: number;
  totalCoins: number;
  /** 생존 시간 (초) */
  time: number;
}

/** 결과 / 최고 점수 화면 */
export class ResultScene extends Scene {
  private readonly ui = new UILayer(this.game);
  private readonly retryButton: Button;
  private readonly titleButton: Button;
  private readonly particles = new ParticleSystem(500);
  private t = 0;
  private celebrated = false;
  private confettiTimer = 0;
  private layoutY = { title: 0, score: 0, badge: 0, stats: 0 };

  constructor(
    game: Game,
    private readonly result: ResultData,
  ) {
    super(game);
    this.retryButton = this.ui.add(
      new Button(game, { label: '다시 하기', icon: 'retry', color: COLORS.cyan, onClick: () => game.scenes.change(new GameScene(game)) }),
    );
    this.titleButton = this.ui.add(
      new Button(game, { label: '타이틀', icon: 'home', color: COLORS.magenta, onClick: () => game.scenes.change(new TitleScene(game)) }),
    );
  }

  override onResize(width: number, height: number): void {
    const safe = this.game.view.safe;
    const top = safe.top;
    const usable = height - safe.top - safe.bottom;
    const landscape = width > height;
    this.layoutY = {
      title: top + usable * (landscape ? 0.12 : 0.17),
      score: top + usable * (landscape ? 0.3 : 0.32),
      badge: top + usable * (landscape ? 0.44 : 0.42),
      stats: top + usable * (landscape ? 0.55 : 0.5),
    };
    const bw = Math.min(width - 96, 440);
    const bh = 96;
    if (landscape) {
      const y = top + usable * 0.8;
      this.retryButton.setCenter(width / 2 - bw / 2 - 14, y, bw, bh);
      this.titleButton.setCenter(width / 2 + bw / 2 + 14, y, bw, bh);
    } else {
      this.retryButton.setCenter(width / 2, top + usable * 0.68, bw, bh);
      this.titleButton.setCenter(width / 2, top + usable * 0.68 + bh + 24, bw, bh);
    }
  }

  update(dt: number): void {
    this.t += dt;
    // 게임오버 직후 화면을 연타해서 실수로 '다시 하기'가 눌리지 않게 잠깐 잠금
    const ready = this.t > 0.7;
    this.retryButton.enabled = ready;
    this.titleButton.enabled = ready;
    this.ui.update(dt);

    if (this.result.isNewRecord && this.t > 1.25) {
      if (!this.celebrated) {
        this.celebrated = true;
        this.game.audio.play('record');
      }
      this.confettiTimer -= dt;
      if (this.confettiTimer <= 0 && this.t < 4) {
        this.confettiTimer = 0.35;
        const { width } = this.game.view;
        this.particles.emit(rand(width * 0.15, width * 0.85), this.layoutY.badge, {
          count: 26,
          color: [COLORS.yellow, COLORS.magenta, COLORS.cyan, COLORS.green],
          speed: [180, 520],
          angle: -Math.PI / 2,
          spread: Math.PI * 0.9,
          gravity: 700,
          drag: 1.2,
          life: [0.8, 1.6],
          size: [4, 8],
        });
      }
    }
    this.particles.update(dt);
  }

  render(ctx: CanvasRenderingContext2D): void {
    const { width } = this.game.view;
    const cx = width / 2;
    const r = this.result;
    this.game.background.render(ctx);

    neonText(ctx, 'GAME OVER', cx, this.layoutY.title, Math.min(84, width * 0.11), COLORS.magenta);

    // 점수 카운트업
    const k = easeOutCubic(Math.min(1, this.t / 1.2));
    const shown = Math.floor(r.score * k);
    plainText(ctx, 'SCORE', cx, this.layoutY.score - 62, 24, COLORS.textDim, { weight: 700 });
    neonText(ctx, shown.toLocaleString(), cx, this.layoutY.score, 88, COLORS.cyan);

    if (r.isNewRecord && this.t > 1.2) {
      const pop = easeOutBack(Math.min(1, (this.t - 1.2) * 4));
      const pulse = 1 + 0.05 * Math.sin(this.t * 6);
      neonText(ctx, 'NEW RECORD!', cx, this.layoutY.badge, 50 * pop * pulse, COLORS.yellow);
    } else {
      neonText(ctx, `BEST ${r.best.toLocaleString()}`, cx, this.layoutY.badge, 36, COLORS.yellow, { glow: 0.5 });
    }

    // 재화·시간 (아이콘 + 글자를 한 덩어리로 가운데 정렬)
    const statsY = this.layoutY.stats;
    const coinText = `+${r.coinsEarned}  (보유 ${r.totalCoins.toLocaleString()})`;
    ctx.font = font(26, 700);
    const rowW = 28 + 12 + ctx.measureText(coinText).width;
    const rowX = cx - rowW / 2;
    drawIcon(ctx, 'gem', rowX + 14, statsY, 28, COLORS.yellow);
    plainText(ctx, coinText, rowX + 40, statsY, 26, COLORS.text, { align: 'left', weight: 700 });
    plainText(ctx, `생존 시간 ${r.time.toFixed(1)}초`, cx, statsY + 44, 22, COLORS.textDim, { weight: 600 });

    this.ui.render(ctx);
    this.particles.render(ctx);
  }
}
