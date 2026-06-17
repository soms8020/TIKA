/**
 * @jest-environment node
 *
 * 서비스 DB 상호작용 로직:
 * - getBoard 그룹화 + Done 24시간 필터 (TC-API-002)
 * - reorderTicket startedAt/completedAt 비즈니스 규칙 (TC-API-007)
 */
import {
  getBoard,
  reorderTicket,
  getTicketById,
  updateTicket,
  completeTicket,
  deleteTicket,
} from '@/server/services/ticketService';
import { db } from '@/server/db';
import type { ReorderTicketInput } from '@/shared/types';

jest.mock('@/server/db', () => ({
  db: {
    select: jest.fn(),
    transaction: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockedDb = db as unknown as {
  select: jest.Mock;
  transaction: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
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

  it('002-3 칼럼 내 position 오름차순 정렬을 유지한다', async () => {
    mockedDb.select.mockReturnValue({
      from: () => ({
        orderBy: () =>
          Promise.resolve([
            row({ id: 10, status: 'BACKLOG', position: 0 }),
            row({ id: 11, status: 'BACKLOG', position: 1024 }),
            row({ id: 12, status: 'BACKLOG', position: 2048 }),
          ]),
      }),
    });
    const { board } = await getBoard();
    expect(board.BACKLOG.map((t) => t.position)).toEqual([0, 1024, 2048]);
    expect(board.BACKLOG.map((t) => t.id)).toEqual([10, 11, 12]);
  });

  it('002-4 total은 표시되는 전체 티켓 수와 같다(필터된 Done 제외)', async () => {
    mockedDb.select.mockReturnValue({
      from: () => ({
        orderBy: () =>
          Promise.resolve([
            row({ id: 1, status: 'BACKLOG' }),
            row({ id: 2, status: 'TODO' }),
            row({ id: 3, status: 'DONE', completedAt: new Date(Date.now() - 1000) }),
            row({ id: 4, status: 'DONE', completedAt: new Date(Date.now() - 90000000) }),
          ]),
      }),
    });
    const { board, total } = await getBoard();
    const displayed =
      board.BACKLOG.length +
      board.TODO.length +
      board.IN_PROGRESS.length +
      board.DONE.length;
    expect(total).toBe(displayed);
    expect(total).toBe(3); // 24시간 초과 Done 1건 제외
  });

  it('002-7 각 티켓에 isOverdue(boolean)가 포함되고 과거 dueDate는 true', async () => {
    const past = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    mockedDb.select.mockReturnValue({
      from: () => ({
        orderBy: () =>
          Promise.resolve([row({ id: 1, status: 'TODO', dueDate: past })]),
      }),
    });
    const { board } = await getBoard();
    expect(typeof board.TODO[0].isOverdue).toBe('boolean');
    expect(board.TODO[0].isOverdue).toBe(true);
  });

  it('002-8 모든 날짜 필드를 포함한다', async () => {
    mockedDb.select.mockReturnValue({
      from: () => ({
        orderBy: () =>
          Promise.resolve([
            row({
              id: 1,
              status: 'TODO',
              plannedStartDate: '2026-02-03',
              dueDate: '2999-12-31',
              startedAt: new Date(),
              completedAt: null,
            }),
          ]),
      }),
    });
    const { board } = await getBoard();
    const t = board.TODO[0];
    expect(t).toHaveProperty('plannedStartDate');
    expect(t).toHaveProperty('dueDate');
    expect(t).toHaveProperty('startedAt');
    expect(t).toHaveProperty('completedAt');
  });
});

describe('reorderTicket (TC-API-007)', () => {
  beforeEach(() => jest.clearAllMocks());

  type Row = ReturnType<typeof row>;

  /**
   * tx 모킹. reorder의 호출 흐름:
   *  select#1(existing) → update(moved) → select#2(column).orderBy → [update(reindex)…] → select#3(final)
   * update().set(v)의 v들을 captured 배열에 순서대로 담는다.
   */
  function setupTx(opts: { existing: Row | null; column?: Row[]; final?: Row }) {
    const captured: Record<string, unknown>[] = [];
    let whereCall = 0;
    const tx = {
      select: () => ({
        from: () => ({
          where: () => {
            whereCall += 1;
            const call = whereCall;
            const value =
              call === 1
                ? opts.existing
                  ? [opts.existing]
                  : []
                : [opts.final ?? opts.existing];
            const p = Promise.resolve(value) as Promise<unknown> & {
              orderBy: () => Promise<Row[]>;
            };
            p.orderBy = () => Promise.resolve(opts.column ?? []);
            return p;
          },
        }),
      }),
      update: () => ({
        set: (v: Record<string, unknown>) => {
          captured.push(v);
          return { where: () => Promise.resolve(undefined) };
        },
      }),
    };
    mockedDb.transaction.mockImplementation(
      async (cb: (t: typeof tx) => unknown) => cb(tx)
    );
    return captured;
  }

  const input = (o: Partial<ReorderTicketInput>): ReorderTicketInput => ({
    ticketId: 1,
    status: 'TODO',
    position: 100,
    ...o,
  });

  it('007-11 존재하지 않는 티켓이면 null', async () => {
    setupTx({ existing: null });
    const result = await reorderTicket(input({}));
    expect(result).toBeNull();
  });

  it('007-3 TODO로 이동 시 startedAt을 설정한다', async () => {
    const moved = row({ id: 1, status: 'TODO', position: 100 });
    const captured = setupTx({
      existing: row({ id: 1, status: 'BACKLOG' }),
      column: [moved],
      final: moved,
    });
    await reorderTicket(input({ status: 'TODO' }));
    expect(captured[0].startedAt).toBeInstanceOf(Date);
  });

  it('007-4 TODO→BACKLOG 이동 시 startedAt을 null로 초기화한다', async () => {
    const moved = row({ id: 1, status: 'BACKLOG', position: 100 });
    const captured = setupTx({
      existing: row({ id: 1, status: 'TODO', startedAt: new Date() }),
      column: [moved],
      final: moved,
    });
    await reorderTicket(input({ status: 'BACKLOG' }));
    expect(captured[0].startedAt).toBeNull();
  });

  it('007-5 DONE에서 나가면 completedAt을 null로 초기화한다', async () => {
    const moved = row({ id: 1, status: 'TODO', position: 100 });
    const captured = setupTx({
      existing: row({ id: 1, status: 'DONE', completedAt: new Date() }),
      column: [moved],
      final: moved,
    });
    await reorderTicket(input({ status: 'TODO' }));
    expect(captured[0].completedAt).toBeNull();
    expect(captured[0].startedAt).toBeInstanceOf(Date);
  });

  it('007-2 충돌이 없으면 affected는 빈 배열이다', async () => {
    const moved = row({ id: 1, status: 'IN_PROGRESS', position: 512 });
    setupTx({
      existing: row({ id: 1, status: 'BACKLOG' }),
      column: [moved, row({ id: 2, status: 'IN_PROGRESS', position: 2048 })],
      final: moved,
    });
    const result = await reorderTicket(input({ status: 'IN_PROGRESS', position: 512 }));
    expect(result?.ticket.status).toBe('IN_PROGRESS');
    expect(result?.ticket.position).toBe(512);
    expect(result?.affected).toEqual([]);
  });

  it('007-8 position 충돌 시 칼럼을 1024 간격으로 재정렬하고 affected를 반환한다', async () => {
    // 이동 티켓(id1)과 기존 티켓(id2)이 같은 position(100) → 충돌
    const movedFinal = row({ id: 1, status: 'TODO', position: 0 });
    const captured = setupTx({
      existing: row({ id: 1, status: 'BACKLOG' }),
      column: [
        row({ id: 1, status: 'TODO', position: 100 }),
        row({ id: 2, status: 'TODO', position: 100 }),
      ],
      final: movedFinal,
    });
    const result = await reorderTicket(input({ status: 'TODO', position: 100 }));

    // 이동 티켓은 동률에서 앞에 와 position 0, 기존 티켓은 1024로 재배치
    expect(result?.affected).toEqual([{ id: 2, position: 1024 }]);
    // captured: [moved 초기 update, moved 재정렬(0), id2 재정렬(1024)]
    expect(captured.length).toBe(3);
  });
});

// where()로 단건 조회를 모킹하는 헬퍼
const selectWhere = (value: unknown[]) => ({
  from: () => ({ where: () => Promise.resolve(value) }),
});

describe('getTicketById (TC-API-003)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('존재하지 않으면 null 을 반환한다', async () => {
    mockedDb.select.mockReturnValue(selectWhere([]));
    expect(await getTicketById(999)).toBeNull();
  });

  it('존재하면 isOverdue 파생 필드를 포함해 반환한다', async () => {
    mockedDb.select.mockReturnValue(selectWhere([row({ id: 1, status: 'TODO' })]));
    const t = await getTicketById(1);
    expect(t?.id).toBe(1);
    expect(t).toHaveProperty('isOverdue');
  });
});

