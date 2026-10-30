/// <reference types="vite/client" />

// ── 빌드할 때 넣어 주는 값 (src/core/build.ts에서 사용) ─────────────
interface ImportMetaEnv {
  /** GitHub Actions: 커밋 SHA (.github/workflows/deploy.yml에서 설정) */
  readonly VITE_APP_VERSION?: string;
  /** GitHub Actions: 실행 번호 */
  readonly VITE_BUILD_NUMBER?: string;
  /** Vercel이 자동으로 넣어 주는 커밋 SHA */
  readonly VERCEL_GIT_COMMIT_SHA?: string;
}

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
