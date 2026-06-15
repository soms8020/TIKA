import { NextResponse } from 'next/server';
import { completeTicket } from '@/server/services/ticketService';
import { errorResponse, ErrorCode } from '@/server/http/errors';

type Params = { params: Promise<{ id: string }> };

function parseId(raw: string): number | null {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) return null;
  return id;
}

// PATCH /api/tickets/:id/complete — 티켓 완료 처리 (API_SPEC §5)
export async function PATCH(_req: Request, { params }: Params) {
  const id = parseId((await params).id);
  if (id === null) {
    return errorResponse(400, ErrorCode.VALIDATION_ERROR, '잘못된 티켓 ID입니다');
  }

  try {
    const ticket = await completeTicket(id);
    if (!ticket) {
      return errorResponse(404, ErrorCode.TICKET_NOT_FOUND, '티켓을 찾을 수 없습니다');
    }
    return NextResponse.json(ticket, { status: 200 });
  } catch {
    return errorResponse(500, ErrorCode.INTERNAL_ERROR, '서버 내부 오류');
  }
}
