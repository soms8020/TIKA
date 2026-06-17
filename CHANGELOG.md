# Changelog

이 파일은 `/changelog` 스킬로 자동 기록된다. 최신 항목이 위에 온다.

## [main] - 2026-06-17 14:10

### Prompt
> "colors.json / DESIGN_SYSTEM 를 우리 사이트에 맞도록 컬러·UI 조정. 4개 스위밍라인 구분선, 각 배경색 다르게, 제목 14pt bold·내용/인풋 12pt, input box 일관성. 좌측 Backlog 전체 높이 + 우측 상단 필터(48px) + 하단 3영역 구조."
> "트렐로.png 참고로 board 스타일 개선(연한 컬럼 배경, 헤더 카드 갯수 뱃지). 반응형: <768 단일·Backlog 숨김 / 768 2컬럼 / 1024 4컬럼 풀."
> "TicketCard 접근성/UX·렌더링 성능·코드 품질 검토 후 1,2,3 모두 진행(키보드 DnD·React.memo·전용 드래그 핸들)."
> "Board 성능 검토(번들/API/낙관적 업데이트) → ②(create/update/remove 반환 엔티티 반영, 재조회 왕복 제거) + ③-1(reorder/complete 성공 시 서버 응답 reconcile) 적용."

### Changes
- **Added**: 디자인 토큰 단일 출처 colors.json + 디자인 시스템 문서 (`src/shared/design/colors.json`, `docs/DESIGN_SYSTEM.md`)
- **Modified**: 4 스위밍레인 색/구분선·상단 액센트, 타이포(제목 14px Bold/내용·입력 12px), input 일관 스타일, 트렐로풍 카드/카운트 뱃지, 콘텐츠 영역 레이아웃(Backlog 전체높이 + 우측 필터48px+3칼럼)·반응형 (`src/styles/globals.css`)
- **Modified**: 콘텐츠 레이아웃 재구성 — 필터를 우측 영역으로(`filterSlot`), 반응형 칼럼 (`src/client/components/board/Board.tsx`, `BoardContainer.tsx`, `Column.tsx`)
- **Modified**: TicketCard 접근성/성능 리팩터 — 열기 버튼 + 전용 드래그 핸들 분리(키보드 DnD 보존), React.memo, overlay 비대화형 복제본 (`src/client/components/ticket/TicketCard.tsx`)
- **Modified**: useTickets 성능 — create/update/remove 반환 엔티티 반영(재조회 왕복 제거), reorder/complete 성공 시 서버 응답 reconcile (`src/client/hooks/useTickets.ts`, `src/client/lib/boardDnd.ts`)
- **Modified**: TicketCard Props 계약(onSelect/overlay) 명세 갱신 (`docs/COMPONENT_SPEC.md`)
- **Modified**: 위 변경에 맞춘 테스트 갱신 (`__test__/client/...`)

### Files Modified
- `src/styles/globals.css` (+307, -170 lines)
- `src/shared/design/colors.json` (+36, -0 lines)
- `docs/DESIGN_SYSTEM.md` (+73, -0 lines)
- `docs/COMPONENT_SPEC.md` (+11, -8 lines)
- `src/client/components/ticket/TicketCard.tsx` (+78, -35 lines)
- `src/client/components/board/Board.tsx` (+19, -10 lines)
- `src/client/components/board/BoardContainer.tsx` (+8, -1 lines)
- `src/client/components/board/Column.tsx` (+2, -5 lines)
- `src/client/hooks/useTickets.ts` (+33, -9 lines)
- `src/client/lib/boardDnd.ts` (+66, -0 lines)
- `__test__/client/components/ticket/TicketCard.test.tsx` (+58, -43 lines)
- `__test__/client/hooks/useTickets.test.ts` (+88, -64 lines)
- `__test__/client/lib/boardDnd.test.ts` (+64, -1 lines)
- `__test__/client/components/board/Column.test.tsx` (+4, -2 lines)
- `__test__/client/components/board/Board.test.tsx` (+2, -1 lines)
- `__test__/client/components/board/BoardContainer.test.tsx` (+2, -0 lines)
- `.claude/settings.local.json` (+4, -1 lines)
- (별도: Vercel agent-skills `web-design-guidelines`·`vercel-react-best-practices` 설치 — 벤더 자산이라 이번 커밋에서 제외)

### Tests
- npm test: 214 passed / 0 failed (28 test suites)

## [main] - 2026-06-17 11:24

