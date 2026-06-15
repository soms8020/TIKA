/**
 * @jest-environment node
 */
import { createTicket } from '@/server/services/ticketService';
import { db } from '@/server/db';

jest.mock('@/server/db', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
  },
}));

const mockedDb = db as unknown as {
  select: jest.Mock;
  insert: jest.Mock;
};

// db.select(...).from(...).where(...) → Promise<[{ min }]>
function mockMinPosition(min: number | null): void {
  mockedDb.select.mockReturnValue({
    from: () => ({
      where: () => Promise.resolve([{ min }]),
    }),
  });
}

// db.insert(...).values(v).returning() → Promise<[row]> (입력값 + 자동 필드 머지)
function mockInsertReturningEcho(): void {
  mockedDb.insert.mockReturnValue({
    values: (v: Record<string, unknown>) => ({
      returning: () =>
        Promise.resolve([
          {
            id: 1,
            title: v.title ?? null,
            description: v.description ?? null,
            status: v.status,
            priority: v.priority,
            position: v.position,
            plannedStartDate: v.plannedStartDate ?? null,
            dueDate: v.dueDate ?? null,
            startedAt: null,
            completedAt: null,
            createdAt: new Date('2026-02-01T09:00:00.000Z'),
            updatedAt: new Date('2026-02-01T09:00:00.000Z'),
          },
        ]),
    }),
  });
}

describe('ticketService.createTicket', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockInsertReturningEcho();
  });

  it('빈 Backlog 칼럼이면 position을 0으로 설정한다', async () => {
    mockMinPosition(null);
    const ticket = await createTicket({ title: '첫 티켓' });
    expect(ticket.position).toBe(0);
  });

  it('기존 티켓이 있으면 position을 min - 1024로 설정한다', async () => {
    mockMinPosition(0);
    const ticket = await createTicket({ title: '두번째 티켓' });
    expect(ticket.position).toBe(-1024);
  });

  it('우선순위를 입력하지 않으면 MEDIUM을 적용한다', async () => {
    mockMinPosition(null);
    const ticket = await createTicket({ title: '제목' });
    expect(ticket.priority).toBe('MEDIUM');
  });

  it('상태는 항상 BACKLOG이며 startedAt/completedAt은 null이다', async () => {
    mockMinPosition(null);
    const ticket = await createTicket({ title: '제목', priority: 'HIGH' });
    expect(ticket.status).toBe('BACKLOG');
    expect(ticket.priority).toBe('HIGH');
    expect(ticket.startedAt).toBeNull();
    expect(ticket.completedAt).toBeNull();
  });
});
