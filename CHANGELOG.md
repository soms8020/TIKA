# Changelog

이 파일은 `/changelog` 스킬로 자동 기록된다. 최신 항목이 위에 온다.

## [main] - 2026-06-15 17:02

### Prompt
> "TicketFrom 컴포넌트의 테스트를 작성해줘. 아직 구현하지는 마. TC-COMP-004 기반: ... createTicketSchema를 폼 검증에 사용해."
> "TicketFrom 테스트를 통과하는 구현을 만들어줘. createTicketSchema로 클라이언트 사이드 검증, form-field 등 globals.css 클래스 활용, Phase 1 Button 재사용."
> "Phase 3 나머지를 TDD로 구현해줘. TicketDetailView(3 tests), TicketModal(7 tests). 삭제시 2단계 확인(삭제버튼 → ConfirmDialog → 확인)."
> "Phase 3 컴포넌트를 프리뷰 페이지에 추가해줘. 1. 티켓 생성 버튼 → Modal+TicketForm(create), 2. 카드 클릭 → TicketModal. 실행해줘."

### Changes
- **Added**: 티켓 생성/수정 폼 — createTicketSchema 클라이언트 검증, 인라인 에러, Button 재사용 (`src/client/components/ticket/TicketForm.tsx`)
- **Added**: 읽기 전용 상세 뷰 — 상태/시작일/종료일/생성일 표시, null은 "-" (`src/client/components/ticket/TicketDetailView.tsx`)
- **Added**: 티켓 상세/수정/삭제 모달 — Modal+DetailView+Form+ConfirmDialog 조합, 2단계 삭제 확인 (`src/client/components/ticket/TicketModal.tsx`)
- **Added**: 위 3개 컴포넌트의 TDD 테스트 (TC-COMP-004/005) (`__test__/client/components/ticket/TicketForm.test.tsx`, `TicketDetailView.test.tsx`, `TicketModal.test.tsx`)
- **Modified**: 폼/상세 스타일 클래스(.ticket-form/.field*/.detail-*) 추가 (`src/styles/globals.css`)
- **Modified**: 프리뷰에 TicketForm(생성) 모달 + 카드 클릭 시 TicketModal 연동 (`src/app/preview/page.tsx`)

### Files Modified
- `src/app/preview/page.tsx` (+59, -2 lines)
- `src/styles/globals.css` (+38, -0 lines)
- `__test__/client/components/ticket/TicketDetailView.test.tsx` (+76, -0 lines)
- `__test__/client/components/ticket/TicketForm.test.tsx` (+165, -0 lines)
- `__test__/client/components/ticket/TicketModal.test.tsx` (+128, -0 lines)
- `src/client/components/ticket/TicketDetailView.tsx` (+42, -0 lines)
- `src/client/components/ticket/TicketForm.tsx` (+170, -0 lines)
- `src/client/components/ticket/TicketModal.tsx` (+78, -0 lines)

### Tests
- npm test: 140 passed / 0 failed (18 test suites)

## [main] - 2026-06-15 16:36

### Prompt
> "지금까지 변경사항 정리해서 깃에 push해줘"

### Changes
- **Added**: 보드 UI 기능 명세 002-board-ui (spec + 요구사항 체크리스트) (`specs/002-board-ui/spec.md`, `specs/002-board-ui/checklists/requirements.md`)
- **Added**: 프론트엔드 작업 목록 문서 (`docs/FRONTEND_TASKS.md`)
- **Added**: 칸반 보드 컴포넌트 — 보드/칼럼/칼럼 헤더/티켓 카드 (`src/client/components/board/`, `src/client/components/ticket/TicketCard.tsx`)
- **Added**: 공통 UI 컴포넌트 — Badge/Button/ConfirmDialog/Modal (`src/client/components/ui/`)
- **Added**: 보드 UI 컴포넌트 단위 테스트 8종 (`__test__/client/components/`)
- **Added**: UI 미리보기 페이지 및 목 티켓 데이터 (`src/app/preview/page.tsx`, `src/client/mocks/tickets.ts`)
- **Added**: Jest용 TypeScript 설정 및 디자인 와이어프레임 참조 이미지 (`tsconfig.jest.json`, `reference/image/`)
- **Modified**: 디자인 토큰/보드 스타일 전면 추가 (`src/styles/globals.css`)
- **Modified**: 클라이언트 테스트 포함하도록 Jest 설정 갱신 (`jest.config.js`)
- **Modified**: 진행 기능 메타데이터 갱신 (`.specify/feature.json`)
- **Modified**: 로컬 권한 설정 갱신 (`.claude/settings.local.json`)

