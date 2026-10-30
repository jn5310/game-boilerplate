import { COLORS } from '../config';
import type { Game } from '../core/Game';
import { Scene } from '../core/Scene';
import { FloatingTextLayer } from '../fx/FloatingText';
import { ParticleSystem } from '../fx/Particles';
import { ScreenShake } from '../fx/ScreenShake';
import { BALANCE } from '../game/balance';
import { Enemy } from '../game/Enemy';
import { Gem } from '../game/Gem';
import { Player } from '../game/Player';
import { plainText, withAlpha } from '../gfx/neon';
import { Button } from '../ui/Button';
import { Hud } from '../ui/Hud';
import { UILayer } from '../ui/UILayer';
import { VirtualJoystick } from '../ui/VirtualJoystick';
import { circlesOverlap, clamp, dist2, lerp, rand, type Vec2 } from '../utils/math';
import { PauseScene } from './PauseScene';
import { ResultScene } from './ResultScene';

/**
 * 샘플 미니게임 "NEON DODGE"
 * - 이동: 드래그(가상 조이스틱) / 방향키·WASD / 마우스 드래그
 * - 대시: DASH 버튼 / Space·Shift — 대시 중에는 무적 + 부딪힌 적 파괴
 * - 노란 보석 = 재화(코인). 먹는 즉시 저장됨
 *
 * 새 게임을 만들 때는 이 파일과 src/game/ 폴더를 바꾸면 됩니다.
 */
export class GameScene extends Scene {
  private readonly ui = new UILayer(this.game, { keyboardNav: false });
  private readonly joystick = new VirtualJoystick(this.game);
  private readonly hud = new Hud();
  private readonly particles = new ParticleSystem(700);
  private readonly shake = new ScreenShake();
  private readonly floaters = new FloatingTextLayer();
  private readonly pauseButton: Button;
  private readonly dashButton: Button;

  private readonly player: Player;
  private enemies: Enemy[] = [];
  private gems: Gem[] = [];
  private readonly move: Vec2 = { x: 0, y: 0 };

  private elapsed = 0;
  private score = 0;
  private coinsThisRun = 0;
  private spawnTimer = 0.8;
  private gemTimer = 1.0;
  private hitStop = 0;
  private damageFlash = 0;
  /** 0 이상이면 게임오버 연출 중 (경과 시간) */
  private gameOverTime = -1;
  private finished = false;
  private pauseQueued = false;

  constructor(game: Game) {
    super(game);
    const view = game.view;
    this.player = new Player(view.width / 2, view.height * 0.55);

    this.pauseButton = this.ui.add(
      new Button(game, { icon: 'pause', color: COLORS.cyan, hotkey: 'pause', sound: 'pause', onClick: () => this.openPause() }),
    );
    this.dashButton = this.ui.add(
      new Button(game, {
        label: 'DASH',
        sublabel: game.input.isTouchDevice ? '' : 'Space',
        shape: 'circle',
        color: COLORS.magenta,
        holdAction: 'action', // 버튼 = Space 키와 똑같이 취급
        fireOnPress: true,
        sound: null,
      }),
    );
  }

  override onEnter(): void {
    this.hud.best = this.game.save.data.highScore;
    this.hud.setCoins(this.game.save.data.coins);
    this.hud.setHp(this.player.hp, this.player.maxHp);
    this.game.audio.play('start');
    this.game.wakeLock.set(true); // 게임 중에는 화면이 꺼지지 않게
  }

  override onExit(): void {
    this.game.background.scrollSpeed = 24;
    this.game.wakeLock.set(false);
  }

  override onPause(): void {
    this.game.wakeLock.set(false);
  }

  override onResume(): void {
    this.pauseQueued = false;
    this.game.wakeLock.set(true);
  }

  override onAppHidden(): void {
    this.openPause(); // 전화가 오거나 앱을 내리면 자동 일시정지
  }

  /** 안드로이드 뒤로가기 = 일시정지 (게임이 꺼지지 않게) */
  override onBack(): boolean {
    this.openPause();
    return true;
  }

  override onResize(width: number, height: number): void {
    const safe = this.game.view.safe;
    const pauseSize = 84;
    this.pauseButton.setRect(width - safe.right - 20 - pauseSize, safe.top + 12, pauseSize, pauseSize);
    this.hud.layout(width, height, safe, pauseSize + 20);

    const dashR = 80;
    this.dashButton.setCenter(width - safe.right - 36 - dashR, height - safe.bottom - 36 - dashR, dashR * 2, dashR * 2);
    this.joystick.hint = {
      x: safe.left + 50 + this.joystick.radius,
      y: height - safe.bottom - 70 - this.joystick.radius,
    };
    this.player.clampTo(width, height);
  }

