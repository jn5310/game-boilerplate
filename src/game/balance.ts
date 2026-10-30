/**
 * ★ 샘플 게임 밸런스 숫자 모음 — 난이도·속도·점수는 여기서만 바꾸면 됩니다.
 * 단위: 거리 = 논리 단위(화면 짧은 변 = 720), 시간 = 초
 */
export const BALANCE = {
  player: {
    radius: 24,
    speed: 470,
    /** 가속 반응성 (클수록 즉각적) */
    accel: 16,
    maxHp: 5,
    /** 맞은 뒤 무적 시간 */
    invulnTime: 1.2,
    dashSpeed: 1300,
    dashTime: 0.17,
    dashCooldown: 1.1,
  },
  spawn: {
    /** 적 등장 간격: 처음 → 최소 */
    startInterval: 1.0,
    minInterval: 0.3,
    /** 몇 초에 걸쳐 최고 난이도에 도달하는지 */
    rampSeconds: 100,
    maxEnemies: 45,
  },
  /** 플레이어를 따라오는 분홍 삼각형 */
  chaser: { radius: 22, speedMin: 130, speedMax: 220, turnRate: 2.4, life: 9 },
  /** 화면을 가로질러 날아가는 주황 사각형 */
  drifter: { radius: 20, speedMin: 250, speedMax: 400, aimJitter: 0.35 },
  gem: { radius: 18, interval: 2.0, maxOnScreen: 3, life: 7, magnetRange: 140, magnetSpeed: 640 },
  score: { perSecond: 10, gem: 50, dashKill: 30 },
} as const;
