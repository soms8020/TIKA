import { NextResponse } from 'next/server';
import { reorderTicketSchema } from '@/shared/validations/ticket';
import { reorderTicket } from '@/server/services/ticketService';
import { errorResponse, ErrorCode } from '@/server/http/errors';

// PATCH /api/tickets/reorder — 상태/순서 변경 (API_SPEC §7)
export async function PATCH(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse(
      400,
      ErrorCode.VALIDATION_ERROR,
      '요청 본문이 올바른 JSON이 아닙니다'
    );
  }

  const parsed = reorderTicketSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? '요청이 올바르지 않습니다';
    return errorResponse(400, ErrorCode.VALIDATION_ERROR, message);
  }

  try {
    const result = await reorderTicket(parsed.data);
    if (!result) {
      return errorResponse(404, ErrorCode.TICKET_NOT_FOUND, '티켓을 찾을 수 없습니다');
    }
    return NextResponse.json(result, { status: 200 });
  } catch {
    return errorResponse(500, ErrorCode.INTERNAL_ERROR, '서버 내부 오류');
  }
}
