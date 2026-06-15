---
description: "Task list for 티켓 생성 (Create Ticket) — POST /api/tickets"
---

# Tasks: 티켓 생성 (Create Ticket)

**Input**: Design documents from `specs/001-create-ticket/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/post-tickets.md

**Tests**: 포함함 — 헌법 "개발 워크플로"가 TDD(Red→Green→Refactor)를 의무화하므로 각 스토리는 테스트를 먼저 작성한다.

**Organization**: 작업은 user story 단위로 묶여 독립적으로 구현·테스트 가능하다.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 실행 가능 (다른 파일, 미완료 작업에 의존하지 않음)
- **[Story]**: 해당 작업이 속한 user story (US1, US2)
- 설명에 정확한 파일 경로 포함

## Path Conventions

Web app 구조 (단일 Next.js 앱): 백엔드 `src/server/`·`src/app/api/`, 공유 `src/shared/`, 테스트 `__test__/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 테스트 환경 준비

- [X] T001 Route Handler 테스트가 Node 환경에서 실행되도록 `jest.config.js` 확인/설정 (서버 테스트는 `testEnvironment: 'node'`; 필요 시 `__test__/api`·`__test__/services`·`__test__/shared`에 node 환경 적용)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 모든 user story가 의존하는 공유 계층. 완료 전에는 어떤 스토리도 시작 불가.

**⚠️ CRITICAL**: 이 단계 완료 전 user story 작업 금지

- [X] T002 [P] `src/shared/types/index.ts`를 `docs/DATA_MODEL.md` §4와 일치하도록 정정 (TICKET_STATUS/TICKET_PRIORITY const 객체 + 파생 타입, `Ticket`, `TicketWithMeta`, `CreateTicketInput` 등; 기존 `id: string` 축약 타입 제거) — research.md D3
- [X] T003 [P] `src/shared/validations/ticket.ts` 생성: `createTicketSchema` 정의 (API_SPEC.md §검증 스키마 그대로) 및 `export type CreateTicketInput = z.infer<typeof createTicketSchema>`
- [X] T004 [P] 공통 에러 응답 헬퍼 `src/server/http/errors.ts` 생성: `{ error: { code, message } }` 형식 + `VALIDATION_ERROR`/`INTERNAL_ERROR` 상수 (헌법 III)

**Checkpoint**: 공유 타입·검증 스키마·에러 헬퍼 준비 완료 → user story 시작 가능

---

## Phase 3: User Story 1 - 최소 정보로 빠르게 티켓 생성 (Priority: P1) 🎯 MVP

**Goal**: 제목만으로 새 티켓을 생성하면 BACKLOG 상태·MEDIUM 우선순위·Backlog 맨 위(position) 티켓이 만들어지고 전체 데이터가 201로 반환된다.

**Independent Test**: `{"title":"x"}` POST → 201, `status="BACKLOG"`, `priority="MEDIUM"`, `position=0`(빈 칼럼), `startedAt=null`.

### Tests for User Story 1 ⚠️ (먼저 작성, 실패 확인)

- [X] T005 [P] [US1] 서비스 단위 테스트 `__test__/services/ticketService.test.ts`: 빈 칼럼 position=0, 기존 티켓 존재 시 `min-1024`, priority 미입력 시 MEDIUM, status 항상 BACKLOG (DB 모듈 모킹 — research.md D6)
- [X] T006 [P] [US1] Route 통합 테스트 `__test__/api/tickets.test.ts`: 제목만 전송 시 201 + 응답 12필드/불변조건 검증 (서비스 모킹). 기존 TODO 스텁 정정

### Implementation for User Story 1

- [X] T007 [US1] `src/server/services/ticketService.ts`에 `createTicket(input: CreateTicketInput): Promise<Ticket>` 구현: Backlog `MIN(position)` 조회 → `(min ?? 1024) - 1024`, status=BACKLOG, priority 기본 MEDIUM, Drizzle `insert().returning()` 후 Ticket 매핑 (의존: T002, T003; DB는 `src/server/db/client.ts`의 `db` 사용 — research.md D4)
- [X] T008 [US1] `src/app/api/tickets/route.ts`에 `POST` 핸들러 구현(정상 경로): `req.json()` 파싱 → `createTicketSchema.safeParse()` 성공 시 `createTicket()` 호출 → 201 반환 (의존: T003, T004, T007)

**Checkpoint**: 제목 기반 생성이 단독으로 동작·테스트 가능 (MVP)

---

## Phase 4: User Story 2 - 잘못된 입력에 대한 명확한 피드백 (Priority: P2)

**Goal**: 유효하지 않은 입력은 티켓을 생성하지 않고 `{ error: { code: "VALIDATION_ERROR", message } }` 형식의 400으로 명세된 한국어 메시지를 반환한다.

**Independent Test**: `{}`(제목 누락) POST → 400, `code="VALIDATION_ERROR"`, `message="제목을 입력해주세요"`.

### Tests for User Story 2 ⚠️ (먼저 작성, 실패 확인)

