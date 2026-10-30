import { COLORS, CONFIG } from '../config';
import { ParticleSystem } from '../fx/Particles';
import { SAVE_OPTIONS, type SaveData } from '../game/SaveData';
import { NeonBackground } from '../gfx/Background';
import { neonText, plainText, roundRectPath, setPixelsPerUnit, strokeNeon } from '../gfx/neon';
import { Assets } from './Assets';
import { AudioManager } from './AudioManager';
import { BUILD_LABEL } from './build';
import { showError } from './errorOverlay';
import { Haptics } from './Haptics';
import { InputManager } from './InputManager';
import type { Scene } from './Scene';
import { SaveManager } from './SaveManager';
import { SceneManager } from './SceneManager';
import { Viewport } from './Viewport';
import { ScreenWakeLock } from './WakeLock';

type Settings = SaveData['settings'];

/**
 * 게임 본체: 모든 매니저를 만들고 게임 루프를 돌립니다.
 * 씬에서는 this.game.input / audio / save / scenes / view / haptics ... 로 접근하세요.
 */
export class Game {
  readonly ctx: CanvasRenderingContext2D;
  readonly view: Viewport;
  readonly input: InputManager;
  readonly audio: AudioManager;
  readonly save: SaveManager<SaveData>;
  readonly scenes: SceneManager;
  /** 진동 (설정과 연결됨) */
  readonly haptics = new Haptics();
  /** 게임 중 화면 꺼짐 방지 */
  readonly wakeLock = new ScreenWakeLock();
  /** (선택) 이미지 파일 로더 — 실패해도 null */
  readonly assets = new Assets();
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
  private wrongOrientation = false;
  private backTrapArmed = false;

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
    this.applySettings();

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
    if (CONFIG.backButtonPause) this.installBackButton();
  }

  /** 첫 씬으로 게임 시작 */
  start(firstScene: Scene): void {
    this.scenes.change(firstScene, 0);
    this.lastFrame = performance.now();
    requestAnimationFrame(this.frame);
  }

  // ───────────────────────── 설정 ─────────────────────────

  /** 설정 바꾸기 + 저장 + 즉시 적용.  예: game.updateSettings((s) => { s.volume = 0.5; }) */
  updateSettings(mutator: (settings: Settings) => void): void {
    this.save.update((d) => mutator(d.settings));
    this.applySettings();
  }

  /** 저장된 설정을 오디오·진동 등에 반영 (시작할 때, 초기화한 뒤 자동 호출) */
  applySettings(): void {
    const s = this.save.data.settings;
    this.audio.setEnabled(s.soundEnabled);
    this.audio.setVolume(s.volume);
    this.haptics.enabled = s.vibration;
  }

  /** 사운드 켜기/끄기 + 저장 */
  setSoundEnabled(enabled: boolean): void {
    this.updateSettings((s) => {
      s.soundEnabled = enabled;
    });
  }

  toggleSound(): void {
    this.setSoundEnabled(!this.save.data.settings.soundEnabled);
  }

  /** 모든 저장 데이터를 처음 상태로 (최고 점수·재화·설정) */
  resetSaveData(): void {
    this.save.reset();
    this.applySettings();
  }

  // ───────────────────────── 게임 루프 ─────────────────────────

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
    this.input.pollGamepads();
    this.background.update(dt);
    if (CONFIG.touchEffects) {
      for (const p of this.input.pointers.values()) {
        if (p.justDown) this.touchFx.ripple(p.x, p.y, COLORS.cyan);
      }
    }

    // 화면 방향 고정 모드에서 반대로 돌리면: 게임을 멈추고(일시정지) 안내만 보여 줌
    const wrong = this.isWrongOrientation();
    if (wrong && !this.wrongOrientation) this.scenes.notifyAppHidden();
    this.wrongOrientation = wrong;
    if (wrong) this.input.suppress();
    else this.scenes.update(dt);

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
    if (this.wrongOrientation) this.renderRotateHint(ctx);
    this.touchFx.render(ctx);
    if (this.debug) this.renderDebug(ctx);
  }

  private isWrongOrientation(): boolean {
    const mode = CONFIG.orientation;
    if (mode === 'any') return false;
    return mode === 'portrait' ? !this.view.isPortrait : this.view.isPortrait;
  }

  /** "화면을 돌려 주세요" 안내 */
  private renderRotateHint(ctx: CanvasRenderingContext2D): void {
    const { width: w, height: h } = this.view;
    const portrait = CONFIG.orientation === 'portrait';
    ctx.save();
    ctx.fillStyle = 'rgba(5, 5, 15, 0.94)';
    ctx.fillRect(0, 0, w, h);

    // 폰이 목표 방향으로 돌아가는 애니메이션
    const t = (this.time % 2) / 2;
    const turn = Math.min(1, Math.max(0, (t - 0.2) / 0.5));
    const eased = turn * turn * (3 - 2 * turn);
    const from = portrait ? Math.PI / 2 : 0;
    const to = portrait ? 0 : Math.PI / 2;
    ctx.translate(w / 2, h / 2 - 50);
    ctx.rotate(from + (to - from) * eased);
    roundRectPath(ctx, -55, -95, 110, 190, 20);
    strokeNeon(ctx, COLORS.cyan, 4);
    ctx.beginPath();
    ctx.arc(0, 72, 7, 0, Math.PI * 2);
    strokeNeon(ctx, COLORS.cyan, 2);
    ctx.restore();

    neonText(ctx, portrait ? '화면을 세로로 돌려 주세요' : '화면을 가로로 돌려 주세요', w / 2, h / 2 + 110, 34, COLORS.text, {
      glow: 0.4,
    });
  }

  // ───────────────────────── 뒤로가기 ─────────────────────────

  /**
   * 안드로이드 뒤로가기·브라우저 뒤로 버튼을 가로채서 씬의 onBack()을 실행.
   * 사용자가 화면을 한 번 만진 뒤에 방어용 기록을 하나 넣어 둡니다
   * (만지기 전에 넣으면 크롬이 그 기록을 건너뛰어서 동작하지 않음).
   * 씬이 처리하지 않으면(타이틀 등) 원래대로 이전 페이지로 나갑니다.
   */
  private installBackButton(): void {
    const arm = (): void => {
      if (this.backTrapArmed) return;
      history.pushState({ gameBackTrap: true }, '');
      this.backTrapArmed = true;
    };
    window.addEventListener('pointerdown', arm, { capture: true, passive: true });
    window.addEventListener('keydown', arm, { capture: true, passive: true });
    window.addEventListener('popstate', () => {
      if (!this.backTrapArmed) return;
      this.backTrapArmed = false;
      if (this.scenes.handleBack()) arm();
      else history.back();
    });
  }

  private renderDebug(ctx: CanvasRenderingContext2D): void {
    const v = this.view;
    const lines = [
      `FPS ${this.fps}  |  ${Math.round(v.width)}×${Math.round(v.height)}  dpr ${v.dpr.toFixed(2)}  scale ${v.scale.toFixed(3)}  build ${BUILD_LABEL}`,
      `safe T${Math.round(v.safe.top)} R${Math.round(v.safe.right)} B${Math.round(v.safe.bottom)} L${Math.round(v.safe.left)}  gamepad ${this.input.gamepadConnected ? 'on' : 'off'}  wakeLock ${this.wakeLock.active ? 'on' : 'off'}`,
      `pointers ${this.input.pointers.size}  audio ${this.audio.state}  save ${this.save.isPersistent ? 'localStorage' : 'memory'}`,
    ];
    ctx.save();
    const x = v.safe.left + 12;
    let y = v.height - v.safe.bottom - 12 - (lines.length - 1) * 22;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(x - 6, y - 16, 640, lines.length * 22 + 8);
    for (const line of lines) {
      plainText(ctx, line, x, y, 16, COLORS.green, { align: 'left', weight: 600 });
      y += 22;
    }
    ctx.restore();
  }
}
