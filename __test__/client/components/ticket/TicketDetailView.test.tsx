// TDD Red — TicketDetailView (TC-COMP-005 읽기 전용 필드)
// 명세: docs/COMPONENT_SPEC.md §2.7 표시 필드, FR-011
// 대상(미구현): src/client/components/ticket/TicketDetailView.tsx
//
// 계약(contract):
//   Props: { ticket: Ticket }
//   시스템 관리 필드를 읽기 전용(입력 요소 없이)으로 표시한다.
//     상태   → data-testid="detail-status"      (COLUMN_LABELS 라벨)
//     시작일 → data-testid="detail-started-at"   (startedAt, 없으면 "-")
//     종료일 → data-testid="detail-completed-at" (completedAt, 없으면 "-")
//     생성일 → data-testid="detail-created-at"   (createdAt, YYYY-MM-DD)
import { render, screen } from '@testing-library/react';
import {
  TICKET_STATUS,
  TICKET_PRIORITY,
  COLUMN_LABELS,
  type Ticket,
} from '@/shared/types';

import { TicketDetailView } from '@/client/components/ticket/TicketDetailView';

const baseTicket: Ticket = {
  id: 1,
  title: '상세 티켓',
  description: null,
  status: TICKET_STATUS.IN_PROGRESS,
  priority: TICKET_PRIORITY.MEDIUM,
  position: 0,
  plannedStartDate: null,
  dueDate: null,
  startedAt: new Date('2026-06-02T00:00:00Z'),
  completedAt: new Date('2026-06-05T00:00:00Z'),
  createdAt: new Date('2026-06-01T00:00:00Z'),
  updatedAt: new Date('2026-06-01T00:00:00Z'),
};

const makeTicket = (overrides: Partial<Ticket> = {}): Ticket => ({
  ...baseTicket,
  ...overrides,
});

describe('TicketDetailView (TC-COMP-005 읽기 전용)', () => {
  // 1) 상태/시작일/종료일/생성일 값 표시
  it('상태와 시작일/종료일/생성일을 읽기 전용으로 표시한다', () => {
    render(<TicketDetailView ticket={makeTicket()} />);

    expect(screen.getByTestId('detail-status')).toHaveTextContent(
      COLUMN_LABELS[TICKET_STATUS.IN_PROGRESS],
    );
    expect(screen.getByTestId('detail-started-at')).toHaveTextContent('2026-06-02');
    expect(screen.getByTestId('detail-completed-at')).toHaveTextContent('2026-06-05');
    expect(screen.getByTestId('detail-created-at')).toHaveTextContent('2026-06-01');
  });

  // 2) null 날짜는 "-"
  it('startedAt/completedAt 가 null 이면 "-" 로 표시한다', () => {
    render(
      <TicketDetailView
        ticket={makeTicket({ startedAt: null, completedAt: null })}
      />,
    );

    expect(screen.getByTestId('detail-started-at')).toHaveTextContent('-');
    expect(screen.getByTestId('detail-completed-at')).toHaveTextContent('-');
  });

  // 3) status 는 COLUMN_LABELS 라벨로 표시
  it('status 를 COLUMN_LABELS 라벨로 표시한다', () => {
    render(<TicketDetailView ticket={makeTicket({ status: TICKET_STATUS.DONE })} />);

    expect(screen.getByTestId('detail-status')).toHaveTextContent(
      COLUMN_LABELS[TICKET_STATUS.DONE],
    );
  });
});