### Files Modified
- `.claude/settings.local.json` (+2, -1 lines)
- `.specify/feature.json` (+1, -1 lines)
- `jest.config.js` (+1, -1 lines)
- `src/styles/globals.css` (+392, -2 lines)
- `__test__/client/components/board/Board.test.tsx` (+101, -0 lines)
- `__test__/client/components/board/Column.test.tsx` (+121, -0 lines)
- `__test__/client/components/board/ColumnHeader.test.tsx` (+30, -0 lines)
- `__test__/client/components/ticket/TicketCard.test.tsx` (+126, -0 lines)
- `__test__/client/components/ui/Badge.test.tsx` (+40, -0 lines)
- `__test__/client/components/ui/Button.test.tsx` (+85, -0 lines)
- `__test__/client/components/ui/ConfirmDialog.test.tsx` (+52, -0 lines)
- `__test__/client/components/ui/Modal.test.tsx` (+70, -0 lines)
- `docs/FRONTEND_TASKS.md` (+309, -0 lines)
- `reference/image/tika-wireframe.png` (+1028, -0 lines)
- `reference/image/트렐로.png` (+0, -0 lines)
- `specs/002-board-ui/checklists/requirements.md` (+37, -0 lines)
- `specs/002-board-ui/spec.md` (+189, -0 lines)
- `src/app/preview/page.tsx` (+246, -0 lines)
- `src/client/components/board/Board.tsx` (+49, -0 lines)
- `src/client/components/board/Column.tsx` (+59, -0 lines)
- `src/client/components/board/ColumnHeader.tsx` (+16, -0 lines)
- `src/client/components/ticket/TicketCard.tsx` (+69, -0 lines)
- `src/client/components/ui/Badge.tsx` (+36, -0 lines)
- `src/client/components/ui/Button.tsx` (+37, -0 lines)
- `src/client/components/ui/ConfirmDialog.tsx` (+39, -0 lines)
- `src/client/components/ui/Modal.tsx` (+46, -0 lines)
- `src/client/mocks/tickets.ts` (+132, -0 lines)
- `tsconfig.jest.json` (+7, -0 lines)

### Tests
- npm test: 123 passed / 0 failed (15 test suites)

## [main] - 2026-06-15 13:55

### Prompt
> "매번 프롬프트 입력 후 코드를 수정하고 git에 반영할 때, 1. 내가 입력한 프롬프트 내용 2. 변경된 파일 목록과 라인 수 3. 작업 날짜/시간, 브랜치명 4. 테스트 결과를 자동으로 기록하는 시스템을 만들어줘. CHANGELOG.md에 상세 이력, CLAUDE.md에 최근 변경사항 요약, /changelog \"요약\" 명령어로 실행, Hook 보다는 Skill 방식으로 구현."
> "지금 수정한 내용을 반영한 뒤 커밋 메시지를 만들어서 푸시하고 기록해줘. changelog를 통해 update문서나 코드들 리스트업해서 알려줘."

### Changes
- **Added**: `/changelog` 스킬 — 변경 데이터 수집 → CHANGELOG/CLAUDE 기록 절차 정의 (`.claude/skills/changelog/SKILL.md`)
- **Added**: git 변경 데이터 수집기(브랜치/시간/파일별 +/- 라인/상태 JSON 출력) (`scripts/changelog.mjs`)
- **Added**: Changelog 상세 이력 파일 (`CHANGELOG.md`)
- **Modified**: 최근 변경사항 요약 마커 블록 추가 (`CLAUDE.md`)
- **Modified**: 빌드 산출물 `*.tsbuildinfo` 무시 추가 (`.gitignore`)
- **Modified**: 사용하지 않는 `baseUrl` 옵션 제거 (Bundler 해석 영향 없음) (`tsconfig.json`)

### Files Modified
- `.claude/skills/changelog/SKILL.md` (+124, -0 lines)
- `scripts/changelog.mjs` (+134, -0 lines)
- `CLAUDE.md` (+5, -0 lines)
- `.gitignore` (+1, -0 lines)
- `tsconfig.json` (+0, -1 lines)

### Tests
- npm test: 70 passed / 0 failed (tsconfig 변경 영향 검증)
