# Tika 프론트엔드 구현 계획 (FRONTEND_TASKS.md)

> 기준 문서: [COMPONENT_SPEC.md](./COMPONENT_SPEC.md), [REQUIREMENTS.md](./REQUIREMENTS.md), [API_SPEC.md](./API_SPEC.md)
> 기능 명세: [specs/002-board-ui/spec.md](../specs/002-board-ui/spec.md)
> 원칙: [.specify/memory/constitution.md](../.specify/memory/constitution.md) (TypeScript strict, TDD, 계층 경계)
>
> **순서 원칙**: 말단(leaf) 컴포넌트 → 컨테이너 방향의 **bottom-up**.
> 각 단위는 **TDD(Red → Green → Refactor)** 로 구현하며, 하위 의존이 모두 Green인 뒤 상위로 올라간다.

---

## 0. 활용하는 기존 자산 (재구현 금지)

| 자산 | 경로 | 비고 |
|------|------|------|
| 공유 타입 | `src/shared/types/index.ts` | `Ticket`, `TicketWithMeta`, `BoardData`, `CreateTicketInput`, `UpdateTicketInput`, `ReorderTicketInput`, `COLUMN_ORDER`, `COLUMN_LABELS` 등 |
| 공유 검증 | `src/shared/validations/ticket.ts` | `createTicketSchema`, `updateTicketSchema` — **폼 검증 재사용** |
| API 호출 | `src/client/api/ticketApi.ts` | 현재 `fetchTickets`만 존재 → **확장 필요(Phase 0)** |
| 백엔드 | `src/app/api/...` | 구현 완료. 프론트는 호출만 |
| 핵심 스타일 | `src/styles/globals.css` | `.card`, `.badge--*`, `.chip--*`, `.btn--*`, `.column*`, `.filter-btn*`, `.modal-*`, `.board-*` 클래스 그대로 사용 |

**경계 규칙(헌법/CLAUDE.md)**: 본 작업은 `src/client/`에 한정한다. `src/server`·`app/api` 수정 금지. DB 직접 접근 금지. 모든 API는 `ticketApi.ts` 경유.

**제안 디렉토리 구조**
```
src/client/
├── api/ticketApi.ts          # 확장
├── lib/
│   ├── date.ts               # toDateString, getMonday, getSunday, isThisWeek, isOverdue
│   ├── filters.ts            # applyFilter(board, filter)
│   └── position.ts           # computeInsertPosition (낙관적 이동용)
├── hooks/useTickets.ts
└── components/
    ├── ui/                   # 원자 컴포넌트 (Badge, Button, Chip, Modal, ConfirmDialog, SearchInput)
    ├── ticket/               # TicketCard, TicketForm, TicketDetailView, TicketModal
    └── board/                # BoardHeader, FilterBar, Column, Board, BoardContainer
```
테스트: `__test__/client/**` 에 미러링 (RTL + jest-dom).

---

## 1. Phase 구성 (bottom-up)

| Phase | 그룹 | 산출물 | 선행 의존 | 관련 US |
|-------|------|--------|-----------|---------|
| **P0** | 기반(Foundations) | `ticketApi` 확장, `lib/date`, `lib/filters`, `lib/position` | 공유 타입/검증 | 전체 |
| **P1** | 원자(Atoms) | `Badge`, `Chip`, `Button`, `Modal`, `ConfirmDialog`, `SearchInput` | P0(일부 무관) | 전체 |
| **P2** | 티켓 분자(Molecules) | `TicketCard`, `TicketDetailView`, `TicketForm` | P1, 공유 검증 | US1,2,4,6 |
| **P3** | 섹션(Sections) | `FilterBar`, `BoardHeader` | P1 | US2,7 |
| **P4** | DnD 컨테이너 | `Column`, `Board` | P2 | US1,3 |
| **P5** | 상태/오케스트레이션 | `useTickets`, `TicketModal`, `BoardContainer` | P0,P2,P3,P4 | US2~7 |
| **P6** | 페이지 통합 & 마감 | `src/app/page.tsx`, 반응형/접근성 검증, 통합 테스트 | P5 | 전체 |

