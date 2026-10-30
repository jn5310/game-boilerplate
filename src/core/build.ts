/**
 * 빌드 정보 — 폰에서 "새 버전이 반영됐나?"를 바로 확인하기 위한 값.
 * GitHub Actions(deploy.yml이 VITE_BUILD_NUMBER·VITE_APP_VERSION을 넣음)나
 * Vercel(VERCEL_GIT_COMMIT_SHA)에서 빌드하면 채워지고, 개발 서버에서는 'dev'.
 * 타이틀 화면 오른쪽 아래와 ?debug 화면에 표시됩니다.
 */
const env = import.meta.env;
const commit = (env.VITE_APP_VERSION || env.VERCEL_GIT_COMMIT_SHA || '').slice(0, 7);
const buildNumber = env.VITE_BUILD_NUMBER || '';

/** 예: "#12 · 1a2b3c4", Vercel이면 "1a2b3c4", 개발 서버면 "dev" */
export const BUILD_LABEL = buildNumber ? `#${buildNumber}${commit ? ` · ${commit}` : ''}` : commit || 'dev';
