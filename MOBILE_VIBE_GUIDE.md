# 📱 MOBILE VIBE GUIDE

코딩을 몰라도 **폰이나 클라우드에서 이 게임을 켜 보고, 배포하고, 다음 게임을 AI에게 만들게 하는 방법**을 정리한 안내서입니다.

---

## 목차

1. [이 보일러플레이트에 들어 있는 것](#1-이-보일러플레이트에-들어-있는-것)
2. [내 폰에서 켜 보기 (4가지 방법)](#2-내-폰에서-켜-보기)
3. [홈 화면에 추가해서 앱처럼 쓰기 (PWA)](#3-홈-화면에-추가해서-앱처럼-쓰기-pwa)
4. [폴더 지도: 무엇을 고치면 무엇이 바뀌나](#4-폴더-지도)
5. [다음 게임 만들기: 복사해서 쓰는 프롬프트](#5-다음-게임-만들기-프롬프트-모음)
6. [자주 막히는 곳 (FAQ)](#6-자주-막히는-곳-faq)
7. [출시 전 체크리스트](#7-출시-전-체크리스트)

---

## 1. 이 보일러플레이트에 들어 있는 것

| 기능 | 하는 일 |
| --- | --- |
| 반응형 화면 | 세로·가로 어느 쪽이든 화면을 꽉 채우고, 회전하면 즉시 다시 배치. 노치·홈바 영역은 피해서 UI 배치 |
| 화면 방향 고정 (선택) | `config.ts`의 `orientation`을 세로/가로로 바꾸면, 반대로 돌렸을 때 "화면을 돌려 주세요" 안내 + 자동 일시정지 |
| 모바일 방해 동작 차단 | 핀치 줌, 더블탭 확대, 스크롤 밀림, 당겨서 새로고침, 길게 누르기 메뉴를 막음 |
| 뒤로가기 보호 | 안드로이드 뒤로가기를 눌러도 게임이 꺼지지 않고 일시정지 (팝업은 닫힘, 타이틀에서는 원래대로 나감) |
| 통합 입력 | 폰의 터치·드래그·가상 조이스틱, PC의 마우스·키보드, **게임패드**가 같은 코드로 동작. 스와이프·원버튼 입력 도우미 포함 |
| 씬 전환 | 타이틀 → 게임 → 일시정지 팝업 → 결과 화면 (페이드 전환, 연타 방지) |
| 설정 화면 | 사운드·볼륨·진동·화면 흔들림·데이터 초기화 (타이틀과 일시정지에서 열림) |
| 자동 저장 | 최고 점수·설정·보유 재화를 LocalStorage에 저장. 데이터가 깨져도 게임은 멈추지 않음 |
| 효과 | 화면 흔들림(끌 수 있음), 터치 파티클, 폭발, 떠오르는 점수 글자, 진동(안드로이드) |
| 화면 꺼짐 방지 | 게임 중에는 화면이 저절로 어두워지지 않음 (지원 브라우저) |
| UI | 큼직한 네온 버튼, 체력바, 점수판, 쿨다운 표시, 키보드·게임패드 포커스 |
| 에셋 0개 | 그림은 도형으로, 소리는 Web Audio 코드로 만들어서 파일이 없어도 에러가 나지 않음. 나중에 그림을 쓰고 싶으면 실패해도 안전한 이미지 로더가 있음 |
| PWA | 홈 화면에 추가하면 전체 화면 앱처럼 실행, 한 번 접속하면 오프라인에서도 실행 |
| 폰 디버깅 도우미 | 에러가 나면 화면에 빨간 박스로 표시 (`복사` 버튼 → AI에게 붙여 넣기). 주소 끝에 `?debug`를 붙이면 FPS 등 표시 |
| 빌드 번호 | 타이틀 화면 오른쪽 아래 `#12 · 1a2b3c4` → 폰에서 새 버전이 반영됐는지 바로 확인 |
| AI 규칙 자동 적용 | `AGENTS.md` — Kiro가 세션마다 자동으로 읽어서 이 구조와 규칙을 지킴 |

**샘플 게임 NEON DODGE**: 날아오는 네온 도형을 피하고 노란 보석(재화)을 모으세요. DASH를 쓰면 잠깐 무적이 되고 부딪힌 적을 부숩니다.

| | 폰 | PC | 게임패드 |
| --- | --- | --- | --- |
| 이동 | 화면 아무 곳이나 드래그 | 방향키 / WASD / 마우스 드래그 | 왼쪽 스틱 / 십자키 |
| 대시 | 오른쪽 아래 DASH 버튼 | Space / Shift | A / X |
| 일시정지 | 오른쪽 위 ⏸, 뒤로가기 (앱을 내리면 자동) | Esc / P | Start |
| 메뉴 선택 | 탭 | 클릭, 또는 방향키 + Enter | 십자키 + A |

---

## 2. 내 폰에서 켜 보기

상황에 맞는 방법 하나만 고르면 됩니다.

| 방법 | PC 필요? | 결과 |
| --- | --- | --- |
| **A. GitHub Pages** | 없어도 됨 | `https://아이디.github.io/저장소이름/` 영구 주소 (무료) |
| **B. Vercel** | 없어도 됨 | `https://프로젝트이름.vercel.app` 영구 주소 (무료) |
| C. PC에서 개발 + 같은 Wi-Fi 폰 | 필요 | 고친 즉시 폰에 반영 (개발용) |
| D. 클라우드 개발 환경 (Codespaces) | 없어도 됨 | 브라우저 안에서 개발 서버 실행 (개발용) |

> 💡 **PWA 설치와 오프라인 실행은 https 주소에서만 됩니다.** 그래서 "앱처럼 설치"까지 확인하려면 A나 B로 배포한 주소를 쓰세요.

### A. GitHub Pages (추천 · 폰만으로 가능)

**1단계 — 코드를 GitHub에 올리기** (셋 중 하나)

- **Kiro 같은 AI 코딩 도구에게 맡기기 (가장 쉬움)**: 아래 프롬프트를 그대로 보내세요.
  ```
  이 mobile-game-boilerplate 폴더를 내 GitHub에 "neon-dodge"라는 공개 저장소로 올리고,
  GitHub Pages를 GitHub Actions 방식으로 켜서 배포까지 해줘. 끝나면 배포 주소를 알려줘.
  ```
- **PC가 있다면**: GitHub에서 새 저장소(Public)를 만들고 `Add file → Upload files`에 이 폴더 안의 파일들을 끌어다 놓기 (`node_modules`, `dist` 폴더는 빼고).
- **이미 이 보일러플레이트가 GitHub에 있다면**: 저장소 페이지의 `Use this template → Create a new repository` (아래 [5-1](#5-1-새-게임-시작-준비) 참고).

**2단계 — Pages 켜기** (AI에게 맡겼다면 이미 되어 있을 수 있음)

1. 저장소 → `Settings` → 왼쪽 메뉴 `Pages`
2. `Build and deployment` → `Source`를 **GitHub Actions**로 선택

**3단계 — 배포 확인**

1. 저장소의 `Actions` 탭 → "Deploy to GitHub Pages"가 초록색 ✔ 이 될 때까지 1~2분 기다리기
   (안 돌고 있으면 `Run workflow` 버튼으로 수동 실행)
2. 폰 브라우저에서 `https://아이디.github.io/저장소이름/` 열기

이후에는 `main` 브랜치에 코드가 올라갈 때마다 **자동으로 다시 배포**됩니다.

> 무료 계정은 **공개(Public) 저장소**에서만 Pages를 쓸 수 있습니다.

### B. Vercel (폰만으로 가능)

1. GitHub에 코드를 올려 둡니다 (A의 1단계).
2. [vercel.com](https://vercel.com) → `Continue with GitHub`로 로그인
3. `Add New… → Project` → 내 저장소 옆의 `Import`
4. Framework Preset이 **Vite**로 자동 선택된 것을 확인하고 `Deploy`
5. 완료 화면의 `https://….vercel.app` 주소를 폰에서 열기

설정 파일은 따로 필요 없습니다 (`npm run build` → `dist` 폴더를 자동으로 인식). 이후 push할 때마다 자동 배포됩니다.

### C. PC에서 개발하면서 폰으로 바로 테스트

[Node.js](https://nodejs.org) (22.12 이상, LTS 버전 추천)를 설치한 뒤, 이 폴더에서 터미널을 열고:

```bash
npm install      # 처음 한 번만
npm run dev
```

터미널에 이런 줄이 나옵니다:

```
➜  Local:   http://localhost:5173/
➜  Network: http://192.168.0.12:5173/
```

**PC와 폰이 같은 Wi-Fi**에 연결된 상태에서, 폰 브라우저에 `Network` 주소를 입력하면 됩니다. 코드를 저장하면 폰 화면도 자동으로 새로 고쳐집니다.

- 주소 입력이 귀찮다면: PC 크롬에서 그 주소를 연 뒤 주소창의 공유 메뉴 → **QR 코드 만들기** → 폰 카메라로 찍기
- 폰에서 안 열리면: PC 방화벽이 막고 있을 수 있습니다 (Windows는 처음 실행 때 뜨는 "액세스 허용"을 눌러 주세요)
- 배포용 결과물을 미리 보려면: `npm run build` 후 `npm run preview`

### D. 클라우드 개발 환경 (GitHub Codespaces)

PC에 아무것도 설치하지 않고 브라우저에서 개발 서버를 돌리는 방법입니다.

1. GitHub 저장소 페이지 → 초록색 `Code` 버튼 → `Codespaces` 탭 → `Create codespace on main`
2. 아래쪽 터미널에 입력: `npm install && npm run dev`
3. 오른쪽 아래 알림의 `Open in Browser`, 또는 `PORTS` 탭에서 5173 포트의 주소 클릭
4. 같은 GitHub 계정으로 로그인한 폰 브라우저에서 그 주소를 열면 폰으로도 확인 가능
   (로그인 없이 열려면 `PORTS` 탭에서 포트를 우클릭 → `Port Visibility → Public`)

> `vite.config.ts`에 Codespaces 주소(`.app.github.dev`)를 미리 허용해 두었습니다.
> 개인 계정은 매달 무료 사용 시간이 있으니, 다 쓰고 나면 Codespace를 꼭 중지(Stop)하세요.

PC 브라우저라면 [StackBlitz](https://stackblitz.com)에서 `https://stackblitz.com/github/아이디/저장소이름` 주소로 열어도 설치 없이 실행됩니다.

---

## 3. 홈 화면에 추가해서 앱처럼 쓰기 (PWA)

배포된 **https 주소**에서만 됩니다.

| 기기 | 방법 |
| --- | --- |
| 안드로이드 (크롬) | 타이틀 화면의 **`앱으로 설치`** 버튼 (보일 때만), 또는 크롬 메뉴 `⋮` → `홈 화면에 추가` / `앱 설치` |
| 안드로이드 (삼성 인터넷) | 메뉴 → `현재 페이지 추가` → `홈 화면` |
| 아이폰·아이패드 | Safari 아래쪽 **공유 버튼(□↑)** → `홈 화면에 추가` (iOS 16.4 이상은 크롬의 공유 메뉴에서도 가능) |
| PC (크롬·엣지) | 타이틀 화면의 `앱으로 설치` 버튼, 또는 주소창 오른쪽의 설치 아이콘 |

홈 화면 아이콘으로 실행하면 주소창 없이 전체 화면으로 열립니다. 한 번 실행한 뒤에는 **인터넷이 없어도** 실행됩니다.

알아 두면 좋은 점:

- **아이폰은 Safari와 홈 화면 앱의 저장 데이터가 따로입니다.** Safari에서 세운 최고 점수가 홈 화면 앱에는 안 보이는 게 정상입니다.
- 아이폰 Safari는 7일 넘게 접속하지 않은 사이트의 저장 데이터를 지울 수 있습니다. **홈 화면 앱은 실제로 실행한 날을 기준으로 따로 계산되므로, 자주 쓰는 게임이라면 데이터가 지워질 걱정은 거의 없습니다.**
- 새 버전이 반영됐는지는 **타이틀 화면 오른쪽 아래 빌드 번호**(GitHub Actions 실행 번호)로 확인합니다. 예전 번호면 새로고침하거나, 홈 화면 앱은 완전히 껐다가 다시 실행하세요.
- 앱 이름은 `public/manifest.json`의 `name`·`short_name`, 아이폰 아이콘 아래 이름은 `index.html`의 `apple-mobile-web-app-title`에서 바꿉니다.
- 아이콘은 `scripts/generate-icons.mjs`의 색을 바꾼 뒤 `npm run icons`로 다시 만들 수 있습니다. 직접 그린 PNG로 바꾸려면 `public/icons/` 안의 파일을 같은 이름·크기로 덮어쓰세요.

---

## 4. 폴더 지도

★ = 새 게임을 만들 때 주로 고치는 곳. `core/`는 엔진이라 거의 건드릴 일이 없습니다.

```
mobile-game-boilerplate/
├─ index.html                 앱 제목, 아이폰 홈 화면 이름
├─ public/
│  ├─ manifest.json           ★ PWA 앱 이름·색·화면 방향
│  └─ icons/                  앱 아이콘 (npm run icons로 생성)
├─ scripts/
│  ├─ generate-icons.mjs      아이콘 PNG를 코드로 그림
│  ├─ build-sw.mjs            빌드 때 서비스 워커(오프라인 실행) 생성
│  └─ sw-template.js          서비스 워커 원본
├─ .github/workflows/
│  ├─ deploy.yml              GitHub Pages 자동 배포 (빌드 번호도 넣음)
│  └─ ci.yml                  PR 빌드 검사 (머지 전에 확인)
├─ AGENTS.md                  AI 작업 규칙 (Kiro가 자동으로 읽음)
├─ HANDOFF.md                 인수인계: 현재 상태·순서·프롬프트·엔진 치트시트
└─ src/
   ├─ main.ts                 시작점 (첫 화면 지정)
   ├─ config.ts               ★ 게임 이름, 저장 키, 화면 방향, 색 팔레트, 화면 기준 크기
   ├─ core/                   엔진
   │  ├─ Game.ts              게임 루프, 매니저 묶음 (this.game.xxx), 뒤로가기·화면 방향 처리
   │  ├─ Viewport.ts          반응형 캔버스, 노치 영역(safe)
   │  ├─ InputManager.ts      통합 입력, 키·게임패드 배치(KEY_BINDINGS, GAMEPAD_BINDINGS)
   │  ├─ SceneManager.ts      화면 전환
   │  ├─ SaveManager.ts       안전한 저장
   │  ├─ AudioManager.ts      ★ 코드 효과음 표(SFX)
   │  ├─ mobileGuard.ts       줌·스크롤 차단
   │  ├─ Haptics.ts           진동
   │  ├─ WakeLock.ts          게임 중 화면 꺼짐 방지
   │  ├─ Assets.ts            (선택) 이미지 로더 — 실패해도 null
   │  ├─ build.ts             빌드 번호
   │  ├─ pwa.ts               설치 버튼, 서비스 워커 등록
   │  └─ errorOverlay.ts      화면 에러 박스
   ├─ scenes/                 ★ 화면들
   │  ├─ TitleScene.ts        타이틀
   │  ├─ GameScene.ts         ★ 게임 본편
   │  ├─ PauseScene.ts        일시정지 팝업
   │  ├─ SettingsScene.ts     설정 팝업 (사운드·볼륨·진동·흔들림·초기화)
   │  └─ ResultScene.ts       결과 / 최고 점수
   ├─ game/                   ★ 샘플 게임 내용
   │  ├─ balance.ts           ★ 속도·난이도·점수 숫자
   │  ├─ SaveData.ts          ★ 저장할 데이터 구조
   │  ├─ Player.ts / Enemy.ts / Gem.ts
   ├─ ui/                     버튼, UILayer, 가상 조이스틱, HUD(체력바·점수판)
   ├─ fx/                     파티클, 화면 흔들림, 떠오르는 글자
   ├─ gfx/                    네온 그리기 도우미, 배경, 아이콘
   └─ utils/math.ts           수학 함수
```

### 핵심 사용법 한눈에 보기

모든 씬에서 `this.game`으로 접근합니다. 좌표와 크기는 **논리 단위**(화면 짧은 변 = 720)라서 어떤 폰에서도 비율이 같습니다.

```ts
// 입력 — 폰·PC 구분 없이
const move = this.game.input.getMoveVector();         // 방향키·WASD + 조이스틱, 길이 0~1
if (this.game.input.wasPressed('action')) { /* Space 또는 화면 버튼 */ }
for (const p of this.game.input.pointers.values()) { /* 멀티터치: p.x, p.y, p.justDown */ }

// 화면 전환
this.game.scenes.change(new ResultScene(this.game, data)); // 페이드 전환
this.game.scenes.push(new PauseScene(this.game));          // 팝업

// 원버튼·스와이프 게임
if (this.game.input.wasPressedOrTouched()) jump();     // 화면 아무 곳 터치 또는 Space
const dir = this.game.input.getDirectionPressed();     // 스와이프 또는 방향키 → 'up' | 'down' | 'left' | 'right' | null

// 저장 (자동 저장됨)
this.game.save.update((d) => { d.coins += 10; });
const best = this.game.save.data.highScore;
this.game.updateSettings((s) => { s.volume = 0.5; });  // 설정은 이걸로 (저장 + 즉시 적용)

// 소리·진동
this.game.audio.play('coin');
this.game.haptics.vibrate(40);                        // 설정에서 끄면 자동으로 무시

// 효과
this.shake.add(0.5);                                  // 화면 흔들림
this.particles.burst(x, y, COLORS.magenta);           // 폭발 파티클

// 화면 크기·노치
const { width, height, safe } = this.game.view;       // 버튼은 씬의 onResize에서 배치

// 뒤로가기 (씬에서)
override onBack() { this.openPause(); return true; }  // true = 처리함, false = 페이지를 떠남
```

전체 API 목록은 [HANDOFF.md 5장 엔진 치트시트](./HANDOFF.md#5-엔진-치트시트-ai사람-공용)에 있습니다.

---

## 5. 다음 게임 만들기: 프롬프트 모음

### 5-1. 새 게임 시작 준비

1. **복사하기**
   - GitHub: 이 보일러플레이트 저장소의 `Settings → General → Template repository`를 한 번 체크해 두면, 이후엔 저장소 페이지의 **`Use this template`** 버튼 하나로 새 게임 저장소가 생깁니다.
   - 또는 폴더를 통째로 복사해서 새 이름으로 바꾸기.
2. **꼭 바꿀 것 3가지** (AI에게 시켜도 됨)
   - `src/config.ts`의 `title`과 **`saveKey`** — 같은 `아이디.github.io` 주소에 여러 게임을 올리면 `saveKey`가 같을 때 세이브가 섞입니다.
   - `public/manifest.json`의 `name`, `short_name`
   - `index.html`의 `<title>`, `apple-mobile-web-app-title`
   - 세로/가로 고정 게임이라면 `src/config.ts`의 `orientation`과 `manifest.json`의 `"orientation"`

> 💡 바로 쓸 수 있는 **시작 프롬프트(빈칸 채우기)** 는 [HANDOFF.md 3장](./HANDOFF.md#3-시작-프롬프트-복사해서-빈칸만-채우기)에 있습니다.

### 5-2. AI에게 맨 처음 붙여 넣을 "프로젝트 규칙"

Kiro는 저장소의 `AGENTS.md`를 자동으로 읽으므로 따로 보낼 필요가 없습니다. `AGENTS.md`를 읽지 않는 다른 AI 도구라면, 새 대화를 시작할 때 아래 블록을 먼저 보내세요.

```
[프로젝트 규칙]
- 이 프로젝트는 TypeScript + Vite + HTML5 Canvas 기반 모바일 퍼스트 게임 보일러플레이트야.
  구조와 사용법은 MOBILE_VIBE_GUIDE.md와 각 파일 상단 주석을 먼저 읽고 따라줘.
- src/core/ 는 엔진이니 꼭 필요할 때만 수정하고, 게임 내용은 src/scenes/ 와 src/game/ 에 만들어줘.
- 입력은 항상 this.game.input 으로 처리해서 폰 터치, PC 마우스·키보드, 게임패드가 모두 동작하게 해줘.
  (이동: getMoveVector, 버튼 행동: wasPressed / Button의 holdAction, 원버튼: wasPressedOrTouched, 스와이프: getDirectionPressed)
- 게임 씬은 onAppHidden과 onBack에서 일시정지를 띄우고, 화면 흔들림·진동은 설정(save.data.settings)을 따르게 해줘.
- 좌표는 논리 단위(화면 짧은 변 = 720)로. UI 배치는 씬의 onResize에서 하고 view.safe(노치 영역)를 피해줘.
- 버튼은 ui/Button + UILayer를 쓰고, 손가락으로 누르기 쉽게 높이 80 이상으로.
- 이미지·오디오 파일 없이 gfx/neon 도형과 AudioManager 코드 효과음만 써줘.
- 저장할 값은 src/game/SaveData.ts 인터페이스와 DEFAULT_SAVE에 추가하고 save.update()로 바꿔줘.
- 숫자(속도·난이도·점수)는 한 파일(예: src/game/balance.ts)에 모아줘.
- 끝나면 npm run build가 에러 없이 통과하는지 확인하고, 바뀐 파일 목록을 알려줘.
```

### 5-3. 새 게임 만들기 프롬프트 (빈칸 채우기)

```
이 보일러플레이트로 새 게임을 만들어줘.

- 게임 이름: [예: 스타 캐처]  → config.ts의 title·saveKey, manifest.json, index.html 제목도 바꿔줘
- 한 줄 설명: [예: 떨어지는 별을 바구니로 받는 게임]
- 조작: 폰 = [예: 좌우 드래그] / PC = [예: 방향키, 마우스]
- 점수: [예: 별 1개 = 10점, 연속으로 받으면 콤보 보너스]
- 재화: [예: 금색 별 = 코인 1개, 저장됨]
- 게임 오버: [예: 별을 3개 놓치면]
- 난이도: [예: 30초마다 떨어지는 속도 증가]
- 분위기: [예: 보라·하늘색 네온, 경쾌한 효과음]

샘플 게임(NEON DODGE)의 GameScene과 src/game/ 은 새 게임으로 교체하고,
타이틀·일시정지·결과 화면, 세이브, 사운드, 이펙트 시스템은 그대로 재사용해줘.
```

**장르별 예시** — 위 템플릿 대신 한 줄로 시작해도 됩니다.

```
화면을 탭하면 점프하는 무한 러너로 바꿔줘. 장애물은 네온 사각형, 코인은 공중에 떠 있게.
```
```
벽돌깨기 게임으로 바꿔줘. 패들은 폰에선 드래그, PC에선 방향키와 마우스로 움직여.
```
```
아래에서 위로 자동 발사하는 슈팅 게임으로 바꿔줘. 조이스틱으로 이동, 적 웨이브와 보스 1종.
```
```
4x4 숫자 합치기(2048) 퍼즐로 바꿔줘. 폰은 스와이프, PC는 방향키. 최고 점수 저장.
```
```
떨어지는 노트를 타이밍 맞춰 탭하는 리듬 게임으로 바꿔줘. 4개 레인, 판정 PERFECT/GOOD/MISS.
```

### 5-4. 기능 추가 프롬프트

```
결과 화면에 상점 버튼을 추가해줘. 모은 코인으로 플레이어 색(스킨) 3종을 살 수 있고,
산 스킨과 선택한 스킨은 SaveData에 저장해줘.
```
```
60초마다 보스가 나오게 해줘. 체력바가 위에 표시되고, 대시로만 데미지를 줄 수 있어.
```
```
Web Audio로 코드로 만든 반복 배경음(BGM)을 추가하고, 설정 화면에 BGM 켜기/끄기를 넣어줘. 설정은 저장.
```
```
보석을 먹을 때도 아주 짧게 진동하게 해줘 (game.haptics 사용, 설정의 진동 옵션 따르기).
```
```
매일 처음 접속하면 코인 10개를 주는 출석 보상을 추가해줘. 마지막 수령 날짜는 SaveData에 저장.
```
```
public/images/player.png 이미지를 플레이어로 쓰고 싶어. game.assets로 불러오고, 못 불러오면
지금처럼 네온 도형으로 그려서 절대 에러가 나지 않게 해줘.
```
```
화면 방향을 세로로만 고정해줘 (config.ts의 orientation과 manifest.json의 orientation을 'portrait'로).
```
```
이미지를 여러 장 쓸 거라서, 불러오는 동안 진행률 막대가 나오는 로딩 화면을 타이틀 전에 넣어줘.
```

### 5-5. 버그 고치기 프롬프트

폰 화면에 빨간 에러 박스가 뜨면 **`복사`** 버튼을 누르고 그대로 붙여 넣으세요.

```
폰에서 [무엇을 했을 때] [어떤 일이 일어나].
기대한 동작: [어떻게 되어야 함]
기기: [예: 갤럭시 S23 크롬 / 아이폰 15 사파리 홈 화면 앱]
빌드 번호: [타이틀 화면 오른쪽 아래]
에러 내용: (빨간 박스에서 복사한 내용 붙여 넣기)
```

```
GitHub Actions 배포가 실패했어. 아래는 Actions 로그의 빨간 부분이야. 고쳐줘.
(로그 붙여 넣기)
```

```
폰에서 버벅여. 주소 끝에 ?debug 를 붙였더니 FPS가 [숫자]로 나와. 성능을 개선해줘.
```

> 💡 AI에게 큰 작업을 맡기기 전에 **커밋(저장 지점)** 을 만들어 두세요. 결과가 마음에 안 들면 "마지막 커밋으로 되돌려줘"라고 하면 됩니다.

---

## 6. 자주 막히는 곳 (FAQ)

**소리가 안 나요.**
모바일 브라우저는 화면을 한 번 터치하기 전에는 소리를 낼 수 없습니다 (첫 터치 후부터 남). 아이폰은 옆면 **무음 스위치**가 켜져 있으면 소리가 안 나는 게 정상입니다. `설정`에서 사운드가 켜져 있는지, 볼륨이 0%가 아닌지도 확인하세요.

**화면이 검게만 나오거나 멈췄어요.**
빨간 에러 박스가 떴는지 보세요. 안 보이면 주소 끝에 `?debug`를 붙여 다시 열고, 왼쪽 아래 정보와 함께 AI에게 상황을 설명하세요. PC라면 `F12` → Console 탭의 빨간 글씨를 복사해도 됩니다.

**배포했는데 예전 버전이 보여요.**
타이틀 화면 오른쪽 아래 빌드 번호와 GitHub `Actions` 탭의 최신 실행 번호를 비교하세요. 다르면 1~2분 뒤 새로고침하고, 홈 화면 앱은 완전히 종료 후 다시 실행합니다. 처음 방문할 때는 GitHub Pages 캐시 때문에 최대 10분 늦을 수 있습니다.

**GitHub Pages 주소가 404예요.**
`Settings → Pages → Source`가 **GitHub Actions**인지, `Actions` 탭의 배포가 초록색 ✔인지, 저장소가 Public인지 확인하세요. 주소 끝의 `/저장소이름/`도 정확해야 합니다.

**`npm run build`(또는 Actions)가 실패해요.**
빌드는 먼저 TypeScript 타입 검사를 합니다. 에러 메시지 전체를 AI에게 붙여 넣으면 대부분 바로 고칩니다.

**최고 점수가 저장이 안 돼요.**
시크릿(비공개) 모드에서는 저장이 막힐 수 있습니다. 이때 타이틀 화면 아래에 빨간 안내 문구가 나옵니다. 게임마다 `config.ts`의 `saveKey`가 다른지도 확인하세요.

**저장 데이터를 초기화하고 싶어요.**
타이틀 → `설정` → `데이터 초기화`를 누르고, 3초 안에 한 번 더 누르세요 (실수 방지). 게임 도중 일시정지에서 연 설정에는 초기화 버튼이 없습니다.

**진동이 안 와요 / 진동 버튼이 없어요.**
아이폰 Safari는 웹 진동을 지원하지 않아서 설정에 진동 버튼이 나오지 않습니다. 안드로이드는 `설정`에서 진동이 켜져 있는지, 폰이 무음·방해금지 모드인지 확인하세요.

**안드로이드에서 뒤로가기를 누르면 어떻게 되나요?**
게임 중이면 일시정지, 팝업(일시정지·설정)이면 닫기, 결과 화면이면 타이틀로 갑니다. 타이틀에서는 원래대로 앱을 나갑니다. 화면을 한 번도 만지기 전에는 브라우저 정책상 가로채지 못합니다. 끄려면 `config.ts`의 `backButtonPause`를 `false`로 바꾸세요.

**게임패드를 연결했는데 안 움직여요.**
연결한 뒤 패드 버튼을 한 번 눌러야 브라우저가 인식합니다. 인식되면 타이틀 아래 안내가 "게임패드: …"로 바뀝니다. Xbox·PlayStation 패드처럼 표준 배치인 패드를 기준으로 맞춰 두었습니다.

**저사양 폰에서 버벅여요.**
`src/config.ts`의 `maxPixelRatio`를 `1.5`(또는 `1`)로 낮추세요. 그래도 느리면 파티클 개수(`ParticleSystem`의 숫자, `emit`의 `count`)를 줄이세요.

**가로/세로 모두 지원하는데 한쪽만 쓰고 싶어요.**
두 곳을 같은 값으로 바꾸세요: `src/config.ts`의 `orientation`과 `public/manifest.json`의 `"orientation"` (`'portrait'` 세로 / `'landscape'` 가로).
- 설치된 앱(주로 안드로이드)은 manifest대로 화면이 고정됩니다.
- 브라우저에서는 회전 자체를 막을 수 없습니다. 그래서 반대로 돌리면 "화면을 돌려 주세요" 안내가 뜨고 게임이 일시정지됩니다.

**아이콘을 바꿨는데 폰에 예전 아이콘이 보여요.**
홈 화면 아이콘은 설치할 때 저장됩니다. 지우고 다시 `홈 화면에 추가`하세요.

---

## 7. 출시 전 체크리스트

- [ ] `config.ts`의 `title`, `saveKey`를 새 게임 것으로 바꿨다
- [ ] `manifest.json`의 `name`·`short_name`, `index.html`의 제목을 바꿨다
- [ ] 아이콘을 새 게임에 맞게 바꿨다 (`npm run icons` 또는 직접 그린 PNG)
- [ ] 폰 세로·가로, PC 키보드·마우스(게임패드가 있다면 게임패드도)로 처음부터 게임 오버까지 해 봤다
- [ ] 게임 도중 앱을 내렸다가 돌아오면 일시정지되어 있다
- [ ] 안드로이드 뒤로가기를 누르면 게임이 꺼지지 않고 일시정지된다
- [ ] 설정(사운드·볼륨·진동·화면 흔들림)이 바로 적용되고, 껐다 켜도 유지된다
- [ ] 타이틀 오른쪽 아래 빌드 번호가 최신 배포 번호와 같다
- [ ] 브라우저를 껐다 켜도 최고 점수·코인·사운드 설정이 남아 있다
- [ ] 배포 주소에서 `홈 화면에 추가` 후 전체 화면으로 실행된다
- [ ] 비행기 모드에서도 홈 화면 앱이 실행된다 (한 번 실행한 뒤)
