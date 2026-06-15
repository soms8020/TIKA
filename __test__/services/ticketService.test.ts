/**
 * @jest-environment node
 *
 * TC-API-001 (서비스 계층): 티켓 생성의 비즈니스 로직 검증.
 * - 001-1  기본값(status=BACKLOG, priority=MEDIUM)
 * - 001-10 position 자동 할당 (연속 생성 시 나중 티켓이 더 위 = 더 작은 position)
 * - 001-11 startedAt/completedAt 초기값 null
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

describe('ticketService.createTicket (TC-API-001)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockInsertReturningEcho();
  });

  it('001-1 우선순위 미입력 시 MEDIUM, status는 항상 BACKLOG', async () => {
    mockMinPosition(null);
    const ticket = await createTicket({ title: '테스트 할일' });
    expect(ticket.status).toBe('BACKLOG');
    expect(ticket.priority).toBe('MEDIUM');
  });

  it('001-1 우선순위를 입력하면 그대로 반영한다', async () => {
    mockMinPosition(null);
    const ticket = await createTicket({ title: '제목', priority: 'HIGH' });
    expect(ticket.priority).toBe('HIGH');
  });

  it('001-10 빈 Backlog 칼럼이면 position을 0으로 설정한다', async () => {
    mockMinPosition(null);
    const ticket = await createTicket({ title: '첫 티켓' });
    expect(ticket.position).toBe(0);
  });

  it('001-10 기존 티켓이 있으면 position을 min - 1024로 설정한다', async () => {
    mockMinPosition(0);
    const ticket = await createTicket({ title: '두번째 티켓' });
    expect(ticket.position).toBe(-1024);
  });

  it('001-10 연속 2개 생성 시 나중 티켓의 position이 더 작다(맨 위 배치)', async () => {
    // 첫 생성: 빈 칼럼 → position 0
    mockMinPosition(null);
    const first = await createTicket({ title: '첫 티켓' });

    // 두번째 생성: 현재 최소값(0) 기준 → position -1024
    mockMinPosition(first.position);
    const second = await createTicket({ title: '두번째 티켓' });

    expect(second.position).toBeLessThan(first.position);
  });

  it('001-11 생성 직후 startedAt/completedAt은 null이다', async () => {
    mockMinPosition(null);
    const ticket = await createTicket({ title: '제목' });
    expect(ticket.startedAt).toBeNull();
    expect(ticket.completedAt).toBeNull();
  });
});
