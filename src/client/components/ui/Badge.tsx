// Badge — 우선순위 뱃지(PriorityBadge) / 종료예정일 칩(DueDateBadge)
// 스타일: globals.css의 .badge / .badge--{low|medium|high}, .chip / .chip--overdue
import { type TicketPriority } from '@/shared/types';

const PRIORITY_LABEL: Record<TicketPriority, string> = {
  LOW: '낮음',
  MEDIUM: '보통',
  HIGH: '높음',
};

const PRIORITY_CLASS: Record<TicketPriority, string> = {
  LOW: 'badge--low',
  MEDIUM: 'badge--medium',
  HIGH: 'badge--high',
};

export const PriorityBadge = ({ priority }: { priority: TicketPriority }) => (
  <span className={`badge ${PRIORITY_CLASS[priority]}`} data-priority={priority}>
    {PRIORITY_LABEL[priority]}
  </span>
);

interface DueDateBadgeProps {
  date: string | null;
  isOverdue?: boolean;
}

export const DueDateBadge = ({ date, isOverdue = false }: DueDateBadgeProps) => {
  if (!date) return null;
  return (
    <span className={`chip chip--due${isOverdue ? ' chip--overdue' : ''}`}>
      {date}
    </span>
  );
};
