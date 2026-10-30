/**
 * 진동 피드백 (안드로이드 크롬 등). 아이폰 Safari는 웹 진동을 지원하지 않아 조용히 무시됩니다.
 * 설정 화면의 '진동' 옵션(save.data.settings.vibration)과 연결되어 있습니다.
 *
 *   game.haptics.vibrate(30);              // 짧게 톡
 *   game.haptics.vibrate([80, 50, 160]);   // 징-징 (진동, 쉼, 진동 ms)
 */
export class Haptics {
  /** 이 기기·브라우저가 진동을 지원하는지 */
  readonly supported = typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
  /** 사용자 설정 (Game.applySettings가 맞춰 줌) */
  enabled = true;

  vibrate(pattern: number | number[]): void {
    if (!this.enabled || !this.supported) return;
    try {
      navigator.vibrate(pattern);
    } catch {
      /* 일부 브라우저는 사용자 입력 전 호출을 막음 — 무시 */
    }
  }
}
