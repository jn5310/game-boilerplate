/** 중첩된 모든 필드를 읽기 전용으로 — 실수로 save.data.coins = 5 처럼 직접 바꾸는 것을 컴파일 단계에서 막음 */
export type DeepReadonly<T> = T extends (infer U)[]
  ? ReadonlyArray<DeepReadonly<U>>
  : T extends object
    ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
    : T;

export interface SaveOptions<T extends { version: number }> {
  /** LocalStorage 키 (게임마다 다르게) */
  key: string;
  /** 기본값 = 데이터 구조의 '정답지'. 불러온 값의 타입을 이 기본값과 비교해서 검사합니다 */
  defaults: T;
  /** 예전 버전 세이브를 새 구조로 바꾸는 함수 (version 필드 기준) */
  migrate?: (raw: Record<string, unknown>, fromVersion: number) => Record<string, unknown>;
  /** 범위 제한 등 추가 검사 (예: 볼륨 0~1, 재화는 0 이상 정수) */
  validate?: (data: T) => void;
  /** 마지막 변경 후 몇 ms 뒤에 저장할지 (연속 변경을 한 번에 모아서 저장) */
  debounceMs?: number;
}

/**
 * 안전한 로컬 세이브 매니저.
 *
 * - 자동 저장: update() 하면 잠시 후 자동 저장, 앱이 백그라운드로 가거나 닫힐 때 즉시 저장
 * - 손상 방지: JSON이 깨졌거나 타입이 틀린 필드는 기본값으로 복구 (게임이 멈추지 않음)
 * - 시크릿 모드 등 LocalStorage를 못 쓰는 환경에서도 에러 없이 메모리로 동작 (isPersistent = false)
 * - 버전 관리: 데이터 구조를 바꿀 때 version을 올리고 migrate에서 옛 데이터를 변환
 *
 * 사용법:
 *   game.save.data.highScore                        // 읽기
 *   game.save.update((d) => { d.coins += 10; });    // 쓰기 (자동 저장됨)
 */
export class SaveManager<T extends { version: number }> {
  private current: T;
  private readonly storage: Storage | null;
  private timer: number | null = null;
  private dirty = false;
  /** LocalStorage에 실제로 저장되는지 */
  readonly isPersistent: boolean;
  /** 마지막 저장 실패 사유 (용량 초과 등) */
  lastError: string | null = null;

  constructor(private readonly options: SaveOptions<T>) {
    this.storage = SaveManager.openStorage();
    this.isPersistent = this.storage !== null;
    this.current = this.load();

    // 모바일에서는 beforeunload가 잘 안 불리므로 visibilitychange / pagehide에서 저장
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') this.flush();
    });
    window.addEventListener('pagehide', () => this.flush());
    window.addEventListener('beforeunload', () => this.flush());
  }

  /** 현재 데이터 (읽기 전용) */
  get data(): DeepReadonly<T> {
    return this.current as DeepReadonly<T>;
  }

  /** 데이터 수정 → 자동 저장 예약 */
  update(mutator: (draft: T) => void): void {
    mutator(this.current);
    this.options.validate?.(this.current);
    this.dirty = true;
    if (this.timer !== null) window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => this.flush(), this.options.debounceMs ?? 400);
  }

  /** 예약된 저장을 지금 바로 실행 */
  flush(): void {
    if (this.timer !== null) {
      window.clearTimeout(this.timer);
      this.timer = null;
    }
    if (!this.dirty) return;
    this.dirty = false;
    if (!this.storage) return;
    try {
      this.storage.setItem(this.options.key, JSON.stringify(this.current));
      this.lastError = null;
    } catch (err) {
      // 용량 초과(QuotaExceededError) 등 — 게임은 계속 진행, 메모리에는 남아 있음
      this.lastError = err instanceof Error ? err.message : String(err);
      console.warn('[SaveManager] 저장 실패:', err);
    }
  }

  /** 모든 데이터를 기본값으로 초기화 */
  reset(): void {
    this.update((draft) => {
      Object.assign(draft, clone(this.options.defaults));
    });
    this.flush();
  }

  private load(): T {
    const defaults = this.options.defaults;
    let raw: string | null = null;
    try {
      raw = this.storage?.getItem(this.options.key) ?? null;
    } catch {
      raw = null;
    }
    if (raw === null) return clone(defaults);

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      console.warn('[SaveManager] 세이브 데이터가 손상되어 기본값으로 시작합니다.');
      this.backupCorrupted(raw);
      return clone(defaults);
    }
    if (!isPlainObject(parsed)) return clone(defaults);

    let obj = parsed;
    const fromVersion = typeof obj.version === 'number' ? obj.version : 0;
    if (this.options.migrate && fromVersion < defaults.version) {
      try {
        obj = this.options.migrate(obj, fromVersion);
      } catch (err) {
        console.warn('[SaveManager] 마이그레이션 실패, 가능한 필드만 살립니다.', err);
      }
    }

    const data = sanitize(defaults, obj);
    data.version = defaults.version;
    this.options.validate?.(data);
    return data;
  }

  /** 깨진 데이터는 지우지 않고 따로 보관 (나중에 복구할 수 있게) */
  private backupCorrupted(raw: string): void {
    try {
      this.storage?.setItem(`${this.options.key}:corrupted`, raw);
    } catch {
      /* 무시 */
    }
  }

  /** LocalStorage 사용 가능 여부 확인 (사파리 시크릿 모드, 저장 차단 설정 등 대비) */
  private static openStorage(): Storage | null {
    try {
      const storage = window.localStorage;
      const probe = '__save_probe__';
      storage.setItem(probe, '1');
      storage.removeItem(probe);
      return storage;
    } catch {
      console.warn('[SaveManager] LocalStorage를 쓸 수 없어 이번 실행 동안만 메모리에 저장합니다.');
      return null;
    }
  }
}

// ───────────────────────── 내부 도우미 ─────────────────────────

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/**
 * 기본값의 '모양'을 기준으로 불러온 값을 검사합니다.
 * - 기본값에 없는 필드는 버림, 빠진 필드는 기본값으로 채움
 * - 타입이 다르면(숫자 자리에 문자열 등) 기본값 사용, NaN/Infinity도 거부
 * → 새 필드를 추가할 때는 인터페이스와 기본값에만 추가하면 자동으로 검사됩니다.
 */
function sanitize<T>(defaults: T, loaded: unknown): T {
  if (Array.isArray(defaults)) {
    // 배열은 통째로 받되 원소 검사는 validate에서 (기본값이 빈 배열이면 원소 타입을 알 수 없으므로)
    return (Array.isArray(loaded) ? clone(loaded) : clone(defaults)) as T;
  }
  if (isPlainObject(defaults)) {
    const source = isPlainObject(loaded) ? loaded : {};
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(defaults)) {
      out[key] = sanitize(defaults[key], source[key]);
    }
    return out as T;
  }
  if (typeof defaults === 'number') {
    return (typeof loaded === 'number' && Number.isFinite(loaded) ? loaded : defaults) as T;
  }
  return (typeof loaded === typeof defaults ? loaded : defaults) as T;
}
