/**
 * ★ 게임 전역 설정 — 새 게임을 만들 때 가장 먼저 바꾸는 파일
 */
export const CONFIG = {
  /** 게임 이름 (타이틀 화면에 표시) */
  title: 'NEON DODGE',
  /** 부제 */
  subtitle: 'MOBILE-FIRST BOILERPLATE',

  /**
   * LocalStorage 저장 키.
   * ⚠ 게임마다 반드시 다르게! 같은 주소(예: 아이디.github.io)에 올린 다른 게임과 세이브가 섞입니다.
   */
  saveKey: 'neon-dodge/save',

  /**
   * 화면의 '짧은 변'을 몇 논리 단위로 볼지.
   * 세로 폰이면 가로 폭 = 720, 가로 폰/PC면 세로 높이 = 720. 긴 변은 화면 비율에 따라 늘어남.
   * 모든 좌표·크기는 이 논리 단위로 계산하면 어떤 기기에서도 비율이 같게 보입니다.
   */
  designShortSide: 720,

  /** 고해상도 화면 픽셀 배율 상한 (선명도 ↔ 성능). 저사양 폰에서 버벅이면 1.5로 낮추세요 */
  maxPixelRatio: 2,

  /** 한 프레임 최대 시간(초). 탭 전환·렉 후에 물체가 순간이동하는 것을 막음 */
  maxDeltaTime: 1 / 20,

  /** 화면 어디든 터치/클릭하면 네온 파티클 */
  touchEffects: true,

  /** 에러를 화면에 빨간 박스로 표시 (폰에는 개발자 도구가 없으니까!) */
  showErrorOverlay: true,
} as const;

/** 네온 팔레트 */
export const COLORS = {
  bg: '#05050f',
  bgTop: '#070818',
  bgBottom: '#13062b',
  cyan: '#00f0ff',
  magenta: '#ff2bd6',
  yellow: '#ffe14d',
  green: '#39ff88',
  orange: '#ff8a1f',
  red: '#ff3355',
  purple: '#9d5cff',
  white: '#ffffff',
  text: '#e8f7ff',
  textDim: '#8a93b8',
} as const;

/** 시스템 폰트만 사용 (폰트 파일 0개) */
export const FONT_FAMILY =
  'system-ui, -apple-system, "Segoe UI", "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", Roboto, sans-serif';

/** ctx.font 문자열 만들기. 예: ctx.font = font(32) */
export function font(size: number, weight: number | string = 800): string {
  return `${weight} ${Math.round(size)}px ${FONT_FAMILY}`;
}
