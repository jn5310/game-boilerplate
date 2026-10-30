/// <reference types="vite/client" />

// ── 브라우저별 비표준 API 타입 보강 ──────────────────────────

interface Window {
  /** 구형 iOS Safari용 Web Audio */
  webkitAudioContext?: typeof AudioContext;
}

interface Navigator {
  /** iOS Safari: 홈 화면 앱으로 실행 중이면 true */
  standalone?: boolean;
}

/** 안드로이드 크롬 / PC 크롬·엣지의 '앱 설치' 이벤트 */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

interface WindowEventMap {
  beforeinstallprompt: BeforeInstallPromptEvent;
}
