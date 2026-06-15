<!--
Sync Impact Report
==================
Version change: (template/unversioned) → 1.0.0
Bump rationale: Initial ratification — template placeholders replaced with concrete
                principles. First governed version of the Tika constitution.

Modified principles:
  - [PRINCIPLE_1_NAME] → I. TypeScript Strict 타입 안전성
  - [PRINCIPLE_2_NAME] → II. API 응답 명세 준수
  - [PRINCIPLE_3_NAME] → III. 통일된 에러 응답 형식
  - [PRINCIPLE_4_NAME] → IV. Zod 요청 검증
  - [PRINCIPLE_5_NAME] → V. 서비스 계층 분리

Added sections:
  - 기술 제약 (Technology Constraints)
  - 개발 워크플로 (Development Workflow)

Removed sections: none (template section slots repurposed)

Templates requiring updates:
  - ✅ .specify/templates/plan-template.md (Constitution Check는 헌법을 동적 참조 — 변경 불필요)
  - ✅ .specify/templates/spec-template.md (구현 비종속 — 변경 불필요)
  - ✅ .specify/templates/tasks-template.md (경로/카테고리 일반 placeholder — 변경 불필요)
  - ✅ CLAUDE.md (SDD 워크플로 및 코딩 컨벤션과 일관)

Deferred TODOs: none
-->

# Tika Constitution

티켓 기반 칸반 보드 TODO 앱 **Tika**의 최상위 규범이다.
모든 명세(spec)·계획(plan)·작업(tasks)·구현은 본 헌법을 따르며,
충돌 시 헌법이 우선한다.

## Core Principles

### I. TypeScript Strict 타입 안전성

TypeScript는 strict 모드로만 작성한다. 이는 협상 불가(NON-NEGOTIABLE)다.

- `tsconfig`의 `strict`는 항상 활성화하며 비활성화 금지.
- `any` 사용 금지. 외부/불확실 값은 `unknown`으로 받고 타입 가드 후 사용.
- 공유 타입은 반드시 `@/shared/types`에서 import 하며 중복 정의 금지.
- 타입 오류가 있는 코드는 머지 금지.

**Rationale**: 프론트엔드·백엔드가 `src/shared/`로 타입을 공유하는 구조에서
타입 안전성은 계층 간 계약의 신뢰성을 보장하는 최소 조건이다.

### II. API 응답 명세 준수

모든 API 응답은 `docs/API_SPEC.md`에 정의된 형식을 정확히 따른다.

- 응답 본문 구조·필드명·HTTP 상태 코드는 API_SPEC.md와 일치해야 한다.
- 명세에 없는 응답 형식을 임의로 추가하지 않는다.
- 명세와 구현이 다르면 API_SPEC.md를 먼저 정정한 뒤 구현을 맞춘다.

**Rationale**: API_SPEC.md가 클라이언트-서버 계약의 단일 진실 공급원이며,
명세 우선 원칙(SDD)을 API 경계에서 강제한다.

### III. 통일된 에러 응답 형식

모든 에러 응답은 `{ error: { code, message } }` 형식을 사용한다.

- 성공 응답과 에러 응답의 형식을 혼용하지 않는다.
- `code`는 식별 가능한 에러 코드, `message`는 사람이 읽을 수 있는 설명으로 채운다.
- 허용 HTTP 상태 코드: 200, 201, 204, 400, 404, 500.

**Rationale**: 일관된 에러 구조는 클라이언트의 에러 처리 로직을 단순·예측 가능하게 만들고,
디버깅과 사용자 피드백의 품질을 보장한다.

### IV. Zod 요청 검증

모든 들어오는 요청은 Zod 스키마로 검증한다.

- 검증 스키마는 `src/shared/`(validations)에 정의하고 Route Handler에서 사용한다.
- 검증되지 않은 요청 본문/쿼리/파라미터를 비즈니스 로직에 전달 금지.
- 검증 실패는 원칙 III의 에러 형식(상태 코드 400)으로 응답한다.

**Rationale**: 신뢰할 수 없는 입력을 경계에서 차단해야 타입 안전성(원칙 I)이
런타임까지 유지되며, 공유 스키마는 타입과 검증의 단일 출처가 된다.

### V. 서비스 계층 분리

비즈니스 로직은 반드시 `src/server/services/`에 분리한다.

- Route Handler(`app/api/`)는 얇게 유지한다: 요청 파싱 → 서비스 호출 → 응답 반환.
- 비즈니스 규칙·도메인 로직을 Route Handler나 클라이언트에 작성 금지.
- DB 접근은 services를 통해 Drizzle ORM으로만 수행하며 raw SQL 금지.

