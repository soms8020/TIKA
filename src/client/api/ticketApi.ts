// ticketApi — 백엔드 REST API 호출 래퍼 (COMPONENT_SPEC §4, API_SPEC.md)
// 모든 티켓 API 호출은 이 모듈을 경유한다. 컴포넌트/훅에서 직접 fetch 금지.
import type {
  BoardData,
  Ticket,
  CreateTicketInput,
  UpdateTicketInput,
  ReorderTicketInput,
} from '@/shared/types';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

// reorder 응답: 이동한 티켓 + 순서가 바뀐 다른 티켓들
interface ReorderResult {
  ticket: Ticket;
  affected: { id: number; position: number }[];
}

// 공통 에러 처리 — { error: { code, message } } 형식을 파싱해 message 로 throw
async function throwApiError(res: Response): Promise<never> {
  let message = `요청에 실패했습니다 (${res.status})`;
  try {
    const body: unknown = await res.json();
    if (
      typeof body === 'object' &&
      body !== null &&
      'error' in body &&
      typeof (body as { error?: { message?: unknown } }).error?.message === 'string'
    ) {
      message = (body as { error: { message: string } }).error.message;
    }
  } catch {
    // 본문이 없거나 JSON 이 아니면 기본 메시지를 사용한다.
  }
  throw new Error(message);
}

// GET /api/tickets → 보드 데이터(BoardData)
export async function getBoard(): Promise<BoardData> {
  const res = await fetch('/api/tickets');
  if (!res.ok) await throwApiError(res);
  const data: { board: BoardData } = await res.json();
  return data.board;
}

// POST /api/tickets → 생성된 티켓
export async function create(input: CreateTicketInput): Promise<Ticket> {
  const res = await fetch('/api/tickets', {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(input),
  });
  if (!res.ok) await throwApiError(res);
  return res.json();
}

// PATCH /api/tickets/:id → 수정된 티켓
export async function update(id: number, input: UpdateTicketInput): Promise<Ticket> {
  const res = await fetch(`/api/tickets/${id}`, {
    method: 'PATCH',
    headers: JSON_HEADERS,
    body: JSON.stringify(input),
  });
  if (!res.ok) await throwApiError(res);
  return res.json();
}

// DELETE /api/tickets/:id → 204 No Content (본문 없음)
export async function remove(id: number): Promise<void> {
  const res = await fetch(`/api/tickets/${id}`, { method: 'DELETE' });
  if (!res.ok) await throwApiError(res);
}

// PATCH /api/tickets/reorder → { ticket, affected }
export async function reorder(input: ReorderTicketInput): Promise<ReorderResult> {
  const res = await fetch('/api/tickets/reorder', {
    method: 'PATCH',
    headers: JSON_HEADERS,
    body: JSON.stringify(input),
  });
  if (!res.ok) await throwApiError(res);
  return res.json();
}

// PATCH /api/tickets/:id/complete → 완료된 티켓 (요청 본문 없음)
export async function complete(id: number): Promise<Ticket> {
  const res = await fetch(`/api/tickets/${id}/complete`, { method: 'PATCH' });
  if (!res.ok) await throwApiError(res);
  return res.json();
}
