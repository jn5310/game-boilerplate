import { COLORS, CONFIG } from '../config';
import { ParticleSystem } from '../fx/Particles';
import { SAVE_OPTIONS, type SaveData } from '../game/SaveData';
import { NeonBackground } from '../gfx/Background';
import { plainText, setPixelsPerUnit } from '../gfx/neon';
import { AudioManager } from './AudioManager';
import { showError } from './errorOverlay';
import { InputManager } from './InputManager';
import type { Scene } from './Scene';
import { SaveManager } from './SaveManager';
import { SceneManager } from './SceneManager';
import { Viewport } from './Viewport';

/**
 * 게임 본체: 모든 매니저를 만들고 게임 루프를 돌립니다.
 * 씬에서는 this.game.input / audio / save / scenes / view 로 접근하세요.
 */
export class Game {
  readonly ctx: CanvasRenderingContext2D;
  readonly view: Viewport;
  readonly input: InputManager;
  readonly audio: AudioManager;
  readonly save: SaveManager<SaveData>;
  readonly scenes: SceneManager;
  /** 모든 씬이 함께 쓰는 배경 */
  readonly background: NeonBackground;
  /** 화면 터치 피드백 파티클 (모든 씬 위에 그려짐) */
  readonly touchFx = new ParticleSystem(240);
  /** 게임 시작 후 흐른 시간 (초) */
  time = 0;
  /** 주소에 ?debug 를 붙이면 FPS 등 표시 */
  readonly debug = new URLSearchParams(location.search).has('debug');

  private lastFrame = 0;
  private fps = 0;
  private fpsFrames = 0;
  private fpsTime = 0;

  constructor(readonly canvas: HTMLCanvasElement) {
    // alpha:false = 불투명 캔버스 → 모바일에서 합성 비용이 줄어 더 빠름
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('이 브라우저는 Canvas 2D를 지원하지 않습니다.');
    this.ctx = ctx;

    this.view = new Viewport(canvas);
    this.input = new InputManager(canvas, this.view);
    this.audio = new AudioManager();
    this.save = new SaveManager(SAVE_OPTIONS);
    this.scenes = new SceneManager(this);
    this.background = new NeonBackground();

    const settings = this.save.data.settings;
    this.audio.setEnabled(settings.soundEnabled);
    this.audio.setVolume(settings.volume);

    setPixelsPerUnit(this.view.pixelsPerUnit);
    this.background.resize(this.view.width, this.view.height);
    this.view.onResize((width, height) => {
      setPixelsPerUnit(this.view.pixelsPerUnit);
      this.background.resize(width, height);
      this.scenes.resize(width, height);
      this.render(); // 회전 직후 빈 화면이 깜빡이지 않게 바로 다시 그림
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.scenes.notifyAppHidden();
      else this.lastFrame = performance.now();
    });
    window.addEventListener('blur', () => this.scenes.notifyAppHidden());
  }

  /** 첫 씬으로 게임 시작 */
  start(firstScene: Scene): void {
    this.scenes.change(firstScene, 0);
    this.lastFrame = performance.now();
    requestAnimationFrame(this.frame);
  }

  /** 사운드 켜기/끄기 + 저장 */
  setSoundEnabled(enabled: boolean): void {
    this.save.update((d) => {
      d.settings.soundEnabled = enabled;
    });
    this.audio.setEnabled(enabled);
  }

  toggleSound(): void {
    this.setSoundEnabled(!this.save.data.settings.soundEnabled);
  }

  private frame = (now: number): void => {
    requestAnimationFrame(this.frame);
    let dt = (now - this.lastFrame) / 1000;
    this.lastFrame = now;
    if (!(dt > 0)) dt = 0;
    dt = Math.min(dt, CONFIG.maxDeltaTime);

    try {
      this.update(dt);
      this.render();
    } catch (err) {
      showError(err);
    }
    this.input.endFrame();
  };

  private update(dt: number): void {
    this.time += dt;
    this.background.update(dt);
    if (CONFIG.touchEffects) {
      for (const p of this.input.pointers.values()) {
        if (p.justDown) this.touchFx.ripple(p.x, p.y, COLORS.cyan);
      }
    }
    this.scenes.update(dt);
    this.touchFx.update(dt);

    if (this.debug) {
      this.fpsFrames++;
      this.fpsTime += dt;
      if (this.fpsTime >= 0.5) {
        this.fps = Math.round(this.fpsFrames / this.fpsTime);
        this.fpsFrames = 0;
        this.fpsTime = 0;
      }
    }
  }

  private render(): void {
    const ctx = this.ctx;
    this.view.applyTransform(ctx);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, this.view.width, this.view.height);

    this.scenes.render(ctx);
    this.touchFx.render(ctx);
    if (this.debug) this.renderDebug(ctx);
  }

  private renderDebug(ctx: CanvasRenderingContext2D): void {
    const v = this.view;
    const lines = [
      `FPS ${this.fps}  |  ${Math.round(v.width)}×${Math.round(v.height)}  dpr ${v.dpr.toFixed(2)}  scale ${v.scale.toFixed(3)}`,
      `safe T${Math.round(v.safe.top)} R${Math.round(v.safe.right)} B${Math.round(v.safe.bottom)} L${Math.round(v.safe.left)}`,
      `pointers ${this.input.pointers.size}  audio ${this.audio.state}  save ${this.save.isPersistent ? 'localStorage' : 'memory'}`,
    ];
    ctx.save();
    const x = v.safe.left + 12;
    let y = v.height - v.safe.bottom - 12 - (lines.length - 1) * 22;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(x - 6, y - 16, 560, lines.length * 22 + 8);
    for (const line of lines) {
      plainText(ctx, line, x, y, 16, COLORS.green, { align: 'left', weight: 600 });
      y += 22;
    }
    ctx.restore();
  }
}
