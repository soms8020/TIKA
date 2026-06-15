import { sql, eq, asc } from 'drizzle-orm';
import { db } from '@/server/db';
import { tickets } from '@/server/db/schema';
import {
  TICKET_STATUS,
  TICKET_PRIORITY,
  type Ticket,
  type TicketWithMeta,
  type TicketStatus,
  type TicketPriority,
  type BoardData,
  type CreateTicketInput,
  type UpdateTicketInput,
  type ReorderTicketInput,
} from '@/shared/types';

type TicketRow = typeof tickets.$inferSelect;

const DONE_VISIBLE_MS = 24 * 60 * 60 * 1000; // Done 칼럼 24시간 필터 (DATA_MODEL §5.4)

function toTicket(row: TicketRow): Ticket {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status as TicketStatus,
    priority: row.priority as TicketPriority,
    position: row.position,
    plannedStartDate: row.plannedStartDate,
    dueDate: row.dueDate,
    startedAt: row.startedAt,
    completedAt: row.completedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

// 오버듀 판정 (DATA_MODEL §5.3): dueDate < 오늘 && status !== DONE
export function isOverdue(ticket: Ticket): boolean {
  if (!ticket.dueDate) return false;
  if (ticket.status === TICKET_STATUS.DONE) return false;
  const today = new Date().toISOString().split('T')[0];
  return ticket.dueDate < today;
}

// Done 칼럼 표시 여부 (DATA_MODEL §5.4): completedAt 기준 24시간 이내
export function isDoneVisible(ticket: Ticket): boolean {
  if (ticket.status !== TICKET_STATUS.DONE) return false;
  if (!ticket.completedAt) return false;
  return Date.now() - ticket.completedAt.getTime() <= DONE_VISIBLE_MS;
}

function withMeta(ticket: Ticket): TicketWithMeta {
  return { ...ticket, isOverdue: isOverdue(ticket) };
}

// 해당 칼럼의 맨 위(최소 position - 1024) 값을 계산한다. 빈 칼럼이면 0.
async function topPosition(status: TicketStatus): Promise<number> {
  const rows = await db
    .select({ min: sql<number | null>`min(${tickets.position})` })
    .from(tickets)
    .where(eq(tickets.status, status));
  const min = rows[0]?.min;
  return (min === null || min === undefined ? 1024 : Number(min)) - 1024;
}

// POST /api/tickets — 새 티켓을 Backlog 맨 위에 생성 (API_SPEC §1)
export async function createTicket(input: CreateTicketInput): Promise<Ticket> {
  const position = await topPosition(TICKET_STATUS.BACKLOG);

  const [row] = await db
    .insert(tickets)
    .values({
      title: input.title,
      description: input.description ?? null,
      status: TICKET_STATUS.BACKLOG,
      priority: input.priority ?? TICKET_PRIORITY.MEDIUM,
      position,
      plannedStartDate: input.plannedStartDate ?? null,
      dueDate: input.dueDate ?? null,
    })
    .returning();

  return toTicket(row);
}

// GET /api/tickets — 전체 티켓을 칼럼별로 그룹화하여 반환 (API_SPEC §2)
export async function getBoard(): Promise<{ board: BoardData; total: number }> {
  const rows = await db.select().from(tickets).orderBy(asc(tickets.position));

  const board = {
    BACKLOG: [],
    TODO: [],
    IN_PROGRESS: [],
    DONE: [],
  } as BoardData;

  let total = 0;
  for (const row of rows) {
    const ticket = toTicket(row);
    // Done 칼럼은 24시간 이내 완료 티켓만 표시
    if (ticket.status === TICKET_STATUS.DONE && !isDoneVisible(ticket)) {
      continue;
    }
    board[ticket.status].push(withMeta(ticket));
    total += 1;
  }

  return { board, total };
}

// GET /api/tickets/:id — 단건 조회 (API_SPEC §3). 없으면 null
export async function getTicketById(id: number): Promise<TicketWithMeta | null> {
  const rows = await db.select().from(tickets).where(eq(tickets.id, id));
  if (rows.length === 0) return null;
  return withMeta(toTicket(rows[0]));
}

// PATCH /api/tickets/:id — 부분 수정 (API_SPEC §4). 없으면 null
export async function updateTicket(
  id: number,
  input: UpdateTicketInput
): Promise<TicketWithMeta | null> {
  const updates: Partial<TicketRow> = {};
  if ('title' in input && input.title !== undefined) updates.title = input.title;
  if ('description' in input) updates.description = input.description ?? null;
  if ('priority' in input && input.priority !== undefined) {
    updates.priority = input.priority;
  }
  if ('plannedStartDate' in input) {
    updates.plannedStartDate = input.plannedStartDate ?? null;
  }
  if ('dueDate' in input) updates.dueDate = input.dueDate ?? null;

  // 수정할 필드가 없으면 기존 티켓을 그대로 반환
  if (Object.keys(updates).length === 0) {
    return getTicketById(id);
  }

  const [row] = await db
    .update(tickets)
    .set(updates)
    .where(eq(tickets.id, id))
    .returning();

  if (!row) return null;
  return withMeta(toTicket(row));
}

// PATCH /api/tickets/:id/complete — Done 완료 처리 (API_SPEC §5). 없으면 null
export async function completeTicket(id: number): Promise<Ticket | null> {
  const existing = await db.select().from(tickets).where(eq(tickets.id, id));
  if (existing.length === 0) return null;

  const position = await topPosition(TICKET_STATUS.DONE);

  const [row] = await db
    .update(tickets)
    .set({
      status: TICKET_STATUS.DONE,
      completedAt: new Date(),
      position,
    })
    .where(eq(tickets.id, id))
    .returning();

  return toTicket(row);
}

// DELETE /api/tickets/:id — 하드 삭제 (API_SPEC §6). 삭제 성공 시 true, 없으면 false
export async function deleteTicket(id: number): Promise<boolean> {
  const deleted = await db
    .delete(tickets)
    .where(eq(tickets.id, id))
    .returning({ id: tickets.id });
  return deleted.length > 0;
}

export interface ReorderResult {
  ticket: Ticket;
  affected: { id: number; position: number }[];
}

// PATCH /api/tickets/reorder — 상태/순서 변경 (API_SPEC §7). 없으면 null
// 트랜잭션으로 처리하며, startedAt/completedAt 비즈니스 규칙을 적용한다.
export async function reorderTicket(
  input: ReorderTicketInput
): Promise<ReorderResult | null> {
  return db.transaction(async (tx) => {
    const existing = await tx
      .select()
      .from(tickets)
      .where(eq(tickets.id, input.ticketId));
    if (existing.length === 0) return null;

    const from = toTicket(existing[0]);

    const updates: Partial<TicketRow> = {
      status: input.status,
      position: input.position,
    };

    // startedAt 규칙 (DATA_MODEL §5.1)
    if (input.status === TICKET_STATUS.TODO) {
      updates.startedAt = new Date();
    } else if (
      from.status === TICKET_STATUS.TODO &&
      input.status === TICKET_STATUS.BACKLOG
    ) {
      updates.startedAt = null;
    }

    // completedAt 규칙 (DATA_MODEL §5.2): Done에서 나가면 초기화
    if (from.status === TICKET_STATUS.DONE) {
      updates.completedAt = null;
    }

    const [row] = await tx
      .update(tickets)
      .set(updates)
      .where(eq(tickets.id, input.ticketId))
      .returning();

    return { ticket: toTicket(row), affected: [] };
  });
}
