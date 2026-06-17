'use client';

// Column — 단일 칼럼(상태)의 카드 목록 + 드롭 영역
// 명세: COMPONENT_SPEC 2.5, TEST_CASES C002-1~3, FR-001/002
// 스타일: globals.css의 .column / .column--sidebar / .column--main / .column--drop-active
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import {
  TICKET_STATUS,
  COLUMN_LABELS,
  type TicketStatus,
  type TicketWithMeta,
} from '@/shared/types';
import { ColumnHeader } from './ColumnHeader';
import { TicketCard } from '../ticket/TicketCard';

interface ColumnProps {
  status: TicketStatus;
  tickets: TicketWithMeta[];
  onTicketClick: (ticket: TicketWithMeta) => void;
}

export const Column = ({ status, tickets, onTicketClick }: ColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const isSidebar = status === TICKET_STATUS.BACKLOG;

  const className = [
    'column',
    isSidebar ? 'column--sidebar' : 'column--main',
    isOver ? 'column--drop-active' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div ref={setNodeRef} className={className} data-status={status}>
      <ColumnHeader title={COLUMN_LABELS[status]} count={tickets.length} />
      <SortableContext
        items={tickets.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="column__list">
          {tickets.length === 0 ? (
            <p className="column__empty">이 칼럼에 티켓이 없습니다</p>
          ) : (
            tickets.map((ticket) => (
              // onSelect 는 안정 참조(onTicketClick) → TicketCard 의 React.memo 가 유효
              <TicketCard key={ticket.id} ticket={ticket} onSelect={onTicketClick} />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
};