> **MVP 게이트**: P0+P1+P2(TicketCard)+P4(Column,Board)+P5(BoardContainer, 조회만)+P6 까지면 **US1(보드 조회)** 단독 동작. 이후 생성·DnD·수정·삭제·필터를 얹는다.

---

## 2. 의존성 그래프

```
                         [공유 types / validations]   (기존)
                                   │
   ┌───────────────────────────────┼───────────────────────────────┐
   ▼                                ▼                                ▼
P0 ticketApi(확장)            P0 lib/date                     P0 lib/position
   │                            │     │
   │                            │     └────────────┐
   │                            ▼                  │
   │                       P0 lib/filters          │
   │                                               │
P1 원자 ──────────────────────────────────────────┼──────────────┐
  Button   Modal─►ConfirmDialog   Badge   Chip   SearchInput      │
   │         │         │           │       │        │             │
   │         │         │           └───┬───┘        │             │
   │         │         │               ▼            │             │
   │         │         │        P2 TicketCard ◄─────┼──(useSortable, lib/date)
   │         │         │               │            │             │
   │         ▼         │               │            │             │
   │  P2 TicketDetailView              │            │             │
   │   │                               │            │             │
   ▼   ▼                               │            │             │
P2 TicketForm (Button+공유검증)         │            │             │
   │                                   ▼            ▼             │
   │                            P4 Column ◄── SortableContext     │
   │                                   │                          │
   │                                   ▼                          │
   │                            P4 Board ◄── DndContext/DragOverlay
   │                                   │                          │
   ├──────────────┐                    │                          │
   ▼              ▼                    │                          │
P3 BoardHeader  P3 FilterBar           │                          │
   │              │                    │                          │
   └──────┬───────┘                    │                          │
          │                            │                          │
          │   P5 useTickets ◄── ticketApi + lib/position ─────────┘
          │        │
          ▼        ▼
   P5 TicketModal (Modal+DetailView+Form+ConfirmDialog)
          │        │
          └────┬───┘
               ▼
       P5 BoardContainer (Header+FilterBar+Board+TicketModal+useTickets+filters)
               │
               ▼
       P6 src/app/page.tsx (서버 컴포넌트: 초기 데이터 → BoardContainer)
```

병렬 가능: `Badge`/`Chip`/`Button`/`SearchInput`은 서로 독립. `lib/*`는 UI와 독립적으로 먼저 끝낼 수 있다.

---

## 3. Phase별 상세 + 컴포넌트별 TDD 체크리스트

> 각 항목은 **Red(실패 테스트 먼저)** → **Green(최소 구현)** → **Refactor(개선·테스트 유지)** 순서.
> 테스트는 COMPONENT_SPEC의 Props/동작/접근성 명세를 그대로 검증 대상으로 삼는다.

### Phase 0 — 기반(Foundations)

#### 0.1 `ticketApi.ts` 확장
- [ ] **Red**: `create/update/remove/reorder/complete` 호출이 올바른 method·URL·body로 `fetch`를 부르고, 비정상 응답 시 throw 하는지 (fetch mock) 테스트
- [ ] **Green**: `createTicket(POST /api/tickets)`, `updateTicket(PATCH /api/tickets/:id)`, `deleteTicket(DELETE /api/tickets/:id)`, `reorderTicket(PATCH /api/tickets/reorder)`, `completeTicket(PATCH /api/tickets/:id/complete)` 구현. 반환 타입은 공유 타입 사용
- [ ] **Refactor**: 공통 `request` 헬퍼로 method/headers/에러 처리 통일 (`{ error: { code, message } }` 파싱)
- 명세: COMPONENT_SPEC §4 "API 호출 함수", API_SPEC.md

#### 0.2 `lib/date.ts`
- [ ] **Red**: `toDateString`, `getMonday`/`getSunday`(주 경계), `isOverdue(ticket)`(dueDate<today && status≠DONE), `isThisWeek(ticket)`(월~일 & TODO/IN_PROGRESS) 케이스 테스트 (경계값·null 포함)
- [ ] **Green**: 순수 함수 구현
- [ ] **Refactor**: 시간 기준 주입 가능하게(테스트 결정성)
- 명세: COMPONENT_SPEC 2.3 필터 로직, REQUIREMENTS FR-008

