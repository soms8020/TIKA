// TicketCard (TC-COMP-001) — 열기 버튼 + 전용 드래그 핸들 분리, React.memo
// 명세: docs/COMPONENT_SPEC.md §2.6, FR-003/004/017/018
//
// 계약(contract):
//   Props: { ticket: TicketWithMeta; onSelect: (ticket) => void; overlay?: boolean }
//   루트: div.card (드래그 노드), data-overdue / ticket-card-done 클래스
//   열기: button.card__open  (aria-label="티켓 열기: {title}") → onSelect(ticket)
//   드래그: button.card__drag-handle (aria-label="드래그하여 이동") = dnd-kit activator
//   overlay=true → 비대화형 복제본(card--overlay, aria-hidden, 버튼 없음)
import { render, screen, fireEvent } from '@testing-library/react';
import {
  TICKET_STATUS,
  TICKET_PRIORITY,
  type TicketWithMeta,
} from '@/shared/types';

// --- dnd-kit mock (드래그 핸들: setActivatorNodeRef 포함) ---
jest.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    setActivatorNodeRef: jest.fn(),
    transform: null,
    transition: undefined,
    isDragging: false,
  }),
}));
jest.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: () => '' }, Translate: { toString: () => '' } },
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
      <TicketCard ticket={makeTicket()} onSelect={() => {}} />,
    );
    expect(screen.getByText('기본 티켓')).toBeInTheDocument();
    expect(container.querySelector('[data-priority="MEDIUM"]')).toBeInTheDocument();
    expect(screen.getByTestId('ticket-due-date')).toHaveTextContent('2026-06-20');
  });

  // C001-2: 오버듀 → 루트 카드에 data-overdue
  it('C001-2: isOverdue=true 이면 카드에 data-overdue 속성을 가진다', () => {
    const { container } = render(
      <TicketCard ticket={makeTicket({ isOverdue: true })} onSelect={() => {}} />,
    );
    expect(container.querySelector('.card')).toHaveAttribute('data-overdue', 'true');
  });

  // C001-3: 완료 상태 → 루트 카드에 ticket-card-done
  it('C001-3: status=DONE 이면 ticket-card-done 클래스를 가진다', () => {
    const { container } = render(
      <TicketCard ticket={makeTicket({ status: TICKET_STATUS.DONE })} onSelect={() => {}} />,
    );
    expect(container.querySelector('.card')).toHaveClass('ticket-card-done');
  });

  // C001-4: 종료예정일 없는 티켓
  it('C001-4: dueDate=null 이면 종료예정일 영역을 숨긴다', () => {
    render(<TicketCard ticket={makeTicket({ dueDate: null })} onSelect={() => {}} />);
    expect(screen.queryByTestId('ticket-due-date')).toBeNull();
  });

  // C001-5: 열기 버튼 클릭 → onSelect(ticket)
  it('C001-5: 열기 버튼 클릭 시 onSelect 를 티켓과 함께 호출한다', () => {
    const onSelect = jest.fn();
    const ticket = makeTicket();
    render(<TicketCard ticket={ticket} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button', { name: /티켓 열기/ }));
    expect(onSelect).toHaveBeenCalledWith(ticket);
  });

  // C001-6: 긴 제목 말줄임 클래스
  it('C001-6: 긴 제목에 말줄임 클래스(card__title)를 적용한다', () => {
    const longTitle = '가'.repeat(200);
    render(<TicketCard ticket={makeTicket({ title: longTitle })} onSelect={() => {}} />);
    expect(screen.getByText(longTitle)).toHaveClass('card__title');
  });

  // C001-7: 우선순위별 data-priority
  it.each([
    TICKET_PRIORITY.LOW,
    TICKET_PRIORITY.MEDIUM,
    TICKET_PRIORITY.HIGH,
  ])('C001-7: priority=%s 이면 뱃지에 data-priority 속성을 가진다', (priority) => {
    const { container } = render(
      <TicketCard ticket={makeTicket({ priority })} onSelect={() => {}} />,
    );
    expect(container.querySelector(`[data-priority="${priority}"]`)).toBeInTheDocument();
  });

  // C001-8: 전용 드래그 핸들 버튼 제공
  it('C001-8: "드래그하여 이동" 핸들 버튼을 제공한다', () => {
    render(<TicketCard ticket={makeTicket()} onSelect={() => {}} />);
    const handle = screen.getByRole('button', { name: '드래그하여 이동' });
    expect(handle).toBeInTheDocument();
    expect(handle).toHaveClass('card__drag-handle');
  });

  // C001-9: 열기 버튼은 네이티브 button (키보드 Enter/Space 기본 활성화)
  it('C001-9: 열기 버튼은 type="button" 네이티브 버튼이다', () => {
    render(<TicketCard ticket={makeTicket()} onSelect={() => {}} />);
    expect(screen.getByRole('button', { name: /티켓 열기/ })).toHaveAttribute('type', 'button');
  });

  // C001-10: overlay 복제본은 비대화형(aria-hidden, 버튼 없음)
  it('C001-10: overlay=true 면 aria-hidden 비대화형 복제본을 렌더한다', () => {
    const { container } = render(
      <TicketCard ticket={makeTicket()} onSelect={() => {}} overlay />,
    );
    expect(screen.queryByRole('button')).toBeNull();
    expect(container.querySelector('.card--overlay')).toBeInTheDocument();
    expect(container.querySelector('.card[aria-hidden="true"]')).toBeInTheDocument();
  });
});