- [X] T009 [P] [US2] Zod 스키마 단위 테스트 `__test__/shared/createTicketSchema.test.ts`: 6개 검증 실패 케이스(제목 누락/공백, 제목 200자 초과, 설명 1000자 초과, 잘못된 우선순위, 과거 종료예정일) + 유효 입력 통과, 각 실패 메시지 일치
- [X] T010 [P] [US2] Route 통합 테스트 `__test__/api/tickets.test.ts`에 400 케이스 추가: 제목 누락/공백/초과·잘못된 우선순위·과거 dueDate → 400 + 에러 형식/메시지 검증

### Implementation for User Story 2

- [X] T011 [US2] `src/app/api/tickets/route.ts`에 검증 실패 분기 구현: `safeParse` 실패 시 `error.issues[0].message`로 400 `VALIDATION_ERROR` 응답(에러 헬퍼 사용), JSON 파싱 실패도 400 처리, 예외는 500 `INTERNAL_ERROR` (의존: T004, T008 — research.md D5)

**Checkpoint**: 정상 생성(US1)과 검증 실패(US2)가 모두 독립적으로 동작

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: 마무리 및 정합성 확인

- [X] T012 [P] `npm test` 전체 통과 확인 (US1·US2 테스트 green) — 18/18 통과
- [X] T013 [P] `npm run lint`·`npm run build` 통과 확인, `console.log` 등 디버깅 코드 제거 (헌법 워크플로) — build/typecheck/lint green, 디버깅 코드 없음
- [X] T014 [P] `specs/001-create-ticket/quickstart.md`의 수동 검증 시나리오(curl 201/400) 실행 확인 — 로컬 Postgres(tika_dev)에서 실제 검증 완료: 201(BACKLOG/MEDIUM/position=0), 2번째=position -1024, 제목누락/과거dueDate/잘못된우선순위 → 400 VALIDATION_ERROR. (db-test.js env 로딩 버그 수정: .env.local 로드)
- [X] T015 명세-코드 경로 불일치(DB 클라이언트 `client.ts` vs 문서 `index.ts`) 해결 (research.md D4) — 명세(SSOT)에 맞춰 코드를 `src/server/db/index.ts`로 통일(client.ts 제거), import는 `@/server/db`. 서비스/테스트 갱신, 테스트 18/18·빌드 통과

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 의존 없음, 즉시 시작
- **Foundational (Phase 2)**: Setup 후. 모든 user story를 BLOCK
- **User Stories (Phase 3~4)**: Foundational 완료 후 시작
  - US1(P1) → US2(P2) 순서 권장. US2의 라우트 에러 분기(T011)는 US1의 핸들러(T008)에 이어 작성
- **Polish (Phase 5)**: 원하는 user story 완료 후

### User Story Dependencies

- **US1 (P1)**: Foundational(T002~T004) 후 시작. 다른 스토리 의존 없음
- **US2 (P2)**: Foundational 후 시작. 라우트 파일을 US1과 공유하므로 T011은 T008 이후 (같은 파일 `route.ts` — 병렬 불가)

### Within Each User Story

- 테스트 먼저 작성·실패 확인 → 구현 (TDD)
- 모델/타입 → 서비스 → 엔드포인트 순

### Parallel Opportunities

- T002·T003·T004 (Foundational, 서로 다른 파일) 병렬 가능
- US1 테스트 T005·T006 병렬 가능
- US2 테스트 T009·T010 병렬 가능
- T012·T013·T014 병렬 가능
- ⚠️ T008·T011은 동일 파일 `src/app/api/tickets/route.ts` → 병렬 불가, 순차

---

## Parallel Example: Foundational

```bash
# 서로 다른 파일이므로 동시 진행 가능:
Task: "src/shared/types/index.ts 정정 (T002)"
Task: "src/shared/validations/ticket.ts 생성 (T003)"
Task: "src/server/http/errors.ts 생성 (T004)"
```

## Parallel Example: User Story 1 Tests

```bash
Task: "서비스 단위 테스트 __test__/services/ticketService.test.ts (T005)"
Task: "Route 통합 테스트(201) __test__/api/tickets.test.ts (T006)"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: Setup
2. Phase 2: Foundational (CRITICAL)
3. Phase 3: User Story 1 (TDD)
4. **STOP & VALIDATE**: 제목 기반 생성 201 단독 검증
5. 데모 가능

### Incremental Delivery

1. Setup + Foundational → 기반 완성
2. US1 추가 → 단독 검증 → MVP
3. US2 추가 → 검증 실패 응답 검증 → 신뢰성 확보
4. Polish

---

## Notes

- [P] = 다른 파일, 의존 없음
- TDD: 구현 전 테스트 실패 확인 필수, 테스트 삭제/skip 금지 (헌법)
- 단일 진실 공급원: 응답/검증/에러는 `docs/API_SPEC.md`·`docs/DATA_MODEL.md`를 따른다
- `any` 사용 금지, DB 접근은 services에서 Drizzle로만 (헌법 I/V)
