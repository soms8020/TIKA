// TDD Red — Board (Backlog 사이드바 + 3칼럼 메인 레이아웃)
// 명세: COMPONENT_SPEC 2.4, TEST_CASES C003-1~3
// 대상(미구현): src/client/components/board/Board.tsx
//   Props: { board: BoardData; onTicketClick }
//   레이아웃: .board-layout > [Backlog Column(.column--sidebar), .board-main > 3 Columns]
//   칼럼 순서: BACKLOG, TODO, IN_PROGRESS, DONE
import { render, screen, fireEvent } from '@testing-library/react';
import {
  TICKET_STATUS,
  TICKET_PRIORITY,
  COLUMN_LABELS,
  type BoardData,
  type TicketWithMeta,
} from '@/shared/types';

// --- dnd-kit mock (Board: DndContext/DragOverlay, Column: useDroppable/SortableContext, Card: useSortable) ---
jest.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DragOverlay: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useDroppable: () => ({ setNodeRef: jest.fn(), isOver: false }),
  // 센서 API (Board 가 useSensors/useSensor/PointerSensor 사용)
  useSensors: () => [],
  useSensor: () => ({}),
  PointerSensor: function PointerSensor() {},
}));
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
  SortableContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  verticalListSortingStrategy: undefined,
}));
jest.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: () => '' } },
}));

import { Board } from '@/client/components/board/Board';

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

const emptyBoard: BoardData = {
  BACKLOG: [],
  TODO: [],
  IN_PROGRESS: [],
  DONE: [],
};

describe('Board', () => {
  it('4개 칼럼을 BACKLOG, TODO, IN_PROGRESS, DONE 순서로 렌더한다', () => {
    const { container } = render(<Board board={emptyBoard} onTicketClick={() => {}} />);
    const labels = Array.from(
      container.querySelectorAll('.column__header'),
    ).map((el) => el.textContent);
    expect(labels[0]).toContain(COLUMN_LABELS.BACKLOG);
    expect(labels[1]).toContain(COLUMN_LABELS.TODO);
    expect(labels[2]).toContain(COLUMN_LABELS.IN_PROGRESS);
    expect(labels[3]).toContain(COLUMN_LABELS.DONE);
  });

  it('Backlog 는 사이드바(column--sidebar)로 배치된다', () => {
    const { container } = render(<Board board={emptyBoard} onTicketClick={() => {}} />);
    const sidebar = container.querySelector('.column--sidebar');
    expect(sidebar).toBeInTheDocument();
    expect(sidebar).toHaveTextContent(COLUMN_LABELS.BACKLOG);
  });

  it('메인 영역(.board-main)에 3개 칼럼이 들어간다', () => {
    const { container } = render(<Board board={emptyBoard} onTicketClick={() => {}} />);
    expect(container.querySelectorAll('.board-main .column')).toHaveLength(3);
  });

  it('카드 클릭 시 onTicketClick 을 호출한다', () => {
    const onTicketClick = jest.fn();
    const ticket = makeTicket({ id: 7, status: TICKET_STATUS.TODO });
    render(
      <Board
        board={{ ...emptyBoard, TODO: [ticket] }}
        onTicketClick={onTicketClick}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /티켓 열기/ }));
    expect(onTicketClick).toHaveBeenCalledWith(ticket);
  });
});
