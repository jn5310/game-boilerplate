import { COLORS, font } from '../config';
import type { SfxName } from '../core/AudioManager';
import type { Game } from '../core/Game';
import type { Action } from '../core/InputManager';
import { drawIcon, type IconName } from '../gfx/icons';
import { neonText, plainText, roundRectPath, strokeNeon, withAlpha } from '../gfx/neon';
import { approach, TAU } from '../utils/math';

export interface ButtonOptions {
  label?: string;
  /** 작은 보조 글자 (예: 단축키 안내 'Space') */
  sublabel?: string;
  icon?: IconName;
  color?: string;
  shape?: 'rect' | 'circle';
  onClick?: () => void;
  /** 키보드 단축키: 이 행동 키를 누르면 버튼을 누른 것과 같음 (예: 'pause' → Esc/P) */
  hotkey?: Action;
  /**
   * 누르고 있는 동안 이 행동을 '눌림' 상태로 만듦.
   * → 게임 코드는 input.wasPressed('action') 하나로 Space 키와 화면 버튼을 모두 처리.
   */
  holdAction?: Action;
  /** true = 손가락이 닿는 순간 발동 (게임 조작 버튼). 기본 false = 메뉴처럼 손을 뗄 때 발동 */
  fireOnPress?: boolean;
  /** 누를 때 소리. 기본 'click', null이면 무음 */
  sound?: SfxName | null;
}

/**
 * 터치·마우스·키보드로 모두 누를 수 있는 네온 버튼.
 * - 터치 판정 영역이 보이는 크기보다 넓음(hitPadding) → 손가락으로 누르기 쉬움
 * - 눌렀다가 버튼 밖으로 손가락을 빼고 떼면 취소됨 (일반 앱 버튼과 같은 동작)
 * - 위치·크기는 논리 단위. 씬의 onResize에서 setRect / setCenter로 배치하세요.
 */
export class Button {
  x = 0;
  y = 0;
  w = 320;
  h = 96;
  label: string;
  sublabel: string;
  icon: IconName | undefined;
  color: string;
  shape: 'rect' | 'circle';
  onClick: (() => void) | undefined;
  hotkey: Action | undefined;
  holdAction: Action | undefined;
  fireOnPress: boolean;
  sound: SfxName | null;
  visible = true;
  enabled = true;
  /** 0~1 진행도 (쿨다운 표시용). 1이면 가득 참 = 표시 안 함 */
  progress = 1;
  /** 키보드 포커스 (UILayer가 관리) */
  focused = false;
  /** 보이는 크기 바깥으로 이만큼 더 터치 인정 (논리 단위) */
  hitPadding = 14;

  private pointerId: number | null = null;
  private pressedInside = false;
  private hovered = false;
  private pressAnim = 0;
  private flash = 0;
  private fitCacheKey = '';
  private fitSize = 0;

  constructor(
    private readonly game: Game,
    options: ButtonOptions = {},
  ) {
    this.label = options.label ?? '';
    this.sublabel = options.sublabel ?? '';
    this.icon = options.icon;
    this.color = options.color ?? COLORS.cyan;
    this.shape = options.shape ?? 'rect';
    this.onClick = options.onClick;
    this.hotkey = options.hotkey;
    this.holdAction = options.holdAction;
    this.fireOnPress = options.fireOnPress ?? false;
    this.sound = options.sound === undefined ? 'click' : options.sound;
  }

  setRect(x: number, y: number, w: number, h: number): this {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    return this;
  }

  setCenter(cx: number, cy: number, w: number, h: number): this {
    return this.setRect(cx - w / 2, cy - h / 2, w, h);
  }

  get centerX(): number {
    return this.x + this.w / 2;
  }

  get centerY(): number {
    return this.y + this.h / 2;
  }

  get isPressed(): boolean {
    return this.pointerId !== null && this.pressedInside;
  }

  get isHovered(): boolean {
    return this.hovered;
  }

  contains(px: number, py: number): boolean {
    const pad = this.hitPadding;
    if (this.shape === 'circle') {
      const r = Math.min(this.w, this.h) / 2 + pad;
      const dx = px - this.centerX;
      const dy = py - this.centerY;
      return dx * dx + dy * dy <= r * r;
    }
    return px >= this.x - pad && px <= this.x + this.w + pad && py >= this.y - pad && py <= this.y + this.h + pad;
  }

  update(dt: number): void {
    const input = this.game.input;
    if (!this.visible) {
      this.pointerId = null;
      this.hovered = false;
      return;
    }

    // 1) 새로 닿은 손가락 중 내 위에 있는 것을 가져감 (조이스틱보다 먼저 update해야 함)
    if (this.pointerId === null) {
      for (const p of input.pointers.values()) {
        if (p.justDown && p.owner === null && this.contains(p.x, p.y)) {
          input.claim(p, this);
          this.pointerId = p.id;
          this.pressedInside = true;
          if (this.fireOnPress) this.fire();
          break;
        }
      }
    }

    // 2) 누르고 있는 동안
    if (this.pointerId !== null) {
      const p = input.pointers.get(this.pointerId);
      if (!p || p.owner !== this) {
        this.pointerId = null;
      } else {
        this.pressedInside = this.contains(p.x, p.y);
        if (this.holdAction && this.enabled && p.isDown) input.holdAction(this.holdAction);
        if (p.justUp) {
          if (!this.fireOnPress && !p.cancelled && this.pressedInside) this.fire();
          this.pointerId = null;
        }
      }
    }

    // 3) 키보드 단축키
    if (this.hotkey && input.wasPressed(this.hotkey)) this.fire();

    // 4) PC 마우스 호버
    this.hovered = input.mouse !== null && this.contains(input.mouse.x, input.mouse.y);
    if (this.hovered && this.enabled) input.requestPointerCursor();

    this.pressAnim = approach(this.pressAnim, this.isPressed || (this.holdAction && this.pointerId !== null) ? 1 : 0, dt * 14);
    this.flash = Math.max(0, this.flash - dt * 3.5);
  }