### Prompt
> "이제 남은 업무를 구현해야 해. 티켓의 드래그 앤 드롭(스윔라인 어느 곳이든 드래그 앤 드롭으로 이동 및 티켓의 위치 포지션 계산)과 app/page.tsx를 서버 컴포넌트로 변환해야 해. ... useTickets의 reorder/complete는 COMPONENT_SPEC §4의 낙관적 업데이트 패턴 적용(백업 → UI 즉시 반영 → API 호출 → 실패 시 롤백)"
> "app/preview/page.tsx 프리뷰 페이지를 삭제해줘. 이제 실제 page.tsx에서 전체 앱을 확인할 수 있어."
> "변경사항 정리해줘 /mocks/tickets.ts는 정리해도 돼."

### Changes
- **Added**: 삽입 위치 계산 `computeInsertPosition` (`src/client/lib/position.ts`)
- **Added**: 드롭 해석 + 낙관적 보드 변형 `resolveDrop`/`moveTicket`/`completeOnBoard` (`src/client/lib/boardDnd.ts`)
- **Added**: 이번주/오버듀 필터·카운트 + 주 경계 날짜 유틸 (`src/client/lib/filters.ts`, `src/client/lib/date.ts`)
- **Added**: 보드 오케스트레이터 — useTickets+Header+FilterBar+Board+TicketModal+DnD 분기 (`src/client/components/board/BoardContainer.tsx`)
- **Added**: 상단 헤더(생성 버튼) / 필터 바(이번주·일정초과 토글) (`src/client/components/board/BoardHeader.tsx`, `FilterBar.tsx`)
- **Added**: 티켓 CRUD 훅 — create/update/remove 재조회 + reorder/complete 낙관적 업데이트 (`src/client/hooks/useTickets.ts`)
- **Added**: 위 모듈들의 TDD 테스트 10종 (`__test__/client/lib/*`, `__test__/client/hooks/useTickets.test.ts`, `__test__/client/components/board/*`, `__test__/client/api/ticketApi.test.ts`, `__test__/app/page.test.tsx`)
- **Modified**: `app/page.tsx` 서버 컴포넌트로 전환 — `ticketService.getBoard()` 조회 후 BoardContainer 주입 (`src/app/page.tsx`)
- **Modified**: ticketApi 호출 함수 6종(getBoard/create/update/remove/reorder/complete) 구현 (`src/client/api/ticketApi.ts`)
- **Modified**: Board 에 DnD 핸들러(onDragStart/End)·DragOverlay·PointerSensor 추가 (`src/client/components/board/Board.tsx`)
- **Modified**: `test:components` npm 스크립트 추가 (`package.json`)
- **Deleted**: 컴포넌트 프리뷰 페이지 제거 (실제 page.tsx로 대체) (`src/app/preview/page.tsx`)
- **Deleted**: 프리뷰 전용 목 데이터 정리 (참조처 없음) (`src/client/mocks/tickets.ts`)

### Files Modified
- `__test__/app/page.test.tsx` (+43, -0 lines)
- `__test__/client/api/ticketApi.test.ts` (+210, -0 lines)
- `__test__/client/components/board/Board.test.tsx` (+4, -0 lines)
- `__test__/client/components/board/BoardContainer.test.tsx` (+154, -0 lines)
- `__test__/client/components/board/BoardHeader.test.tsx` (+36, -0 lines)
- `__test__/client/components/board/FilterBar.test.tsx` (+87, -0 lines)
- `__test__/client/hooks/useTickets.test.ts` (+188, -0 lines)
- `__test__/client/lib/boardDnd.test.ts` (+119, -0 lines)
- `__test__/client/lib/date.test.ts` (+78, -0 lines)
- `__test__/client/lib/filters.test.ts` (+81, -0 lines)
- `__test__/client/lib/position.test.ts` (+34, -0 lines)
- `package.json` (+1, -0 lines)
- `src/app/page.tsx` (+10, -4 lines)
- `src/app/preview/page.tsx` (+0, -302 lines)
- `src/client/api/ticketApi.ts` (+88, -3 lines)
- `src/client/components/board/Board.tsx` (+53, -23 lines)
- `src/client/components/board/BoardContainer.tsx` (+113, -0 lines)
- `src/client/components/board/BoardHeader.tsx` (+27, -0 lines)
- `src/client/components/board/FilterBar.tsx` (+42, -0 lines)
- `src/client/hooks/useTickets.ts` (+110, -0 lines)
- `src/client/lib/boardDnd.ts` (+116, -0 lines)
- `src/client/lib/date.ts` (+42, -0 lines)
- `src/client/lib/filters.ts` (+29, -0 lines)
- `src/client/lib/position.ts` (+13, -0 lines)
- `src/client/mocks/tickets.ts` (+0, -131 lines)

### Tests
- npm test: 205 passed / 0 failed (28 test suites)

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
