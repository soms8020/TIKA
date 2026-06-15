# Quickstart: 티켓 생성 (Create Ticket)

`POST /api/tickets` 기능이 end-to-end로 동작함을 검증하는 가이드.

## Prerequisites

- 의존성 설치 완료 (`npm install`)
- `.env.local`에 `DATABASE_URL` 설정, 마이그레이션 적용 (`npm run db:migrate`)
- (테스트용) `.env.test`에 테스트 DB 연결 정보

## 단위/통합 테스트 실행

```bash
npm test
```

기대 결과:
- `__test__/shared/createTicketSchema.test.ts` — Zod 검증 통과/실패 케이스 전부 green
- `__test__/services/ticketService.test.ts` — position 계산(빈 칼럼=0, 기존 시 min-1024), priority 기본값 green
- `__test__/api/tickets.test.ts` — 201 생성 / 400 검증 실패 green

## 수동 검증 (개발 서버)

```bash
npm run dev
```

다른 터미널에서:

```bash
# 1) 제목만 → 201, BACKLOG/MEDIUM
curl -i -X POST http://localhost:3000/api/tickets \
  -H "Content-Type: application/json" \
  -d '{"title":"첫 티켓"}'

# 2) 제목 누락 → 400 VALIDATION_ERROR
curl -i -X POST http://localhost:3000/api/tickets \
  -H "Content-Type: application/json" \
  -d '{}'
```

기대:
- (1) HTTP 201, 응답 body의 `status="BACKLOG"`, `priority="MEDIUM"`, `position=0`(빈 칼럼), `startedAt=null`
- (2) HTTP 400, body `{ "error": { "code": "VALIDATION_ERROR", "message": "제목을 입력해주세요" } }`

## 계약/모델 참조

- 계약: [contracts/post-tickets.md](./contracts/post-tickets.md)
- 데이터 모델: [data-model.md](./data-model.md)
- 결정 사항: [research.md](./research.md)

> 구현 코드는 본 문서에 포함하지 않는다. 실제 작업 단위는 `/speckit.tasks` 산출물(tasks.md)을 따른다.