  /** 버튼 발동 (코드에서 직접 호출해도 됨) */
  fire(): void {
    if (!this.enabled || !this.visible) return;
    this.flash = 1;
    if (this.sound) this.game.audio.play(this.sound);
    this.onClick?.();
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.visible) return;
    const cx = this.centerX;
    const cy = this.centerY;
    const scale = 1 - 0.07 * this.pressAnim + 0.03 * this.flash;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.translate(-cx, -cy);
    ctx.globalAlpha *= this.enabled ? 1 : 0.38;

    // 바탕
    this.path(ctx, 0);
    const fill = 0.1 + (this.hovered ? 0.08 : 0) + 0.18 * this.pressAnim + 0.3 * this.flash;
    ctx.fillStyle = withAlpha(this.color, Math.min(0.7, fill));
    ctx.fill();

    // 쿨다운 진행도
    if (this.progress < 1) {
      ctx.save();
      if (this.shape === 'circle') {
        const r = Math.min(this.w, this.h) / 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + TAU * this.progress);
        ctx.closePath();
      } else {
        ctx.beginPath();
        ctx.rect(this.x, this.y + this.h * (1 - this.progress), this.w, this.h * this.progress);
      }
      ctx.fillStyle = withAlpha(this.color, 0.22);
      ctx.fill();
      ctx.restore();
    }

    // 테두리
    this.path(ctx, 0);
    strokeNeon(ctx, this.color, 3.5);

    // 키보드 포커스 테두리 (키보드를 쓸 때만 보임)
    if (this.focused && this.game.input.lastDevice === 'keyboard') {
      this.path(ctx, 10);
      ctx.globalAlpha *= 0.6 + 0.4 * Math.sin(this.game.time * 8);
      strokeNeon(ctx, COLORS.white, 2.5);
    }
    ctx.restore();

    // 내용 (아이콘·글자) — 눌림 크기 반영
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.translate(-cx, -cy);
    ctx.globalAlpha *= this.enabled ? 1 : 0.45;
    this.drawContent(ctx, cx, cy);
    ctx.restore();
  }

  private drawContent(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
    const short = Math.min(this.w, this.h);
    const hasSub = this.sublabel.length > 0;
    const textY = hasSub ? cy - short * 0.1 : cy;

    if (this.icon && !this.label) {
      drawIcon(ctx, this.icon, cx, textY, short * 0.48, this.color);
    } else if (this.label) {
      const iconSize = this.icon ? this.h * 0.4 : 0;
      const gap = this.icon ? this.h * 0.16 : 0;
      const size = this.fitLabel(ctx, this.w - this.h * 0.5 - iconSize - gap, this.shape === 'circle' ? short * 0.26 : this.h * 0.34);
      const textWidth = this.measure(ctx, size);
      const total = iconSize + gap + textWidth;
      const left = cx - total / 2;
      if (this.icon) drawIcon(ctx, this.icon, left + iconSize / 2, textY, iconSize, this.color);
      neonText(ctx, this.label, left + iconSize + gap + textWidth / 2, textY, size, COLORS.white, { glow: 0.4 });
    }
    if (hasSub) {
      plainText(ctx, this.sublabel, cx, cy + short * 0.24, short * 0.15, this.color, { weight: 700, alpha: 0.85 });
    }
  }

  /** 글자가 버튼 폭을 넘지 않게 크기 자동 조절 (결과는 캐시) */
  private fitLabel(ctx: CanvasRenderingContext2D, maxWidth: number, preferred: number): number {
    const key = `${this.label}|${maxWidth}|${preferred}`;
    if (key === this.fitCacheKey) return this.fitSize;
    let size = Math.round(preferred);
    while (size > 12 && this.measure(ctx, size) > maxWidth) size -= 2;
    this.fitCacheKey = key;
    this.fitSize = size;
    return size;
  }

  private measure(ctx: CanvasRenderingContext2D, size: number): number {
    ctx.save();
    ctx.font = font(size, 800);
    const w = ctx.measureText(this.label).width;
    ctx.restore();
    return w;
  }

  private path(ctx: CanvasRenderingContext2D, grow: number): void {
    if (this.shape === 'circle') {
      ctx.beginPath();
      ctx.arc(this.centerX, this.centerY, Math.min(this.w, this.h) / 2 + grow, 0, TAU);
    } else {
      roundRectPath(ctx, this.x - grow, this.y - grow, this.w + grow * 2, this.h + grow * 2, Math.min(this.h, this.w) * 0.3 + grow);
    }
  }
}
