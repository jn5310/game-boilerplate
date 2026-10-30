import { clamp } from '../utils/math';

/** 효과음 이름 — 새 효과음은 아래 SFX 표에 추가하고 여기에도 이름을 추가하세요 */
export type SfxName = 'click' | 'start' | 'coin' | 'hit' | 'explode' | 'kill' | 'dash' | 'gameover' | 'record' | 'pause';

export interface ToneOptions {
  /** 파형: sine(부드러움) square(8비트) triangle(플루트) sawtooth(거침) */
  type?: OscillatorType;
  /** 시작 주파수 (Hz) */
  freq: number;
  /** 끝 주파수 (Hz) — 지정하면 미끄러지듯 변함 */
  freqEnd?: number;
  /** 길이 (초) */
  duration: number;
  /** 0~1 */
  volume?: number;
  /** 몇 초 뒤에 재생할지 */
  delay?: number;
  /** 저역 통과 필터 (Hz) — 낮을수록 먹먹한 소리 */
  filter?: number;
}

export interface NoiseOptions {
  duration: number;
  volume?: number;
  /** 필터 시작 주파수 (Hz) */
  freq: number;
  /** 필터 끝 주파수 (Hz) */
  freqEnd?: number;
  /** 필터 종류 */
  filterType?: BiquadFilterType;
  delay?: number;
}

/**
 * 코드로 만든 효과음 표 (오디오 파일 0개).
 * pitch: 1 = 기본 음높이. 같은 소리를 반복할 때 살짝 바꿔 주면 덜 지루합니다.
 */
const SFX: Record<SfxName, (a: AudioManager, pitch: number) => void> = {
  click: (a, p) => a.tone({ type: 'square', freq: 700 * p, freqEnd: 980 * p, duration: 0.06, volume: 0.12 }),
  pause: (a) => a.tone({ type: 'sine', freq: 620, freqEnd: 380, duration: 0.14, volume: 0.25 }),
  start: (a) => {
    [523, 659, 784, 1047].forEach((f, i) =>
      a.tone({ type: 'triangle', freq: f, duration: 0.18, volume: 0.25, delay: i * 0.07 }),
    );
  },
  coin: (a, p) => {
    a.tone({ type: 'square', freq: 988 * p, duration: 0.07, volume: 0.1 });
    a.tone({ type: 'square', freq: 1319 * p, duration: 0.24, volume: 0.1, delay: 0.07 });
  },
  dash: (a) => {
    a.noise({ duration: 0.2, volume: 0.25, freq: 500, freqEnd: 4000, filterType: 'bandpass' });
    a.tone({ type: 'triangle', freq: 300, freqEnd: 900, duration: 0.14, volume: 0.16 });
  },
  hit: (a) => {
    a.noise({ duration: 0.28, volume: 0.55, freq: 2000, freqEnd: 200 });
    a.tone({ type: 'sawtooth', freq: 240, freqEnd: 50, duration: 0.25, volume: 0.25, filter: 1200 });
  },
  kill: (a, p) => {
    a.noise({ duration: 0.22, volume: 0.35, freq: 3000 * p, freqEnd: 300 });
    a.tone({ type: 'square', freq: 440 * p, freqEnd: 110 * p, duration: 0.15, volume: 0.1 });
  },
  explode: (a) => {
    a.noise({ duration: 0.8, volume: 0.65, freq: 2600, freqEnd: 60 });
    a.tone({ type: 'sine', freq: 150, freqEnd: 30, duration: 0.7, volume: 0.5 });
  },
  gameover: (a) => {
    [392, 330, 262, 196].forEach((f, i) =>
      a.tone({ type: 'sawtooth', freq: f, freqEnd: f * 0.97, duration: 0.34, volume: 0.16, delay: 0.25 + i * 0.18, filter: 1500 }),
    );
  },
  record: (a) => {
    [523, 659, 784, 1047, 1319].forEach((f, i) =>
      a.tone({ type: 'square', freq: f, duration: 0.16, volume: 0.09, delay: i * 0.08 }),
    );
    a.tone({ type: 'triangle', freq: 1568, duration: 0.7, volume: 0.18, delay: 0.42 });
  },
};

/**
 * Web Audio API 효과음 매니저.
 *
 * - 모바일 브라우저는 '사용자가 화면을 한 번 터치하기 전'에는 소리를 못 냅니다.
 *   그래서 첫 터치/클릭/키 입력 때 자동으로 오디오를 깨웁니다(unlock). 따로 할 일 없음.
 * - 앱이 백그라운드로 가면 오디오를 멈춰 배터리를 아낍니다.
 * - 아이폰 무음 스위치가 켜져 있으면 소리가 안 나는 것이 정상입니다(iOS 정책).
 *
 * 사용법: game.audio.play('coin');  game.audio.play('coin', 1.2); // 살짝 높은 음
 */
