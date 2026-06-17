// TDD Red — boardDnd: 드롭 위치 해석 + 낙관적 보드 변형 (COMPONENT_SPEC §5.1, FR-007)
// 대상(미구현): src/client/lib/boardDnd.ts
//   resolveDrop(board, activeId, overId) → { status, position } | null
//   moveTicket(board, ticketId, toStatus, position) → 새 BoardData (낙관적 이동)
//   completeOnBoard(board, ticketId) → 새 BoardData (Done 으로 낙관적 완료)
import {
  TICKET_STATUS,
  TICKET_PRIORITY,
  type BoardData,
  type TicketWithMeta,
} from '@/shared/types';
import {
  resolveDrop,
  moveTicket,
  completeOnBoard,
  withOverdue,
  upsertTicket,
  removeTicketById,
  applyReorderResult,
} from '@/client/lib/boardDnd';

const card = (
  id: number,
  status: TicketWithMeta['status'],
  position: number,
  overrides: Partial<TicketWithMeta> = {},
): TicketWithMeta => ({
  id,
  title: `t${id}`,
  description: null,
  status,
  priority: TICKET_PRIORITY.MEDIUM,
  position,
  plannedStartDate: null,
  dueDate: null,
  startedAt: null,
  completedAt: null,
  createdAt: new Date('2026-06-01'),
  updatedAt: new Date('2026-06-01'),
  isOverdue: false,
  ...overrides,
});

const makeBoard = (): BoardData => ({
  BACKLOG: [card(4, TICKET_STATUS.BACKLOG, 0)],
  TODO: [
    card(1, TICKET_STATUS.TODO, 0),
    card(2, TICKET_STATUS.TODO, 1024),
    card(5, TICKET_STATUS.TODO, 2048),
  ],
  IN_PROGRESS: [card(3, TICKET_STATUS.IN_PROGRESS, 0)],
  DONE: [],
});

describe('resolveDrop', () => {
  it('빈/다른 칼럼(상태 id)에 드롭하면 그 칼럼 맨 뒤 position 을 계산한다', () => {
    expect(resolveDrop(makeBoard(), 1, TICKET_STATUS.IN_PROGRESS)).toEqual({
      status: TICKET_STATUS.IN_PROGRESS,
      position: 1024, // [t3(0)] 뒤 → 0 + 1024
    });
  });

  it('다른 칼럼의 카드 위에 드롭하면 그 카드 앞에 삽입한다', () => {
    expect(resolveDrop(makeBoard(), 1, 3)).toEqual({
      status: TICKET_STATUS.IN_PROGRESS,
      position: -1024, // t3(0) 앞 → 0 - 1024
    });
  });

  it('같은 칼럼 내 카드 사이로 이동하면 (prev+next)/2 이다', () => {
    // t1 을 t5 위로 → active 제외 목록 [t2(1024), t5(2048)] 의 index 1 → 1536
    expect(resolveDrop(makeBoard(), 1, 5)).toEqual({
      status: TICKET_STATUS.TODO,
      position: 1536,
    });
  });

  it('빈 DONE 칼럼에 드롭하면 position 0 을 반환한다', () => {
    expect(resolveDrop(makeBoard(), 1, TICKET_STATUS.DONE)).toEqual({
      status: TICKET_STATUS.DONE,
      position: 0,
    });
  });

  it('자기 자신 위에 드롭하면 null 이다', () => {
    expect(resolveDrop(makeBoard(), 1, 1)).toBeNull();
  });

  it('존재하지 않는 티켓이면 null 이다', () => {
    expect(resolveDrop(makeBoard(), 999, TICKET_STATUS.TODO)).toBeNull();
  });
});

