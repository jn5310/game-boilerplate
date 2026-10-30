import { COLORS, CONFIG } from '../config';
import type { Game } from '../core/Game';
import { pwa } from '../core/pwa';
import { Scene } from '../core/Scene';
import { drawIcon } from '../gfx/icons';
import { neonPolygon, neonText, plainText } from '../gfx/neon';
import { Button } from '../ui/Button';
import { UILayer } from '../ui/UILayer';
import { easeOutBack, rand, TAU } from '../utils/math';
import { GameScene } from './GameScene';

interface Orbiter {
  angle: number;
  distance: number;
  speed: number;
  sides: number;
  size: number;
  color: string;
}

/** 타이틀 화면 */
export class TitleScene extends Scene {
  private readonly ui = new UILayer(this.game);
  private readonly startButton: Button;
  private readonly soundButton: Button;
  private readonly installButton: Button;
  private readonly orbiters: Orbiter[];
  private t = 0;
  private titleY = 0;
  private infoY = 0;
  private footerY = 0;

  constructor(game: Game) {
    super(game);
    this.startButton = this.ui.add(
      new Button(game, { label: '게임 시작', icon: 'play', color: COLORS.cyan, onClick: () => game.scenes.change(new GameScene(game)) }),
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
    this.installButton = this.ui.add(
      new Button(game, {
        label: '앱으로 설치',
        icon: 'install',
        color: COLORS.green,
        onClick: () => {
          void pwa.install();
        },
      }),
    );
    this.installButton.visible = pwa.canInstall;
    this.refreshSoundLabel();

    const colors = [COLORS.cyan, COLORS.magenta, COLORS.yellow, COLORS.orange, COLORS.purple];
    this.orbiters = Array.from({ length: 7 }, (_, i) => ({
      angle: rand(0, TAU),
      distance: rand(0.75, 1.15),
      speed: rand(0.15, 0.4) * (i % 2 ? 1 : -1),
      sides: 3 + (i % 4),
      size: rand(14, 26),
      color: colors[i % colors.length],
    }));
  }

  override onResize(width: number, height: number): void {
    const safe = this.game.view.safe;
    const top = safe.top;
    const usable = height - safe.top - safe.bottom;
    const landscape = width > height;

    this.titleY = top + usable * (landscape ? 0.2 : 0.24);
    this.infoY = top + usable * (landscape ? 0.36 : 0.37);
    this.footerY = height - safe.bottom - 34;

    this.layoutButtons();
  }

  /** 설치 버튼이 보이는지에 따라 버튼 배치가 달라짐 */
  private layoutButtons(): void {
    const { width, height, safe } = this.game.view;
    const top = safe.top;
    const usable = height - safe.top - safe.bottom;
    const bw = Math.min(width - 96, 460);
    if (width > height) {
      // 가로 화면: 보조 버튼 두 개를 한 줄에
      this.startButton.setCenter(width / 2, top + usable * 0.53, bw, 100);
      const y = top + usable * 0.53 + 100 / 2 + 24 + 84 / 2;
      if (this.installButton.visible) {
        const small = (bw - 20) / 2;
        this.soundButton.setCenter(width / 2 - small / 2 - 10, y, small, 84);
        this.installButton.setCenter(width / 2 + small / 2 + 10, y, small, 84);
      } else {
        this.soundButton.setCenter(width / 2, y, (bw - 20) / 2, 84);
      }
    } else {
      this.startButton.setCenter(width / 2, top + usable * 0.52, bw, 104);
      this.soundButton.setCenter(width / 2, this.startButton.centerY + 104 / 2 + 26 + 88 / 2, bw, 88);
      this.installButton.setCenter(width / 2, this.soundButton.centerY + 88 + 22, bw, 88);
    }
  }

  update(dt: number): void {
    this.t += dt;
    if (this.installButton.visible !== pwa.canInstall) {
      this.installButton.visible = pwa.canInstall;
      this.layoutButtons();
    }
    for (const o of this.orbiters) o.angle += o.speed * dt;
    this.ui.update(dt);
  }

  render(ctx: CanvasRenderingContext2D): void {
    const { width } = this.game.view;
    const cx = width / 2;
    this.game.background.render(ctx);

    // 제목 주위를 도는 도형들
    const ringR = Math.min(width * 0.42, 300);
    for (const o of this.orbiters) {
      const x = cx + Math.cos(o.angle) * ringR * o.distance;
      const y = this.titleY + Math.sin(o.angle) * ringR * o.distance * 0.45;
      neonPolygon(ctx, x, y, o.size, o.sides, o.angle * 2, o.color, 3);
    }

    // 제목 (등장 애니메이션 + 은은한 깜빡임)
    const appear = easeOutBack(Math.min(1, this.t * 1.6));
    const flicker = Math.sin(this.t * 37) > 0.97 ? 0.6 : 1;
    const titleSize = Math.min(104, width * 0.125) * appear;
    neonText(ctx, CONFIG.title, cx, this.titleY, titleSize, COLORS.magenta, { glow: 1.2, alpha: flicker });
    plainText(ctx, CONFIG.subtitle, cx, this.titleY + titleSize * 0.75, 20, COLORS.cyan, { weight: 700, alpha: 0.8 });

    // 기록 · 재화
    const save = this.game.save.data;
    neonText(ctx, `BEST ${save.highScore.toLocaleString()}`, cx - 90, this.infoY, 30, COLORS.cyan, { glow: 0.5 });
    drawIcon(ctx, 'gem', cx + 70, this.infoY, 26, COLORS.yellow);
    neonText(ctx, save.coins.toLocaleString(), cx + 92, this.infoY, 30, COLORS.yellow, { align: 'left', glow: 0.5 });

    this.ui.render(ctx);
    this.renderFooter(ctx, cx);
  }

  private renderFooter(ctx: CanvasRenderingContext2D, cx: number): void {
    const lines: Array<[string, string]> = [];
    if (!this.game.save.isPersistent) lines.push(['⚠ 이 브라우저에서는 기록이 저장되지 않아요 (시크릿 모드?)', COLORS.red]);
    if (pwa.isIOS && !pwa.isStandalone) lines.push(['아이폰: 공유 버튼 → "홈 화면에 추가"로 앱처럼 설치', COLORS.green]);
    lines.push([
      this.game.input.isTouchDevice ? '드래그 = 이동 · DASH 버튼 = 대시' : '방향키/WASD = 이동 · Space = 대시 · Esc = 일시정지',
      COLORS.textDim,
    ]);
    let y = this.footerY;
    for (let i = lines.length - 1; i >= 0; i--) {
      plainText(ctx, lines[i][0], cx, y, 20, lines[i][1], { weight: 600 });
      y -= 30;
    }
  }

  private refreshSoundLabel(): void {
    const on = this.game.save.data.settings.soundEnabled;
    this.soundButton.label = on ? '사운드 ON' : '사운드 OFF';
    this.soundButton.icon = on ? 'sound-on' : 'sound-off';
  }
}