describe('updateTicket (TC-API-004)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('변경 필드가 없으면 기존 티켓을 그대로 반환한다', async () => {
    mockedDb.select.mockReturnValue(selectWhere([row({ id: 1, status: 'TODO' })]));
    const t = await updateTicket(1, {});
    expect(t?.id).toBe(1);
    expect(mockedDb.update).not.toHaveBeenCalled();
  });

  it('전송된 필드를 반영하고 수정된 티켓을 반환한다', async () => {
    let captured: Record<string, unknown> = {};
    mockedDb.update.mockReturnValue({
      set: (v: Record<string, unknown>) => {
        captured = v;
        return { where: () => ({ returning: () => Promise.resolve([row({ id: 1, title: '새 제목', status: 'TODO' })]) }) };
      },
    });
    const t = await updateTicket(1, { title: '새 제목', priority: 'HIGH', description: null });
    expect(captured.title).toBe('새 제목');
    expect(captured.priority).toBe('HIGH');
    expect(captured.description).toBeNull();
    expect(t?.title).toBe('새 제목');
  });

  it('존재하지 않으면 null 을 반환한다', async () => {
    mockedDb.update.mockReturnValue({
      set: () => ({ where: () => ({ returning: () => Promise.resolve([]) }) }),
    });
    expect(await updateTicket(1, { title: 'x' })).toBeNull();
  });
});

