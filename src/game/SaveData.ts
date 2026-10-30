import { CONFIG } from '../config';
import type { SaveOptions } from '../core/SaveManager';
import { clamp } from '../utils/math';

/**
 * ★ 세이브 데이터 구조 — 저장하고 싶은 값이 생기면 여기에 추가하세요.
 *
 * 새 필드 추가 방법 (2단계면 끝):
 *   1) 아래 SaveData 인터페이스에 필드 추가
 *   2) DEFAULT_SAVE에 기본값 추가
 *   → 예전 세이브를 가진 사용자도 새 필드는 기본값으로 자동 채워집니다.
 *
 * 필드 이름을 바꾸거나 의미를 바꿀 때는 SAVE_VERSION을 올리고 migrateSave에서 변환하세요.
 */
export interface SaveData {
  /** 세이브 구조 버전 */
  version: number;
  /** 최고 점수 */
  highScore: number;
  /** 보유 재화 (게임 중 모은 코인) */
  coins: number;
  settings: {
    /** 사운드 켜짐 */
    soundEnabled: boolean;
    /** 효과음 볼륨 0~1 */
    volume: number;
    /** 진동 피드백 (지원 기기만) */
    vibration: boolean;
    /** 화면 흔들림 (멀미가 나면 끌 수 있게) */
    screenShake: boolean;
  };
  stats: {
    /** 플레이 횟수 */
    gamesPlayed: number;
    /** 지금까지 모은 코인 총합 */
    totalCoins: number;
    /** 가장 오래 버틴 시간 (초) */
    bestTime: number;
  };
}

export const SAVE_VERSION = 1;

export const DEFAULT_SAVE: SaveData = {
  version: SAVE_VERSION,
  highScore: 0,
  coins: 0,
  settings: {
    soundEnabled: true,
    volume: 0.8,
    vibration: true,
    screenShake: true,
  },
  stats: {
    gamesPlayed: 0,
    totalCoins: 0,
    bestTime: 0,
  },
};

/** 값 범위 검사 — 불러올 때와 update() 할 때마다 실행 */
function validateSave(d: SaveData): void {
  d.highScore = Math.max(0, Math.floor(d.highScore));
  d.coins = Math.max(0, Math.floor(d.coins));
  d.settings.volume = clamp(d.settings.volume, 0, 1);
  d.stats.gamesPlayed = Math.max(0, Math.floor(d.stats.gamesPlayed));
  d.stats.totalCoins = Math.max(0, Math.floor(d.stats.totalCoins));
  d.stats.bestTime = Math.max(0, d.stats.bestTime);
}

/**
 * 예전 버전 세이브 변환. 예시:
 *   if (from < 2) { raw.coins = raw.gold; delete raw.gold; }  // v1의 gold → v2의 coins
 */
function migrateSave(raw: Record<string, unknown>, _from: number): Record<string, unknown> {
  return raw;
}

export const SAVE_OPTIONS: SaveOptions<SaveData> = {
  key: CONFIG.saveKey,
  defaults: DEFAULT_SAVE,
  validate: validateSave,
  migrate: migrateSave,
};
