# Data Model: 티켓 생성 (Create Ticket)

생성(Create) 관점에서 본 데이터 모델. 전체 스키마는 `docs/DATA_MODEL.md`를 단일 출처로 참조한다.

## Entity: Ticket (tickets)

| 필드 | 타입 | 생성 시 출처 | 비고 |
|------|------|--------------|------|
| id | number (serial) | DB 자동 | PK, auto-increment |
| title | string | 사용자 입력(필수) | 1~200자, trim 후 1자 이상 |
| description | string \| null | 사용자 입력(선택) | 최대 1000자, 미입력 시 null |
| status | TicketStatus | **시스템 고정** | 생성 시 항상 `BACKLOG` |
| priority | TicketPriority | 사용자 입력(선택) | 미입력 시 `MEDIUM` |
| position | number | **시스템 계산** | `(MIN(position) ?? 1024) - 1024` (빈 칼럼=0) |
| plannedStartDate | string \| null | 사용자 입력(선택) | YYYY-MM-DD, 과거 허용 |
| dueDate | string \| null | 사용자 입력(선택) | YYYY-MM-DD, 오늘(포함) 이후 |
| startedAt | Date \| null | 시스템 | 생성 시 항상 null |
| completedAt | Date \| null | 시스템 | 생성 시 항상 null |
| createdAt | Date | DB 자동 (defaultNow) | |
| updatedAt | Date | DB 자동 (defaultNow) | |

## 생성 입력 (CreateTicketInput)

`src/shared/validations/ticket.ts`의 `createTicketSchema`에서 도출 (`z.infer`).

| 필드 | 필수 | 검증 규칙 | 실패 메시지 |
|------|------|-----------|-------------|
| title | ✅ | min(1), max(200), trim().length>0 | "제목을 입력해주세요" / "제목은 200자 이내로 입력해주세요" |
| description | ✗ | max(1000) | "설명은 1000자 이내로 입력해주세요" |
| priority | ✗ | enum(LOW\|MEDIUM\|HIGH) | "우선순위는 LOW, MEDIUM, HIGH 중 선택해주세요" |
| plannedStartDate | ✗ | regex `^\d{4}-\d{2}-\d{2}$` | (형식 오류) |
| dueDate | ✗ | regex + `>= 오늘` | "종료예정일은 오늘 이후 날짜를 선택해주세요" |

## 생성 시 적용되는 비즈니스 규칙 (서비스 계층)

1. **status 고정**: 입력에 status 필드가 있어도 무시, 항상 `BACKLOG`.
2. **priority 기본값**: `input.priority ?? 'MEDIUM'`.
3. **position 계산**: Backlog 칼럼의 `MIN(position)` 조회 후 `(min ?? 1024) - 1024`.
4. **타임스탬프**: createdAt/updatedAt은 DB `defaultNow()`. startedAt/completedAt은 null.

## 상태 전이

해당 없음 — 생성은 항상 `BACKLOG` 진입 상태이며 본 기능에서 전이는 발생하지 않는다(전이는 reorder/complete 기능 범위).

## 관련 타입 (shared)

- `TicketStatus`, `TicketPriority` — const 객체 + `typeof` 파생 (DATA_MODEL.md §4)
- `Ticket` — 응답 직렬화 기준 엔티티
- `CreateTicketInput` — 요청 입력 타입

> `src/shared/types/index.ts`는 현재 DATA_MODEL.md §4와 불일치하므로 구현 전 정정 대상(research.md D3).
