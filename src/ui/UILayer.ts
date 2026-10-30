import type { Game } from '../core/Game';
import type { Button } from './Button';

export interface UILayerOptions {
  /**
   * 방향키/WASD로 버튼 사이를 이동하고 Enter/Space로 누르기 (PC 키보드 전용 조작).
   * 메뉴 화면은 true, 방향키로 캐릭터를 움직이는 게임 화면은 false.
   */
  keyboardNav?: boolean;
}

/**
 * 버튼 묶음. 씬마다 하나 만들어서 update/render만 호출하면 됩니다.
 * 첫 번째로 추가한 버튼이 기본 포커스 → PC에서 Enter만 눌러도 '주 버튼'이 눌림.
 */
export class UILayer {
  readonly buttons: Button[] = [];
  keyboardNav: boolean;
  private focusIndex = 0;

  constructor(
    private readonly game: Game,
    options: UILayerOptions = {},
  ) {
    this.keyboardNav = options.keyboardNav ?? true;
  }

  add<T extends Button>(button: T): T {
    this.buttons.push(button);
    return button;
  }

  update(dt: number): void {
    if (this.keyboardNav) this.updateKeyboardFocus();
    for (const button of this.buttons) button.update(dt);
  }

  render(ctx: CanvasRenderingContext2D): void {
    for (const button of this.buttons) button.render(ctx);
  }

  private updateKeyboardFocus(): void {
    const input = this.game.input;
    const items = this.buttons.filter((b) => b.visible && b.enabled && !b.holdAction);
    for (const b of this.buttons) b.focused = false;
    if (items.length === 0) return;

    // 마우스를 올린 버튼으로 포커스 이동
    const hoveredIndex = items.findIndex((b) => b.isHovered);
    if (hoveredIndex >= 0) this.focusIndex = hoveredIndex;

    if (input.wasPressed('down') || input.wasPressed('right')) this.focusIndex++;
    if (input.wasPressed('up') || input.wasPressed('left')) this.focusIndex--;
    this.focusIndex = ((this.focusIndex % items.length) + items.length) % items.length;

    const focused = items[this.focusIndex];
    focused.focused = true;
    if (input.wasPressed('confirm')) focused.fire();
  }
}
