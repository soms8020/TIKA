/**
 * @jest-environment node
 */
import { POST } from '@/app/api/tickets/route';
import { createTicket } from '@/server/services/ticketService';
import type { Ticket } from '@/shared/types';

jest.mock('@/server/services/ticketService', () => ({
  createTicket: jest.fn(),
}));

const mockedCreateTicket = createTicket as jest.Mock;

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/tickets', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const sampleTicket: Ticket = {
  id: 1,
  title: '첫 티켓',
  description: null,
  status: 'BACKLOG',
  priority: 'MEDIUM',
  position: 0,
  plannedStartDate: null,
  dueDate: null,
  startedAt: null,
  completedAt: null,
  createdAt: new Date('2026-02-01T09:00:00.000Z'),
  updatedAt: new Date('2026-02-01T09:00:00.000Z'),
};

describe('POST /api/tickets', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('제목만 제공하면 201과 함께 BACKLOG/MEDIUM 티켓을 반환한다', async () => {
    mockedCreateTicket.mockResolvedValue(sampleTicket);

    const res = await POST(makeRequest({ title: '첫 티켓' }));
    expect(res.status).toBe(201);

    const json = await res.json();
    expect(json.status).toBe('BACKLOG');
    expect(json.priority).toBe('MEDIUM');
    expect(json.position).toBe(0);
    expect(json.startedAt).toBeNull();
    expect(json.completedAt).toBeNull();
    // 응답에 12개 필드가 모두 포함된다
    expect(Object.keys(json).sort()).toEqual(
      [
        'completedAt',
        'createdAt',
        'description',
        'dueDate',
        'id',
        'plannedStartDate',
        'position',
        'priority',
        'startedAt',
        'status',
        'title',
        'updatedAt',
      ].sort()
    );
    expect(mockedCreateTicket).toHaveBeenCalledWith(
      expect.objectContaining({ title: '첫 티켓' })
    );
  });

  it.each([
    [{}, '제목을 입력해주세요'],
    [{ title: '   ' }, '제목을 입력해주세요'],
    [{ title: 'a'.repeat(201) }, '제목은 200자 이내로 입력해주세요'],
    [{ title: '제목', priority: 'URGENT' }, '우선순위는 LOW, MEDIUM, HIGH 중 선택해주세요'],
    [{ title: '제목', dueDate: '2000-01-01' }, '종료예정일은 오늘 이후 날짜를 선택해주세요'],
  ])('검증 실패(%o) 시 400과 VALIDATION_ERROR를 반환한다', async (body, message) => {
    const res = await POST(makeRequest(body));
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error.code).toBe('VALIDATION_ERROR');
    expect(json.error.message).toBe(message);
    // 검증 실패 시 서비스는 호출되지 않는다
    expect(mockedCreateTicket).not.toHaveBeenCalled();
  });
});
