# Research: 티켓 생성 (Create Ticket)

Phase 0 — spec/plan의 미해결 항목 및 기술 결정 정리.

## D1. 빈 Backlog 칼럼의 position 결정

- **Decision**: `position = (MIN(position) ?? 1024) - 1024`. 즉 칼럼이 비어 있으면 `0`, 티켓이 있으면 `min - 1024`.
- **Rationale**: API_SPEC.md(§POST 처리 규칙)와 DATA_MODEL.md §5.5는 "min(position) - 1024 (맨 위 배치)"를 규정한다. 빈 칼럼 케이스는 명시되지 않았으나, DATA_MODEL.md 시드 데이터의 칼럼별 첫 티켓 position이 `0`이므로 빈 칼럼의 첫 티켓도 `0`이 되도록 sentinel을 `1024`로 둔다.
- **Alternatives considered**: DB 기본값 `1` 사용 → 시드/명세의 0 관례와 불일치하여 기각. `null 시 0 고정` → 동일 결과지만 `(min ?? 1024) - 1024` 공식이 분기 없이 단순하여 채택.

## D2. dueDate "오늘 이후"의 기준 시각

- **Decision**: API_SPEC.md의 Zod 스키마를 그대로 사용한다 — `val >= new Date().toISOString().split('T')[0]`. "오늘"은 UTC 기준 날짜이며 오늘 당일을 허용(포함)한다.
- **Rationale**: 헌법 II/IV에 따라 API_SPEC.md의 공유 스키마가 단일 출처다. 명세에 정의된 비교식을 변형하지 않는다.
- **알려진 편차**: API_SPEC 헤더의 Timezone은 Asia/Seoul이나 위 비교는 UTC 날짜를 사용한다. KST 자정~09:00 구간에서 경계 오판 가능. MVP 범위에서는 명세 스키마를 우선하고, 추후 타임존 정합은 별도 이슈로 다룬다(본 기능 범위 외).

## D3. 공유 타입(`src/shared/types/index.ts`) 정정

- **Decision**: 현재 파일의 축약된 `Ticket` 타입(`id: string`, 다수 필드 누락)을 DATA_MODEL.md §4 정의로 교체한다(상태/우선순위 const 객체 + 파생 타입, `Ticket`, `TicketWithMeta`, `CreateTicketInput` 등).
- **Rationale**: 헌법 I(공유 타입 단일 정의)·II(API 응답 일치). DB 스키마(`id: serial` → number)·API 응답과 타입이 일치해야 strict 빌드와 계층 계약이 성립한다. 양쪽 경계에 영향 → shared를 가장 먼저 수정.
- **Alternatives considered**: 기능별 로컬 타입 정의 → 헌법 I 위반으로 기각.

## D4. DB 클라이언트 경로 불일치 → 해결됨

- **Decision**: 명세(DATA_MODEL.md/TRD.md)가 단일 출처이므로 코드를 명세에 맞춰 `src/server/db/index.ts`로 통일했다. import 경로는 `@/server/db`. 기존 `client.ts`는 제거.
- **Rationale**: 헌법상 명세가 SSOT이며 코드가 명세를 따른다. `index.ts`는 모듈 진입점 관례와도 일치.
- **상태**: 해결 완료 (T015). 서비스/테스트 import 갱신 및 빌드·테스트 통과 확인.

## D5. Route Handler 검증 실패 시 메시지 선택

- **Decision**: `safeParse` 실패 시 `error.issues[0].message`를 에러 응답 message로 사용하고 code는 `VALIDATION_ERROR`로 고정한다.
- **Rationale**: API_SPEC.md는 각 검증 실패에 단일 한국어 메시지를 정의한다. 여러 필드 동시 오류 시 우선순위는 명세에 없으므로 Zod의 이슈 순서(스키마 정의 순서)를 따른다.
- **Alternatives considered**: 모든 이슈 배열 반환 → API_SPEC 에러 형식(`message` 단일 문자열)과 불일치하여 기각.

## D6. 테스트 전략 (Drizzle 의존성 격리)

- **Decision**: 서비스 단위 테스트는 DB 모듈(`src/server/db`)을 모킹하여 비즈니스 규칙(position 계산·기본값)을 검증한다. Route 통합 테스트는 서비스 계층을 모킹하여 핸들러의 검증·상태코드·응답 형식을 검증한다.
- **Rationale**: 실제 DB 없이도 TDD Red/Green을 빠르게 돌릴 수 있고 계층 분리(헌법 V)의 검증 가능성을 살린다. `.env.test`가 있으므로 통합 e2e는 선택적으로 추가 가능.
- **Alternatives considered**: 모든 테스트를 실 DB로 → 느리고 환경 의존적이라 단위 레벨에서는 기각.

## 미해결 항목

없음 — 모든 NEEDS CLARIFICATION 해소됨.
