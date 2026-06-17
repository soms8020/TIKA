'use client';

// TicketCard — 개별 티켓 카드
// 명세: COMPONENT_SPEC §2.6, TEST_CASES TC-COMP-001, FR-003/004/017/018
// 구조: 카드 컨테이너(드래그 노드) + 열기 버튼(card__open) + 전용 드래그 핸들(card__drag-handle)
//   - 클릭/키보드 활성화(상세 열기)와 드래그를 서로 다른 <button> 으로 분리해 충돌 제거
//   - 드래그 리스너는 핸들에만 부착 → dnd-kit 키보드 드래그 보존
// 스타일: globals.css의 .card / .card__open / .card__drag-handle / .card__title / .card__desc / .card__chips
import { memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { type TicketWithMeta, TICKET_STATUS } from '@/shared/types';
import { PriorityBadge, DueDateBadge } from '../ui/Badge';

interface TicketCardProps {
  ticket: TicketWithMeta;
  onSelect: (ticket: TicketWithMeta) => void;
  overlay?: boolean;
}

const cardClassName = (
  ticket: TicketWithMeta,
  isDragging: boolean,
  overlay: boolean,
): string =>
  [
    'card',
    overlay ? 'card--overlay' : '',
    ticket.status === TICKET_STATUS.DONE ? 'ticket-card-done' : '',
    ticket.isOverdue ? 'card--overdue' : '',
    isDragging ? 'card--dragging' : '',
  ]
    .filter(Boolean)
    .join(' ');

// 카드 본문(열기 버튼/오버레이 공용) — 모두 phrasing 콘텐츠라 <button> 안에 둘 수 있다.
const CardBody = ({ ticket }: { ticket: TicketWithMeta }) => (
  <>
    <span className="card__title">{ticket.title}</span>
    {ticket.description && <span className="card__desc">{ticket.description}</span>}
    <span className="card__chips">
      <PriorityBadge priority={ticket.priority} />
      {ticket.dueDate && (
        <span data-testid="ticket-due-date">
          <DueDateBadge date={ticket.dueDate} isOverdue={ticket.isOverdue} />
        </span>
      )}
    </span>
  </>
);

export const TicketCard = memo(function TicketCard({
  ticket,
  onSelect,
  overlay = false,
}: TicketCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: ticket.id });

  // DragOverlay 복제본: 비대화형 + 스크린리더에서 숨김 (중복 버튼 방지)
  if (overlay) {
    return (
      <div className={cardClassName(ticket, false, true)} aria-hidden="true">
        <CardBody ticket={ticket} />
      </div>
    );
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cardClassName(ticket, isDragging, false)}
      data-overdue={ticket.isOverdue ? 'true' : undefined}
    >
      {/* 상세 열기 — 네이티브 button: Enter/Space 활성화 기본 제공 */}
      <button
        type="button"
        className="card__open"
        aria-label={`티켓 열기: ${ticket.title}`}
        onClick={() => onSelect(ticket)}
      >
        <CardBody ticket={ticket} />
      </button>

      {/* 전용 드래그 핸들 — dnd-kit activator(리스너 미덮어쓰기) */}
      <button
        type="button"
        ref={setActivatorNodeRef}
        className="card__drag-handle"
        aria-label="드래그하여 이동"
        {...attributes}
        {...listeners}
      >
        ⠿
      </button>
    </div>
  );
});
