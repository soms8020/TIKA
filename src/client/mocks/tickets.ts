// 프리뷰/테스트용 목(mock) 데이터 — DB 연결 없이 컴포넌트를 렌더링하기 위한 픽스처.
// 실제 API 응답 형태(TicketWithMeta / BoardData)와 동일하게 맞춘다.
//
// 분포: BACKLOG 2(HIGH 1) · TODO 3(isOverdue 1) · IN_PROGRESS 1 · DONE 1
import {
  TICKET_STATUS,
  TICKET_PRIORITY,
  type TicketWithMeta,
  type BoardData,
} from '@/shared/types';

const baseDates = {
  createdAt: new Date('2026-06-01T09:00:00Z'),
  updatedAt: new Date('2026-06-10T09:00:00Z'),
};

export const mockTickets: TicketWithMeta[] = [
  // --- BACKLOG (2) ---
  {
    id: 1,
    title: '디자인 시스템 토큰 정리',
    description: '우선순위/상태 색상 토큰을 globals.css로 통일',
    status: TICKET_STATUS.BACKLOG,
    priority: TICKET_PRIORITY.HIGH, // ← HIGH 우선순위
    position: 0,
    plannedStartDate: '2026-06-18',
    dueDate: '2026-06-25',
    startedAt: null,
    completedAt: null,
    ...baseDates,
    isOverdue: false,
  },
  {
    id: 2,
    title: '백로그 사이드바 레이아웃',
    description: '좌측 고정 사이드바 + 별도 스크롤',
    status: TICKET_STATUS.BACKLOG,
    priority: TICKET_PRIORITY.MEDIUM,
    position: 1024,
    plannedStartDate: null,
    dueDate: null,
    startedAt: null,
    completedAt: null,
    ...baseDates,
    isOverdue: false,
  },

  // --- TODO (3, 하나는 오버듀) ---
  {
    id: 3,
    title: '오버듀 카드 표시 — 기한 지남',
    description: '종료예정일이 지난 미완료 티켓',
    status: TICKET_STATUS.TODO,
    priority: TICKET_PRIORITY.HIGH,
    position: 0,
    plannedStartDate: '2026-06-05',
    dueDate: '2026-06-09',
    startedAt: null,
    completedAt: null,
    ...baseDates,
    isOverdue: true, // ← 오버듀
  },
  {
    id: 4,
    title: '보드 조회 API 연동',
    description: 'GET /api/tickets 결과를 칼럼별로 표시',
    status: TICKET_STATUS.TODO,
    priority: TICKET_PRIORITY.MEDIUM,
    position: 1024,
    plannedStartDate: '2026-06-16',
    dueDate: '2026-06-22',
    startedAt: null,
    completedAt: null,
    ...baseDates,
    isOverdue: false,
  },
  {
    id: 5,
    title: '필터 바 구현',
    description: '이번주 업무 / 일정 초과 필터',
    status: TICKET_STATUS.TODO,
    priority: TICKET_PRIORITY.LOW,
    position: 2048,
    plannedStartDate: null,
    dueDate: null,
    startedAt: null,
    completedAt: null,
    ...baseDates,
    isOverdue: false,
  },

  // --- IN_PROGRESS (1) ---
  {
    id: 6,
    title: '드래그앤드롭 정렬',
    description: '@dnd-kit으로 칼럼 간/내 이동',
    status: TICKET_STATUS.IN_PROGRESS,
    priority: TICKET_PRIORITY.MEDIUM,
    position: 0,
    plannedStartDate: '2026-06-12',
    dueDate: '2026-06-20',
    startedAt: new Date('2026-06-12T09:00:00Z'),
    completedAt: null,
    ...baseDates,
    isOverdue: false,
  },

  // --- DONE (1) ---
  {
    id: 7,
    title: '완료 처리 흐름',
    description: 'Done 이동 시 completedAt 기록',
    status: TICKET_STATUS.DONE,
    priority: TICKET_PRIORITY.LOW,
    position: 0,
    plannedStartDate: '2026-06-02',
    dueDate: '2026-06-08',
    startedAt: new Date('2026-06-03T09:00:00Z'),
    completedAt: new Date('2026-06-08T15:00:00Z'),
    ...baseDates,
    isOverdue: false,
  },
];

// 보드 전체 시연용 — 칼럼별 그룹화 (Board/Column/BoardContainer 프리뷰에 사용)
export const mockBoard: BoardData = {
  BACKLOG: mockTickets.filter((t) => t.status === TICKET_STATUS.BACKLOG),
  TODO: mockTickets.filter((t) => t.status === TICKET_STATUS.TODO),
  IN_PROGRESS: mockTickets.filter((t) => t.status === TICKET_STATUS.IN_PROGRESS),
  DONE: mockTickets.filter((t) => t.status === TICKET_STATUS.DONE),
};
