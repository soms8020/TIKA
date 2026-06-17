// TDD Red — BoardContainer (COMPONENT_SPEC §2.1/§5, FRONTEND_TASKS 5.3)
// 대상(미구현): src/client/components/board/BoardContainer.tsx
//
// 오케스트레이션: useTickets + BoardHeader(생성) + FilterBar(필터) + Board(DnD) + TicketModal(상세)
//   - "새 업무" → 생성 모달, 제출 → create
//   - 카드 클릭 → 상세 모달(TicketModal)
//   - DnD onDragEnd: 대상=Done → complete, 그 외 → reorder(계산된 position)
//   - 필터: Backlog 제외 메인 칼럼에만 적용
import { render, screen, fireEvent, act } from '@testing-library/react';
import {
  TICKET_STATUS,
  TICKET_PRIORITY,
  type BoardData,
  type TicketWithMeta,
} from '@/shared/types';

jest.mock('@/client/api/ticketApi');
import * as ticketApi from '@/client/api/ticketApi';

// Board 는 DnD/카드클릭을 구동하기 위한 경량 스텁으로 대체한다.
jest.mock('@/client/components/board/Board', () => ({
  Board: (props: {
    board: BoardData;
    onTicketClick: (t: TicketWithMeta) => void;
    onDragStart?: (e: { active: { id: number } }) => void;
    onDragEnd?: (e: { active: { id: number }; over: { id: number | string } | null }) => void;
    activeTicket?: TicketWithMeta | null;
    filterSlot?: import('react').ReactNode;
  }) => (
    <div data-testid="board-mock">
      {props.filterSlot}
      <span data-testid="todo-count">{props.board.TODO.length}</span>
      <span data-testid="backlog-count">{props.board.BACKLOG.length}</span>
      <span data-testid="active-id">{props.activeTicket?.id ?? 'none'}</span>
      <button data-testid="click-card" onClick={() => props.onTicketClick(props.board.TODO[0])}>
        card
      </button>
      <button data-testid="drag-start" onClick={() => props.onDragStart?.({ active: { id: 1 } })}>
        start
      </button>
      <button
        data-testid="drag-done"
        onClick={() => props.onDragEnd?.({ active: { id: 1 }, over: { id: 'DONE' } })}
      >
        to-done
      </button>
      <button
        data-testid="drag-ip"
        onClick={() => props.onDragEnd?.({ active: { id: 1 }, over: { id: 'IN_PROGRESS' } })}
      >
        to-ip
      </button>
      <button
        data-testid="drag-none"
        onClick={() => props.onDragEnd?.({ active: { id: 1 }, over: null })}
      >
        none
      </button>
    </div>
  ),
}));

import { BoardContainer } from '@/client/components/board/BoardContainer';

const mockedApi = ticketApi as jest.Mocked<typeof ticketApi>;

