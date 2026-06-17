# CLAUDE.md - Tika Project

## 프로젝트 개요
Tika는 티켓 기반 칸반 보드 TODO 앱이다.
Next.js App Router 기반으로, 프론트엔드와 백엔드를 디렉토리 수준에서 분리한다.
src/shared/에서 타입과 검증 스키마를 공유한다.

본 프로젝트는 **SDD(Spec-Driven Development, 명세 주도 개발)** 방식으로 진행한다.
모든 기능은 코드보다 명세(spec)를 먼저 작성하고, `specify → plan → tasks → implement`
사이클을 거쳐 구현한다. 명세가 단일 진실 공급원(Single Source of Truth)이며,
구현은 명세를 따른다. 코드와 명세가 충돌하면 명세를 먼저 바로잡는다.

## 프로젝트 구조
- app/api/         : 백엔드 진입점 (Route Handlers, 요청 파싱 + 응답만)
- src/server/      : 백엔드 로직 (services, db, middleware)
- src/client/      : 프론트엔드 로직 (components, hooks, api 호출)
- src/shared/      : 공유 타입, Zod 스키마, 상수
- docs/            : 제품/기술 명세 문서 (PRD, TRD 등)
- specs/           : SDD 기능 명세 (기능별 spec.md / plan.md / tasks.md)
- .specify/        : SDD 설정 (constitution, 템플릿, 워크플로, 스크립트)

## 기술 스택
- Framework: Next.js 15 (App Router)
- Language: TypeScript (strict mode)
- Frontend: React 19
- Styling: Tailwind CSS 4
- Drag & Drop: @dnd-kit/core + @dnd-kit/sortable
- ORM: Drizzle ORM
- DB: Vercel Postgres (Neon)
- Validation: Zod
- Testing: Jest + React Testing Library
- Deployment: Vercel

## 명세 문서 경로 (반드시 참조)

### 제품/기술 명세 (docs/)
- 제품 요구사항: /docs/PRD.md
- 기술 요구사항: /docs/TRD.md
- 상세 요구사항: /docs/REQUIREMENTS.md
- API 명세: /docs/API_SPEC.md
- 데이터 모델: /docs/DATA_MODEL.md
- 컴포넌트 명세: /docs/COMPONENT_SPEC.md
- 테스트 케이스: /docs/TEST_CASES.md

### SDD 산출물 (.specify/, specs/)
- 프로젝트 헌법: /.specify/memory/constitution.md (최우선 원칙, 모든 작업의 상위 규칙)
- 기능 명세: /specs/<feature>/spec.md (무엇을·왜)
- 구현 계획: /specs/<feature>/plan.md (어떻게·기술 결정)
- 작업 목록: /specs/<feature>/tasks.md (의존성 순서의 실행 단위)
- 템플릿: /.specify/templates/ (spec/plan/tasks/checklist/constitution)

## 코딩 컨벤션

### TypeScript (공통)
- strict 모드 사용
- any 사용 금지, unknown 사용 후 타입 가드
- 인터페이스는 I 접두사 없이 명사로 (예: Ticket, BoardData)
- enum 대신 const 객체 + typeof 패턴 사용
- 공유 타입은 반드시 @/shared/types에서 import

### 백엔드 (app/api/ + src/server/)
- Route Handler는 얇게: 요청 파싱 → 서비스 호출 → 응답 반환
- 비즈니스 로직은 src/server/services/에 작성
- Zod로 요청 검증 (shared/validations에서 import)
- 에러 응답 형식 통일: { error: { code, message } }
- HTTP 상태 코드: 200, 201, 204, 400, 404, 500
- DB 쿼리는 Drizzle ORM으로만 작성 (raw SQL 금지)

### 프론트엔드 (src/client/)
- 함수 컴포넌트 + 화살표 함수
- Props 타입은 컴포넌트 파일 내 정의
- API 호출은 src/client/api/ticketApi.ts를 통해서만
- 파일명: PascalCase (예: TicketCard.tsx)

### 경계 규칙
- 백엔드 작업 시(app/api/, src/server/) 프론트엔드(src/client/) 코드 수정 금지
- 프론트엔드 작업 시(src/client/) 백엔드(app/api/, src/server/) 코드 수정 금지
- 양쪽에 영향을 주는 변경은 src/shared/ 먼저 수정 후 각각 반영
- src/client/에서 직접 DB 접근 금지
- src/server/에서 React 관련 코드 작성 금지

## SDD 워크플로 규칙

### 핵심 사이클
모든 기능은 아래 순서를 따른다. 각 단계는 다음 단계의 입력이 되며,
검토 게이트(spec 검토, plan 검토)를 통과해야 다음 단계로 진행한다.

