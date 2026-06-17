// TDD Red — lib/filters (FRONTEND_TASKS 0.3, COMPONENT_SPEC §2.3, FR-014)
// 대상(미구현): src/client/lib/filters.ts
//   applyFilter(board, 'all'|'thisWeek'|'overdue') — Backlog 는 항상 전체, 메인 칼럼만 필터
//   filterCounts(board) — { thisWeek, overdue } 카운트
import {
  TICKET_STATUS,
  TICKET_PRIORITY,
  type BoardData,
  type TicketWithMeta,
} from '@/shared/types';
import { applyFilter, filterCounts } from '@/client/lib/filters';

const card = (
  id: number,
  status: TicketWithMeta['status'],
  overrides: Partial<TicketWithMeta> = {},
): TicketWithMeta => ({
  id,
  title: `t${id}`,
  description: null,
  status,
  priority: TICKET_PRIORITY.MEDIUM,
  position: 0,
  plannedStartDate: null,
  dueDate: null,
  startedAt: null,
  completedAt: null,
  createdAt: new Date('2026-06-01'),
  updatedAt: new Date('2026-06-01'),
  isOverdue: false,
  ...overrides,
});

// 2026-06-17(수) 기준 주: 월 2026-06-15 ~ 일 2026-06-21
const FIXED_NOW = new Date('2026-06-17T12:00:00Z');

const makeBoard = (): BoardData => ({
  BACKLOG: [card(10, TICKET_STATUS.BACKLOG, { dueDate: '2026-06-18' })],
  TODO: [
    card(1, TICKET_STATUS.TODO, { dueDate: '2026-06-18' }), // 이번주
    card(2, TICKET_STATUS.TODO, { dueDate: '2026-06-09', isOverdue: true }), // 오버듀
    card(3, TICKET_STATUS.TODO, { dueDate: null }), // 둘 다 아님
  ],
  IN_PROGRESS: [card(4, TICKET_STATUS.IN_PROGRESS, { dueDate: '2026-06-20' })], // 이번주
  DONE: [card(5, TICKET_STATUS.DONE)],
});

beforeAll(() => {
  jest.useFakeTimers().setSystemTime(FIXED_NOW);
});
afterAll(() => {
  jest.useRealTimers();
});

describe('applyFilter', () => {
  it("'all' 은 board 를 그대로 반환한다", () => {
    const board = makeBoard();
    expect(applyFilter(board, 'all')).toBe(board);
  });

  it("'overdue' 는 메인 칼럼에서 isOverdue 만 남기고 Backlog 는 전체 유지", () => {
    const result = applyFilter(makeBoard(), 'overdue');
    expect(result.TODO.map((t) => t.id)).toEqual([2]);
    expect(result.IN_PROGRESS).toHaveLength(0);
    expect(result.BACKLOG.map((t) => t.id)).toEqual([10]); // Backlog 불변
  });

  it("'thisWeek' 는 이번주 dueDate 의 TODO/IN_PROGRESS 만 남기고 Backlog 는 전체 유지", () => {
    const result = applyFilter(makeBoard(), 'thisWeek');
    expect(result.TODO.map((t) => t.id)).toEqual([1]);
    expect(result.IN_PROGRESS.map((t) => t.id)).toEqual([4]);
    expect(result.DONE).toHaveLength(0);
    expect(result.BACKLOG.map((t) => t.id)).toEqual([10]); // Backlog 불변
  });
});

describe('filterCounts', () => {
  it('thisWeek / overdue 카운트를 계산한다 (Backlog 제외)', () => {
    expect(filterCounts(makeBoard())).toEqual({ thisWeek: 2, overdue: 1 });
  });
});
