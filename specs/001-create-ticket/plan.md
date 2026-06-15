# Implementation Plan: 티켓 생성 (Create Ticket)

**Branch**: `001-create-ticket` | **Date**: 2026-06-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-create-ticket/spec.md`

## Summary

`POST /api/tickets`를 구현한다. 사용자가 제목(필수) 및 선택 필드(설명·우선순위·시작예정일·종료예정일)를 보내면, 공유 Zod 스키마로 요청을 검증하고, 서비스 계층이 비즈니스 규칙(상태=BACKLOG, 우선순위 기본 MEDIUM, position=Backlog 최소값-1024, 빈 칼럼은 0)을 적용하여 Drizzle ORM으로 티켓을 생성한 뒤, API_SPEC.md에 정의된 12개 필드를 201로 반환한다. 검증 실패는 `{ error: { code: "VALIDATION_ERROR", message } }` 형식의 400으로 응답한다.

기술 접근: **Route Handler(얇게) → Service(비즈니스 로직) → Drizzle(DB)** 3계층 분리. 검증 스키마와 타입은 `src/shared/`에 두어 프론트/백엔드가 공유한다.

## Technical Context

**Language/Version**: TypeScript 5.3 (strict mode)

**Primary Dependencies**: Next.js 15 (App Router, Route Handlers), Drizzle ORM 0.38, Zod 3, postgres-js

**Storage**: PostgreSQL (Neon/Vercel Postgres) — `tickets` 테이블 (마이그레이션 `drizzle/0000_robust_famine.sql` 이미 존재)

**Testing**: Jest 29 + ts-jest. 서비스/검증 단위 테스트는 node 환경, Route Handler 통합 테스트는 `Request` 객체로 핸들러 직접 호출

**Target Platform**: Vercel 서버리스 (Node 런타임)

**Project Type**: Web application (프론트엔드/백엔드 디렉토리 분리, 단일 Next.js 앱)

**Performance Goals**: 단일 사용자 MVP — 특별한 처리량 목표 없음. 생성은 단건 INSERT + 1회 MIN 조회

**Constraints**: 응답 형식·필드명·상태 코드는 `docs/API_SPEC.md`와 정확히 일치(헌법 II). raw SQL 금지, Drizzle만 사용(헌법 V)

**Scale/Scope**: 본 기능 범위는 `POST /api/tickets` 단일 엔드포인트. GET/PATCH/DELETE/reorder는 범위 외

## Constitution Check

*GATE: Phase 0 이전 통과 필수. Phase 1 설계 후 재점검.*

| 원칙 | 적용 방식 | 통과 |
|------|-----------|------|
| I. TypeScript Strict 타입 안전성 | `any` 미사용, 공유 타입은 `@/shared/types`에서 import. 본 기능 선결 작업으로 `src/shared/types/index.ts`를 DATA_MODEL.md 명세에 맞게 정정(현재 불일치) | ✅ |
| II. API 응답 명세 준수 | 응답 12필드·상태코드(201/400)를 API_SPEC.md와 일치시킴. contracts/로 계약 고정 | ✅ |
| III. 통일된 에러 응답 형식 | 검증 실패 시 `{ error: { code: "VALIDATION_ERROR", message } }`, 상태 400 | ✅ |
| IV. Zod 요청 검증 | `src/shared/validations/ticket.ts`의 `createTicketSchema`로 Route Handler에서 검증 후 서비스 호출 | ✅ |
| V. 서비스 계층 분리 | Route Handler는 파싱→검증→서비스 호출→응답만. 비즈니스 로직과 DB 접근은 `src/server/services/ticketService.ts` | ✅ |

**초기 게이트 결과: 통과** (위반 없음 → Complexity Tracking 불필요)

**Phase 1 설계 후 재점검: 통과** — 설계 산출물(data-model.md, contracts/post-tickets.md)이 위 5개 원칙을 모두 유지함. 신규 위반 없음.

## Project Structure

### Documentation (this feature)

```text
specs/001-create-ticket/
├── plan.md              # 이 파일
├── research.md          # Phase 0: 결정 사항(미해결 항목 해소)
├── data-model.md        # Phase 1: 생성 관점 데이터 모델
├── quickstart.md        # Phase 1: 검증/실행 가이드
├── contracts/
│   └── post-tickets.md  # Phase 1: POST /api/tickets 계약
└── tasks.md             # Phase 2: /speckit.tasks 산출물 (이 명령 아님)
```

### Source Code (repository root)

```text
src/
├── shared/
│   ├── types/
│   │   └── index.ts                 # [정정] Ticket, CreateTicketInput 등 — DATA_MODEL.md와 일치시킴
│   └── validations/
│       └── ticket.ts                # [신규] createTicketSchema (API_SPEC.md 검증 스키마)
├── server/
│   ├── db/
│   │   ├── client.ts                # [기존] drizzle 클라이언트 (db export)
│   │   └── schema.ts                # [기존] tickets 테이블
│   └── services/
│       └── ticketService.ts         # [신규] createTicket(): 비즈니스 로직 + DB 접근
└── app/
    └── api/
        └── tickets/
            └── route.ts             # [신규] POST 핸들러 (얇게)

