import { COLORS } from '../config';
import { clamp } from '../utils/math';
import type { Game } from './Game';
import type { Scene } from './Scene';

type Operation = { type: 'change'; scene: Scene } | { type: 'push'; scene: Scene } | { type: 'pop' };

interface Fade {
  phase: 'out' | 'in';
  t: number;
  half: number;
  next: Scene | null;
}

/**
 * 씬(화면) 스택 관리.
 *
 *   scenes.change(new GameScene(game))   // 전체 화면 교체 (페이드 전환)
 *   scenes.push(new PauseScene(game))    // 팝업 띄우기 (아래 씬은 멈춘 채로 보임)
 *   scenes.pop()                         // 팝업 닫기
 *
 * - 전환은 프레임이 끝날 때 한꺼번에 적용되므로 update 도중에 호출해도 안전합니다.
 * - 페이드 중에는 입력을 막아서, 버튼 연타로 화면이 두 번 바뀌는 문제를 막습니다.
 */
export class SceneManager {
  private readonly stack: Scene[] = [];
  private readonly queue: Operation[] = [];
  private fade: Fade | null = null;

  constructor(private readonly game: Game) {}

  /** 맨 위(지금 조작 중인) 씬 */
  get current(): Scene | undefined {
    return this.stack[this.stack.length - 1];
  }

  get isTransitioning(): boolean {
    return this.fade !== null;
  }

  /** 모든 씬을 내리고 새 씬으로 교체. fadeSeconds = 0이면 즉시 */
  change(scene: Scene, fadeSeconds = 0.4): void {
    if (fadeSeconds <= 0 || this.stack.length === 0) {
      this.fade = null;
      this.queue.push({ type: 'change', scene });
      return;
    }
    if (this.fade?.phase === 'out') return; // 이미 전환 중 → 무시 (연타 방지)
    const half = fadeSeconds / 2;
    // 페이드 인 도중이면 지금 어두운 정도에서 이어서 다시 어두워짐
    const t = this.fade ? (1 - clamp(this.fade.t / this.fade.half, 0, 1)) * half : 0;
    this.fade = { phase: 'out', t, half, next: scene };
  }

  /** 팝업 씬 올리기 */
  push(scene: Scene): void {
    this.queue.push({ type: 'push', scene });
  }

  /** 맨 위 팝업 닫기 (마지막 한 장은 닫지 않음) */
  pop(): void {
    this.queue.push({ type: 'pop' });
  }

  update(dt: number): void {
    const fade = this.fade;
    if (fade) {
      this.game.input.suppress();
      fade.t += dt;
      if (fade.phase === 'out' && fade.t >= fade.half) {
        if (fade.next) this.queue.push({ type: 'change', scene: fade.next });
        this.fade = { phase: 'in', t: 0, half: fade.half, next: null };
      } else if (fade.phase === 'in' && fade.t >= fade.half) {
        this.fade = null;
      }
    }
    this.current?.update(dt);
    this.applyQueue();
  }

  render(ctx: CanvasRenderingContext2D): void {
    // 맨 위에서부터 내려가며 '팝업이 아닌' 첫 씬을 찾고, 거기서부터 위로 차례대로 그림
    let start = this.stack.length - 1;
    while (start > 0 && this.stack[start].isOverlay) start--;
    for (let i = Math.max(0, start); i < this.stack.length; i++) {
      ctx.save();
      this.stack[i].render(ctx);
      ctx.restore();
    }

    if (this.fade) {
      const k = clamp(this.fade.t / this.fade.half, 0, 1);
      ctx.save();
      ctx.globalAlpha = this.fade.phase === 'out' ? k : 1 - k;
      ctx.fillStyle = COLORS.bg;
      ctx.fillRect(0, 0, this.game.view.width, this.game.view.height);
      ctx.restore();
    }
  }

  resize(width: number, height: number): void {
    for (const scene of this.stack) scene.onResize(width, height);
  }

  notifyAppHidden(): void {
    this.current?.onAppHidden();
  }

  /** 뒤로가기 버튼 → 맨 위 씬의 onBack. 화면 전환 중에는 무시(처리한 것으로 취급) */
  handleBack(): boolean {
    if (this.fade) return true;
    return this.current?.onBack() ?? false;
  }

  private applyQueue(): void {
    while (this.queue.length > 0) {
      const op = this.queue.shift()!;
      if (op.type === 'change') {
        while (this.stack.length > 0) this.stack.pop()!.onExit();
        this.enter(op.scene);
      } else if (op.type === 'push') {
        this.current?.onPause();
        this.enter(op.scene);
      } else if (this.stack.length > 1) {
        this.stack.pop()!.onExit();
        this.current?.onResume();
      }
    }
  }

  private enter(scene: Scene): void {
    this.stack.push(scene);
    scene.onResize(this.game.view.width, this.game.view.height);
    scene.onEnter();
  }
}
