import { CONFIG } from '../config';

/**
 * 에러를 화면 위에 빨간 박스로 보여 줍니다.
 * 폰에는 개발자 도구가 없으니, 이 박스를 스크린샷 찍거나 [복사]해서 AI에게 붙여 넣으면 됩니다.
 */
let box: HTMLDivElement | null = null;
let list: HTMLPreElement | null = null;
const counts = new Map<string, number>();

export function installErrorOverlay(): void {
  window.addEventListener('error', (e) => showError(e.error ?? e.message));
  window.addEventListener('unhandledrejection', (e) => showError(e.reason));
}

export function showError(error: unknown): void {
  console.error(error);
  if (!CONFIG.showErrorOverlay) return;

  const message =
    error instanceof Error
      ? `${error.name}: ${error.message}\n${(error.stack ?? '').split('\n').slice(1, 6).join('\n')}`
      : String(error);
  counts.set(message, (counts.get(message) ?? 0) + 1);

  if (!box || !list) createBox();
  list!.textContent = [...counts]
    .map(([text, count]) => (count > 1 ? `(${count}회) ${text}` : text))
    .join('\n\n');
}

function createBox(): void {
  box = document.createElement('div');
  box.setAttribute('data-allow-touch', ''); // 이 안에서는 스크롤·선택 허용
  box.style.cssText = [
    'position:fixed',
    'left:8px',
    'right:8px',
    'top:calc(8px + env(safe-area-inset-top))',
    'max-height:45%',
    'overflow:auto',
    'z-index:99999',
    'padding:12px',
    'border:2px solid #ff3355',
    'border-radius:12px',
    'background:rgba(30,0,10,0.94)',
    'color:#fff',
    'font:12px/1.45 ui-monospace,Menlo,Consolas,monospace',
    'touch-action:pan-y',
    'user-select:text',
    '-webkit-user-select:text',
  ].join(';');

  const header = document.createElement('div');
  header.style.cssText = 'display:flex;gap:8px;align-items:center;margin-bottom:8px;font-weight:700;';
  const title = document.createElement('span');
  title.textContent = '⚠ 에러 발생';
  title.style.flex = '1';
  header.append(title, makeButton('복사', copyAll), makeButton('닫기', () => box?.remove()));

  list = document.createElement('pre');
  list.style.cssText = 'margin:0;white-space:pre-wrap;word-break:break-word;';
  box.append(header, list);
  document.body.appendChild(box);

  // 닫았다가 새 에러가 나면 다시 표시
  const observer = new MutationObserver(() => {
    if (box && !box.isConnected) {
      box = null;
      list = null;
      counts.clear();
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true });
}

function makeButton(label: string, onClick: () => void): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  button.style.cssText =
    'padding:8px 14px;border:1px solid #fff6;border-radius:8px;background:#ff3355;color:#fff;font:700 13px system-ui,sans-serif;';
  button.addEventListener('click', onClick);
  return button;
}

function copyAll(): void {
  const text = list?.textContent ?? '';
  navigator.clipboard?.writeText(text).catch(() => undefined);
}
