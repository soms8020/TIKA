// boardDnd — 드래그앤드롭 드롭 위치 해석 + 낙관적 보드 변형 (COMPONENT_SPEC §5.1, FR-007)
// 순수 함수 모음. board 는 불변으로 다루고 항상 새 객체를 반환한다.
import {
  TICKET_STATUS,
  COLUMN_ORDER,
  type BoardData,
  type TicketStatus,
  type TicketWithMeta,
} from '@/shared/types';
import { computeInsertPosition } from './position';

export function findTicket(
  board: BoardData,
  id: number,
): TicketWithMeta | undefined {
  for (const status of COLUMN_ORDER) {
    const found = board[status].find((t) => t.id === id);
    if (found) return found;
  }
  return undefined;
}

function isStatus(id: number | string): id is TicketStatus {
  return (COLUMN_ORDER as string[]).includes(id as string);
}

// board 에서 ticketId 를 모든 칼럼에서 제거한 새 board
function boardWithout(board: BoardData, ticketId: number): BoardData {
  return {
    BACKLOG: board.BACKLOG.filter((t) => t.id !== ticketId),
    TODO: board.TODO.filter((t) => t.id !== ticketId),
    IN_PROGRESS: board.IN_PROGRESS.filter((t) => t.id !== ticketId),
    DONE: board.DONE.filter((t) => t.id !== ticketId),
  };
}

export interface DropTarget {
  status: TicketStatus;
  position: number;
}

// 드롭 이벤트(active/over id)를 대상 칼럼·position 으로 변환. 이동 불필요 시 null.
// overId 는 칼럼(상태 문자열) 또는 카드(티켓 id) 일 수 있다.
export function resolveDrop(
  board: BoardData,
  activeId: number,
  overId: number | string,
): DropTarget | null {
  if (activeId === overId) return null;
  const active = findTicket(board, activeId);
  if (!active) return null;

  let status: TicketStatus;
  let overTicketId: number | null = null; // 카드 위 드롭이면 그 카드 id
  if (isStatus(overId)) {
    status = overId;
  } else {
    overTicketId = Number(overId);
    const over = findTicket(board, overTicketId);
    if (!over) return null;
    status = over.status;
  }

  // active 를 제외한 대상 칼럼 목록 기준으로 삽입 index 를 정한다.
  const targetList = board[status].filter((t) => t.id !== activeId);
  let index: number;
  if (overTicketId === null) {
    index = targetList.length; // 칼럼 빈 영역 → 맨 뒤
  } else {
    const i = targetList.findIndex((t) => t.id === overTicketId);
    index = i < 0 ? targetList.length : i;
  }

  return { status, position: computeInsertPosition(targetList, index) };
}

// 낙관적 이동: ticketId 를 toStatus/position 으로 옮긴 새 board 를 반환한다.
export function moveTicket(
  board: BoardData,
  ticketId: number,
  toStatus: TicketStatus,
  position: number,
): BoardData {
  const active = findTicket(board, ticketId);
  if (!active) return board;

  const next = boardWithout(board, ticketId);
  const moved: TicketWithMeta = {
    ...active,
    status: toStatus,
    position,
    isOverdue: toStatus === TICKET_STATUS.DONE ? false : active.isOverdue,
  };
  next[toStatus] = [...next[toStatus], moved].sort(
    (a, b) => a.position - b.position,
  );
  return next;
}

// 낙관적 완료: ticketId 를 DONE 맨 위로 옮기고 completedAt 을 설정한 새 board 를 반환한다.
export function completeOnBoard(board: BoardData, ticketId: number): BoardData {
  const active = findTicket(board, ticketId);
  if (!active) return board;

  const next = boardWithout(board, ticketId);
  const topPosition = (next.DONE[0]?.position ?? 1024) - 1024;
  const done: TicketWithMeta = {
    ...active,
    status: TICKET_STATUS.DONE,
    position: topPosition,
    isOverdue: false,
    completedAt: new Date(),
  };
  next.DONE = [done, ...next.DONE];
  return next;
}
