/**
 * 화면 흔들림 (trauma 방식: 세게 맞을수록 크게, 시간이 지나면 자연스럽게 잦아듦).
 *
 *   shake.add(0.3);   // 약하게 (코인 먹기 등)
 *   shake.add(0.8);   // 세게 (피격·폭발)
 *
 *   render 안에서: ctx.save(); shake.apply(ctx, w, h); ...월드 그리기...; ctx.restore();
 *   (점수판·버튼 같은 UI는 apply 바깥에서 그리면 흔들리지 않음)
 */
export class ScreenShake {
  /** 최대 이동 거리 (논리 단위) */
  maxOffset = 28;
  /** 최대 회전 (라디안) */
  maxAngle = 0.04;
  /** 초당 줄어드는 양 */
  decay = 1.6;

  private trauma = 0;
  private time = 0;
  private offsetX = 0;
  private offsetY = 0;
  private angle = 0;

  add(amount: number): void {
    this.trauma = Math.min(1, this.trauma + amount);
  }

  get intensity(): number {
    return this.trauma;
  }

  update(dt: number): void {
    this.time += dt;
    this.trauma = Math.max(0, this.trauma - this.decay * dt);
    const s = this.trauma * this.trauma; // 제곱해야 약한 흔들림은 은은하고 강한 흔들림은 확실함
    this.offsetX = this.maxOffset * s * wave(this.time * 31, 0.1);
    this.offsetY = this.maxOffset * s * wave(this.time * 29, 7.3);
    this.angle = this.maxAngle * s * wave(this.time * 23, 3.7);
  }

  apply(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    if (this.trauma <= 0) return;
    ctx.translate(width / 2 + this.offsetX, height / 2 + this.offsetY);
    ctx.rotate(this.angle);
    ctx.translate(-width / 2, -height / 2);
  }

  reset(): void {
    this.trauma = 0;
  }
}

/** 부드럽게 출렁이는 -1~1 값 (완전 랜덤보다 덜 어지러움) */
function wave(t: number, seed: number): number {
  return Math.sin(t + seed) * 0.6 + Math.sin(t * 2.31 + seed * 1.7) * 0.4;
}