#### 0.3 `lib/filters.ts`
- [ ] **Red**: `applyFilter(board, 'all'|'thisWeek'|'overdue')`가 **Backlog는 항상 전체**, 메인 칼럼만 필터링하는지 테스트
- [ ] **Green**: 구현 (lib/date 사용)
- [ ] **Refactor**: 카운트 계산(`{ thisWeek, overdue }`) 함수 분리
- 명세: spec FR-014, COMPONENT_SPEC 2.3

#### 0.4 `lib/position.ts`
- [ ] **Red**: `computeInsertPosition(targetList, index)` — 맨앞(첫-1024)/맨뒤(마지막+1024)/사이((prev+next)/2)/빈칼럼(0) 테스트
- [ ] **Green**: 구현
- [ ] **Refactor**: 간격<1 재정렬 신호 반환 등 경계 처리
- 명세: REQUIREMENTS FR-007 position 재계산

---

### Phase 1 — 원자(Atoms) `components/ui/`

#### 1.1 `Badge` (우선순위)
- [ ] **Red**: `priority` props에 따라 `badge--low/medium/high` 클래스와 라벨이 렌더되는지
- [ ] **Green**: 구현 (`Props: { priority: TicketPriority }`)
- [ ] **Refactor**: 색상 매핑 상수화
- 명세: COMPONENT_SPEC §3 Badge, REQUIREMENTS §6

#### 1.2 `Chip` (완료표기일/오버듀)
- [ ] **Red**: 일반 칩 vs `overdue` 변형(`chip--overdue`) 렌더, 날짜 텍스트 표시 테스트
- [ ] **Green**: 구현 (`Props: { label; variant?: 'due'|'overdue' }`)
- [ ] **Refactor**: 아이콘 슬롯 옵션화
- 명세: 와이어프레임 칩, COMPONENT_SPEC 2.6

#### 1.3 `Button`
- [ ] **Red**: `variant(primary/secondary/danger/ghost)`·`size(sm/md/lg)`·`isLoading`(비활성+스피너)·`onClick` 테스트
- [ ] **Green**: 구현
- [ ] **Refactor**: `disabled || isLoading` 처리 일원화
- 명세: COMPONENT_SPEC §3 Button

#### 1.4 `Modal` (기반)
- [ ] **Red**: `isOpen` 토글 렌더, **ESC**·**바깥 클릭** 시 `onClose` 호출, 열림 시 body 스크롤 잠금(`no-scroll`) 테스트
- [ ] **Green**: 구현 (오버레이 + 패널, 포커스 트랩 기본)
- [ ] **Refactor**: 언마운트 시 스크롤락 해제 cleanup
- 명세: COMPONENT_SPEC §3 Modal, FR-015

#### 1.5 `ConfirmDialog`
- [ ] **Red**: 메시지 렌더, 확인/취소 콜백, 위험 동작은 `btn--danger` 테스트
- [ ] **Green**: 구현 (Modal + Button 조합)
- [ ] **Refactor**: 기본 문구/버튼 라벨 props화
- 명세: COMPONENT_SPEC §3 ConfirmDialog, FR-013

#### 1.6 `SearchInput` (MVP placeholder)
- [ ] **Red**: 비활성(disabled) placeholder로 렌더되는지
- [ ] **Green**: 최소 구현
- [ ] **Refactor**: 2차 구현 훅 지점 주석
- 명세: COMPONENT_SPEC 2.2 (2차 구현 예정)

---

### Phase 2 — 티켓 분자(Molecules) `components/ticket/`

#### 2.1 `TicketCard`
- [ ] **Red**:
  - 제목(1줄 말줄임)·설명·`Badge`(우선순위)·종료예정일(`Chip`) 표시
  - `isOverdue` 시 `card--overdue` 적용
  - 클릭 시 `onClick` 호출 / **드래그와 클릭 구분**(미세 이동은 클릭)
  - 접근성: `role="button"`, `aria-label="티켓: {title}"`, Tab 포커스·Enter로 열기
