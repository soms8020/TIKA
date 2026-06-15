'use client';

// TicketCard — 개별 티켓 카드 (드래그 소스)
// 명세: COMPONENT_SPEC 2.6, TEST_CASES TC-COMP-001, FR-003/004/017/018
// 스타일: globals.css의 .card / .card__title / .card__desc / .card__chips
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { type TicketWithMeta, TICKET_STATUS } from '@/shared/types';
import { PriorityBadge, DueDateBadge } from '../ui/Badge';

interface TicketCardProps {
  ticket: TicketWithMeta;
  onClick: () => void;
}

export const TicketCard = ({ ticket, onClick }: TicketCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: ticket.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const className = [
    'card',
    ticket.status === TICKET_STATUS.DONE ? 'ticket-card-done' : '',
    ticket.isOverdue ? 'card--overdue' : '',
    isDragging ? 'card--dragging' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={className}
      role="button"
      tabIndex={0}
      aria-label={`티켓: ${ticket.title}`}
      data-overdue={ticket.isOverdue ? 'true' : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onClick();
      }}
    >
      <p className="card__title">{ticket.title}</p>
      {ticket.description && <p className="card__desc">{ticket.description}</p>}
      <div className="card__chips">
        <PriorityBadge priority={ticket.priority} />
        {ticket.dueDate && (
          <span data-testid="ticket-due-date">
            <DueDateBadge date={ticket.dueDate} isOverdue={ticket.isOverdue} />
          </span>
        )}
      </div>
    </div>
  );
};
