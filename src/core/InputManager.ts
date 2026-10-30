import type { Vec2 } from '../utils/math';
import type { Viewport } from './Viewport';

/**
 * 게임에서 쓰는 '행동' 이름.
 * 키보드 키, 화면 버튼(holdAction), 가상 조이스틱이 모두 이 이름으로 합쳐지기 때문에
 * 게임 코드는 "무슨 장치로 눌렀는지" 신경 쓸 필요가 없습니다.
 */
export type Action = 'up' | 'down' | 'left' | 'right' | 'confirm' | 'pause' | 'action';

/** 키보드 배치 (KeyboardEvent.code 기준이라 한/영 입력 상태와 무관) */
export const KEY_BINDINGS: Record<Action, readonly string[]> = {
  up: ['ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  confirm: ['Enter', 'NumpadEnter', 'Space'],
  pause: ['Escape', 'KeyP'],
  action: ['Space', 'ShiftLeft', 'ShiftRight', 'KeyJ', 'KeyZ'],
};

const BOUND_KEYS = new Set(Object.values(KEY_BINDINGS).flat());

export type PointerKind = 'mouse' | 'touch' | 'pen';

/** 화면을 누르고 있는 손가락 하나 (PC에서는 마우스 왼쪽 버튼) */
export interface GamePointer {
  readonly id: number;
  readonly kind: PointerKind;
  /** 현재 위치 (논리 좌표) */
  x: number;
  y: number;
  /** 처음 누른 위치 */
  readonly startX: number;
  readonly startY: number;
  /** 누른 시각 (performance.now() ms) */
  readonly startTime: number;
  /** 아직 누르고 있는지 */
  isDown: boolean;
  /** 이번 프레임에 눌렸는지 */
  justDown: boolean;
  /** 이번 프레임에 떼어졌는지 */
  justUp: boolean;
  /** 전화 수신·시스템 제스처 등으로 취소됨 (클릭으로 치지 않음) */
  cancelled: boolean;
  /**
   * 이 포인터를 가져간 주인 (버튼, 조이스틱 등). null이면 아직 아무도 안 가져감.
   * 버튼이 먼저 가져가면 조이스틱은 그 손가락을 무시합니다 → UI와 조작이 겹치지 않음.
   */
  owner: object | null;
}

/** 짧게 눌렀다 뗀 동작 (터치 탭 = 마우스 클릭) */
export interface Tap {
  x: number;
  y: number;
  pointer: GamePointer;
}

const TAP_MAX_MS = 350;
const TAP_MAX_DIST = 28; // 논리 단위
/** 화면 전환 중처럼 입력을 막아야 할 때 포인터를 이 주인에게 줘서 아무도 못 쓰게 함 */
const SYSTEM_OWNER = Object.freeze({ name: 'system' });

/**
 * 통합 입력 매니저 — 터치 / 마우스 / 펜 / 키보드를 한 가지 방식으로 읽습니다.
 *
 * 사용법 (씬의 update 안에서):
 *   const move = input.getMoveVector();        // 방향키·WASD + 가상 조이스틱 (길이 0~1)
 *   if (input.wasPressed('action')) dash();    // Space키 또는 화면의 액션 버튼
 *   for (const p of input.pointers.values()) { ... } // 멀티터치 직접 처리
 *
 * 프레임 규칙: 이벤트는 쌓아 두었다가, 프레임 끝(endFrame)에 '이번 프레임' 표시를 지웁니다.
 */
export class InputManager {
  /** 누르고 있는 포인터 (이번 프레임에 뗀 것 포함) */
  readonly pointers = new Map<number, GamePointer>();
  /** 이번 프레임에 완료된 탭 */
  readonly taps: Tap[] = [];
  /** 마우스 커서 위치 (PC 호버용). 터치에서는 null */
  mouse: Vec2 | null = null;
  /** 마지막으로 쓴 입력 종류. 'keyboard'면 버튼에 포커스 테두리를 보여 줌 */
  lastDevice: 'pointer' | 'keyboard' = 'pointer';
  /** 주 입력이 손가락인 기기인지 (안내 문구 분기용) */
  readonly isTouchDevice: boolean;

  private readonly keysDown = new Set<string>();
  private readonly keysPressed = new Set<string>();
  private virtualHeld = new Set<Action>();
  private virtualHeldPrev = new Set<Action>();
  private readonly virtualPressed = new Set<Action>();
  private analogX = 0;
  private analogY = 0;
  private suppressed = false;
  private wantPointerCursor = false;
  private cursorIsPointer = false;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly view: Viewport,
  ) {
    this.isTouchDevice = window.matchMedia?.('(pointer: coarse)').matches ?? false;

    canvas.addEventListener('pointerdown', this.onPointerDown);
    canvas.addEventListener('pointermove', this.onPointerMove);
    canvas.addEventListener('pointerup', this.onPointerUp);
    canvas.addEventListener('pointercancel', this.onPointerCancel);
    canvas.addEventListener('pointerleave', this.onPointerLeave);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    // 다른 앱/탭으로 가면 눌린 키와 손가락을 모두 놓은 것으로 처리 (키가 눌린 채로 남는 버그 방지)
    window.addEventListener('blur', () => this.reset());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.reset();
    });
  }

  // ───────────────────────── 조회 API ─────────────────────────

  /** 행동 버튼을 누르고 있는지 (키보드 또는 화면 버튼) */
  isDown(action: Action): boolean {
    if (this.virtualHeld.has(action)) return true;
    for (const code of KEY_BINDINGS[action]) if (this.keysDown.has(code)) return true;
    return false;
  }

  /** 이번 프레임에 막 눌렀는지 (한 번만 true) */
  wasPressed(action: Action): boolean {
    if (this.suppressed) return false;
    if (this.virtualPressed.has(action)) return true;
    for (const code of KEY_BINDINGS[action]) if (this.keysPressed.has(code)) return true;
    return false;
  }

  /** 키를 직접 확인 (KeyboardEvent.code, 예: 'KeyR') */
  isKeyDown(code: string): boolean {
    return this.keysDown.has(code);
  }

  wasKeyPressed(code: string): boolean {
    return !this.suppressed && this.keysPressed.has(code);
  }

  /**
   * 이동 방향 (x, y 각각 -1~1, 길이 최대 1).
   * 방향키·WASD + 가상 조이스틱을 합친 값이라 폰/PC 코드가 똑같습니다.
   */
  getMoveVector(out: Vec2 = { x: 0, y: 0 }): Vec2 {
    let x = (this.isDown('right') ? 1 : 0) - (this.isDown('left') ? 1 : 0);
    let y = (this.isDown('down') ? 1 : 0) - (this.isDown('up') ? 1 : 0);
    if (x !== 0 && y !== 0) {
      x *= Math.SQRT1_2;
      y *= Math.SQRT1_2;
    }
    x += this.analogX;
    y += this.analogY;
    const len = Math.hypot(x, y);
    if (len > 1) {
      x /= len;
      y /= len;
    }
    out.x = x;
    out.y = y;
    return out;
  }

  // ─────────────── 가상 컨트롤(화면 버튼·조이스틱)용 API ───────────────

  /** 화면 버튼이 누르고 있는 동안 매 프레임 호출 → 키보드를 누른 것과 똑같이 취급 */
  holdAction(action: Action): void {
    this.virtualHeld.add(action);
    if (!this.virtualHeldPrev.has(action)) this.virtualPressed.add(action);
  }

  /** 가상 조이스틱이 매 프레임 호출 (-1~1) */
  setAnalog(x: number, y: number): void {
    this.analogX = x;
    this.analogY = y;
  }

  /** 포인터를 가져가기. 이미 주인이 있으면 false */
  claim(pointer: GamePointer, owner: object): boolean {
    if (pointer.owner !== null && pointer.owner !== owner) return false;
    pointer.owner = owner;
    return true;
  }

  /** PC에서 마우스가 버튼 위에 있으면 손가락 커서로 */
  requestPointerCursor(): void {
    this.wantPointerCursor = true;
  }

  /** 이번 프레임의 새 입력을 모두 무시 (화면 전환 중 연타 방지) */
  suppress(): void {
    this.suppressed = true;
    for (const p of this.pointers.values()) if (p.justDown && p.owner === null) p.owner = SYSTEM_OWNER;
    this.keysPressed.clear();
    this.virtualPressed.clear();
    this.taps.length = 0;
  }

  /** 모든 입력을 뗀 상태로 (앱이 백그라운드로 갈 때 등) */
  reset(): void {
    this.keysDown.clear();
    this.virtualHeld.clear();
    for (const p of this.pointers.values()) {
      if (p.isDown) {
        p.isDown = false;
        p.justUp = true;
        p.cancelled = true;
      }
    }
    this.mouse = null;
  }

  /** Game 루프가 매 프레임 마지막에 호출 */
  endFrame(): void {
    for (const [id, p] of this.pointers) {
      if (p.justUp) this.pointers.delete(id);
      else p.justDown = false;
    }
    this.keysPressed.clear();
    this.virtualPressed.clear();
    const prev = this.virtualHeldPrev;
    this.virtualHeldPrev = this.virtualHeld;
    this.virtualHeld = prev;
    this.virtualHeld.clear();
    this.taps.length = 0;
    this.analogX = 0;
    this.analogY = 0;
    this.suppressed = false;

    if (this.wantPointerCursor !== this.cursorIsPointer) {
      this.cursorIsPointer = this.wantPointerCursor;
      this.canvas.style.cursor = this.cursorIsPointer ? 'pointer' : '';
    }
    this.wantPointerCursor = false;
  }

  // ───────────────────────── 브라우저 이벤트 ─────────────────────────

  private onPointerDown = (e: PointerEvent): void => {
    if (e.pointerType === 'mouse' && e.button !== 0) return; // 마우스는 왼쪽 버튼만
    // 화면 밖으로 손가락이 나가도 계속 추적
    try {
      this.canvas.setPointerCapture(e.pointerId);
    } catch {
      /* 일부 브라우저는 지원 안 함 — 무시 */
    }
    // iframe(itch.io 등)에 넣었을 때 키보드 입력을 받기 위해
    if (!document.hasFocus()) window.focus();

    const x = this.view.toLogicalX(e.clientX);
    const y = this.view.toLogicalY(e.clientY);
    const kind: PointerKind = e.pointerType === 'touch' || e.pointerType === 'pen' ? e.pointerType : 'mouse';
    this.pointers.set(e.pointerId, {
      id: e.pointerId,
      kind,
      x,
      y,
      startX: x,
      startY: y,
      startTime: performance.now(),
      isDown: true,
      justDown: true,
      justUp: false,
      cancelled: false,
      owner: null,
    });
    this.lastDevice = 'pointer';
    if (kind === 'mouse') this.mouse = { x, y };
  };

  private onPointerMove = (e: PointerEvent): void => {
    const x = this.view.toLogicalX(e.clientX);
    const y = this.view.toLogicalY(e.clientY);
    if (e.pointerType === 'mouse') {
      if (this.mouse) {
        this.mouse.x = x;
        this.mouse.y = y;
      } else {
        this.mouse = { x, y };
      }
    }
    const p = this.pointers.get(e.pointerId);
    if (p && p.isDown) {
      p.x = x;
      p.y = y;
    }
  };

  private onPointerUp = (e: PointerEvent): void => {
    const p = this.pointers.get(e.pointerId);
    if (!p || !p.isDown) return;
    p.x = this.view.toLogicalX(e.clientX);
    p.y = this.view.toLogicalY(e.clientY);
    p.isDown = false;
    p.justUp = true;
    const quick = performance.now() - p.startTime <= TAP_MAX_MS;
    const still = Math.hypot(p.x - p.startX, p.y - p.startY) <= TAP_MAX_DIST;
    if (quick && still) this.taps.push({ x: p.x, y: p.y, pointer: p });
  };

  private onPointerCancel = (e: PointerEvent): void => {
    const p = this.pointers.get(e.pointerId);
    if (!p || !p.isDown) return;
    p.isDown = false;
    p.justUp = true;
    p.cancelled = true;
  };

  private onPointerLeave = (e: PointerEvent): void => {
    if (e.pointerType === 'mouse' && !this.pointers.has(e.pointerId)) this.mouse = null;
  };

  private onKeyDown = (e: KeyboardEvent): void => {
    if (e.ctrlKey || e.metaKey || e.altKey) return; // 브라우저 단축키(새로고침 등)는 건드리지 않음
    if (BOUND_KEYS.has(e.code)) e.preventDefault(); // 방향키·스페이스로 페이지가 스크롤되지 않게
    this.lastDevice = 'keyboard';
    if (e.repeat || this.keysDown.has(e.code)) return;
    this.keysDown.add(e.code);
    this.keysPressed.add(e.code);
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    this.keysDown.delete(e.code);
  };
}
