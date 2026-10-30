import { CONFIG } from '../config';

/**
 * 게임 중 화면 꺼짐 방지 (Screen Wake Lock API).
 * 터치가 뜸한 게임(퍼즐·방치형 등)에서 화면이 어두워지는 것을 막습니다.
 * 지원하지 않는 브라우저에서는 아무 일도 하지 않습니다. CONFIG.keepScreenOn으로 끌 수 있습니다.
 *
 *   game.wakeLock.set(true);   // 게임 시작·재개 때
 *   game.wakeLock.set(false);  // 일시정지·종료 때
 */
export class ScreenWakeLock {
  private sentinel: WakeLockSentinel | null = null;
  private wanted = false;

  constructor() {
    // 앱을 내렸다 오면 브라우저가 자동으로 풀어 버리므로 다시 요청
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.wanted) void this.acquire();
    });
  }

  get supported(): boolean {
    return 'wakeLock' in navigator;
  }

  /** 지금 화면 꺼짐 방지가 걸려 있는지 */
  get active(): boolean {
    return this.sentinel !== null;
  }

  set(on: boolean): void {
    this.wanted = on && CONFIG.keepScreenOn;
    if (this.wanted) void this.acquire();
    else void this.release();
  }

  private async acquire(): Promise<void> {
    if (!this.supported || this.sentinel || document.hidden) return;
    try {
      const sentinel = await navigator.wakeLock.request('screen');
      if (!this.wanted) {
        void sentinel.release();
        return;
      }
      this.sentinel = sentinel;
      sentinel.addEventListener('release', () => {
        if (this.sentinel === sentinel) this.sentinel = null;
      });
    } catch {
      /* 배터리 절약 모드 등으로 거절될 수 있음 — 게임에는 영향 없음 */
    }
  }

  private async release(): Promise<void> {
    const sentinel = this.sentinel;
    this.sentinel = null;
    try {
      await sentinel?.release();
    } catch {
      /* 무시 */
    }
  }
}
