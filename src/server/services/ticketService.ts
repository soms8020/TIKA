import { sql, eq } from 'drizzle-orm';
import { db } from '@/server/db';
import { tickets } from '@/server/db/schema';
import {
  TICKET_STATUS,
  TICKET_PRIORITY,
  type Ticket,
  type TicketStatus,
  type TicketPriority,
  type CreateTicketInput,
} from '@/shared/types';

type TicketRow = typeof tickets.$inferSelect;

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

// 새 티켓을 Backlog 맨 위에 생성한다 (docs/API_SPEC.md §1, DATA_MODEL.md §5.5).
export async function createTicket(input: CreateTicketInput): Promise<Ticket> {
  // Backlog 칼럼의 최소 position 조회 → 맨 위 배치값 계산.
  // 빈 칼럼이면 min이 null이므로 sentinel 1024를 사용해 position이 0이 되도록 한다.
  const rows = await db
    .select({ min: sql<number | null>`min(${tickets.position})` })
    .from(tickets)
    .where(eq(tickets.status, TICKET_STATUS.BACKLOG));

  const min = rows[0]?.min;
  const position = (min === null || min === undefined ? 1024 : Number(min)) - 1024;

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