**Rationale**: 진입점과 도메인 로직의 분리는 테스트 가능성과 재사용성을 높이고,
프론트엔드/백엔드 경계 규칙을 구조적으로 강제한다.

## 기술 제약 (Technology Constraints)

- Framework: Next.js 15 (App Router) / React 19 / TypeScript strict.
- ORM: Drizzle ORM (raw SQL 금지) / DB: Vercel Postgres (Neon).
- Validation: Zod / Styling: Tailwind CSS 4 / DnD: @dnd-kit.
- 계층 경계: `app/api`·`src/server`(백엔드), `src/client`(프론트엔드),
  `src/shared`(공유)를 침범하지 않는다. 양쪽 영향 변경은 `src/shared` 먼저 수정.
- `src/client`의 직접 DB 접근 금지, `src/server`의 React 코드 작성 금지.

## 개발 워크플로 (Development Workflow)

- SDD 사이클을 따른다: `specify → plan → tasks → implement`.
  spec/plan/tasks 없이 구현 시작 금지.
- 구현 단계에서는 TDD를 적용한다: 테스트 우선(Red) → 최소 구현(Green) → 리팩터(Refactor).
  테스트 삭제·skip 금지. 테스트 실패 시 구현을 고치고, 명세 오류면 명세를 먼저 정정.
- plan 작성 시 본 헌법의 Constitution Check 게이트를 통과해야 한다.
  위반이 불가피하면 plan의 Complexity Tracking에 사유를 명시한다.
- `console.log` 등 디버깅 코드 커밋 금지.

## Governance

- 본 헌법은 다른 모든 관행·문서보다 우선한다. 명세·계획·작업·구현은 헌법을 준수해야 하며,
  모든 리뷰는 준수 여부를 확인한다.
- 개정은 변경 내용·근거를 문서화하고 아래 정책에 따라 버전을 증가시킨다:
  - MAJOR: 원칙의 제거 또는 하위 호환을 깨는 거버넌스 변경.
  - MINOR: 원칙/섹션 추가 또는 실질적 지침 확장.
  - PATCH: 문구 명확화, 오타 수정 등 비의미적 변경.
- 헌법 개정 시 의존 템플릿(plan/spec/tasks)과 CLAUDE.md의 정합성을 함께 점검한다.
- 런타임 개발 지침은 `CLAUDE.md`를 참조한다.

## Guardrails (절대 준수 사항)
AI코딩 에이전트가 실수로 위함한 작업을 수행하지 않도록 명시적으로 금지하는 규칙들이다.
**이 규칙들은 어떤 상황에서도 위반할 수 없다. **

### 데이터베이스 금지 명령어
 - 'DROP TABLE', 'DROP DATABASE' -- 절대 금지
 - 'TRUNCATE' -- 절대 금지
 - 'DELETE FROM' (WHERE절 없이) -- 절대 금지
 - 'ALTER TABLE DROP COLUMN' -- 사용자 명시적 허가 필요
### 데이터베이스 안전 규칙
 - 삭제/리셋 작업 시 반드시 사용자 승인 요청
 - 삭제 전 백업 또는 복구 방법 안내
 - 테스트 데이터 존재 시 DB리셋 대신 SQL로 해결
 - 운영 DB 자동 변경 절대 금지

### Git 금지 명령어
  - 'git push --force' -- 절대 금지
  - 'git reset --hard' -- 절대 금지
  - 'git clean -fd' -- 사용자 확인 필요
  - 'git branch -D' (main/master) -- 절대 금지

### 패키지 관리 금지 명령어
   - 'npm audit fix --force' -- 절대 금지
   - 'rm -rf node_modules && npm install' -- 사용자 확인 필요
   - 메이저 버전 자동 업그레이드 -- 절대 금지

### 파일 시스템 금지 명령어
  - 'rm -rf /' 또는 루트 경로 삭제 -- 절대 금지
  - 프로젝트 외부 파일 수정 -- 절대 금지
  - '.env' 파일 삭제 -- 사용자 확인 필요
  - 'src/' 디렉토리 전체 삭제 -- 절대 금지

### 안전 작업 원칙 
 - 파괴적 작업(삭제, 초기화) 전 반드시 사용자 확인
 - 복구 불가능한 작업은 백업 방법 먼저 안내
 - 자동화된 스크립트의 파괴적 명령 실행 금지
 - 의심스러운 작업은 실행 전 사용자에게 설명 및 확인

**Version**: 1.0.0 | **Ratified**: 2026-06-15 | **Last Amended**: 2026-06-15
