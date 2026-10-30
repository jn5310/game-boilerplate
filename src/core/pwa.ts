/**
 * PWA(앱 설치) 지원.
 * - 서비스 워커 등록: 한 번 접속하면 오프라인에서도 실행 (배포된 빌드에서만 동작, 개발 서버에서는 꺼짐)
 * - 안드로이드 크롬·PC 크롬/엣지: '앱 설치' 버튼을 직접 띄울 수 있음 (pwa.canInstall → pwa.install())
 * - 아이폰/아이패드: 설치 버튼 API가 없음 → Safari 공유 버튼 → '홈 화면에 추가' 안내 (pwa.isIOS)
 */
let deferredPrompt: BeforeInstallPromptEvent | null = null;

export function initPWA(): void {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // 브라우저 기본 배너 대신 게임 안의 버튼으로 설치
    deferredPrompt = e;
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
  });

  // 서비스 워커는 HTTPS(또는 localhost)에서만 동작
  if (import.meta.env.PROD && 'serviceWorker' in navigator && window.isSecureContext) {
    const register = (): void => {
      navigator.serviceWorker.register('./sw.js').catch((err) => console.warn('[PWA] 서비스 워커 등록 실패', err));
    };
    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register, { once: true });
  }
}

export const pwa = {
  /** 설치 버튼을 보여 줄 수 있는 상태인지 */
  get canInstall(): boolean {
    return deferredPrompt !== null;
  },

  /** 설치 창 띄우기. 설치했으면 true */
  async install(): Promise<boolean> {
    const prompt = deferredPrompt;
    if (!prompt) return false;
    deferredPrompt = null;
    await prompt.prompt();
    const choice = await prompt.userChoice;
    return choice.outcome === 'accepted';
  },

  /** 홈 화면 앱으로 실행 중인지 */
  get isStandalone(): boolean {
    return (
      window.matchMedia('(display-mode: fullscreen)').matches ||
      window.matchMedia('(display-mode: standalone)').matches ||
      navigator.standalone === true
    );
  },

  /** 아이폰·아이패드인지 (아이패드는 맥처럼 보이는 경우까지) */
  get isIOS(): boolean {
    const ua = navigator.userAgent;
    return /iPhone|iPad|iPod/.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1);
  },
};
