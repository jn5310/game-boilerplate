import { COLORS } from '../config';
import type { Game } from '../core/Game';
import { Scene } from '../core/Scene';
import { neonText, plainText, roundRectPath, strokeNeon, withAlpha } from '../gfx/neon';
import { Button } from '../ui/Button';
import { UILayer } from '../ui/UILayer';
import { clamp, easeOutBack } from '../utils/math';

export interface SettingsOptions {
  /** '데이터 초기화' 버튼을 보여 줄지 (게임 도중 일시정지에서 열 때는 false) */
  allowReset?: boolean;
}

type Row = 'sound' | 'volume' | 'vibration' | 'shake' | 'reset' | 'close';

/**
 * 설정 팝업 — 사운드·볼륨·진동·화면 흔들림·데이터 초기화.
 * 바꾼 값은 바로 저장되고 적용됩니다 (game.updateSettings).
 * 새 설정을 추가하려면: SaveData.settings에 필드 → 여기에 버튼 한 줄 → 필요한 곳에서 save.data.settings로 읽기.
 */
export class SettingsScene extends Scene {
  override readonly isOverlay = true;

  private readonly ui = new UILayer(this.game);
  private readonly soundButton: Button;
  private readonly volumeDown: Button;
  private readonly volumeUp: Button;
  private readonly vibrationButton: Button;
  private readonly shakeButton: Button;
  private readonly resetButton: Button;
  private readonly closeButton: Button;
  private readonly allowReset: boolean;
  private t = 0;
  private resetArmedUntil = 0;
  private resetDoneUntil = 0;
  private panel = { x: 0, y: 0, w: 0, h: 0 };
  private volumeBar = { x: 0, y: 0, w: 0, h: 0 };

  constructor(game: Game, options: SettingsOptions = {}) {
    super(game);
    this.allowReset = options.allowReset ?? true;

    this.soundButton = this.ui.add(
      new Button(game, {
        color: COLORS.yellow,
        onClick: () => game.updateSettings((s) => (s.soundEnabled = !s.soundEnabled)),
      }),
    );
    // −/+ 는 바뀐 볼륨으로 클릭음을 들려주기 위해 버튼 기본 소리를 끄고 직접 재생
    this.volumeDown = this.ui.add(
      new Button(game, { label: '−', color: COLORS.yellow, sound: null, onClick: () => this.changeVolume(-0.1) }),
    );
    this.volumeUp = this.ui.add(
      new Button(game, { label: '+', color: COLORS.yellow, sound: null, onClick: () => this.changeVolume(0.1) }),
    );
    this.vibrationButton = this.ui.add(
      new Button(game, {
        color: COLORS.green,
        onClick: () => {
          game.updateSettings((s) => (s.vibration = !s.vibration));
          game.haptics.vibrate(40); // 켰을 때 바로 느껴 보기
        },
      }),
    );
    this.vibrationButton.visible = game.haptics.supported; // 아이폰 등 미지원 기기에서는 숨김
    this.shakeButton = this.ui.add(
      new Button(game, { color: COLORS.cyan, onClick: () => game.updateSettings((s) => (s.screenShake = !s.screenShake)) }),
    );
    this.resetButton = this.ui.add(new Button(game, { color: COLORS.red, sound: null, onClick: () => this.onReset() }));
    this.resetButton.visible = this.allowReset;
    this.closeButton = this.ui.add(
      new Button(game, { label: '닫기', color: COLORS.purple, hotkey: 'pause', onClick: () => game.scenes.pop() }),
    );
    this.refreshLabels();
  }

  override onBack(): boolean {
    this.game.scenes.pop();
    return true;
  }

  override onResize(width: number, height: number): void {
    const rows: Row[] = ['sound', 'volume'];
    if (this.vibrationButton.visible) rows.push('vibration');
    rows.push('shake');
    if (this.allowReset) rows.push('reset');
    rows.push('close');

    // 세로 화면 = 한 줄, 가로 화면 = 두 줄로 나눠서 높이 720 안에 들어가게
    const landscape = width > height;
    const columns = landscape ? [rows.slice(0, Math.ceil(rows.length / 2)), rows.slice(Math.ceil(rows.length / 2))] : [rows];
    const rowH = 84;
    const gap = 16;
    const colGap = 32;
    const maxRows = Math.max(...columns.map((c) => c.length));
    const w = Math.min(width - 64, landscape ? 1040 : 560);
    const h = 110 + maxRows * rowH + (maxRows - 1) * gap + 40;
    this.panel = { x: (width - w) / 2, y: (height - h) / 2, w, h };

    const colW = (w - 72 - colGap * (columns.length - 1)) / columns.length;
    columns.forEach((column, ci) => {
      const x = this.panel.x + 36 + ci * (colW + colGap);
      column.forEach((row, ri) => this.placeRow(row, x, this.panel.y + 110 + ri * (rowH + gap), colW, rowH));
    });
  }