- [ ] **Green**: `useSortable`로 드래그 가능 구현, 드래그 중 `card--dragging`
- [ ] **Refactor**: 표시 로직(날짜 포맷, 오버듀)을 lib/date로 위임
- 명세: COMPONENT_SPEC 2.6, FR-003/004/017/018

#### 2.2 `TicketDetailView` (읽기 전용)
- [ ] **Red**: 상태·시작일·종료일·생성일을 읽기 전용으로 표시, 값 없으면 "-" 테스트
- [ ] **Green**: 구현
- [ ] **Refactor**: 날짜 포맷 공통화
- 명세: COMPONENT_SPEC 2.7 표시 필드, FR-011

#### 2.3 `TicketForm` (생성/수정)
- [ ] **Red**:
  - `mode='create'|'edit'` 필드 렌더 및 초기값 채움
  - **공유 Zod 스키마 검증** → 에러 메시지 인라인(제목 필수/200자, 설명 1000자, 과거 dueDate 등)
  - 제출 시 `onSubmit(data)` 호출, `isLoading` 시 버튼 비활성
- [ ] **Green**: 구현 (`createTicketSchema`/`updateTicketSchema` 재사용)
- [ ] **Refactor**: 필드→에러 매핑 일반화, create/edit 공통화
- 명세: COMPONENT_SPEC 2.8, FR-005/006, 공유 검증

---

### Phase 3 — 섹션(Sections) `components/board/`

#### 3.1 `FilterBar`
- [ ] **Red**: `이번주 업무`/`일정 초과` 버튼, `activeFilter` 시 `filter-btn--active`, 클릭 시 `onFilterChange` (재클릭 시 'all'로 토글), `counts` 표시
- [ ] **Green**: 구현
- [ ] **Refactor**: 필터 정의 배열화
- 명세: COMPONENT_SPEC 2.3, FR-014

#### 3.2 `BoardHeader`
- [ ] **Red**: `SearchInput`(비활성) + "새 업무" 버튼, 버튼 클릭 시 `onCreateClick`
- [ ] **Green**: 구현
- [ ] **Refactor**: 레이아웃 클래스(`board-header*`) 정리
- 명세: COMPONENT_SPEC 2.2, FR-005

---

### Phase 4 — DnD 컨테이너 `components/board/`

#### 4.1 `Column`
- [ ] **Red**:
  - `tickets`를 position 순서로 `TicketCard` 렌더, 헤더에 칼럼명+카드 수
  - 빈 칼럼 안내("이 칼럼에 티켓이 없습니다")
  - `useDroppable` 드롭 영역, 드롭 대상 하이라이트(`column--drop-active`)
  - BACKLOG는 사이드바 스타일(`column--sidebar`), 메인은 `column--main`
- [ ] **Green**: `SortableContext`로 칼럼 내 정렬 구현
- [ ] **Refactor**: 카드 키/순서 안정화
- 명세: COMPONENT_SPEC 2.5, FR-001/002

#### 4.2 `Board`
- [ ] **Red**: Backlog 사이드바 + TODO/In Progress/Done 3칼럼 배치, `onTicketClick` 전달, DragOverlay에 활성 카드 복제 표시
- [ ] **Green**: `DndContext`(onDragStart/Over/End는 props 콜백으로 위임) + `DragOverlay` 구현, 반응형 레이아웃(`board-layout`/`board-main`)
- [ ] **Refactor**: 칼럼 매핑을 `COLUMN_ORDER`로 일반화
- 명세: COMPONENT_SPEC 2.4, FR-001/007/016

---

### Phase 5 — 상태/오케스트레이션

#### 5.1 `hooks/useTickets.ts`
- [ ] **Red**:
  - `create/update/remove/reorder/complete` 각각: ① **낙관적 반영**(즉시 board 변경) ② API 호출 ③ 성공 시 서버 응답으로 확정 ④ **실패 시 백업 상태로 롤백 + error 설정**
  - `create`는 Backlog 맨 위 추가, `complete`는 Done 이동·completedAt, `reorder`는 status/position 반영(+startedAt 규칙은 서버 응답 반영)
