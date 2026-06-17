// lib/filters — 보드 필터링 + 카운트 (COMPONENT_SPEC §2.3, FR-014)
// Backlog 는 항상 전체 표시하고, 메인 칼럼(TODO/IN_PROGRESS/DONE)만 필터링한다.
import { type BoardData, type TicketWithMeta } from '@/shared/types';
import { isThisWeek } from './date';

export type FilterKey = 'all' | 'thisWeek' | 'overdue';

const isOverdue = (t: TicketWithMeta): boolean => t.isOverdue;

export function applyFilter(board: BoardData, filter: FilterKey): BoardData {
  if (filter === 'all') return board;
  const pred = filter === 'overdue' ? isOverdue : (t: TicketWithMeta) => isThisWeek(t);
  return {
    BACKLOG: board.BACKLOG, // 필터 미적용 (항상 전체)
    TODO: board.TODO.filter(pred),
    IN_PROGRESS: board.IN_PROGRESS.filter(pred),
    DONE: board.DONE.filter(pred),
  };
}

export function filterCounts(
  board: BoardData,
): { thisWeek: number; overdue: number } {
  const main = [...board.TODO, ...board.IN_PROGRESS, ...board.DONE];
  return {
    thisWeek: main.filter((t) => isThisWeek(t)).length,
    overdue: main.filter(isOverdue).length,
  };
}
