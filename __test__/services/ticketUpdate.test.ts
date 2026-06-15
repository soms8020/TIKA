/**
 * @jest-environment node
 *
 * TC-API-004 (서비스 계층): PATCH /api/tickets/:id 부분 수정 로직.
 * - 004-3 설명 삭제(null), 004-4 dueDate 삭제(null)
 * - 004-5 plannedStartDate 수정, 004-6 plannedStartDate 삭제(null)
 * - 004-8 updatedAt 갱신(update 경로 실행), 004-9 status 등 미허용 필드 무시
 */
import { updateTicket } from '@/server/services/ticketService';
import { db } from '@/server/db';
import type { UpdateTicketInput } from '@/shared/types';

jest.mock('@/server/db', () => ({
  db: {
    update: jest.fn(),
    select: jest.fn(),
  },
}));

const mockedDb = db as unknown as {
  update: jest.Mock;
  select: jest.Mock;
};

const baseRow = {
  id: 1,
  title: 't',
  description: '기존 설명',
  status: 'BACKLOG',
  priority: 'MEDIUM',
  position: 0,
  plannedStartDate: '2026-01-01',
  dueDate: '2999-12-31',
  startedAt: null,
  completedAt: null,
  createdAt: new Date('2026-02-01T09:00:00.000Z'),
  updatedAt: new Date('2026-02-01T09:00:00.000Z'),
};

// db.update().set(v).where().returning() → [row] (없으면 [])
function setupUpdate(found = true) {
  let captured: Record<string, unknown> = {};
  mockedDb.update.mockReturnValue({
    set: (v: Record<string, unknown>) => {
      captured = v;
      return {
        where: () => ({
          returning: () =>
            Promise.resolve(found ? [{ ...baseRow, ...v }] : []),
        }),
      };
    },
  });
  return () => captured;
}

describe('updateTicket (TC-API-004)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('004-3 설명 삭제: description=null을 반영한다', async () => {
    const getCaptured = setupUpdate();
    const result = await updateTicket(1, { description: null });
    expect(getCaptured().description).toBeNull();
    expect(result?.description).toBeNull();
  });

  it('004-4 종료예정일 삭제: dueDate=null을 반영한다', async () => {
    const getCaptured = setupUpdate();
    const result = await updateTicket(1, { dueDate: null });
    expect(getCaptured().dueDate).toBeNull();
    expect(result?.dueDate).toBeNull();
  });

  it('004-5 시작예정일 수정', async () => {
    const getCaptured = setupUpdate();
    const result = await updateTicket(1, { plannedStartDate: '2026-03-01' });
    expect(getCaptured().plannedStartDate).toBe('2026-03-01');
    expect(result?.plannedStartDate).toBe('2026-03-01');
  });

  it('004-6 시작예정일 삭제: plannedStartDate=null', async () => {
    const getCaptured = setupUpdate();
    await updateTicket(1, { plannedStartDate: null });
    expect(getCaptured().plannedStartDate).toBeNull();
  });

  it('004-8 수정 시 update 경로가 실행된다(updatedAt $onUpdate 갱신 보장)', async () => {
    setupUpdate();
    await updateTicket(1, { title: '새 제목' });
    expect(mockedDb.update).toHaveBeenCalledTimes(1);
  });

  it('004-9 허용되지 않은 필드(status/position 등)는 set에 포함되지 않는다', async () => {
    const getCaptured = setupUpdate();
    // 타입상 없는 필드를 런타임에 전달해도 서비스가 무시함을 검증
    await updateTicket(1, {
      title: '제목',
      status: 'DONE',
      position: 999,
    } as unknown as UpdateTicketInput);
    const captured = getCaptured();
    expect(captured).not.toHaveProperty('status');
    expect(captured).not.toHaveProperty('position');
    expect(captured.title).toBe('제목');
  });

  it('없는 티켓이면 null을 반환한다', async () => {
    setupUpdate(false);
    const result = await updateTicket(999, { title: 'x' });
    expect(result).toBeNull();
  });
});
