/**
 * @jest-environment node
 *
 * Route Handler 계약 테스트 (서비스 모킹):
 * - GET /api/tickets (TC-API-002)
 * - GET/PATCH/DELETE /api/tickets/:id (TC-API-003, 004, 006)
 * - PATCH /api/tickets/:id/complete (TC-API-005)
 * - PATCH /api/tickets/reorder (TC-API-007)
 */
import { GET as getBoardRoute } from '@/app/api/tickets/route';
import {
  GET as getByIdRoute,
  PATCH as patchByIdRoute,
  DELETE as deleteByIdRoute,
} from '@/app/api/tickets/[id]/route';
import { PATCH as completeRoute } from '@/app/api/tickets/[id]/complete/route';
import { PATCH as reorderRoute } from '@/app/api/tickets/reorder/route';
import * as svc from '@/server/services/ticketService';
import type { Ticket, TicketWithMeta } from '@/shared/types';

jest.mock('@/server/services/ticketService', () => ({
  getBoard: jest.fn(),
  getTicketById: jest.fn(),
  updateTicket: jest.fn(),
  deleteTicket: jest.fn(),
  completeTicket: jest.fn(),
  reorderTicket: jest.fn(),
}));

const mocked = svc as jest.Mocked<typeof svc>;

const ticket: Ticket = {
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
  createdAt: new Date('2026-02-01T09:00:00.000Z'),
  updatedAt: new Date('2026-02-01T09:00:00.000Z'),
};
const withMeta: TicketWithMeta = { ...ticket, isOverdue: false };

function jsonReq(body: unknown): Request {
  return new Request('http://localhost', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}
const params = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => jest.clearAllMocks());

describe('GET /api/tickets (TC-API-002)', () => {
  it('200과 board/total을 반환한다', async () => {
    mocked.getBoard.mockResolvedValue({
      board: { BACKLOG: [withMeta], TODO: [], IN_PROGRESS: [], DONE: [] },
      total: 1,
    });
    const res = await getBoardRoute();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.total).toBe(1);
    expect(json.board.BACKLOG).toHaveLength(1);
  });
});

describe('GET /api/tickets/:id (TC-API-003)', () => {
  it('003-1 존재하는 티켓 → 200', async () => {
    mocked.getTicketById.mockResolvedValue(withMeta);
    const res = await getByIdRoute(new Request('http://localhost'), params('1'));
    expect(res.status).toBe(200);
    expect((await res.json()).id).toBe(1);
  });
  it('003-2 없는 티켓 → 404 TICKET_NOT_FOUND', async () => {
    mocked.getTicketById.mockResolvedValue(null);
    const res = await getByIdRoute(new Request('http://localhost'), params('999'));
    expect(res.status).toBe(404);
    expect((await res.json()).error.code).toBe('TICKET_NOT_FOUND');
  });
  it('003-3 잘못된 id 형식 → 400 VALIDATION_ERROR', async () => {
    const res = await getByIdRoute(new Request('http://localhost'), params('abc'));
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe('VALIDATION_ERROR');
    expect(mocked.getTicketById).not.toHaveBeenCalled();
  });
});

describe('PATCH /api/tickets/:id (TC-API-004)', () => {
  it('004-1 제목 수정 → 200', async () => {
    mocked.updateTicket.mockResolvedValue({ ...withMeta, title: '새 제목' });
    const res = await patchByIdRoute(jsonReq({ title: '새 제목' }), params('1'));
    expect(res.status).toBe(200);
    expect((await res.json()).title).toBe('새 제목');
  });
  it('004-7 없는 티켓 → 404', async () => {
    mocked.updateTicket.mockResolvedValue(null);
    const res = await patchByIdRoute(jsonReq({ title: 'x' }), params('999'));
    expect(res.status).toBe(404);
  });
  it('잘못된 우선순위 → 400 VALIDATION_ERROR', async () => {
    const res = await patchByIdRoute(jsonReq({ priority: 'URGENT' }), params('1'));
    expect(res.status).toBe(400);
    expect((await res.json()).error.message).toBe(
      '우선순위는 LOW, MEDIUM, HIGH 중 선택해주세요'
    );
    expect(mocked.updateTicket).not.toHaveBeenCalled();
  });

  it('004-9 status 등 허용되지 않은 필드는 스키마에서 제거되어 서비스로 전달되지 않는다', async () => {
    mocked.updateTicket.mockResolvedValue({ ...withMeta, title: '제목' });
    await patchByIdRoute(
      jsonReq({ title: '제목', status: 'DONE', position: 999 }),
      params('1')
    );
    const arg = mocked.updateTicket.mock.calls[0][1];
    expect(arg).not.toHaveProperty('status');
    expect(arg).not.toHaveProperty('position');
    expect(arg).toEqual({ title: '제목' });
  });
});

describe('DELETE /api/tickets/:id (TC-API-006)', () => {
  it('006-1 정상 삭제 → 204', async () => {
    mocked.deleteTicket.mockResolvedValue(true);
    const res = await deleteByIdRoute(new Request('http://localhost'), params('1'));
    expect(res.status).toBe(204);
  });
  it('006-2 없는 티켓 → 404', async () => {
    mocked.deleteTicket.mockResolvedValue(false);
    const res = await deleteByIdRoute(new Request('http://localhost'), params('9'));
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/tickets/:id/complete (TC-API-005)', () => {
  it('005-1 정상 완료 → 200, status=DONE', async () => {
    mocked.completeTicket.mockResolvedValue({
      ...ticket,
      status: 'DONE',
      completedAt: new Date(),
    });
    const res = await completeRoute(new Request('http://localhost'), params('1'));
    expect(res.status).toBe(200);
    expect((await res.json()).status).toBe('DONE');
  });
  it('005-4 없는 티켓 → 404', async () => {
    mocked.completeTicket.mockResolvedValue(null);
    const res = await completeRoute(new Request('http://localhost'), params('9'));
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/tickets/reorder (TC-API-007)', () => {
  it('007-1 정상 이동 → 200, ticket+affected', async () => {
    mocked.reorderTicket.mockResolvedValue({
      ticket: { ...ticket, status: 'TODO', position: 100 },
      affected: [],
    });
    const res = await reorderRoute(
      jsonReq({ ticketId: 1, status: 'TODO', position: 100 })
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ticket.status).toBe('TODO');
    expect(json.affected).toEqual([]);
  });
  it('007-9 status=DONE → 400 VALIDATION_ERROR', async () => {
    const res = await reorderRoute(
      jsonReq({ ticketId: 1, status: 'DONE', position: 0 })
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error.message).toBe(
      '상태는 BACKLOG, TODO, IN_PROGRESS 중 선택해주세요'
    );
    expect(mocked.reorderTicket).not.toHaveBeenCalled();
  });
  it('007-10 잘못된 status → 400', async () => {
    const res = await reorderRoute(
      jsonReq({ ticketId: 1, status: 'INVALID', position: 0 })
    );
    expect(res.status).toBe(400);
  });
  it('007-11 없는 티켓 → 404', async () => {
    mocked.reorderTicket.mockResolvedValue(null);
    const res = await reorderRoute(
      jsonReq({ ticketId: 999, status: 'TODO', position: 0 })
    );
    expect(res.status).toBe(404);
  });
});