1. **/speckit.constitution** — 프로젝트 헌법 작성/갱신 (최초 1회 또는 원칙 변경 시)
2. **/speckit.specify** — 기능 명세(spec.md) 작성: 무엇을, 왜 (구현 방법은 적지 않음)
3. **/speckit.clarify** — 명세의 모호한 부분을 질문으로 해소 (plan 전 권장)
4. **/speckit.plan** — 구현 계획(plan.md) 작성: 기술 스택·아키텍처 결정
5. **/speckit.tasks** — 작업 목록(tasks.md) 생성: 의존성 순서의 실행 단위
6. **/speckit.analyze** — spec·plan·tasks 간 일관성 교차 검증 (tasks 후 권장)
7. **/speckit.implement** — tasks.md를 순서대로 실행하여 구현

### 반드시 지켜야 할 것
- 구현 전 반드시 해당 기능의 spec.md → plan.md → tasks.md가 존재해야 한다
- constitution.md의 원칙은 모든 명세·계획·구현보다 우선한다
- spec.md에는 "무엇을/왜"만, "어떻게"는 plan.md에 작성한다
- 구현은 tasks.md에 정의된 작업 단위와 순서를 따른다
- API 구현 시 API_SPEC.md, 컴포넌트 구현 시 COMPONENT_SPEC.md의 명세를 정확히 따른다
- 타입 변경 시 src/shared/types 먼저 수정한다

### 하지 말아야 할 것
- 명세(spec/plan/tasks)에 없는 기능 임의 추가 금지
- spec/plan/tasks 단계를 건너뛰고 곧바로 구현하는 것 금지
- 명세와 코드가 충돌할 때 코드에 맞춰 명세를 무단 수정 금지 (명세를 먼저 정정)
- 테스트 코드 삭제 또는 skip 금지
- any 타입 사용 금지
- console.log 커밋 금지 (디버깅 후 제거)

### 명세-구현 일관성 규칙
- 구현 중 명세 오류/누락 발견 시: 구현을 멈추고 해당 spec/plan을 먼저 수정한 뒤 재개
- 명세 변경은 하위 산출물에 전파한다: spec 변경 → plan 갱신 → tasks 갱신
- 기능 단위 작업이 끝나면 /speckit.analyze로 산출물 간 정합성을 확인한다

### TDD 사이클 규칙 (implement 단계 내부)
- Red 단계: 테스트 코드만 작성, 구현 코드 생성 금지
- Green 단계: 테스트를 통과하는 최소한의 코드만 작성, 테스트 코드 수정 금지
- Refactor 단계: 코드 개선만, 새 기능 추가 금지, 테스트는 반드시 통과 유지
- 테스트와 구현을 한 번에 작성하지 말 것 — 반드시 단계별로 진행
- 테스트 실패 시 구현을 수정할 것, 테스트를 수정하지 말 것 (명세 오류인 경우 명세 먼저 수정)

## 최근 변경사항 (최근 14일)
<!-- RECENT_CHANGES_START -->
- **2026-06-17** [main] TicketDetailView 날짜(ISO 문자열) 포맷 버그 수정 + 홈 force-dynamic(Vercel 빌드 대응) (3 files, +28/-3)
- **2026-06-17** [main] 디자인 토큰(colors.json)·스위밍레인 색/타이포·트렐로풍 보드·반응형·레이아웃 재구성 + TicketCard 접근성/성능(드래그 핸들·memo) + useTickets 재조회 왕복 제거·reconcile (17 files, +855/-349)
- **2026-06-17** [main] 보드 완성 — DnD(드롭 해석·position 계산)·낙관적 reorder/complete·필터·BoardContainer + page.tsx 서버 컴포넌트, 프리뷰/목 데이터 정리 (25 files, +1678/-463)
- **2026-06-15** [main] TicketForm/TicketDetailView/TicketModal TDD 구현(생성 폼·읽기전용 상세·2단계 삭제 모달) + 프리뷰 연동 (8 files, +756/-2)
- **2026-06-15** [main] 보드 UI(002-board-ui) 명세 + 칸반/공통 UI 컴포넌트 및 테스트 + 미리보기 페이지 추가 (28 files, +3320/-5)
- **2026-06-15** [main] /changelog 스킬 + 변경 이력 자동 기록 시스템 추가, tsbuildinfo 무시 (6 files, +~290/-1)
<!-- RECENT_CHANGES_END -->

<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan:
`specs/001-create-ticket/plan.md` (feature: 티켓 생성 / POST /api/tickets)
<!-- SPECKIT END -->


## 디자인 시스템
스타일링 작업 시 반드시 아래 파일들을 참조할 것:
 - 컬러 토큰 (참조): 'src/shared/design/colors.json'
 - 디자인 가이드: 'docs/DESIGN_SYSTEM.md'
 - CSS 변수 (런타임): 'app/globals.css' ':root'

새 컴포넌트 생성 시 colors.json의 semantic 컬러와 DESIGN_SYSTEM.md의 간격/그림자/라운딩 규칙을 따른다.
컬러 변경 시 colors.json과 globals.css의 CSS 변수를 함께 업데이트 한다.