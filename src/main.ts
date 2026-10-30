import './style.css';
import { Game } from './core/Game';
import { installErrorOverlay, showError } from './core/errorOverlay';
import { installMobileGuards } from './core/mobileGuard';
import { initPWA } from './core/pwa';
import { TitleScene } from './scenes/TitleScene';

installErrorOverlay();
installMobileGuards();
initPWA();

try {
  const canvas = document.getElementById('game');
  if (!(canvas instanceof HTMLCanvasElement)) throw new Error('index.html에 <canvas id="game">이 없습니다.');
  const game = new Game(canvas);
  game.start(new TitleScene(game));

  // 개발 중 브라우저 콘솔에서 window.game 으로 상태 확인 가능
  if (import.meta.env.DEV) (window as unknown as { game: Game }).game = game;
} catch (err) {
  showError(err);
}