describe('moveTicket', () => {
  it('티켓을 다른 칼럼으로 옮기고 position 으로 정렬한다', () => {
    const next = moveTicket(makeBoard(), 1, TICKET_STATUS.IN_PROGRESS, 1024);

    expect(next.TODO.map((t) => t.id)).toEqual([2, 5]);
    const moved = next.IN_PROGRESS.find((t) => t.id === 1);
    expect(moved?.status).toBe(TICKET_STATUS.IN_PROGRESS);
    expect(moved?.position).toBe(1024);
    expect(next.IN_PROGRESS.map((t) => t.id)).toEqual([3, 1]); // position 0, 1024
  });

  it('원본 board 를 변형하지 않는다(불변)', () => {
    const board = makeBoard();
    moveTicket(board, 1, TICKET_STATUS.IN_PROGRESS, 1024);
    expect(board.TODO.map((t) => t.id)).toEqual([1, 2, 5]);
  });

  it('존재하지 않는 티켓이면 board 를 그대로 반환한다', () => {
    const board = makeBoard();
    expect(moveTicket(board, 999, TICKET_STATUS.TODO, 0)).toBe(board);
  });
});

describe('completeOnBoard', () => {
  it('티켓을 DONE 으로 옮기고 completedAt 을 설정한다', () => {
    const next = completeOnBoard(makeBoard(), 1);

    expect(next.TODO.map((t) => t.id)).toEqual([2, 5]);
    const done = next.DONE.find((t) => t.id === 1);
    expect(done?.status).toBe(TICKET_STATUS.DONE);
    expect(done?.completedAt).toBeInstanceOf(Date);
    expect(done?.isOverdue).toBe(false);
  });
});

describe('withOverdue', () => {
  it('과거 dueDate + 미완료 티켓이면 isOverdue=true', () => {
    expect(
      withOverdue(card(1, TICKET_STATUS.TODO, 0, { dueDate: '2020-01-01' })).isOverdue,
    ).toBe(true);
  });

  it('DONE 이거나 dueDate 가 없으면 isOverdue=false', () => {
    expect(
      withOverdue(card(1, TICKET_STATUS.DONE, 0, { dueDate: '2020-01-01' })).isOverdue,
    ).toBe(false);
    expect(withOverdue(card(1, TICKET_STATUS.TODO, 0, { dueDate: null })).isOverdue).toBe(false);
  });
});

describe('upsertTicket', () => {
  it('새 티켓을 status 칼럼에 position 정렬로 삽입한다', () => {
    const next = upsertTicket(makeBoard(), card(99, TICKET_STATUS.TODO, 512));
    expect(next.TODO.map((t) => t.id)).toEqual([1, 99, 2, 5]); // 0,512,1024,2048
  });

  it('이미 존재하는 id 는 교체(칼럼 이동 포함)한다', () => {
    const next = upsertTicket(makeBoard(), card(1, TICKET_STATUS.IN_PROGRESS, 2048));
    expect(next.TODO.map((t) => t.id)).toEqual([2, 5]); // 1 제거됨
    expect(next.IN_PROGRESS.map((t) => t.id)).toEqual([3, 1]); // 0, 2048
  });
});

describe('removeTicketById', () => {
  it('해당 id 를 모든 칼럼에서 제거한다', () => {
    const next = removeTicketById(makeBoard(), 1);
    expect(next.TODO.map((t) => t.id)).toEqual([2, 5]);
  });
});

describe('applyReorderResult', () => {
  it('이동 티켓을 서버 position 으로, affected 도 반영 후 정렬한다', () => {
    const board: BoardData = {
      BACKLOG: [],
      TODO: [card(1, TICKET_STATUS.TODO, 0)],
      IN_PROGRESS: [card(3, TICKET_STATUS.IN_PROGRESS, 0)],
      DONE: [],
    };
    const next = applyReorderResult(board, {
      ticket: card(1, TICKET_STATUS.IN_PROGRESS, 1024),
      affected: [{ id: 3, position: 512 }],
    });

    expect(next.TODO).toHaveLength(0);
    expect(next.IN_PROGRESS.map((t) => t.id)).toEqual([3, 1]); // 512 < 1024
    expect(next.IN_PROGRESS.find((t) => t.id === 1)?.position).toBe(1024);
    expect(next.IN_PROGRESS.find((t) => t.id === 3)?.position).toBe(512);
  });
});
