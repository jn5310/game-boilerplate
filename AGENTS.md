# AGENTS.md — AI 작업 규칙 (Kiro 등 AI 코딩 도구가 자동으로 읽는 파일)

이 저장소는 **TypeScript + Vite + HTML5 Canvas 모바일 퍼스트 2D 게임 보일러플레이트**입니다.
작업 전에 [HANDOFF.md](./HANDOFF.md)(현재 상태·엔진 API 치트시트·규칙)를 먼저 읽고 따르세요.
사용자용 자세한 안내는 [MOBILE_VIBE_GUIDE.md](./MOBILE_VIBE_GUIDE.md)에 있습니다.

## 반드시 지킬 것

1. 게임 내용은 `src/scenes/`와 `src/game/`에 만들고, `src/core/`(엔진)는 꼭 필요할 때만 고칩니다.
2. 입력은 항상 `this.game.input`으로 처리해서 **폰 터치 · PC 마우스/키보드 · 게임패드**가 모두 동작하게 합니다.
   - 이동은 `getMoveVector()`, 버튼 행동은 `wasPressed()`, 화면 버튼은 `Button`의 `holdAction`을 씁니다.
   - 원버튼 게임은 `wasPressedOrTouched()`, 스와이프 게임은 `getDirectionPressed()`를 씁니다.
3. 씬 `update` 순서는 **UI 버튼 → 조이스틱 → 게임 로직**입니다.
4. 좌표는 논리 단위(화면 짧은 변 = 720)입니다. UI 배치는 씬의 `onResize`에서 하고 `view.safe`(노치 영역)를 피합니다. 버튼 높이는 80 이상으로 합니다.
5. 게임 씬은 일시정지 팝업을 띄워야 합니다.
   - `onAppHidden`(앱을 내릴 때)과 `onBack`(뒤로가기) 둘 다에서 띄웁니다.
   - `onEnter`·`onResume`에서는 `game.wakeLock.set(true)`, `onPause`·`onExit`에서는 `set(false)`를 호출합니다.
6. 이미지·오디오 파일 없이 동작해야 합니다. 그래픽은 `src/gfx/neon.ts`, 소리는 `AudioManager`의 코드 효과음을 씁니다.
   - 이미지를 쓰더라도 `game.assets.image()`가 null이면 도형으로 대신 그립니다.
7. 저장할 값은 `src/game/SaveData.ts`의 인터페이스와 `DEFAULT_SAVE`에 추가하고 `save.update()`로만 바꿉니다.
   - 필드 이름이나 의미를 바꾸면 `SAVE_VERSION`을 올리고 `migrateSave`에서 변환합니다.
   - 새 게임은 `src/config.ts`의 `saveKey`를 반드시 바꿉니다.
8. 사용자 설정을 존중합니다. 흔들림은 `shake.enabled = save.data.settings.screenShake`, 진동은 `game.haptics.vibrate()`를 씁니다(설정 자동 반영).
9. 속도·난이도·점수 숫자는 `src/game/balance.ts` 한 곳에 모읍니다.
10. 화면 방향을 고정하면 `CONFIG.orientation`과 `public/manifest.json`의 `orientation`을 같은 값으로 맞춥니다.
11. `dist/sw.js`는 빌드 결과물이라 직접 고치지 않습니다. 고칠 때는 `scripts/sw-template.js`를 고칩니다.

## 끝내기 전에

- `npm run build`가 에러 없이 통과해야 합니다. 타입 검사가 포함되어 있고, 실패하면 배포되지 않습니다.
- 폰(터치)과 PC(키보드·마우스) 양쪽에서 이 흐름이 동작해야 합니다: 시작 → 플레이 → 일시정지 → 게임 오버 → 다시 하기.
- `main`에 반영되면 GitHub Actions가 GitHub Pages로 자동 배포합니다. PR은 `Build check`가 통과해야 머지할 수 있습니다.
- 사용자에게 바뀐 파일, 조작법, 배포 주소를 알려 줍니다.
- 사용자는 타이틀 화면 오른쪽 아래의 빌드 번호로 새 버전인지 확인합니다.

#[[file:HANDOFF.md]]
