/**
 * 모바일 브라우저의 '게임에 방해되는 기본 동작'을 막습니다.
 * CSS(style.css의 touch-action, overscroll-behavior 등)와 함께 이중으로 막아야 iOS·안드로이드 모두 안전합니다.
 *
 * - 핀치 줌 (iOS Safari는 user-scalable=no를 무시하므로 gesture 이벤트를 직접 막음)
 * - 더블탭 확대, 스크롤, 당겨서 새로고침, 고무줄 바운스
 * - 길게 누를 때 뜨는 메뉴·텍스트 선택·돋보기, 이미지 드래그
 * - PC 트랙패드 핀치(ctrl + 휠) 확대
 *
 * data-allow-touch 속성이 있는 요소(예: 에러 창) 안에서는 막지 않습니다.
 */
export function installMobileGuards(): void {
  const active: AddEventListenerOptions = { passive: false };
  const allowed = (target: EventTarget | null): boolean =>
    target instanceof Element && target.closest('[data-allow-touch]') !== null;

  // iOS Safari 핀치 줌
  for (const type of ['gesturestart', 'gesturechange', 'gestureend']) {
    document.addEventListener(type, (e) => e.preventDefault(), active);
  }

  // 스크롤·바운스·당겨서 새로고침
  document.addEventListener(
    'touchmove',
    (e) => {
      if (!allowed(e.target)) e.preventDefault();
    },
    active,
  );

  // 두 손가락 이상 터치 시작 시 확대 방지 (구형 안드로이드 브라우저)
  document.addEventListener(
    'touchstart',
    (e) => {
      if (e.touches.length > 1 && !allowed(e.target)) e.preventDefault();
    },
    active,
  );

  // 더블탭 확대 (touch-action을 무시하는 구형 iOS 대비)
  let lastTouchEnd = 0;
  document.addEventListener(
    'touchend',
    (e) => {
      const now = performance.now();
      if (now - lastTouchEnd < 350 && !allowed(e.target)) e.preventDefault();
      lastTouchEnd = now;
    },
    active,
  );
  document.addEventListener('dblclick', (e) => e.preventDefault(), active);

  // 길게 누르기 메뉴 / 우클릭 메뉴 / 텍스트 선택 / 드래그
  document.addEventListener('contextmenu', (e) => {
    if (!allowed(e.target)) e.preventDefault();
  });
  document.addEventListener('selectstart', (e) => {
    if (!allowed(e.target)) e.preventDefault();
  });
  document.addEventListener('dragstart', (e) => e.preventDefault());

  // PC: ctrl + 휠 / 트랙패드 핀치 확대
  window.addEventListener(
    'wheel',
    (e) => {
      if (e.ctrlKey) e.preventDefault();
    },
    active,
  );
}