- [ ] **Green**: `UseTicketsReturn` 인터페이스대로 구현 (`ticketApi`·`lib/position` 사용)
- [ ] **Refactor**: 낙관적 패턴(백업→적용→확정/롤백) 공통 래퍼로 추출
- 명세: COMPONENT_SPEC §4, FR-008/009/010, 낙관적 업데이트 패턴

#### 5.2 `TicketModal`
- [ ] **Red**: 열림/닫힘(`isOpen`/`onClose`), 상세(View)+수정(Form) 전환, 삭제 클릭 시 `ConfirmDialog`→확인 시 `onDelete`, 저장 시 `onUpdate`
- [ ] **Green**: 구현 (Modal+DetailView+Form+ConfirmDialog 조합)
- [ ] **Refactor**: 보기/편집 상태 머신 단순화
- 명세: COMPONENT_SPEC 2.7, FR-011/012/013/015

#### 5.3 `BoardContainer` (최상위 클라이언트 컴포넌트)
- [ ] **Red**:
  - `initialData`로 보드 렌더, `useTickets` 연동
  - DnD: `onDragEnd`에서 **대상=Done → complete**, **그 외 → reorder** 분기
  - "새 업무" → 생성 모달, 카드 클릭 → 상세 모달
  - 필터 상태 적용(`applyFilter`)이 Backlog 제외 메인에만 반영
  - 저장 실패 시 롤백 + 에러 안내
- [ ] **Green**: 상태(board/activeTicket/selectedTicket/isCreating/activeFilter) 관리 + 핸들러 구현
- [ ] **Refactor**: 핸들러 분리, 파생 데이터(필터 적용/카운트) 메모이즈
- 명세: COMPONENT_SPEC 2.1, §5 이벤트 흐름, FR 전반

---

### Phase 6 — 페이지 통합 & 마감

#### 6.1 `src/app/page.tsx` (서버 컴포넌트)
- [ ] **Red(통합)**: 초기 보드 데이터를 받아 `BoardContainer`에 주입하고 4칼럼이 렌더되는지 (통합 렌더 테스트)
- [ ] **Green**: 서버에서 초기 데이터 로드 → `BoardContainer initialData=` 전달
- [ ] **Refactor**: 로딩/빈 상태 경로 정리
- 명세: COMPONENT_SPEC §1 계층, FR-001

#### 6.2 통합 시나리오 테스트 (US 흐름)
- [ ] US1 보드 조회 / US2 생성 / US3 DnD(+complete, 롤백) / US4 수정 / US5 삭제 / US6 오버듀 / US7 필터 흐름을 RTL 통합 테스트로 검증
- [ ] 반응형(1024/768/360) 레이아웃 스냅샷·접근성(role/aria/키보드) 확인
- 명세: spec Acceptance Scenarios, REQUIREMENTS NFR-002/003

---

## 4. 진행 규칙 (헌법 §개발 워크플로 준수)

1. **하위 Green 전에 상위 시작 금지** — 그래프의 화살표 역방향으로만 진행.
2. **Red→Green→Refactor 분리** — 테스트와 구현을 한 번에 쓰지 않는다. 테스트 skip/삭제 금지.
3. **타입 안전** — `any` 금지, 공유 타입만 사용. 변경 필요 시 `src/shared` 먼저.
4. **경계 준수** — `src/client`만 수정. API는 `ticketApi.ts` 경유.
5. 각 Phase 종료 시 `npm test` 그린 유지, `/speckit.analyze`로 spec·plan·tasks 정합성 점검 권장.

---

## 5. 다음 단계

- 본 문서는 COMPONENT_SPEC 기반 **bottom-up 작업 계획**이다.
- SDD 정식 산출물로 옮기려면 `/speckit.plan`(기술 결정) → `/speckit.tasks`(의존성 순서 실행 단위)로 동기화한다.
- 구현 시작은 **Phase 0.1(ticketApi 확장)** 부터.
