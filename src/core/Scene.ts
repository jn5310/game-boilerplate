import type { Game } from './Game';

/**
 * 모든 화면(씬)의 부모 클래스.
 *
 * 새 씬 만들기:
 *   export class ShopScene extends Scene {
 *     update(dt: number) { ... }                       // 매 프레임 로직 (dt = 지난 프레임 이후 초)
 *     render(ctx: CanvasRenderingContext2D) { ... }   // 매 프레임 그리기 (논리 좌표)
 *   }
 *   this.game.scenes.change(new ShopScene(this.game));  // 화면 전환
 */
export abstract class Scene {
  /**
   * true면 '팝업' 씬: 아래에 있는 씬이 멈춘 채로 계속 보입니다 (일시정지 창 등).
   * 하위 클래스에서 `override readonly isOverlay = true;` 로 바꾸세요.
   */
  readonly isOverlay: boolean = false;

  constructor(protected readonly game: Game) {}

  /** 화면에 처음 들어올 때 (onResize 직후) */
  onEnter(): void {}

  /** 화면에서 완전히 빠질 때 */
  onExit(): void {}

  /** 위에 팝업 씬이 덮였을 때 (이때부터 update가 멈춤) */
  onPause(): void {}

  /** 위의 팝업이 닫혀서 다시 맨 위가 됐을 때 */
  onResume(): void {}

  /** 화면 크기·방향이 바뀔 때 (논리 단위). 버튼 배치는 여기서! */
  onResize(_width: number, _height: number): void {}

  /** 앱이 백그라운드로 가거나 창이 포커스를 잃을 때 (게임 씬이면 자동 일시정지에 사용) */
  onAppHidden(): void {}

  /**
   * 안드로이드 뒤로가기 / 브라우저 뒤로 버튼 (CONFIG.backButtonPause).
   * 처리했으면 true (예: 일시정지 열기, 팝업 닫기), false면 브라우저가 원래대로 페이지를 떠남 (타이틀 화면 등).
   */
  onBack(): boolean {
    return false;
  }

  abstract update(dt: number): void;

  abstract render(ctx: CanvasRenderingContext2D): void;
}