describe('completeTicket (TC-API-005)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('존재하지 않으면 null 을 반환한다', async () => {
    mockedDb.select.mockReturnValue(selectWhere([]));
    expect(await completeTicket(999)).toBeNull();
  });

  it('status=DONE 으로 변경하고 completedAt 을 설정한다', async () => {
    let selectCall = 0;
    mockedDb.select.mockImplementation(() => {
      selectCall += 1;
      // 1) 존재 확인  2) topPosition(min) 조회
      return selectCall === 1
        ? selectWhere([row({ id: 1, status: 'IN_PROGRESS' })])
        : { from: () => ({ where: () => Promise.resolve([{ min: 0 }]) }) };
    });
    let captured: Record<string, unknown> = {};
    mockedDb.update.mockReturnValue({
      set: (v: Record<string, unknown>) => {
        captured = v;
        return {
          where: () => ({
            returning: () =>
              Promise.resolve([row({ id: 1, status: 'DONE', position: -1024, completedAt: new Date() })]),
          }),
        };
      },
    });

    const result = await completeTicket(1);
    expect(result?.status).toBe('DONE');
    expect(captured.status).toBe('DONE');
    expect(captured.completedAt).toBeInstanceOf(Date);
    expect(captured.position).toBe(-1024); // min(0) - 1024
  });
});

describe('deleteTicket (TC-API-006)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('삭제되면 true 를 반환한다', async () => {
    mockedDb.delete.mockReturnValue({
      where: () => ({ returning: () => Promise.resolve([{ id: 1 }]) }),
    });
    expect(await deleteTicket(1)).toBe(true);
  });

  it('대상이 없으면 false 를 반환한다', async () => {
    mockedDb.delete.mockReturnValue({
      where: () => ({ returning: () => Promise.resolve([]) }),
    });
    expect(await deleteTicket(999)).toBe(false);
  });
});
