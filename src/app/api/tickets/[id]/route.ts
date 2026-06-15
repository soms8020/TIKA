import { NextResponse } from 'next/server';
import { updateTicketSchema } from '@/shared/validations/ticket';
import {
  getTicketById,
  updateTicket,
  deleteTicket,
} from '@/server/services/ticketService';
import { errorResponse, ErrorCode } from '@/server/http/errors';

type Params = { params: Promise<{ id: string }> };

function parseId(raw: string): number | null {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) return null;
  return id;
}

// GET /api/tickets/:id — 티켓 상세 조회 (API_SPEC §3)
export async function GET(_req: Request, { params }: Params) {
  const id = parseId((await params).id);
  if (id === null) {
    return errorResponse(400, ErrorCode.VALIDATION_ERROR, '잘못된 티켓 ID입니다');
  }

  try {
    const ticket = await getTicketById(id);
    if (!ticket) {
      return errorResponse(404, ErrorCode.TICKET_NOT_FOUND, '티켓을 찾을 수 없습니다');
    }
    return NextResponse.json(ticket, { status: 200 });
  } catch {
    return errorResponse(500, ErrorCode.INTERNAL_ERROR, '서버 내부 오류');
  }
}

// PATCH /api/tickets/:id — 티켓 수정 (API_SPEC §4)
export async function PATCH(req: Request, { params }: Params) {
  const id = parseId((await params).id);
  if (id === null) {
    return errorResponse(400, ErrorCode.VALIDATION_ERROR, '잘못된 티켓 ID입니다');
  }

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

  const parsed = updateTicketSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? '요청이 올바르지 않습니다';
    return errorResponse(400, ErrorCode.VALIDATION_ERROR, message);
  }

  try {
    const ticket = await updateTicket(id, parsed.data);
    if (!ticket) {
      return errorResponse(404, ErrorCode.TICKET_NOT_FOUND, '티켓을 찾을 수 없습니다');
    }
    return NextResponse.json(ticket, { status: 200 });
  } catch {
    return errorResponse(500, ErrorCode.INTERNAL_ERROR, '서버 내부 오류');
  }
}

// DELETE /api/tickets/:id — 티켓 삭제 (API_SPEC §6)
export async function DELETE(_req: Request, { params }: Params) {
  const id = parseId((await params).id);
  if (id === null) {
    return errorResponse(400, ErrorCode.VALIDATION_ERROR, '잘못된 티켓 ID입니다');
  }

  try {
    const deleted = await deleteTicket(id);
    if (!deleted) {
      return errorResponse(404, ErrorCode.TICKET_NOT_FOUND, '티켓을 찾을 수 없습니다');
    }
    return new NextResponse(null, { status: 204 });
  } catch {
    return errorResponse(500, ErrorCode.INTERNAL_ERROR, '서버 내부 오류');
  }
}
