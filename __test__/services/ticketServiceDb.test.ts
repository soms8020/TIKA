/**
 * @jest-environment node
 *
 * 서비스 DB 상호작용 로직:
 * - getBoard 그룹화 + Done 24시간 필터 (TC-API-002)
 * - reorderTicket startedAt/completedAt 비즈니스 규칙 (TC-API-007)
 */
import { getBoard, reorderTicket } from '@/server/services/ticketService';
import { db } from '@/server/db';
import type { ReorderTicketInput } from '@/shared/types';

jest.mock('@/server/db', () => ({
  db: {
    select: jest.fn(),
    transaction: jest.fn(),
  },
}));

const mockedDb = db as unknown as {
  select: jest.Mock;
  transaction: jest.Mock;
};

function row(overrides: Record<string, unknown>) {
  return {
    id: 1,
    title: 't',
    description: null,
    status: 'BACKLOG',
    priority: 'MEDIUM',
    position: 0,
    plannedStartDate: null,
    dueDate: null,
    startedAt: null,
    completedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('getBoard (TC-API-002)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('002-1 빈 보드는 4개 빈 배열과 total 0을 반환한다', async () => {
    mockedDb.select.mockReturnValue({
      from: () => ({ orderBy: () => Promise.resolve([]) }),
    });
    const { board, total } = await getBoard();
    expect(Object.keys(board).sort()).toEqual(
      ['BACKLOG', 'DONE', 'IN_PROGRESS', 'TODO'].sort()
    );
    expect(board.BACKLOG).toEqual([]);
    expect(total).toBe(0);
  });

  it('002-2 상태별로 그룹화하고 isOverdue를 포함한다', async () => {
    mockedDb.select.mockReturnValue({
      from: () => ({
        orderBy: () =>
          Promise.resolve([
            row({ id: 1, status: 'BACKLOG' }),
            row({ id: 2, status: 'TODO' }),
            row({ id: 3, status: 'IN_PROGRESS' }),
          ]),
      }),
    });
    const { board, total } = await getBoard();
    expect(board.BACKLOG).toHaveLength(1);
    expect(board.TODO).toHaveLength(1);
    expect(board.IN_PROGRESS).toHaveLength(1);
    expect(board.BACKLOG[0]).toHaveProperty('isOverdue');
    expect(total).toBe(3);
  });

  it('002-5/002-6 Done은 24시간 이내만 포함한다', async () => {
    mockedDb.select.mockReturnValue({
      from: () => ({
        orderBy: () =>
          Promise.resolve([
            row({ id: 1, status: 'DONE', completedAt: new Date(Date.now() - 1000) }),
            row({ id: 2, status: 'DONE', completedAt: new Date(Date.now() - 90000000) }),
          ]),
      }),
    });
    const { board, total } = await getBoard();
    expect(board.DONE).toHaveLength(1);
    expect(board.DONE[0].id).toBe(1);
    expect(total).toBe(1);
  });
});

describe('reorderTicket (TC-API-007)', () => {
  beforeEach(() => jest.clearAllMocks());

  // 트랜잭션 콜백에 넘길 tx 모킹. update().set(v)의 v를 캡처한다.
  function setupTx(existing: ReturnType<typeof row> | null) {
    let captured: Record<string, unknown> = {};
    const tx = {
      select: () => ({
        from: () => ({
          where: () => Promise.resolve(existing ? [existing] : []),
        }),
      }),
      update: () => ({
        set: (v: Record<string, unknown>) => {
          captured = v;
          return {
            where: () => ({
              returning: () => Promise.resolve([{ ...existing, ...v }]),
            }),
          };
        },
      }),
    };
    mockedDb.transaction.mockImplementation(
      async (cb: (t: typeof tx) => unknown) => cb(tx)
    );
    return () => captured;
  }

  const input = (o: Partial<ReorderTicketInput>): ReorderTicketInput => ({
    ticketId: 1,
    status: 'TODO',
    position: 100,
    ...o,
  });

  it('007-11 존재하지 않는 티켓이면 null', async () => {
    setupTx(null);
    const result = await reorderTicket(input({}));
    expect(result).toBeNull();
  });

  it('007-3 TODO로 이동 시 startedAt을 설정한다', async () => {
    const getCaptured = setupTx(row({ status: 'BACKLOG' }));
    await reorderTicket(input({ status: 'TODO' }));
    expect(getCaptured().startedAt).toBeInstanceOf(Date);
  });

  it('007-4 TODO→BACKLOG 이동 시 startedAt을 null로 초기화한다', async () => {
    const getCaptured = setupTx(row({ status: 'TODO', startedAt: new Date() }));
    await reorderTicket(input({ status: 'BACKLOG' }));
    expect(getCaptured().startedAt).toBeNull();
  });

  it('007-5 DONE에서 나가면 completedAt을 null로 초기화한다', async () => {
    const getCaptured = setupTx(
      row({ status: 'DONE', completedAt: new Date() })
    );
    await reorderTicket(input({ status: 'TODO' }));
    expect(getCaptured().completedAt).toBeNull();
    expect(getCaptured().startedAt).toBeInstanceOf(Date);
  });

  it('status와 position을 반영하고 affected 배열을 반환한다', async () => {
    setupTx(row({ status: 'BACKLOG' }));
    const result = await reorderTicket(input({ status: 'IN_PROGRESS', position: 512 }));
    expect(result?.ticket.status).toBe('IN_PROGRESS');
    expect(result?.ticket.position).toBe(512);
    expect(Array.isArray(result?.affected)).toBe(true);
  });
});