  update(dt: number): void {
    this.shake.enabled = this.game.save.data.settings.screenShake;
    // 순서 중요: 버튼 → 조이스틱 → 게임 로직 (버튼을 누른 손가락은 조이스틱이 무시)
    this.ui.update(dt);
    this.joystick.update(dt);
    this.hud.update(dt);

    if (this.gameOverTime >= 0) {
      this.gameOverTime += dt;
      this.updateWorld(dt * 0.25, false); // 슬로모션
      if (this.gameOverTime > 1.5) this.finish();
      return;
    }
    if (this.hitStop > 0) {
      // 맞는 순간 아주 잠깐 멈춤 → 타격감
      this.hitStop -= dt;
      this.updateEffects(dt);
      return;
    }
    this.updateWorld(dt, true);
  }

  private updateWorld(dt: number, playing: boolean): void {
    const { width: w, height: h } = this.game.view;
    const input = this.game.input;
    const p = this.player;

    if (playing) {
      this.elapsed += dt;
      const move = input.getMoveVector(this.move);
      if (input.wasPressed('action') && p.tryDash(move)) {
        this.game.audio.play('dash');
        this.shake.add(0.15);
        this.particles.emit(p.x, p.y, { count: 14, color: COLORS.magenta, shape: 'spark', speed: [150, 380], life: [0.15, 0.35] });
      }
      p.update(dt, move, w, h);
      this.score += BALANCE.score.perSecond * dt;
      this.spawn(dt, w, h);
    }

    for (const e of this.enemies) e.update(dt, p.x, p.y, w, h);
    for (const g of this.gems) g.update(dt, p.x, p.y);
    if (playing && p.alive) this.checkCollisions();
    this.cleanup();
    this.updateEffects(dt);

    this.dashButton.progress = p.dashReady;
    this.hud.score = this.score;
    this.game.background.scrollSpeed = lerp(24, 110, this.difficulty);
  }

  private get difficulty(): number {
    return clamp(this.elapsed / BALANCE.spawn.rampSeconds, 0, 1);
  }

  private spawn(dt: number, w: number, h: number): void {
    const s = BALANCE.spawn;
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      if (this.enemies.length < s.maxEnemies) {
        const kind = Math.random() < 0.45 + 0.15 * this.difficulty ? 'drifter' : 'chaser';
        this.enemies.push(Enemy.spawn(kind, w, h, this.player.x, this.player.y, this.difficulty));
      }
      this.spawnTimer = lerp(s.startInterval, s.minInterval, this.difficulty) * rand(0.7, 1.2);
    }

