// TDD Red — ticketApi (FRONTEND_TASKS Phase 0.1)
// 명세: docs/API_SPEC.md, COMPONENT_SPEC §4 "API 호출 함수"
// 대상(미구현): src/client/api/ticketApi.ts
//
// 계약(contract):
//   getBoard()                     → GET    /api/tickets                  → BoardData ({board,total} 응답의 board)
//   create(input)                  → POST   /api/tickets                  → Ticket   (body: CreateTicketInput)
//   update(id, input)              → PATCH  /api/tickets/:id              → Ticket   (body: UpdateTicketInput)
//   remove(id)                     → DELETE /api/tickets/:id              → void     (204, 본문 파싱 안 함)
//   reorder(input)                 → PATCH  /api/tickets/reorder          → {ticket, affected} (body: ReorderTicketInput)
//   complete(id)                   → PATCH  /api/tickets/:id/complete     → Ticket   (본문 없음)
//
//   공통: body 요청은 Content-Type: application/json + JSON.stringify(body)
//         !res.ok 이면 { error: { code, message } } 를 파싱해 Error(message) throw
import {
  getBoard,
  create,
  update,
  remove,
  reorder,
  complete,
} from '@/client/api/ticketApi';
import type {
  CreateTicketInput,
  UpdateTicketInput,
  ReorderTicketInput,
} from '@/shared/types';

// --- fetch mock ---
const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

beforeEach(() => {
  mockFetch.mockReset();
});

// 성공 응답(JSON) 헬퍼
const okJson = (data: unknown, status = 200) => ({
  ok: true,
  status,
  json: async () => data,
});
// 에러 응답 헬퍼 — API_SPEC 공통 에러 형식 { error: { code, message } }
const errJson = (message: string, status = 400, code = 'VALIDATION_ERROR') => ({
  ok: false,
  status,
  json: async () => ({ error: { code, message } }),
});

// 마지막 fetch 호출의 [url, init]
const lastCall = (): [string, RequestInit] =>
  mockFetch.mock.calls[mockFetch.mock.calls.length - 1] as [string, RequestInit];

// 샘플 데이터 (런타임 JSON 형태 — 타입 강제하지 않음)
const sampleBoard = { BACKLOG: [], TODO: [], IN_PROGRESS: [], DONE: [] };
const sampleTicket = {
  id: 1,
  title: 'API 설계 문서 작성',
  description: null,
  status: 'BACKLOG',
  priority: 'HIGH',
  position: -1024,
  plannedStartDate: null,
  dueDate: null,
  startedAt: null,
  completedAt: null,
  createdAt: '2026-02-01T09:00:00.000Z',
  updatedAt: '2026-02-01T09:00:00.000Z',
};

