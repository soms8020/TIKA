// TDD Red — Column (SortableContext + useDroppable + 빈 칼럼 안내)
// 명세: COMPONENT_SPEC 2.5, TEST_CASES C002-1~3
// 대상(미구현): src/client/components/board/Column.tsx
//   Props: { status; tickets; onTicketClick }
//   클래스: column, BACKLOG→column--sidebar / 그 외→column--main, isOver→column--drop-active
//   빈 칼럼 안내: "이 칼럼에 티켓이 없습니다"
import { render, screen, fireEvent } from '@testing-library/react';
import {
  TICKET_STATUS,
  TICKET_PRIORITY,
  COLUMN_LABELS,
  type TicketWithMeta,
} from '@/shared/types';

// --- dnd-kit mock (Column: useDroppable / SortableContext, TicketCard: useSortable) ---
let mockIsOver = false;
jest.mock('@dnd-kit/core', () => ({
  useDroppable: () => ({ setNodeRef: jest.fn(), isOver: mockIsOver }),
}));
jest.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    transition: undefined,
    isDragging: false,
  }),
  SortableContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  verticalListSortingStrategy: undefined,
}));
jest.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: () => '' } },
}));

import { Column } from '@/client/components/board/Column';

const makeTicket = (overrides: Partial<TicketWithMeta> = {}): TicketWithMeta => ({
  id: 1,
  title: '티켓',
  description: null,
  status: TICKET_STATUS.TODO,
  priority: TICKET_PRIORITY.MEDIUM,
  position: 0,
  plannedStartDate: null,
  dueDate: null,
  startedAt: null,
  completedAt: null,
  createdAt: new Date('2026-06-01'),
  updatedAt: new Date('2026-06-01'),
  isOverdue: false,
  ...overrides,
});

afterEach(() => {
  mockIsOver = false;
});

describe('Column', () => {
  it('칼럼명과 카드 수를 표시한다', () => {
    const tickets = [makeTicket({ id: 1 }), makeTicket({ id: 2 })];
    const { container } = render(
      <Column status={TICKET_STATUS.TODO} tickets={tickets} onTicketClick={() => {}} />,
    );
    expect(screen.getByText(COLUMN_LABELS.TODO)).toBeInTheDocument();
    expect(container.querySelector('.column__count')).toHaveTextContent('2');
  });

  it('티켓들을 카드로 렌더한다', () => {
    const tickets = [makeTicket({ id: 1 }), makeTicket({ id: 2 }), makeTicket({ id: 3 })];
    render(
      <Column status={TICKET_STATUS.TODO} tickets={tickets} onTicketClick={() => {}} />,
    );
    expect(screen.getAllByRole('button')).toHaveLength(3);
  });

  it('빈 칼럼이면 안내 문구를 표시한다', () => {
    render(<Column status={TICKET_STATUS.TODO} tickets={[]} onTicketClick={() => {}} />);
    expect(screen.getByText('이 칼럼에 티켓이 없습니다')).toBeInTheDocument();
  });

  it('티켓이 있으면 빈 칼럼 안내를 표시하지 않는다', () => {
    render(
      <Column status={TICKET_STATUS.TODO} tickets={[makeTicket()]} onTicketClick={() => {}} />,
    );
    expect(screen.queryByText('이 칼럼에 티켓이 없습니다')).toBeNull();
  });

  it('BACKLOG 칼럼은 column--sidebar 스타일을 가진다', () => {
    const { container } = render(
      <Column status={TICKET_STATUS.BACKLOG} tickets={[]} onTicketClick={() => {}} />,
    );
    expect(container.querySelector('.column')).toHaveClass('column--sidebar');
  });

  it('메인 칼럼(TODO 등)은 column--main 스타일을 가진다', () => {
    const { container } = render(
      <Column status={TICKET_STATUS.TODO} tickets={[]} onTicketClick={() => {}} />,
    );
    expect(container.querySelector('.column')).toHaveClass('column--main');
  });

  it('드롭 대상(isOver)일 때 column--drop-active 를 적용한다', () => {
    mockIsOver = true;
    const { container } = render(
      <Column status={TICKET_STATUS.TODO} tickets={[]} onTicketClick={() => {}} />,
    );
    expect(container.querySelector('.column')).toHaveClass('column--drop-active');
  });

  it('카드 클릭 시 해당 티켓으로 onTicketClick 을 호출한다', () => {
    const onTicketClick = jest.fn();
    const ticket = makeTicket({ id: 42 });
    render(
      <Column status={TICKET_STATUS.TODO} tickets={[ticket]} onTicketClick={onTicketClick} />,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onTicketClick).toHaveBeenCalledWith(ticket);
  });
});