__test__/
├── api/
│   └── tickets.test.ts              # [정정] POST /api/tickets 통합 테스트 (현재 TODO 스텁)
├── services/
│   └── ticketService.test.ts        # [신규] createTicket 단위 테스트
└── shared/
    └── createTicketSchema.test.ts   # [신규] Zod 스키마 단위 테스트
```

**Structure Decision**: CLAUDE.md/헌법의 계층 경계를 그대로 따른다. 신규 파일 4개(validations/ticket.ts, services/ticketService.ts, app/api/tickets/route.ts, 테스트), 정정 2개(shared/types/index.ts, __test__/api/tickets.test.ts).

> 경로 정합: DB 클라이언트는 명세(DATA_MODEL.md/TRD.md)에 맞춰 `src/server/db/index.ts`로 통일했다. import는 `@/server/db`로 한다(이전 `client.ts`는 제거 — research.md D4 참조).

## 구현 흐름 (계층별 책임)

### 1. 공유 계층 (`src/shared/`) — 선결
- **types/index.ts 정정**: 현재 `Ticket` 타입이 DB·API와 불일치(`id: string`, 필드 누락). DATA_MODEL.md §4의 정의(상태/우선순위 const 객체, `Ticket`, `CreateTicketInput` 등)로 교체. 양쪽 경계에 영향을 주므로 가장 먼저 수정(헌법: shared 우선).
- **validations/ticket.ts 신규**: API_SPEC.md §검증 스키마의 `createTicketSchema`를 그대로 정의하고 `CreateTicketInput = z.infer<typeof createTicketSchema>`로 타입 도출.

### 2. 서비스 계층 (`src/server/services/ticketService.ts`) — 신규
- `createTicket(input: CreateTicketInput): Promise<Ticket>`
  1. Backlog 칼럼 최소 position 조회 (Drizzle `min()` 집계).
  2. `position = (min ?? 1024) - 1024` → 빈 칼럼이면 `0`, 아니면 `min - 1024`.
  3. `status: 'BACKLOG'`, `priority: input.priority ?? 'MEDIUM'` 적용.
  4. Drizzle `insert(...).returning()`로 생성 후 행 반환.
  5. 반환 행을 API 응답 형태(Ticket)로 매핑.
- DB 접근은 이 계층에서만. raw SQL 금지.

### 3. Route Handler (`src/app/api/tickets/route.ts`) — 신규
- `export async function POST(req: Request)`:
  1. `await req.json()`로 본문 파싱(파싱 실패 시 400 VALIDATION_ERROR).
  2. `createTicketSchema.safeParse()`로 검증 → 실패 시 첫 이슈 message로 400 에러 응답.
  3. 성공 시 `ticketService.createTicket()` 호출.
  4. 결과를 201로 반환.
  5. 예기치 못한 예외는 500 INTERNAL_ERROR.
- 공통 에러 응답 헬퍼(`{ error: { code, message } }`)를 사용.

### 4. 테스트 (TDD: Red → Green → Refactor)
- **Zod 단위 테스트**: 유효/무효 입력별 통과·실패 및 메시지 검증.
- **서비스 단위 테스트**: 빈 칼럼(position=0), 기존 티켓 존재(min-1024), 기본 우선순위 적용. DB는 모킹 또는 테스트 DB(.env.test) 사용.
- **Route 통합 테스트**: 제목만 → 201/BACKLOG/MEDIUM, 제목 누락 → 400 VALIDATION_ERROR (현 TODO 스텁을 실제 테스트로 정정).

## Complexity Tracking

> Constitution Check 위반 없음 — 작성 불필요.
