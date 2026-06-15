// TDD Red — TicketCard (TC-COMP-001 변환)
// 명세: docs/TEST_CASES.md TC-COMP-001, COMPONENT_SPEC 2.6, FR-003/004/017/018
// 대상(미구현): src/client/components/ticket/TicketCard.tsx
//
// 계약(contract):
//   Props: { ticket: TicketWithMeta; onClick: () => void }
//   루트: role="button", aria-label="티켓: {title}"
//         - status=DONE      → 클래스 'ticket-card-done'
//         - isOverdue=true   → 속성 data-overdue="true"
//   제목: 클래스 'card__title' (1줄 말줄임)
//   우선순위 뱃지: 속성 data-priority={priority}
//   종료예정일: data-testid="ticket-due-date" (dueDate=null 이면 미렌더)
//
// dnd-kit은 mock 처리 (DndContext 없이 렌더 가능하게).
import { render, screen, fireEvent } from '@testing-library/react';
import {
  TICKET_STATUS,
  TICKET_PRIORITY,
  type TicketWithMeta,
} from '@/shared/types';

// --- dnd-kit mock ---
jest.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    transition: undefined,
    isDragging: false,
  }),
}));
jest.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: { toString: () => '' },
    Translate: { toString: () => '' },
  },
}));

import { TicketCard } from '@/client/components/ticket/TicketCard';

const baseTicket: TicketWithMeta = {
  id: 1,
  title: '기본 티켓',
  description: '카드 설명',
  status: TICKET_STATUS.TODO,
  priority: TICKET_PRIORITY.MEDIUM,
  position: 0,
  plannedStartDate: null,
  dueDate: '2026-06-20',
  startedAt: null,
  completedAt: null,
  createdAt: new Date('2026-06-01T00:00:00Z'),
  updatedAt: new Date('2026-06-01T00:00:00Z'),
  isOverdue: false,
};

const makeTicket = (overrides: Partial<TicketWithMeta> = {}): TicketWithMeta => ({
  ...baseTicket,
  ...overrides,
});

describe('TicketCard (TC-COMP-001)', () => {
  // C001-1: 기본 렌더링
  it('C001-1: 제목, 우선순위 뱃지, 종료예정일을 렌더한다', () => {
    const { container } = render(
      <TicketCard ticket={makeTicket()} onClick={() => {}} />,
    );
    expect(screen.getByText('기본 티켓')).toBeInTheDocument();
    expect(container.querySelector('[data-priority="MEDIUM"]')).toBeInTheDocument();
    expect(screen.getByTestId('ticket-due-date')).toHaveTextContent('2026-06-20');
  });

  // C001-2: 오버듀 표시
  it('C001-2: isOverdue=true 이면 data-overdue 속성을 가진다', () => {
    render(<TicketCard ticket={makeTicket({ isOverdue: true })} onClick={() => {}} />);
    expect(screen.getByRole('button')).toHaveAttribute('data-overdue', 'true');
  });

  // C001-3: 완료 상태
  it('C001-3: status=DONE 이면 ticket-card-done 클래스를 가진다', () => {
    render(
      <TicketCard
        ticket={makeTicket({ status: TICKET_STATUS.DONE })}
        onClick={() => {}}
      />,
    );
    expect(screen.getByRole('button')).toHaveClass('ticket-card-done');
  });

  // C001-4: 종료예정일 없는 티켓
  it('C001-4: dueDate=null 이면 종료예정일 영역을 숨긴다', () => {
    render(<TicketCard ticket={makeTicket({ dueDate: null })} onClick={() => {}} />);
    expect(screen.queryByTestId('ticket-due-date')).toBeNull();
  });

  // C001-5: 클릭 이벤트
  it('C001-5: 카드 클릭 시 onClick 을 호출한다', () => {
    const onClick = jest.fn();
    render(<TicketCard ticket={makeTicket()} onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  // C001-6: 긴 제목 말줄임
  it('C001-6: 긴 제목에 말줄임 클래스(card__title)를 적용한다', () => {
    const longTitle = '가'.repeat(200);
    render(<TicketCard ticket={makeTicket({ title: longTitle })} onClick={() => {}} />);
    expect(screen.getByText(longTitle)).toHaveClass('card__title');
  });

  // C001-7: 우선순위별 뱃지 data-priority
  it.each([
    TICKET_PRIORITY.LOW,
    TICKET_PRIORITY.MEDIUM,
    TICKET_PRIORITY.HIGH,
  ])('C001-7: priority=%s 이면 뱃지에 data-priority 속성을 가진다', (priority) => {
    const { container } = render(
      <TicketCard ticket={makeTicket({ priority })} onClick={() => {}} />,
    );
    expect(
      container.querySelector(`[data-priority="${priority}"]`),
    ).toBeInTheDocument();
  });
});