    this.gemTimer -= dt;
    if (this.gemTimer <= 0) {
      this.gemTimer = BALANCE.gem.interval * rand(0.7, 1.3);
      if (this.gems.length < BALANCE.gem.maxOnScreen) this.spawnGem(w, h);
    }
  }

  private spawnGem(w: number, h: number): void {
    const safe = this.game.view.safe;
    const top = safe.top + 130; // 점수판 아래
    for (let i = 0; i < 12; i++) {
      const x = rand(safe.left + 60, w - safe.right - 60);
      const y = rand(top, h - safe.bottom - 60);
      if (dist2(x, y, this.player.x, this.player.y) > 180 * 180) {
        this.gems.push(new Gem(x, y));
        return;
      }
    }
  }

  private checkCollisions(): void {
    const p = this.player;
    for (const e of this.enemies) {
      if (e.dead || !circlesOverlap(p.x, p.y, p.radius * 0.85, e.x, e.y, e.radius)) continue;
      if (p.isDashing) {
        // 대시로 들이받기 → 적 파괴
        e.dead = true;
        this.score += BALANCE.score.dashKill;
        this.particles.burst(e.x, e.y, e.color, 0.9);
        this.floaters.add(e.x, e.y - 30, `+${BALANCE.score.dashKill}`, COLORS.magenta);
        this.game.audio.play('kill', rand(0.9, 1.15));
        this.shake.add(0.3);
        this.hud.bumpScore();
      } else if (p.hit()) {
        e.dead = true;
        this.particles.burst(e.x, e.y, e.color, 1);
        this.particles.burst(p.x, p.y, COLORS.cyan, 0.6);
        this.game.audio.play('hit');
        this.game.haptics.vibrate(70);
        this.shake.add(0.65);
        this.hitStop = 0.07;
        this.damageFlash = 1;
        this.hud.setHp(p.hp, p.maxHp);
        if (!p.alive) this.startGameOver();
        return;
      }
    }

    for (const g of this.gems) {
      if (g.collected || !circlesOverlap(p.x, p.y, p.radius + 10, g.x, g.y, g.radius)) continue;
      g.collected = true;
      this.coinsThisRun++;
      this.score += BALANCE.score.gem;
      // 재화는 먹는 즉시 저장 → 게임 도중 브라우저를 꺼도 유지
      this.game.save.update((d) => {
        d.coins += 1;
        d.stats.totalCoins += 1;
      });
      this.hud.setCoins(this.game.save.data.coins);
      this.hud.bumpScore();
      this.game.audio.play('coin', 1 + Math.min(0.5, this.coinsThisRun * 0.02));
      this.particles.emit(g.x, g.y, { count: 16, color: [COLORS.yellow, COLORS.white], shape: 'spark', speed: [120, 340], life: [0.2, 0.45] });
      this.particles.emit(g.x, g.y, { count: 1, color: COLORS.yellow, shape: 'ring', speed: 0, life: [0.35, 0.35], size: [8, 8], sizeEnd: 60 });
      this.floaters.add(g.x, g.y - 30, `+${BALANCE.score.gem}`, COLORS.yellow);
      this.shake.add(0.08);
    }
  }

  private cleanup(): void {
    for (const e of this.enemies) {
      if (e.dead && e.expired) this.particles.emit(e.x, e.y, { count: 8, color: e.color, speed: [40, 140], life: [0.2, 0.4] });
    }
    for (const g of this.gems) {
      if (g.expired && !g.collected) this.particles.emit(g.x, g.y, { count: 6, color: COLORS.yellow, speed: [30, 90], life: [0.2, 0.35] });
    }
    this.enemies = this.enemies.filter((e) => !e.dead);
    this.gems = this.gems.filter((g) => !g.collected && !g.expired);
  }

  private updateEffects(dt: number): void {
    this.particles.update(dt);
    this.shake.update(dt);
    this.floaters.update(dt);
    this.damageFlash = Math.max(0, this.damageFlash - dt * 3);
  }

  private startGameOver(): void {
    this.gameOverTime = 0;
    this.pauseButton.visible = false;
    this.dashButton.visible = false;
    this.particles.burst(this.player.x, this.player.y, COLORS.cyan, 2.2);
    this.particles.burst(this.player.x, this.player.y, COLORS.white, 1.2);
    this.shake.add(1);
    this.game.audio.play('explode');
    this.game.audio.play('gameover');
    this.game.haptics.vibrate([90, 60, 180]);
  }

  private finish(): void {
    if (this.finished) return;
    this.finished = true;
    const save = this.game.save;
    const score = Math.floor(this.score);
    const previousBest = save.data.highScore;
    save.update((d) => {
      d.highScore = Math.max(d.highScore, score);
      d.stats.gamesPlayed += 1;
      d.stats.bestTime = Math.max(d.stats.bestTime, this.elapsed);
    });
    save.flush();
    this.game.scenes.change(
      new ResultScene(this.game, {
        score,
        best: Math.max(previousBest, score),
        isNewRecord: score > previousBest,
        coinsEarned: this.coinsThisRun,
        totalCoins: save.data.coins,
        time: this.elapsed,
      }),
      0.8,
    );
  }

  private openPause(): void {
    if (this.pauseQueued || this.gameOverTime >= 0 || this.game.scenes.current !== this) return;
    this.pauseQueued = true;
    this.joystick.release();
    this.game.scenes.push(new PauseScene(this.game));
  }

  render(ctx: CanvasRenderingContext2D): void {
    const { width: w, height: h } = this.game.view;

    // ── 월드 (화면 흔들림 적용) ──
    ctx.save();
    this.shake.apply(ctx, w, h);
    this.game.background.render(ctx);
    for (const g of this.gems) g.render(ctx);
    for (const e of this.enemies) e.render(ctx);
    this.player.render(ctx);
    this.particles.render(ctx);
    this.floaters.render(ctx);
    ctx.restore();

    if (this.damageFlash > 0) {
      ctx.fillStyle = withAlpha(COLORS.red, 0.28 * this.damageFlash);
      ctx.fillRect(0, 0, w, h);
    }

    // ── UI (흔들리지 않음) ──
    this.joystick.render(ctx);
    this.hud.render(ctx);
    this.ui.render(ctx);
    this.renderTutorial(ctx, w, h);
  }

  private renderTutorial(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const t = this.elapsed;
    if (t > 5 || this.gameOverTime >= 0) return;
    const alpha = t < 4 ? 1 : 5 - t;
    const input = this.game.input;
    const touch = input.isTouchDevice;
    const pad = input.gamepadConnected;
    const line1 = pad ? '왼쪽 스틱 / 십자키로 이동' : touch ? '드래그해서 이동' : '방향키 / WASD (또는 마우스 드래그)로 이동';
    const line2 = pad
      ? 'A = 무적 대시 · 적을 부술 수 있어요'
      : touch
        ? 'DASH = 무적 돌진 · 적을 부술 수 있어요'
        : 'Space = 무적 대시 · 적을 부술 수 있어요';
    plainText(ctx, line1, w / 2, h * 0.3, 28, COLORS.text, { alpha, weight: 700 });
    plainText(ctx, line2, w / 2, h * 0.3 + 40, 22, COLORS.textDim, { alpha, weight: 600 });
  }
}