const card = (id: number, status: TicketWithMeta['status'], overrides: Partial<TicketWithMeta> = {}): TicketWithMeta => ({
  id,
  title: `t${id}`,
  description: null,
  status,
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

const initialData: BoardData = {
  BACKLOG: [card(10, TICKET_STATUS.BACKLOG)],
  TODO: [card(1, TICKET_STATUS.TODO, { title: '할 일 1' })],
  IN_PROGRESS: [],
  DONE: [],
};

beforeEach(() => {
  jest.clearAllMocks();
  mockedApi.getBoard.mockResolvedValue(initialData);
  mockedApi.create.mockResolvedValue(card(2, TICKET_STATUS.BACKLOG));
  mockedApi.update.mockResolvedValue(card(1, TICKET_STATUS.TODO));
  mockedApi.remove.mockResolvedValue(undefined);
  mockedApi.reorder.mockResolvedValue({ ticket: card(1, TICKET_STATUS.IN_PROGRESS), affected: [] });
  mockedApi.complete.mockResolvedValue(card(1, TICKET_STATUS.DONE));
});

describe('BoardContainer', () => {
  it('헤더(Tika/새 업무), 필터 버튼, 보드를 렌더한다', () => {
    render(<BoardContainer initialData={initialData} />);
    expect(screen.getByRole('heading', { name: 'Tika' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '새 업무' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /이번주 업무/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /일정 초과/ })).toBeInTheDocument();
    expect(screen.getByTestId('board-mock')).toBeInTheDocument();
  });

  it('"새 업무" 클릭 시 생성 모달(TicketForm)을 연다', () => {
    render(<BoardContainer initialData={initialData} />);
    fireEvent.click(screen.getByRole('button', { name: '새 업무' }));
    expect(screen.getByText('새 티켓 생성')).toBeInTheDocument();
    expect(screen.getByLabelText(/제목/)).toBeInTheDocument();
  });

  it('생성 모달에서 제출하면 ticketApi.create 를 호출한다', async () => {
    render(<BoardContainer initialData={initialData} />);
    fireEvent.click(screen.getByRole('button', { name: '새 업무' }));
    fireEvent.change(screen.getByLabelText(/제목/), { target: { value: '신규 업무' } });

    await act(async () => {
      fireEvent.click(screen.getByTestId('ticket-form-submit'));
    });

    expect(mockedApi.create).toHaveBeenCalledWith(
      expect.objectContaining({ title: '신규 업무' }),
    );
  });

  it('카드 클릭 시 상세 모달(TicketModal)을 연다', () => {
    render(<BoardContainer initialData={initialData} />);
    fireEvent.click(screen.getByTestId('click-card'));
    expect(screen.getByTestId('detail-status')).toHaveTextContent('TODO');
    expect(screen.getByLabelText(/제목/)).toHaveValue('할 일 1');
  });

  it('Done 칼럼으로 드롭하면 ticketApi.complete 를 호출한다', async () => {
    render(<BoardContainer initialData={initialData} />);
    await act(async () => {
      fireEvent.click(screen.getByTestId('drag-done'));
    });
    expect(mockedApi.complete).toHaveBeenCalledWith(1);
    expect(mockedApi.reorder).not.toHaveBeenCalled();
  });

  it('다른 칼럼으로 드롭하면 계산된 position 으로 ticketApi.reorder 를 호출한다', async () => {
    render(<BoardContainer initialData={initialData} />);
    await act(async () => {
      fireEvent.click(screen.getByTestId('drag-ip'));
    });
    expect(mockedApi.reorder).toHaveBeenCalledWith({
      ticketId: 1,
      status: TICKET_STATUS.IN_PROGRESS,
      position: 0, // 빈 IN_PROGRESS 칼럼
    });
    expect(mockedApi.complete).not.toHaveBeenCalled();
  });

  it('"일정 초과" 필터는 메인 칼럼에만 적용되고 Backlog 는 유지된다', () => {
    render(<BoardContainer initialData={initialData} />);
    expect(screen.getByTestId('todo-count')).toHaveTextContent('1');

    fireEvent.click(screen.getByRole('button', { name: /일정 초과/ }));

    expect(screen.getByTestId('todo-count')).toHaveTextContent('0'); // 오버듀 아님 → 제외
    expect(screen.getByTestId('backlog-count')).toHaveTextContent('1'); // Backlog 불변
  });

  it('드래그 시작 시 activeTicket 을 설정한다(DragOverlay)', () => {
    render(<BoardContainer initialData={initialData} />);
    expect(screen.getByTestId('active-id')).toHaveTextContent('none');
    fireEvent.click(screen.getByTestId('drag-start'));
    expect(screen.getByTestId('active-id')).toHaveTextContent('1');
  });

  it('over 가 없는 드롭은 아무 API 도 호출하지 않는다', async () => {
    render(<BoardContainer initialData={initialData} />);
    await act(async () => {
      fireEvent.click(screen.getByTestId('drag-none'));
    });
    expect(mockedApi.complete).not.toHaveBeenCalled();
    expect(mockedApi.reorder).not.toHaveBeenCalled();
  });

  it('생성 모달에서 취소하면 닫힌다', () => {
    render(<BoardContainer initialData={initialData} />);
    fireEvent.click(screen.getByRole('button', { name: '새 업무' }));
    expect(screen.getByText('새 티켓 생성')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '취소' }));
    expect(screen.queryByText('새 티켓 생성')).toBeNull();
  });

  it('상세 모달에서 수정 제출 시 ticketApi.update 를 호출한다', async () => {
    render(<BoardContainer initialData={initialData} />);
    fireEvent.click(screen.getByTestId('click-card'));
    await act(async () => {
      fireEvent.click(screen.getByTestId('ticket-form-submit'));
    });
    expect(mockedApi.update).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ title: '할 일 1' }),
    );
  });

  it('상세 모달에서 삭제 확인 시 ticketApi.remove 를 호출한다', async () => {
    render(<BoardContainer initialData={initialData} />);
    fireEvent.click(screen.getByTestId('click-card'));
    fireEvent.click(screen.getByTestId('ticket-delete-button'));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '확인' }));
    });
    expect(mockedApi.remove).toHaveBeenCalledWith(1);
  });
});
