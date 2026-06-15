import { NextResponse } from 'next/server';
import { createTicketSchema } from '@/shared/validations/ticket';
import { createTicket } from '@/server/services/ticketService';
import { errorResponse, ErrorCode } from '@/server/http/errors';

// POST /api/tickets — 새 티켓 생성 (docs/API_SPEC.md §1)
export async function POST(req: Request) {
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

  const parsed = createTicketSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? '요청이 올바르지 않습니다';
    return errorResponse(400, ErrorCode.VALIDATION_ERROR, message);
  }

  try {
    const ticket = await createTicket(parsed.data);
    return NextResponse.json(ticket, { status: 201 });
  } catch {
    return errorResponse(500, ErrorCode.INTERNAL_ERROR, '서버 내부 오류');
  }
}