  private placeRow(row: Row, x: number, y: number, w: number, h: number): void {
    switch (row) {
      case 'sound':
        this.soundButton.setRect(x, y, w, h);
        break;
      case 'volume':
        this.volumeDown.setRect(x, y, h, h);
        this.volumeUp.setRect(x + w - h, y, h, h);
        this.volumeBar = { x: x + h + 20, y, w: w - h * 2 - 40, h };
        break;
      case 'vibration':
        this.vibrationButton.setRect(x, y, w, h);
        break;
      case 'shake':
        this.shakeButton.setRect(x, y, w, h);
        break;
      case 'reset':
        this.resetButton.setRect(x, y, w, h);
        break;
      case 'close':
        this.closeButton.setRect(x, y, w, h);
        break;
    }
  }

  update(dt: number): void {
    this.t += dt;
    this.ui.update(dt);
    this.refreshLabels();
  }

  render(ctx: CanvasRenderingContext2D): void {
    const { width, height } = this.game.view;
    const appear = Math.min(1, this.t * 5);
    ctx.fillStyle = `rgba(2, 2, 10, ${0.7 * appear})`;
    ctx.fillRect(0, 0, width, height);

    const p = this.panel;
    const scale = 0.85 + 0.15 * easeOutBack(appear);
    ctx.save();
    ctx.globalAlpha = appear;
    ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
    ctx.scale(scale, scale);
    ctx.translate(-(p.x + p.w / 2), -(p.y + p.h / 2));

    roundRectPath(ctx, p.x, p.y, p.w, p.h, 28);
    ctx.fillStyle = withAlpha('#0b0b24', 0.96);
    ctx.fill();
    strokeNeon(ctx, COLORS.yellow, 3);
    neonText(ctx, '설정', p.x + p.w / 2, p.y + 62, 44, COLORS.yellow);

    this.renderVolumeBar(ctx);
    this.ui.render(ctx);
    ctx.restore();
  }

  private renderVolumeBar(ctx: CanvasRenderingContext2D): void {
    const b = this.volumeBar;
    const settings = this.game.save.data.settings;
    const volume = settings.volume;
    const barY = b.y + b.h * 0.62;
    const barH = 14;
    plainText(ctx, `볼륨 ${Math.round(volume * 100)}%${settings.soundEnabled ? '' : ' (꺼짐)'}`, b.x + b.w / 2, b.y + b.h * 0.3, 24, COLORS.text, {
      weight: 700,
    });
    roundRectPath(ctx, b.x, barY - barH / 2, b.w, barH, barH / 2);
    ctx.fillStyle = withAlpha(COLORS.textDim, 0.25);
    ctx.fill();
    if (volume > 0) {
      roundRectPath(ctx, b.x, barY - barH / 2, Math.max(barH, b.w * volume), barH, barH / 2);
      ctx.fillStyle = withAlpha(COLORS.yellow, settings.soundEnabled ? 0.85 : 0.35);
      ctx.fill();
    }
  }

  private changeVolume(delta: number): void {
    this.game.updateSettings((s) => {
      s.volume = Math.round(clamp(s.volume + delta, 0, 1) * 10) / 10;
    });
    this.game.audio.play('click');
  }

  /** 실수 방지: 한 번 누르면 '한 번 더 누르면 초기화'로 바뀌고, 3초 안에 다시 눌러야 실행 */
  private onReset(): void {
    if (this.t < this.resetArmedUntil) {
      this.game.resetSaveData();
      this.resetArmedUntil = 0;
      this.resetDoneUntil = this.t + 1.5;
      this.game.audio.play('pause');
      this.game.haptics.vibrate(60);
    } else {
      this.resetArmedUntil = this.t + 3;
      this.game.audio.play('click');
    }
  }

  private refreshLabels(): void {
    const s = this.game.save.data.settings;
    const onOff = (on: boolean): string => (on ? '켜짐' : '꺼짐');
    this.soundButton.label = `사운드 ${onOff(s.soundEnabled)}`;
    this.soundButton.icon = s.soundEnabled ? 'sound-on' : 'sound-off';
    this.vibrationButton.label = `진동 ${onOff(s.vibration)}`;
    this.shakeButton.label = `화면 흔들림 ${onOff(s.screenShake)}`;
    this.volumeDown.enabled = s.volume > 0;
    this.volumeUp.enabled = s.volume < 1;
    if (this.t < this.resetDoneUntil) this.resetButton.label = '초기화했어요';
    else if (this.t < this.resetArmedUntil) this.resetButton.label = '한 번 더 누르면 초기화';
    else this.resetButton.label = '데이터 초기화';
  }
}
