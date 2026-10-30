import { CONFIG } from '../config';

export interface SafeArea {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
 * 반응형 캔버스.
 * - 화면 크기 / 세로·가로 회전 / 주소창 접힘 / 기기 픽셀 배율(DPR) 변화를 감지해서 캔버스를 다시 맞춥니다.
 * - 게임 코드는 '논리 단위'만 씁니다: 짧은 변 = CONFIG.designShortSide(720), 긴 변은 화면 비율대로.
 * - safe: 노치·펀치홀·홈 인디케이터에 가려지는 영역 (논리 단위). UI는 이 안쪽에 배치하세요.
 */
export class Viewport {
  /** 논리 화면 너비 */
  width: number = CONFIG.designShortSide;
  /** 논리 화면 높이 */
  height: number = CONFIG.designShortSide;
  /** CSS 픽셀 ÷ 논리 단위 */
  scale = 1;
  /** 캔버스 실제 픽셀 ÷ CSS 픽셀 (최대 CONFIG.maxPixelRatio) */
  dpr = 1;
  /** 노치 등 안전 영역 여백 (논리 단위) */
  readonly safe: SafeArea = { top: 0, right: 0, bottom: 0, left: 0 };

  private cssWidth = 0;
  private cssHeight = 0;
  private offsetLeft = 0;
  private offsetTop = 0;
  private readonly safeProbe: HTMLDivElement;
  private readonly listeners: Array<(width: number, height: number) => void> = [];

  constructor(private readonly canvas: HTMLCanvasElement) {
    // CSS env(safe-area-inset-*) 값을 JS에서 읽기 위한 보이지 않는 요소
    this.safeProbe = document.createElement('div');
    this.safeProbe.setAttribute('aria-hidden', 'true');
    this.safeProbe.style.cssText =
      'position:fixed;inset:0;visibility:hidden;pointer-events:none;' +
      'padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);';
    document.body.appendChild(this.safeProbe);

    const refresh = (): void => this.refresh();
    const container = canvas.parentElement ?? canvas;
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(refresh).observe(container);
    window.addEventListener('resize', refresh);
    window.visualViewport?.addEventListener('resize', refresh);
    window.addEventListener('orientationchange', () => {
      refresh();
      // iOS는 회전 직후 크기를 늦게 알려 주는 경우가 있어서 한 번 더
      window.setTimeout(refresh, 350);
    });
    this.refresh();
  }

  get isPortrait(): boolean {
    return this.height >= this.width;
  }

  /** 1 논리 단위가 실제 캔버스 몇 픽셀인지 (shadowBlur 같은 픽셀 단위 값 보정용) */
  get pixelsPerUnit(): number {
    return this.scale * this.dpr;
  }

  /** 화면 크기가 바뀔 때마다 호출될 함수 등록 */
  onResize(listener: (width: number, height: number) => void): void {
    this.listeners.push(listener);
  }

  /** 매 프레임 그리기 전에 호출: 논리 단위로 그릴 수 있게 변환 행렬 설정 */
  applyTransform(ctx: CanvasRenderingContext2D): void {
    const k = this.scale * this.dpr;
    ctx.setTransform(k, 0, 0, k, 0, 0);
  }

  /** 브라우저 좌표(clientX/Y) → 논리 좌표 */
  toLogicalX(clientX: number): number {
    return (clientX - this.offsetLeft) / this.scale;
  }

  toLogicalY(clientY: number): number {
    return (clientY - this.offsetTop) / this.scale;
  }

  refresh(): void {
    const container = this.canvas.parentElement ?? this.canvas;
    const cssW = Math.max(1, container.clientWidth || window.innerWidth);
    const cssH = Math.max(1, container.clientHeight || window.innerHeight);
    const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, CONFIG.maxPixelRatio));

    const rect = this.canvas.getBoundingClientRect();
    this.offsetLeft = rect.left;
    this.offsetTop = rect.top;

    const sizeChanged = cssW !== this.cssWidth || cssH !== this.cssHeight || dpr !== this.dpr;
    const safeChanged = this.readSafeArea(cssW, cssH);
    if (!sizeChanged && !safeChanged) return;

    this.cssWidth = cssW;
    this.cssHeight = cssH;
    this.dpr = dpr;
    this.scale = Math.min(cssW, cssH) / CONFIG.designShortSide;
    this.width = cssW / this.scale;
    this.height = cssH / this.scale;
    this.readSafeArea(cssW, cssH);

    // 캔버스 해상도는 바뀔 때만 다시 설정 (설정하면 캔버스가 지워지므로)
    const pixelW = Math.round(cssW * dpr);
    const pixelH = Math.round(cssH * dpr);
    if (this.canvas.width !== pixelW) this.canvas.width = pixelW;
    if (this.canvas.height !== pixelH) this.canvas.height = pixelH;

    for (const listener of this.listeners) listener(this.width, this.height);
  }

  /** env(safe-area-inset-*) 읽기. 값이 바뀌었으면 true */
  private readSafeArea(cssW: number, cssH: number): boolean {
    const style = getComputedStyle(this.safeProbe);
    const scale = Math.min(cssW, cssH) / CONFIG.designShortSide;
    const next: SafeArea = {
      top: (parseFloat(style.paddingTop) || 0) / scale,
      right: (parseFloat(style.paddingRight) || 0) / scale,
      bottom: (parseFloat(style.paddingBottom) || 0) / scale,
      left: (parseFloat(style.paddingLeft) || 0) / scale,
    };
    const changed =
      Math.abs(next.top - this.safe.top) > 0.5 ||
      Math.abs(next.right - this.safe.right) > 0.5 ||
      Math.abs(next.bottom - this.safe.bottom) > 0.5 ||
      Math.abs(next.left - this.safe.left) > 0.5;
    Object.assign(this.safe, next);
    return changed;
  }
}
