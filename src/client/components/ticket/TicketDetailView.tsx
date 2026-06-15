// TicketDetailView — 티켓 읽기 전용 상세 (COMPONENT_SPEC §2.7, TC-COMP-005)
// 시스템 관리 필드(상태/시작일/종료일/생성일)를 읽기 전용으로 표시한다.
// 스타일: globals.css 의 .detail-view / .detail-row / .detail-label / .detail-value
import { COLUMN_LABELS, type Ticket } from '@/shared/types';

interface TicketDetailViewProps {
  ticket: Ticket;
}

// Date → YYYY-MM-DD, 값이 없으면 "-"
const formatDate = (value: Date | null): string =>
  value ? value.toISOString().slice(0, 10) : '-';

export const TicketDetailView = ({ ticket }: TicketDetailViewProps) => (
  <dl className="detail-view">
    <div className="detail-row">
      <dt className="detail-label">상태</dt>
      <dd className="detail-value" data-testid="detail-status">
        {COLUMN_LABELS[ticket.status]}
      </dd>
    </div>
    <div className="detail-row">
      <dt className="detail-label">시작일</dt>
      <dd className="detail-value" data-testid="detail-started-at">
        {formatDate(ticket.startedAt)}
      </dd>
    </div>
    <div className="detail-row">
      <dt className="detail-label">종료일</dt>
      <dd className="detail-value" data-testid="detail-completed-at">
        {formatDate(ticket.completedAt)}
      </dd>
    </div>
    <div className="detail-row">
      <dt className="detail-label">생성일</dt>
      <dd className="detail-value" data-testid="detail-created-at">
        {formatDate(ticket.createdAt)}
      </dd>
    </div>
  </dl>
);
