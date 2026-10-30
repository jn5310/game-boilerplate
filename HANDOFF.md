# 인수인계 문서 (HANDOFF)

다음에 새 게임을 **바로 찍어내기 위해 필요한 것을 전부** 모아 둔 문서입니다.
사람도 AI도 이 문서 하나만 읽으면 이어서 작업할 수 있게 썼습니다.

- AI 작업 규칙 요약: [AGENTS.md](./AGENTS.md) (Kiro가 세션마다 자동으로 읽음)
- 자세한 사용법·배포법·FAQ: [MOBILE_VIBE_GUIDE.md](./MOBILE_VIBE_GUIDE.md)
- 마지막 업데이트: 2026-10-30 (v2: 설정·뒤로가기·게임패드·화면 방향 고정 등 보완)

---

## 0. 30초 요약

- 이 저장소는 **모바일 퍼스트 2D 게임 틀**입니다. 입력(터치·마우스·키보드·게임패드), 저장, 화면 전환, 설정, 효과음, 이펙트, 앱 설치, 자동 배포가 이미 들어 있습니다.
- 게임마다 바꾸는 곳은 주로 `src/scenes/GameScene.ts`와 `src/game/` 폴더입니다.
- 새 게임을 만드는 순서는 이렇습니다.
  1. 템플릿으로 새 저장소를 만듭니다.
  2. Pages를 켭니다.
  3. [3장의 시작 프롬프트](#3-시작-프롬프트-복사해서-빈칸만-채우기)를 AI에게 보냅니다.
  4. 폰에서 확인합니다.
- Kiro는 저장소의 `AGENTS.md`를 자동으로 읽어서 규칙을 따릅니다. 그래서 시작 프롬프트에는 **만들 게임 내용만** 채우면 됩니다.
- `main`에 반영되면 1~2분 뒤 `https://jn5310.github.io/저장소이름/`에 자동 배포됩니다. 새 버전인지는 **타이틀 화면 오른쪽 아래 빌드 번호**로 확인합니다.

---

## 1. 현재 상태

| 항목 | 내용 |
| --- | --- |
| 저장소 | https://github.com/jn5310/game-boilerplate (Public, 기본 브랜치 `main`) |
| 배포 주소 | https://jn5310.github.io/game-boilerplate/ |
| 배포 방식 | `main` push → GitHub Actions(`deploy.yml`) → GitHub Pages (1~2분) |
| PR 검사 | PR을 올리면 `Build check`(`ci.yml`)가 타입 검사 + 빌드를 확인 (배포는 안 함) |
| AI 규칙 | `AGENTS.md` — Kiro Web/IDE가 세션마다 자동으로 읽고, 이 문서를 함께 불러옴 |
| 템플릿 설정 | **아직 안 됨** → [2-0](#2-0-처음-한-번만-템플릿-지정)에서 한 번 체크 필요 |
| 기술 스택 | TypeScript 7 (strict), Vite 8 (CI에서 8.3.5로 빌드 확인), HTML5 Canvas 2D |
| 의존성 | 런타임 라이브러리 0개, 이미지·오디오 파일 0개 (devDependencies: `typescript`, `vite`) |
| Node | 22.12 이상 (CI는 최신 LTS) |
| 샘플 게임 | NEON DODGE (도형 피하기 + 보석 모으기 + 대시로 적 부수기) |

### 1-1. 기능 점검표

처음 요구사항과 보완한 기능을 한눈에 볼 수 있게 정리했습니다. 검증 칸의 "자동"은 작업 환경의 브라우저 테스트로 확인했다는 뜻입니다 ([1-2](#1-2-검증-기록) 참고).

| 요구사항 | 구현 | 위치 | 검증 |
| --- | --- | --- | --- |
| 화면 비율 자동 맞춤 (세로/가로) | 짧은 변 720 논리 단위, 회전·주소창 변화 즉시 재배치, 노치 영역(safe) | `core/Viewport.ts` | 자동 |
| 화면 밀림·핀치 줌 방지 | CSS `touch-action`/`overscroll-behavior` + JS 제스처 차단 | `style.css`, `core/mobileGuard.ts` | 자동 (핀치 후 배율 1.0) |
| 세로/가로 고정 (선택) | `CONFIG.orientation` + "화면을 돌려 주세요" 안내 + 자동 일시정지 | `config.ts`, `core/Game.ts` | 자동 |
| 안드로이드 뒤로가기 | 앱 종료 대신 씬의 `onBack` (게임 → 일시정지, 팝업 → 닫기) | `core/Game.ts`, 각 씬 | 자동 |
| 통합 입력 | 터치·마우스·펜·키보드·게임패드를 행동(Action) 하나로 | `core/InputManager.ts` | 자동 (게임패드는 가짜 장치로) |
| 가상 조이스틱 | 누른 자리에 생기는 플로팅 조이스틱, 마우스 드래그도 동일 | `ui/VirtualJoystick.ts` | 자동 (멀티터치 포함) |
| 스와이프·원버튼 입력 | `getDirectionPressed()`, `wasPressedOrTouched()` | `core/InputManager.ts` | 자동 |
| 에셋 0개 | 네온 도형 + 코드 효과음, 아이콘도 스크립트로 생성 | `gfx/`, `core/AudioManager.ts` | 자동 |
| 이미지 쓰기 (선택) | 실패해도 null을 돌려주는 안전 로더 | `core/Assets.ts` | 자동 (없는 파일 → null) |
| PWA 설치 | manifest(전체 화면), 설치 버튼, 아이폰 안내 | `public/manifest.json`, `core/pwa.ts` | 자동 (실기기 설치는 미확인) |
| 오프라인 실행 | 빌드 후 파일 목록으로 서비스 워커 생성, HTML은 매번 새 버전 확인 | `scripts/build-sw.mjs`, `scripts/sw-template.js` | 자동 |
| 씬 매니저 | 타이틀 → 게임 → 일시정지 팝업 → 결과, 페이드·연타 방지 | `core/SceneManager.ts`, `scenes/` | 자동 |
| 설정 화면 | 사운드·볼륨·진동·화면 흔들림·데이터 초기화(2단계 확인) | `scenes/SettingsScene.ts` | 자동 |
| 로컬 세이브 | 타입 정의, 자동 저장, 손상·조작 데이터 복구, 저장 불가 환경 대응 | `core/SaveManager.ts`, `game/SaveData.ts` | 자동 |
| 화면 흔들림·파티클 | trauma 방식 흔들림(끄기 가능), 풀 방식 파티클, 터치 파티클 | `fx/` | 자동 |
| 진동 | 설정과 연결된 `game.haptics` (아이폰은 미지원이라 자동으로 숨김) | `core/Haptics.ts` | 자동 (가짜 API로) |
| 화면 꺼짐 방지 | 게임 중에만 Wake Lock | `core/WakeLock.ts` | 자동 (가짜 API로) |
| UI | 큼직한 버튼(터치 여유 영역), 키보드·게임패드 포커스, 체력바·점수판 | `ui/` | 자동 |
| 샘플 미니게임 | NEON DODGE | `scenes/GameScene.ts`, `game/` | 자동 |
| 폰 디버깅 | 화면 에러 박스(복사 버튼), `?debug` 정보, 빌드 번호 표시 | `core/errorOverlay.ts`, `core/build.ts` | 자동 |
| 배포 | GitHub Pages 자동 배포 + PR 빌드 검사 | `.github/workflows/` | 실제 CI로 확인 |
| 문서 | 가이드, 인수인계, AI 규칙 | `MOBILE_VIBE_GUIDE.md`, `HANDOFF.md`, `AGENTS.md` | — |

### 1-2. 검증 기록

**v1 (2026-10-30, 첫 배포)**

- CI 실제 빌드: `tsc --noEmit` 통과 → `vite build` 성공(JS 59.47 kB, gzip 20.59 kB) → 서비스 워커 생성 → GitHub Pages 배포 성공
- 배포된 파일을 그대로 받아 `/game-boilerplate/` 경로에서 모바일 환경으로 실행: 404·콘솔 에러 없음, 서비스 워커·manifest 정상
- 터치(조이스틱·멀티터치·DASH), 회전, 핀치 차단, PC 키보드·마우스, 일시정지 자동 진입, 저장·복구·오프라인

**v2 (2026-10-30, 보완 후)** — 아래 항목 모두 통과, 콘솔 에러 0

- **설정**
  - 볼륨 −/+ 결과가 저장됨 (0.8 → 0.6)
  - 흔들림·진동 켜기/끄기가 저장되고, 진동을 켤 때 실제로 진동 호출
  - 데이터 초기화는 2단계 확인 후 기본값으로 돌아감
  - 일시정지에서 연 설정에는 초기화 버튼이 숨겨짐
- **뒤로가기**

  | 어디서 | 결과 |
  | --- | --- |
  | 설정 | 닫기 |
  | 게임 | 일시정지 |
  | 일시정지 위의 설정 | 설정 → 일시정지 → 게임 순서로 닫힘 |
  | 결과 | 타이틀 |
  | 타이틀 | 페이지를 떠남 (가두지 않음) |

  - 반복해도 브라우저 기록이 쌓이지 않음
- **기기 기능**
  - 화면 꺼짐 방지: 게임 시작 때 켜짐, 일시정지 때 꺼짐, 재개 때 다시 켜짐
  - 진동: 피격 70ms, 게임 오버 [90, 60, 180]
  - 흔들림을 끄면 피격해도 흔들림 0
- **입력**
  - 스와이프(오른쪽·위) 감지, 방향 입력(스와이프 + 방향키) 감지
  - 빈 곳을 터치하면 감지하고, 버튼을 누른 터치는 제외
- **이미지 로더:** 있는 파일은 192px로 불러오고, 없는 파일은 null (에러 없음)
- **게임패드 (가짜 장치)**
  - 연결 감지와 안내 문구 변경
  - 십자키로 메뉴 포커스 이동, A로 시작
  - 스틱으로 이동 (+162), X로 대시, Start로 일시정지·재개
- **PC:** 키보드로 설정 열기(가로 화면은 2열 배치), Esc로 닫기, 서비스 워커·오프라인 실행
- **세로 고정 모드:** 가로로 돌리면 안내가 뜨고 게임이 멈춤(시간 정지). 다시 세로로 돌리면 일시정지 팝업이 떠 있음
- **PR CI(`Build check`):** 실제 Vite 빌드 결과는 이 변경의 PR에서 확인

**아직 확인 못 한 것**

- 실제 아이폰·안드로이드 기기에서의 플레이, 홈 화면 설치, 진동, 화면 꺼짐 방지 (작업 환경에서는 가짜 API로 확인)
- 실제 게임패드 하드웨어 (표준 배치 기준으로 가짜 장치로 확인)
- 아이폰 무음 스위치가 켜졌을 때 소리 (iOS 정책상 안 나는 게 정상)
- 라이브 주소 직접 접속 (작업 환경의 프록시가 github.io를 막아서, 배포 산출물로 대신 검증)

---

## 2. 새 게임 찍어내기 (단계별)

### 2-0. 처음 한 번만: 템플릿 지정

`game-boilerplate` 저장소 → `Settings` → `General` → **Template repository** 체크.
(작업 환경에서 API로 시도했지만 권한 문제로 막혀서 직접 해야 합니다.)

### 2-1. 새 저장소 만들기

1. https://github.com/jn5310/game-boilerplate → **`Use this template`** → `Create a new repository`
2. 이름은 영문 소문자와 하이픈으로 정합니다 (예: `star-catcher`). 이 이름이 주소가 됩니다: `https://jn5310.github.io/star-catcher/`
3. **Public** 선택 → `Create repository`

> ⚠ 만들자마자 Actions가 한 번 돌고 **실패(빨간 X)** 할 수 있습니다. Pages가 아직 꺼져 있어서 생기는 정상적인 실패입니다. 2-2를 하면 해결됩니다.

### 2-2. Pages 켜기

1. 새 저장소 → `Settings` → `Pages` → `Build and deployment` → `Source`: **GitHub Actions**
2. `Actions` 탭 → 실패한 실행 → `Re-run all jobs`
   (AI가 다음에 push하면 어차피 다시 배포되니 생략해도 됩니다.)

폰에서 할 때는 GitHub 앱이 아니라 **브라우저**로 github.com에 들어가세요. `Settings` 탭이 안 보이면 브라우저 메뉴에서 "데스크톱 사이트"를 켭니다.

### 2-3. AI에게 시작 프롬프트 보내기

Kiro(또는 다른 AI 코딩 도구)에서 **새 저장소를 연결한 새 세션**을 열고, [3장의 시작 프롬프트](#3-시작-프롬프트-복사해서-빈칸만-채우기)를 빈칸만 채워서 보냅니다.
Kiro는 `AGENTS.md`를 자동으로 읽습니다. `AGENTS.md`를 읽지 않는 도구도 시작 프롬프트 첫 줄이 이 문서를 읽게 합니다.

### 2-4. 폰에서 확인하고 반복

1. `https://jn5310.github.io/저장소이름/`를 폰에서 엽니다.
   - 타이틀 오른쪽 아래 빌드 번호가 Actions 실행 번호와 같으면 새 버전입니다.
   - 번호가 다르면 1~2분 뒤 새로고침합니다.
2. 해 보고 고칠 점을 말합니다 ([4장 프롬프트](#4-이어서-쓰는-프롬프트)).
3. AI가 반영하면 다시 1번으로.
4. 마음에 들면 홈 화면에 추가합니다 (안드로이드: 크롬 `⋮` → `홈 화면에 추가`, 아이폰: Safari 공유 → `홈 화면에 추가`).

---

## 3. 시작 프롬프트 (복사해서 빈칸만 채우기)

```
먼저 AGENTS.md, HANDOFF.md, MOBILE_VIBE_GUIDE.md를 읽고, 거기 적힌 규칙과 구조대로 이 저장소에서 새 게임을 만들어줘.

[새 게임]
- 이름(영문, 화면 표시용):
- 한 줄 설명:
- 조작: 폰 =            / PC =
- 화면 방향: 세로 고정 / 가로 고정 / 둘 다
- 점수 규칙:
- 재화(코인) 얻는 방법:
- 게임 오버 조건:
- 난이도 변화:
- 색·분위기:

[할 일]
1. 이름 바꾸기: src/config.ts의 title·subtitle·saveKey(다른 게임과 겹치지 않게),
   public/manifest.json의 name·short_name, index.html의 <title>·apple-mobile-web-app-title, README.md 제목
2. 화면 방향을 고정하면 CONFIG.orientation과 manifest.json의 orientation을 같은 값으로
3. 샘플 게임(NEON DODGE)의 src/scenes/GameScene.ts와 src/game/의 Player·Enemy·Gem·balance는 새 게임으로 교체.
   타이틀·일시정지·설정·결과 화면과 src/core, src/ui, src/fx, src/gfx는 재사용 (필요하면 문구·배치만 수정)
4. 속도·난이도·점수 숫자는 src/game/balance.ts 한 곳에 모으기
5. 저장할 값은 src/game/SaveData.ts의 인터페이스와 DEFAULT_SAVE에 추가하고 save.update()로 변경
6. 앱 아이콘 색을 게임 분위기에 맞추고 npm run icons로 다시 생성 (scripts/generate-icons.mjs의 COLORS)
7. MOBILE_VIBE_GUIDE.md·HANDOFF.md·README.md에서 NEON DODGE 설명 부분을 새 게임 내용으로 갱신

[완료 조건]
- npm run build가 에러 없이 통과
- 폰(터치)·PC(키보드·마우스)·게임패드에서 시작 → 플레이 → 일시정지(뒤로가기 포함) → 게임 오버 → 다시 하기가 동작
- main에 반영되어 GitHub Actions 배포가 성공 (PR로 올렸다면 Build check 통과 후 링크를 줘, 내가 머지할게)
- 끝나면 배포 주소, 조작법, 바뀐 파일 목록을 알려줘
```

---

## 4. 이어서 쓰는 프롬프트

**밸런스**
```
너무 어려워. 처음 30초는 적을 절반만 나오게 하고 속도는 20% 느리게 해줘. balance.ts 숫자만 바꿔줘.
```

**기능 추가** (더 많은 예시는 MOBILE_VIBE_GUIDE.md 5-4)
```
결과 화면에 상점을 추가해줘. 코인으로 플레이어 색 3종을 살 수 있고, 산 것과 고른 것은 SaveData에 저장해줘.
```
```
Web Audio 코드로 만든 반복 배경음을 넣고, 설정 화면에 'BGM 켜기/끄기'를 추가해서 저장해줘.
```
```
60초마다 보스가 나오게 해줘. 체력바가 위에 표시되고, 대시로만 데미지를 줄 수 있어.
```
```
public/images/player.png를 플레이어 그림으로 써줘. game.assets로 불러오고, 못 불러오면 지금 도형으로 그려줘.
```

**버그** (폰 화면의 빨간 에러 박스 → `복사` → 붙여 넣기)
```
폰에서 [무엇을 하면] [이런 일이 생겨]. 원래는 [이렇게 돼야 해].
기기: [예: 갤럭시 크롬 / 아이폰 사파리 홈 화면 앱]  빌드 번호: [타이틀 오른쪽 아래 숫자]
에러: (복사한 내용)
```

**배포 실패**
```
GitHub Actions(또는 PR의 Build check)가 실패했어. 실패한 실행의 로그를 확인해서 원인을 고치고 다시 배포해줘.
```

**성능**
```
폰에서 버벅여. 주소 끝에 ?debug를 붙이면 FPS가 [숫자]로 나와. 그래픽은 유지하면서 성능을 개선해줘.
```

**되돌리기**
```
방금 바꾼 게 마음에 안 들어. 마지막으로 잘 되던 커밋으로 되돌려서 배포해줘.
```

---

## 5. 엔진 치트시트 (AI·사람 공용)

모든 씬에서 `this.game.xxx`로 접근합니다. 좌표와 크기는 **논리 단위**입니다 (화면 짧은 변 = 720).

### 설정 값 (`src/config.ts`)

```ts
CONFIG.title; CONFIG.subtitle;
CONFIG.saveKey;            // ⚠ 게임마다 다르게
CONFIG.designShortSide;    // 720
CONFIG.maxPixelRatio;      // 2 (저사양 폰이 버벅이면 1.5)
CONFIG.maxDeltaTime;       // 1/20초
CONFIG.touchEffects;       // 터치 파티클
CONFIG.showErrorOverlay;   // 화면 에러 박스
CONFIG.orientation;        // 'any' | 'portrait' | 'landscape' (manifest.json도 같이)
CONFIG.backButtonPause;    // 뒤로가기 → 씬의 onBack
CONFIG.keepScreenOn;       // 게임 중 화면 꺼짐 방지 허용
COLORS.cyan; font(32, 800);
```

### 씬 만들기 / 전환

```ts
import { Scene } from '../core/Scene';

export class MyScene extends Scene {
  // override readonly isOverlay = true;      // 팝업 씬이면 (아래 씬이 멈춘 채 보임)
  override onResize(w: number, h: number) {}  // 버튼 배치 (회전·주소창 변화 때마다 호출). this.game.view.safe 피하기
  override onEnter() {}                       // 들어올 때 (onResize 직후)
  override onExit() {}                        // 완전히 나갈 때
  override onPause() {}                       // 위에 팝업이 덮였을 때 (update 멈춤)
  override onResume() {}                      // 팝업이 닫혔을 때
  override onAppHidden() {}                   // 앱을 내리거나 창 포커스를 잃었을 때 → 게임 씬은 일시정지 push
  override onBack(): boolean { return false; } // 뒤로가기. 처리했으면 true, false면 페이지를 떠남
  update(dt: number) {}                       // dt = 초 (최대 1/20)
  render(ctx: CanvasRenderingContext2D) {}
}

this.game.scenes.change(new ResultScene(this.game, data)); // 전체 교체 (페이드 0.4초, 두 번째 인자로 조절)
this.game.scenes.push(new PauseScene(this.game));          // 팝업 올리기
this.game.scenes.push(new SettingsScene(this.game, { allowReset: false })); // 설정 팝업 (게임 중엔 초기화 숨김)
this.game.scenes.pop();                                    // 팝업 닫기
this.game.scenes.current; this.game.scenes.isTransitioning;
```

### 입력 — `this.game.input`

```ts
// Action = 'up' | 'down' | 'left' | 'right' | 'confirm' | 'pause' | 'action'
// 키보드: KEY_BINDINGS (confirm = Enter·Space, pause = Esc·P, action = Space·Shift·J·Z)
// 게임패드: GAMEPAD_BINDINGS (A = confirm·action, X = action, Start = pause, 십자키 = 방향, 왼쪽 스틱 = 이동)
input.getMoveVector();          // 방향키·WASD + 가상 조이스틱 + 게임패드 스틱 합친 값 {x, y}, 길이 0~1
input.isDown('action');         // 누르고 있는지 (키보드 / holdAction 버튼 / 게임패드)
input.wasPressed('action');     // 이번 프레임에 막 눌렀는지
input.wasPressedOrTouched();    // 원버튼 게임: 화면 아무 곳 터치(버튼 위 제외) 또는 행동 키 — UI update 다음에 호출
input.getDirectionPressed();    // 'up'|'down'|'left'|'right'|null — 스와이프 또는 방향키·십자키 (2048·러너 등)
input.getNewPointer(owner?);    // 이번 프레임에 새로 닿은 주인 없는 손가락 (owner를 주면 가져감)
input.swipes;                   // 이번 프레임의 스와이프 [{dir, dx, dy, pointer}] (60단위 이상, 0.6초 안)
input.taps;                     // 이번 프레임의 짧은 탭 [{x, y, pointer}]
input.pointers;                 // Map<id, GamePointer>: x, y, startX, startY, startTime, isDown, justDown, justUp, cancelled, owner, kind
input.claim(pointer, owner);    // 손가락 가져가기 → 다른 UI·조이스틱이 무시
input.isKeyDown('KeyR'); input.wasKeyPressed('KeyR');  // KeyboardEvent.code로 직접
input.isTouchDevice; input.gamepadConnected; input.lastDevice; input.mouse;
```

### 저장·설정 — `this.game.save`, `this.game` (구조: `src/game/SaveData.ts`)

```ts
save.data.highScore; save.data.coins;
save.data.settings.soundEnabled; save.data.settings.volume; save.data.settings.vibration; save.data.settings.screenShake;
save.data.stats.gamesPlayed; save.data.stats.totalCoins; save.data.stats.bestTime;
save.update((d) => { d.coins += 1; });  // 0.4초 뒤 자동 저장, 앱을 내리면 즉시 저장
save.flush(); save.isPersistent;        // isPersistent=false면 LocalStorage 사용 불가(메모리만)

this.game.updateSettings((s) => { s.volume = 0.5; });  // 설정 바꾸기 = 저장 + 오디오·진동에 즉시 반영
this.game.resetSaveData();                             // 모든 데이터 초기화 (설정 화면의 '데이터 초기화')
this.game.toggleSound(); this.game.setSoundEnabled(true);
```

### 소리·진동·기기 — `this.game.audio`, `haptics`, `wakeLock`, `assets`

```ts
audio.play('coin', 1.1);  // 'click' | 'start' | 'coin' | 'hit' | 'explode' | 'kill' | 'dash' | 'gameover' | 'record' | 'pause', 두 번째 = 음높이 배율
audio.tone({ type: 'square', freq: 440, freqEnd: 880, duration: 0.1, volume: 0.2, delay: 0, filter: 2000 });
audio.noise({ duration: 0.3, freq: 2000, freqEnd: 200, volume: 0.4, filterType: 'lowpass', delay: 0 });
// 새 효과음: src/core/AudioManager.ts의 SfxName 타입과 SFX 표에 추가

haptics.vibrate(30); haptics.vibrate([80, 50, 160]);  // 설정이 꺼져 있거나 미지원(아이폰)이면 무시
haptics.supported;

wakeLock.set(true);   // 게임 씬 onEnter·onResume / set(false): onPause·onExit
wakeLock.active;

await assets.loadImages({ player: 'images/player.png' });  // public/images/player.png
const img = assets.image('player');  // 없으면 null → 도형으로 대신 그리기
```

### 화면 — `this.game.view`

```ts
view.width; view.height;  // 논리 크기 (세로 폰 ≈ 720×1560, 가로 폰 ≈ 1560×720, PC 1280×720 등)
view.safe;                // { top, right, bottom, left } 노치·홈바 영역 (논리 단위)
view.isPortrait; view.scale; view.dpr;
this.game.time;           // 시작 후 흐른 시간(초)
this.game.background;     // 공용 네온 배경: render(ctx), scrollSpeed, gridColor
BUILD_LABEL;              // src/core/build.ts — "#12 · 1a2b3c4" (개발 서버는 'dev')
```

### 효과 (씬마다 만들고 `update(dt)` / `render(ctx)` 호출)

```ts
const particles = new ParticleSystem(600);
particles.emit(x, y, { count: 12, color: [COLORS.cyan, COLORS.white], speed: [80, 320], angle, spread,
                       life: [0.35, 0.8], size: [3, 7], sizeEnd: 0, gravity: 0, drag: 2.5, shape: 'dot' | 'spark' | 'ring' });
particles.burst(x, y, COLORS.magenta, 1);  // 폭발
particles.ripple(x, y, COLORS.cyan);       // 터치 피드백

const shake = new ScreenShake();
shake.enabled = this.game.save.data.settings.screenShake;  // 설정 존중 (update 맨 앞에서)
shake.add(0.5);  // 0~1. render에서: ctx.save(); shake.apply(ctx, w, h); 월드 그리기; ctx.restore(); 그 다음 UI

const floaters = new FloatingTextLayer();
floaters.add(x, y, '+50', COLORS.yellow, 30);
```

### UI

```ts
const ui = new UILayer(this.game, { keyboardNav: true });  // 게임 화면처럼 방향키로 캐릭터를 움직이면 false
const btn = ui.add(new Button(this.game, {
  label: '시작', sublabel: 'Space', icon: 'play', color: COLORS.cyan, shape: 'rect' | 'circle',
  onClick: () => {}, hotkey: 'pause',       // 키를 누르면 버튼 클릭과 같음
  holdAction: 'action', fireOnPress: true,  // 게임 조작 버튼: 누르는 즉시 발동 + 키보드와 같은 행동으로 취급
  sound: 'click',                           // null이면 무음
}));
btn.setRect(x, y, w, h); btn.setCenter(cx, cy, w, h);  // onResize에서
btn.visible; btn.enabled; btn.progress;                // progress 0~1 = 쿨다운 표시

const joystick = new VirtualJoystick(this.game);  // 화면 아무 곳이나 누르면 생기는 플로팅 조이스틱
joystick.zone = { x, y, w, h };  // 시작 가능한 영역 (기본 = 화면 전체)
joystick.hint = { x, y };        // 터치 기기에서 처음에 보여 줄 '여기를 드래그' 위치
joystick.value; joystick.active; joystick.release();

const hud = new Hud();           // 상단 체력바·점수·코인
hud.layout(w, h, view.safe, 오른쪽_버튼_폭); hud.setHp(hp, maxHp); hud.setCoins(n); hud.score = s; hud.best = b; hud.bumpScore();
```

### 그리기 (`src/gfx/neon.ts`, `src/gfx/icons.ts`)

```ts
neonCircle(ctx, x, y, r, color, width?);
neonPolygon(ctx, x, y, r, sides, rotation, color, width?);   // 3=삼각형, 4=마름모, 6=육각형
neonText(ctx, text, x, y, size, color, { align, baseline, weight, glow, alpha });
plainText(ctx, text, x, y, size, color, { align, baseline, weight, alpha });  // 빛 없는 작은 글씨 (가장 빠름)
drawGlow(ctx, x, y, radius, color, alpha?);                   // 빛 번짐
polygonPath(...) / roundRectPath(ctx, x, y, w, h, r) + strokeNeon(ctx, color, width);  // 직접 만든 모양을 네온 선으로
drawIcon(ctx, 'pause' | 'play' | 'sound-on' | 'sound-off' | 'home' | 'retry' | 'install' | 'heart' | 'gem' | 'settings', x, y, size, color);
withAlpha('#00f0ff', 0.5);
```

### 수학 (`src/utils/math.ts`)

`clamp` `lerp` `damp`(프레임 무관 부드럽게 따라가기) `approach` `rand` `randInt` `pick` `dist2` `circlesOverlap` `pointInRect` `rotateToward` `easeOutCubic` `easeOutBack` `TAU`, 타입 `Vec2` `Rect`

---

## 6. 파일 지도: 바꾸는 곳 / 그대로 두는 곳

| 구분 | 경로 | 설명 |
| --- | --- | --- |
| **게임마다 바꿈** | `src/scenes/GameScene.ts` | 게임 본편 |
| | `src/game/` | 캐릭터·적·아이템(`Player`, `Enemy`, `Gem`), 숫자(`balance.ts`), 저장 구조(`SaveData.ts`) |
| | `src/config.ts` | 이름, `saveKey`, 화면 방향, 색 팔레트 |
| | `public/manifest.json`, `index.html` | 앱 이름, 화면 방향 |
| | `scripts/generate-icons.mjs` → `public/icons/` | 아이콘 색·모양 |
| **가끔 수정** | `src/scenes/TitleScene.ts`, `PauseScene.ts`, `SettingsScene.ts`, `ResultScene.ts` | 문구·배치·버튼·설정 항목 추가 |
| | `src/core/AudioManager.ts` | 새 효과음 추가 (SFX 표) |
| | `src/core/InputManager.ts` | 키·게임패드 배치(`KEY_BINDINGS`, `GAMEPAD_BINDINGS`), 행동 이름 추가 |
| **그대로 둠** | `src/core/` 나머지 | 엔진: 게임 루프·뒤로가기·화면 방향(`Game`), 화면(`Viewport`), 저장, 전환, PWA, 진동(`Haptics`), 화면 꺼짐 방지(`WakeLock`), 이미지 로더(`Assets`), 빌드 번호(`build`), 에러 박스 |
| | `src/ui/`, `src/fx/`, `src/gfx/`, `src/utils/` | 재사용 부품 |
| | `scripts/build-sw.mjs`, `scripts/sw-template.js` | 서비스 워커 (`dist/sw.js`는 빌드 결과라 직접 수정 금지) |
| | `.github/workflows/deploy.yml`, `ci.yml` | 자동 배포, PR 빌드 검사 |
| | `vite.config.ts`, `tsconfig.json` | 빌드 설정 |
| | `AGENTS.md`, `HANDOFF.md`, `MOBILE_VIBE_GUIDE.md` | AI 규칙·인수인계·가이드 (게임 설명 부분만 갱신) |

---

## 7. 지켜야 할 규칙과 함정

1. **업데이트 순서: 버튼(`ui.update`) → 조이스틱 → 게임 로직.** 버튼이 먼저 손가락을 가져가야 조이스틱이 같이 움직이지 않습니다. `holdAction` 버튼과 `wasPressedOrTouched()`도 같은 순서에 의존합니다.
2. **좌표는 논리 단위, 배치는 `onResize`에서.** 회전·주소창 접힘 때마다 다시 호출됩니다. UI는 `view.safe`(노치 영역)를 피합니다.
3. **버튼은 높이 80 이상.** 판정 영역은 보이는 크기보다 14씩 더 넓습니다(`hitPadding`).
4. **게임 씬 필수 4종 세트.**
   - `onAppHidden` → 일시정지 팝업
   - `onBack` → 일시정지 팝업 후 `true` 반환
   - `onEnter`·`onResume` → `wakeLock.set(true)`
   - `onPause`·`onExit` → `wakeLock.set(false)`
5. **설정 존중.** 흔들림은 `shake.enabled`를 설정과 연결합니다. 진동은 `game.haptics`만 씁니다 (`navigator.vibrate`를 직접 부르지 않음).
6. **`saveKey`는 게임마다 다르게.** `jn5310.github.io`에 올린 게임들은 LocalStorage를 공유합니다. 서비스 워커 캐시는 경로별로 자동 분리됩니다.
7. **`save.data`는 읽기 전용**(타입으로 막혀 있음) → 값은 `save.update()`, 설정은 `game.updateSettings()`로 바꿉니다.
8. **세이브 필드 추가는 인터페이스 + `DEFAULT_SAVE`만** 고치면 됩니다. 이름·의미를 바꿀 때는 `SAVE_VERSION`을 올리고 `migrateSave`에서 옛 데이터를 변환합니다.
9. **에셋 0개 원칙.** 이미지는 `game.assets`로 불러오고, `null`이면 도형으로 대신 그립니다.
10. **화면 방향 고정은 두 곳.** `CONFIG.orientation`과 `public/manifest.json`의 `orientation`을 같은 값으로 맞춥니다.
11. **움직임은 `dt`를 곱해서.** `dt` 상한(1/20초) 덕분에 렉이 걸려도 순간이동하지 않습니다.
12. **모바일 성능:** `ctx.shadowBlur`는 느리니 도형에는 `drawGlow` + `strokeNeon`을 씁니다. 파티클은 풀(pool) 방식이라 개수 상한(생성자 숫자)을 넘으면 오래된 것부터 재사용합니다.
13. **소리는 첫 터치 이후에만 납니다** (브라우저 정책). 아이폰 무음 스위치가 켜져 있으면 안 나는 게 정상입니다.
14. **`npm run build`에는 TypeScript 타입 검사가 포함됩니다.** 타입 에러가 있으면 배포가 안 됩니다 (Actions 빨간 X).
15. **개발 서버(`npm run dev`)에서는** 서비스 워커가 꺼져 있고, 브라우저 콘솔에서 `window.game`으로 상태를 볼 수 있습니다. 배포본은 주소 끝에 `?debug`를 붙이면 FPS·화면 크기·입력·빌드 번호가 표시됩니다.
16. **뒤로가기 가로채기는 사용자가 화면을 한 번 만진 뒤부터** 동작합니다 (만지기 전에 넣은 기록은 크롬이 건너뜀). 타이틀처럼 `onBack`이 `false`인 씬에서는 원래대로 페이지를 떠납니다.

---

## 8. 배포·운영 메모

- **배포 흐름:** `main` push → `build` 작업 → `deploy` 작업. `build` 작업은 설치 → 타입 검사 → Vite 빌드 → 서비스 워커 생성 → Pages 설정 → 산출물 업로드 순서로 돕니다.
- **PR 검사:** PR을 올리면 `Build check`(`ci.yml`)가 같은 빌드를 돌립니다. 초록 체크가 뜬 PR만 머지하세요.
- **빌드 번호:** `deploy.yml`이 `VITE_BUILD_NUMBER`(실행 번호)와 `VITE_APP_VERSION`(커밋)을 넣습니다. Vercel은 `VERCEL_GIT_COMMIT_SHA`를 씁니다. 화면에는 타이틀 오른쪽 아래와 `?debug`에 표시됩니다.
- **업데이트가 안 보일 때:** 서비스 워커가 HTML을 매번 서버에 새로 확인하므로 보통 새로고침 한 번이면 됩니다. 홈 화면 앱은 완전히 껐다가 다시 실행합니다. 처음 방문(서비스 워커 설치 전)은 GitHub Pages 캐시 때문에 최대 10분 늦을 수 있습니다.
- **비공개 저장소로 하고 싶다면:** 무료 계정의 GitHub Pages는 공개 저장소만 됩니다. 비공개로 두려면 Vercel로 배포하고(설정 파일 불필요, Vite 자동 인식), `deploy.yml`은 지우거나 꺼 둡니다 (`ci.yml`이 빌드 검사를 계속 함).
- **경고 메시지:** Actions 로그의 "Node.js 20 is deprecated … forced to run on Node.js 24"는 옛 Node 기준으로 만든 액션이라 뜨는 경고입니다. 대상은 `actions/configure-pages@v5`, `actions/deploy-pages@v4`, 그리고 `upload-pages-artifact@v4`가 내부에서 쓰는 `upload-artifact`입니다. 지금은 정상 동작합니다.
  - 나중에 액션 버전을 올릴 때는 `upload-pages-artifact`와 `deploy-pages`를 같은 세대로 함께 올리고, 배포된 사이트가 실제로 열리는지 확인하세요. v5끼리 섞었다가 배포가 깨져 v4로 되돌린 사례가 보고되어 있습니다.
- **package-lock.json 없음:** 작업 환경에서 npm 레지스트리 접근이 막혀 만들지 못했습니다. 그래서 CI는 `npm install`을 씁니다. 버전을 고정하고 싶으면 Codespaces 등에서 `npm install` 후 생긴 `package-lock.json`을 커밋하고, workflow를 `npm ci` + `cache: npm`으로 바꾸면 됩니다.
- **앱 스토어 출시(나중에):** Google Play는 [PWABuilder](https://www.pwabuilder.com)로 패키징할 수 있습니다. 다만 주소창을 없애려면 도메인 루트에 `/.well-known/assetlinks.json`이 필요해서, `github.io/저장소이름/`보다 Vercel이나 개인 도메인이 맞습니다. iOS는 Mac + Xcode가 필요합니다.
- **웹게임 사이트(itch.io 등):** `npm run build` 후 `dist` 폴더 안의 파일을 zip으로 올리면 됩니다 (상대 경로 빌드라 그대로 동작, iframe 안에서도 키보드 입력 받음).

---

## 9. 설계 결정과 이유

| 결정 | 이유 |
| --- | --- |
| 화면 짧은 변 = 720 논리 단위, 긴 변은 가변 | 폰·태블릿·PC 어디서나 같은 비율과 같은 난이도. 레터박스(검은 띠) 없음 |
| DPR 상한 2 (`CONFIG.maxPixelRatio`) | 3배 화면 폰에서 선명도 차이는 작고 성능 부담은 큼 |
| 가변 `dt` + 상한, 프레임당 update 1회 | '이번 프레임에 눌림' 판정이 단순해지고 120Hz 폰에서도 부드러움 |
| 포인터 소유권(`owner`) | 버튼을 누른 손가락이 조이스틱을 움직이지 않음, 멀티터치 지원 |
| 키보드·화면 버튼·게임패드를 '행동(Action)'으로 통합 | 게임 코드는 장치를 몰라도 됨 (`wasPressed('action')` 하나로 끝) |
| 게임패드 스틱은 이동엔 아날로그, 메뉴에선 방향 버튼 | 이동은 부드럽게, 메뉴 포커스는 한 칸씩 |
| 뒤로가기 = 첫 터치 후 기록 하나를 넣어 가로채기 | 안드로이드에서 실수로 뒤로가기를 눌러도 게임이 꺼지지 않음. 타이틀에서는 원래대로 나감 |
| 화면 방향 고정 = 안내 오버레이 + 일시정지 | 브라우저에서는 회전 자체를 막을 수 없어서, 설치 앱은 manifest가 고정 |
| 설정은 팝업 씬 하나에 모음 | 타이틀·일시정지 어디서든 같은 화면. 게임 중에는 초기화 숨김 |
| Vite `base: './'` (상대 경로) | 저장소 이름이 붙은 Pages 주소, Vercel, itch.io 어디서나 그대로 동작 |
| 서비스 워커 직접 작성 (플러그인 없음) | 의존성 0. 빌드 후 실제 파일 목록으로 미리 저장. 캐시 이름에 경로를 넣어 같은 github.io의 다른 게임과 충돌 없음 |
| HTML은 `cache: 'no-cache'`로 매번 확인 | GitHub Pages의 10분 캐시 때문에 배포 직후 예전 버전이 보이는 문제 방지 |
| manifest에 `id` 없음 | 같은 github.io 주소에 올린 게임끼리 앱 ID가 겹치지 않게 (`start_url`이 기본 ID) |
| 기본값 구조로 세이브 검사 | 새 필드 = 인터페이스 + 기본값 추가만으로 끝. 깨지거나 조작된 데이터도 복구 |
| 화면 에러 박스·빌드 번호 기본 표시 | 폰에는 개발자 도구가 없어서, 에러 복사와 버전 확인을 화면에서 바로 |
| `AGENTS.md` + 이 문서 | Kiro가 세션마다 규칙을 자동으로 읽음. 다른 AI 도구는 시작 프롬프트 첫 줄로 같은 효과 |
| 저장소 Public | 무료 계정에서 GitHub Pages를 쓰기 위한 조건 |

---

## 10. 남은 일 / 아이디어

- [ ] `Settings → General → Template repository` 체크 (1회)
- [ ] 실제 기기 테스트: 아이폰 Safari·홈 화면 앱, 안드로이드 크롬·홈 화면 앱 (진동·화면 꺼짐 방지·뒤로가기 포함)
- [ ] (선택) 실제 게임패드로 확인 (Xbox·PS 패드는 표준 배치)
- [ ] (선택) `package-lock.json` 커밋 후 workflow를 `npm ci`로 전환
- [ ] (선택) GitHub Actions 버전 정기 점검 (8장 경고 참고)
- 아이디어: 코인 상점·스킨, 코드 BGM, 출석 보상, 보스, 로딩 화면(이미지를 많이 쓸 때), Google Play 출시