describe('ticketApi', () => {
  describe('getBoard', () => {
    it('GET /api/tickets 로 호출하고 board 데이터를 반환한다', async () => {
      mockFetch.mockResolvedValueOnce(okJson({ board: sampleBoard, total: 0 }));

      const result = await getBoard();

      const [url, init] = lastCall();
      expect(url).toBe('/api/tickets');
      expect(init?.method ?? 'GET').toBe('GET');
      expect(result).toEqual(sampleBoard);
    });

    it('에러 응답이면 error.message 로 throw 한다', async () => {
      mockFetch.mockResolvedValueOnce(errJson('서버 오류', 500, 'INTERNAL_ERROR'));
      await expect(getBoard()).rejects.toThrow('서버 오류');
    });
  });

  describe('create', () => {
    const input: CreateTicketInput = { title: '새 티켓', priority: 'HIGH' };

    it('POST /api/tickets 로 body 를 보내고 생성된 티켓을 반환한다', async () => {
      mockFetch.mockResolvedValueOnce(okJson(sampleTicket, 201));

      const result = await create(input);

      const [url, init] = lastCall();
      expect(url).toBe('/api/tickets');
      expect(init.method).toBe('POST');
      expect(init.headers).toEqual(
        expect.objectContaining({ 'Content-Type': 'application/json' }),
      );
      expect(JSON.parse(init.body as string)).toEqual(input);
      expect(result).toEqual(sampleTicket);
    });

    it('에러 응답이면 error.message 로 throw 한다', async () => {
      mockFetch.mockResolvedValueOnce(errJson('제목을 입력해주세요'));
      await expect(create({ title: '' })).rejects.toThrow('제목을 입력해주세요');
    });
  });

  describe('update', () => {
    const input: UpdateTicketInput = { title: '수정된 제목', priority: 'MEDIUM' };

    it('PATCH /api/tickets/:id 로 body 를 보내고 수정된 티켓을 반환한다', async () => {
      mockFetch.mockResolvedValueOnce(okJson(sampleTicket));

      const result = await update(1, input);

      const [url, init] = lastCall();
      expect(url).toBe('/api/tickets/1');
      expect(init.method).toBe('PATCH');
      expect(init.headers).toEqual(
        expect.objectContaining({ 'Content-Type': 'application/json' }),
      );
      expect(JSON.parse(init.body as string)).toEqual(input);
      expect(result).toEqual(sampleTicket);
    });

    it('에러 응답이면 error.message 로 throw 한다', async () => {
      mockFetch.mockResolvedValueOnce(errJson('티켓을 찾을 수 없습니다', 404, 'TICKET_NOT_FOUND'));
      await expect(update(999, input)).rejects.toThrow('티켓을 찾을 수 없습니다');
    });
  });

  describe('remove', () => {
    it('DELETE /api/tickets/:id 로 호출한다 (204, 본문 없음)', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 204, json: async () => undefined });

      await remove(1);

      const [url, init] = lastCall();
      expect(url).toBe('/api/tickets/1');
      expect(init.method).toBe('DELETE');
    });

    it('에러 응답이면 error.message 로 throw 한다', async () => {
      mockFetch.mockResolvedValueOnce(errJson('티켓을 찾을 수 없습니다', 404, 'TICKET_NOT_FOUND'));
      await expect(remove(999)).rejects.toThrow('티켓을 찾을 수 없습니다');
    });
  });

  describe('reorder', () => {
    const input: ReorderTicketInput = {
      ticketId: 3,
      status: 'IN_PROGRESS',
      position: 0,
    };

    it('PATCH /api/tickets/reorder 로 body 를 보내고 {ticket, affected} 를 반환한다', async () => {
      const response = {
        ticket: { ...sampleTicket, id: 3, status: 'IN_PROGRESS', position: 0 },
        affected: [{ id: 5, position: 1024 }],
      };
      mockFetch.mockResolvedValueOnce(okJson(response));

      const result = await reorder(input);

      const [url, init] = lastCall();
      expect(url).toBe('/api/tickets/reorder');
      expect(init.method).toBe('PATCH');
      expect(init.headers).toEqual(
        expect.objectContaining({ 'Content-Type': 'application/json' }),
      );
      expect(JSON.parse(init.body as string)).toEqual(input);
      expect(result).toEqual(response);
    });

    it('에러 응답이면 error.message 로 throw 한다', async () => {
      mockFetch.mockResolvedValueOnce(
        errJson('상태는 BACKLOG, TODO, IN_PROGRESS 중 선택해주세요'),
      );
      await expect(reorder(input)).rejects.toThrow(
        '상태는 BACKLOG, TODO, IN_PROGRESS 중 선택해주세요',
      );
    });
  });

  describe('complete', () => {
    it('PATCH /api/tickets/:id/complete 로 호출하고 완료된 티켓을 반환한다', async () => {
      const done = { ...sampleTicket, status: 'DONE', completedAt: '2026-02-01T15:30:00.000Z' };
      mockFetch.mockResolvedValueOnce(okJson(done));

      const result = await complete(1);

      const [url, init] = lastCall();
      expect(url).toBe('/api/tickets/1/complete');
      expect(init.method).toBe('PATCH');
      expect(init.body).toBeUndefined(); // 완료 API는 요청 본문 없음
      expect(result).toEqual(done);
    });

    it('에러 응답이면 error.message 로 throw 한다', async () => {
      mockFetch.mockResolvedValueOnce(errJson('티켓을 찾을 수 없습니다', 404, 'TICKET_NOT_FOUND'));
      await expect(complete(999)).rejects.toThrow('티켓을 찾을 수 없습니다');
    });
  });
});
