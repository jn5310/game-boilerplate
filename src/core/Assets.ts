/**
 * (선택) 이미지 파일 불러오기 — 이 보일러플레이트는 기본적으로 파일이 하나도 없지만,
 * 나중에 그림을 쓰고 싶을 때를 위한 안전한 로더입니다. **실패해도 에러 없이 null**을 돌려주므로
 * "이미지가 있으면 그리고, 없으면 네온 도형" 패턴으로 쓰면 절대 깨지지 않습니다.
 *
 * 파일은 public/ 아래에 두고 상대 경로로 적습니다:  public/images/player.png → 'images/player.png'
 * (빌드하면 서비스 워커가 자동으로 오프라인 저장까지 해 줍니다)
 *
 *   // 예: 타이틀 씬 onEnter 등에서 (기다리지 않아도 됨)
 *   void game.assets.loadImages({ player: 'images/player.png' });
 *
 *   // 그릴 때
 *   const img = game.assets.image('player');
 *   if (img) ctx.drawImage(img, x - 32, y - 32, 64, 64);
 *   else neonCircle(ctx, x, y, 32, COLORS.cyan);
 */
export class Assets {
  private readonly images = new Map<string, HTMLImageElement>();
  private readonly failed = new Set<string>();

  /**
   * 이미지 여러 개 불러오기. 모두 끝나면(성공이든 실패든) resolve.
   * @param onProgress 로딩 화면을 만들 때 (불러온 개수, 전체 개수)
   */
  async loadImages(list: Record<string, string>, onProgress?: (loaded: number, total: number) => void): Promise<void> {
    const entries = Object.entries(list);
    let loaded = 0;
    await Promise.all(
      entries.map(async ([name, url]) => {
        const img = await loadImage(url);
        if (img) {
          this.images.set(name, img);
          this.failed.delete(name);
        } else {
          this.failed.add(name);
          console.warn(`[Assets] 이미지를 불러오지 못해 도형으로 대신 그립니다: ${url}`);
        }
        loaded++;
        onProgress?.(loaded, entries.length);
      }),
    );
  }

  /** 불러온 이미지. 아직 안 불러왔거나 실패했으면 null */
  image(name: string): HTMLImageElement | null {
    return this.images.get(name) ?? null;
  }

  /** 불러오기에 실패한 이름 목록 (디버그용) */
  get failedNames(): string[] {
    return [...this.failed];
  }
}

function loadImage(url: string, timeoutMs = 10_000): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    const timer = window.setTimeout(() => resolve(null), timeoutMs);
    img.onload = () => {
      window.clearTimeout(timer);
      resolve(img);
    };
    img.onerror = () => {
      window.clearTimeout(timer);
      resolve(null);
    };
    img.decoding = 'async';
    img.src = url;
  });
}
