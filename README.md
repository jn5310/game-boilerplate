# 📱 Mobile-First Game Boilerplate (NEON DODGE)

TypeScript + Vite + HTML5 Canvas로 만든 **모바일 퍼스트 2D 게임 시작 템플릿**입니다.
복사해서 바로 새 게임을 만들 수 있고, 이미지·오디오 파일이 하나도 없어도 동작합니다.

> **새 게임을 바로 만들려면 [HANDOFF.md](./HANDOFF.md)** (인수인계 문서: 현재 상태, 기능 점검표, 단계별 순서, 복사용 프롬프트, 엔진 치트시트)
>
> 자세한 사용법·배포법·FAQ는 **[MOBILE_VIBE_GUIDE.md](./MOBILE_VIBE_GUIDE.md)**, AI 작업 규칙은 **[AGENTS.md](./AGENTS.md)** (Kiro가 자동으로 읽음)에 있습니다.

## 들어 있는 것

| 기능 | 파일 |
| --- | --- |
| 반응형 캔버스 (세로/가로, 노치 영역, 고해상도), 화면 방향 고정 옵션 | `src/core/Viewport.ts`, `src/config.ts` |
| 핀치 줌·스크롤·길게 누르기 방지, 안드로이드 뒤로가기 = 일시정지 | `src/core/mobileGuard.ts`, `src/style.css`, `src/core/Game.ts` |
| 통합 입력 (터치·마우스·키보드·게임패드·가상 조이스틱·스와이프) | `src/core/InputManager.ts`, `src/ui/VirtualJoystick.ts` |
| 씬 매니저 (타이틀 → 게임 → 일시정지 → 결과) + 설정 팝업 | `src/core/SceneManager.ts`, `src/scenes/` |
| 안전한 자동 저장 (최고 점수·설정·재화) | `src/core/SaveManager.ts`, `src/game/SaveData.ts` |
| 코드로 만든 효과음 (Web Audio), 진동, 화면 꺼짐 방지 | `src/core/AudioManager.ts`, `Haptics.ts`, `WakeLock.ts` |
| 화면 흔들림·파티클·떠오르는 글자 | `src/fx/` |
| 네온 버튼·체력바·점수판 | `src/ui/`, `src/gfx/` |
| (선택) 실패해도 안전한 이미지 로더 | `src/core/Assets.ts` |
| PWA (홈 화면 설치, 오프라인 실행) | `public/manifest.json`, `scripts/build-sw.mjs`, `src/core/pwa.ts` |
| 빌드 번호 표시, 화면 에러 박스, `?debug` | `src/core/build.ts`, `src/core/errorOverlay.ts` |
| 자동 배포 + PR 빌드 검사 | `.github/workflows/deploy.yml`, `ci.yml` |
| 샘플 미니게임 | `src/scenes/GameScene.ts`, `src/game/` |

## 실행

```bash
npm install
npm run dev       # 개발 서버 (같은 Wi-Fi의 폰에서도 접속 가능)
npm run build     # 타입 검사 + 배포용 빌드 → dist/
npm run preview   # 빌드 결과 미리보기
npm run icons     # 앱 아이콘 PNG 다시 만들기
```

Node.js 22.12 이상이 필요합니다. `main`에 push하면 `.github/workflows/deploy.yml`이 GitHub Pages로 자동 배포합니다.

## 조작

| | 폰 | PC | 게임패드 |
| --- | --- | --- | --- |
| 이동 | 화면 드래그 (가상 조이스틱) | 방향키 / WASD / 마우스 드래그 | 왼쪽 스틱 / 십자키 |
| 대시 | DASH 버튼 | Space / Shift | A / X |
| 일시정지 | ⏸ 버튼, 뒤로가기 (앱을 내리면 자동) | Esc / P | Start |
| 메뉴 | 탭 | 클릭, 또는 방향키 + Enter | 십자키 + A |

주소 끝에 `?debug`를 붙이면 FPS·화면 크기·입력 상태가 표시됩니다. 타이틀 화면 오른쪽 아래 숫자는 빌드 번호입니다 (배포할 때마다 바뀜).
