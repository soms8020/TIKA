# Contract: POST /api/tickets

`docs/API_SPEC.md §1`을 단일 출처로 하는 본 기능의 계약. 구현·테스트는 이 계약을 정확히 만족해야 한다(헌법 II).

## Request

- **Method/Path**: `POST /api/tickets`
- **Content-Type**: `application/json`
- **Auth**: 없음 (MVP)

### Body

| 필드 | 타입 | 필수 | 제약 | 기본값 |
|------|------|------|------|--------|
| title | string | O | 1~200자, 공백만 불가 | - |
| description | string | X | ≤1000자 | null |
| priority | "LOW"\|"MEDIUM"\|"HIGH" | X | enum | MEDIUM |
| plannedStartDate | string | X | YYYY-MM-DD | null |
| dueDate | string | X | YYYY-MM-DD, 오늘(포함) 이후 | null |

```json
{ "title": "API 설계 문서 작성", "priority": "HIGH", "dueDate": "2026-02-15" }
```

## Response 201 Created

본문은 생성된 티켓 전체. 필드 12개 모두 포함.

```json
{
  "id": 1,
  "title": "API 설계 문서 작성",
  "description": null,
  "status": "BACKLOG",
  "priority": "HIGH",
  "position": 0,
  "plannedStartDate": null,
  "dueDate": "2026-02-15",
  "startedAt": null,
  "completedAt": null,
  "createdAt": "2026-02-01T09:00:00.000Z",
  "updatedAt": "2026-02-01T09:00:00.000Z"
}
```

**불변 조건**:
- `status` == `"BACKLOG"` (항상)
- `priority` 미입력 시 `"MEDIUM"`
- `position` == Backlog 빈 칼럼이면 `0`, 아니면 기존 `min(position) - 1024`
- `startedAt` == null, `completedAt` == null

## Error Responses

형식: `{ "error": { "code": string, "message": string } }`

| Status | code | 조건 | message |
|--------|------|------|---------|
| 400 | VALIDATION_ERROR | 제목 누락/공백 | 제목을 입력해주세요 |
| 400 | VALIDATION_ERROR | 제목 200자 초과 | 제목은 200자 이내로 입력해주세요 |
| 400 | VALIDATION_ERROR | 설명 1000자 초과 | 설명은 1000자 이내로 입력해주세요 |
| 400 | VALIDATION_ERROR | 잘못된 우선순위 | 우선순위는 LOW, MEDIUM, HIGH 중 선택해주세요 |
| 400 | VALIDATION_ERROR | 과거 종료예정일 | 종료예정일은 오늘 이후 날짜를 선택해주세요 |
| 400 | VALIDATION_ERROR | JSON 파싱 실패 | (검증 에러로 처리) |
| 500 | INTERNAL_ERROR | 서버 내부 오류 | 서버 내부 오류 |

## Contract Test 시나리오 (핵심)

1. `{title:"x"}` → 201, status=BACKLOG, priority=MEDIUM, startedAt=null
2. `{}` (title 없음) → 400, code=VALIDATION_ERROR, message="제목을 입력해주세요"
3. `{title:"   "}` (공백) → 400, "제목을 입력해주세요"
4. `{title:"a".repeat(201)}` → 400, "제목은 200자 이내로 입력해주세요"
5. `{title:"x", priority:"URGENT"}` → 400, "우선순위는 LOW, MEDIUM, HIGH 중 선택해주세요"
6. `{title:"x", dueDate:"2000-01-01"}` → 400, "종료예정일은 오늘 이후 날짜를 선택해주세요"
