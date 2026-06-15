/**
 * @jest-environment node
 *
 * TC-API-001: POST /api/tickets — 티켓 생성 (docs/TEST_CASES.md)
 * 관련 FR: FR-001 / US-001, US-002
 *
 * 이 파일은 Route Handler 계층(HTTP 계약·검증·응답)을 검증한다.
 * - 001-1~9, 11 을 다룬다.
 * - 001-10(position 자동 할당)은 비즈니스 로직이 서비스 계층에 있으므로
 *   __test__/services/ticketService.test.ts 에서 검증한다.
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

const baseTicket: Ticket = {
  id: 1,
  title: '테스트 할일',
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

describe('TC-API-001: POST /api/tickets — 티켓 생성', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('001-1 필수 필드만으로 생성 → 201, status=BACKLOG, priority=MEDIUM', async () => {
    mockedCreateTicket.mockResolvedValue(baseTicket);

    const res = await POST(makeRequest({ title: '테스트 할일' }));
    expect(res.status).toBe(201);

    const json = await res.json();
    expect(json.status).toBe('BACKLOG');
    expect(json.priority).toBe('MEDIUM');
    expect(mockedCreateTicket).toHaveBeenCalledWith(
      expect.objectContaining({ title: '테스트 할일' })
    );
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
  });

  it('001-2 전체 필드로 생성 → 201, 모든 필드 반영', async () => {
    const input = {
      title: 'API 설계 문서 작성',
      description: '엔드포인트 정의',
      priority: 'HIGH' as const,
      plannedStartDate: '2026-01-01',
      dueDate: '2999-12-31',
    };
    const created: Ticket = {
      ...baseTicket,
      title: input.title,
      description: input.description,
      priority: 'HIGH',
      plannedStartDate: input.plannedStartDate,
      dueDate: input.dueDate,
    };
    mockedCreateTicket.mockResolvedValue(created);

    const res = await POST(makeRequest(input));
    expect(res.status).toBe(201);

    // 검증된 전체 필드가 서비스로 전달된다
    expect(mockedCreateTicket).toHaveBeenCalledWith(
      expect.objectContaining(input)
    );

    const json = await res.json();
    expect(json.title).toBe(input.title);
    expect(json.description).toBe(input.description);
    expect(json.priority).toBe('HIGH');
    expect(json.plannedStartDate).toBe(input.plannedStartDate);
    expect(json.dueDate).toBe(input.dueDate);
  });

  describe('검증 실패 → 400 VALIDATION_ERROR', () => {
    it.each([
      ['001-3 제목 누락', {}, '제목을 입력해주세요'],
      ['001-4 빈 제목', { title: '' }, '제목을 입력해주세요'],
      ['001-5 공백만 제목', { title: '   ' }, '제목을 입력해주세요'],
      ['001-6 제목 200자 초과', { title: 'a'.repeat(201) }, '제목은 200자 이내로 입력해주세요'],
      ['001-7 설명 1000자 초과', { title: 'ok', description: 'a'.repeat(1001) }, '설명은 1000자 이내로 입력해주세요'],
      ['001-8 잘못된 우선순위', { title: 'ok', priority: 'URGENT' }, '우선순위는 LOW, MEDIUM, HIGH 중 선택해주세요'],
      ['001-9 과거 종료예정일', { title: 'ok', dueDate: '2020-01-01' }, '종료예정일은 오늘 이후 날짜를 선택해주세요'],
    ])('%s', async (_label, body, message) => {
      const res = await POST(makeRequest(body));
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.error.code).toBe('VALIDATION_ERROR');
      expect(json.error.message).toBe(message);
      // 검증 실패 시 서비스는 호출되지 않는다
      expect(mockedCreateTicket).not.toHaveBeenCalled();
    });
  });

  it('001-11 정상 생성 시 startedAt/completedAt 초기값은 null', async () => {
    mockedCreateTicket.mockResolvedValue(baseTicket);

    const res = await POST(makeRequest({ title: '테스트 할일' }));
    const json = await res.json();
    expect(json.startedAt).toBeNull();
    expect(json.completedAt).toBeNull();
  });
});