export class AudioManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private enabled = true;
  private volume = 0.8;
  private readonly lastPlayed = new Map<SfxName, number>();

  constructor() {
    const unlock = (): void => this.unlock();
    for (const type of ['pointerdown', 'pointerup', 'touchend', 'keydown', 'click']) {
      window.addEventListener(type, unlock, { capture: true, passive: true });
    }
    document.addEventListener('visibilitychange', () => {
      if (!this.ctx) return;
      if (document.hidden) safe(() => this.ctx?.suspend());
      else safe(() => this.ctx?.resume());
    });
  }

  /** 'locked'(아직 터치 전) | 'running' | 'suspended' 등 — 디버그 표시용 */
  get state(): string {
    return this.ctx ? this.ctx.state : 'locked';
  }

  get isEnabled(): boolean {
    return this.enabled;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.applyVolume();
  }

  setVolume(volume: number): void {
    this.volume = clamp(volume, 0, 1);
    this.applyVolume();
  }

  /** 효과음 재생. 사운드가 꺼져 있거나 아직 잠금 해제 전이면 조용히 무시 */
  play(name: SfxName, pitch = 1): void {
    if (!this.enabled || !this.ctx || this.ctx.state === 'closed') return;
    const now = performance.now();
    if (now - (this.lastPlayed.get(name) ?? -Infinity) < 35) return; // 같은 소리 연타 제한
    this.lastPlayed.set(name, now);
    try {
      SFX[name](this, pitch);
    } catch (err) {
      console.warn('[AudioManager] 재생 실패', err);
    }
  }

  /** 단순한 음 하나 (효과음 제작용 부품) */
  tone(o: ToneOptions): void {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    const t0 = ctx.currentTime + (o.delay ?? 0);
    const end = t0 + o.duration;
    const osc = ctx.createOscillator();
    osc.type = o.type ?? 'sine';
    osc.frequency.setValueAtTime(o.freq, t0);
    if (o.freqEnd) osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.freqEnd), end);

    const gain = this.envelope(t0, end, o.volume ?? 0.3);
    if (o.filter) {
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = o.filter;
      osc.connect(filter);
      filter.connect(gain);
    } else {
      osc.connect(gain);
    }
    gain.connect(this.master);
    osc.start(t0);
    osc.stop(end + 0.05);
  }

  /** 잡음 (폭발·타격·바람 소리 제작용 부품) */
  noise(o: NoiseOptions): void {
    const ctx = this.ctx;
    if (!ctx || !this.master || !this.noiseBuffer) return;
    const t0 = ctx.currentTime + (o.delay ?? 0);
    const end = t0 + o.duration;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = o.filterType ?? 'lowpass';
    filter.frequency.setValueAtTime(o.freq, t0);
    if (o.freqEnd) filter.frequency.exponentialRampToValueAtTime(Math.max(1, o.freqEnd), end);
    const gain = this.envelope(t0, end, o.volume ?? 0.3);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    src.start(t0, Math.random() * 0.5);
    src.stop(end + 0.05);
  }

  /** 짧게 커졌다가 자연스럽게 사라지는 볼륨 곡선 */
  private envelope(t0: number, end: number, volume: number): GainNode {
    const gain = this.ctx!.createGain();
    const peak = Math.max(0.0002, volume);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(peak, t0 + Math.min(0.01, (end - t0) / 4));
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    return gain;
  }

  private applyVolume(): void {
    if (!this.ctx || !this.master) return;
    this.master.gain.setTargetAtTime(this.enabled ? this.volume : 0, this.ctx.currentTime, 0.02);
  }

  /** 사용자의 첫 입력 때 오디오 깨우기 (브라우저 자동재생 정책 대응) */
  private unlock(): void {
    if (document.hidden) return;
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? window.webkitAudioContext;
      if (!Ctor) return; // Web Audio 미지원 브라우저: 소리 없이 진행
      try {
        this.ctx = new Ctor({ latencyHint: 'interactive' });
      } catch {
        return;
      }
      const ctx = this.ctx;
      this.master = ctx.createGain();
      this.master.gain.value = this.enabled ? this.volume : 0;
      // 소리가 여러 개 겹쳐도 찢어지지 않게 컴프레서 통과
      const compressor = ctx.createDynamicsCompressor();
      this.master.connect(compressor);
      compressor.connect(ctx.destination);
      this.noiseBuffer = createNoiseBuffer(ctx);
      // 구형 iOS: 무음 버퍼를 한 번 재생해야 잠금이 풀림
      const silent = ctx.createBufferSource();
      silent.buffer = ctx.createBuffer(1, 1, 22050);
      silent.connect(ctx.destination);
      silent.start(0);
    }
    if (this.ctx.state !== 'running') safe(() => this.ctx?.resume());
  }
}

function createNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const length = ctx.sampleRate; // 1초
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

/** Promise를 반환하는(또는 안 하는 구형) 오디오 API를 에러 없이 호출 */
function safe(fn: () => Promise<void> | undefined): void {
  try {
    fn()?.catch(() => undefined);
  } catch {
    /* 무시 */
  }
}
