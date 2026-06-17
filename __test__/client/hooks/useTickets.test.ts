// useTickets (COMPONENT_SPEC §4, FRONTEND_TASKS Phase 5.1)
//   create/update/remove : API 호출 → getBoard 재조회
//   reorder/complete     : 낙관적 업데이트 (백업 → 즉시 반영 → API → 실패 시 롤백)
// ticketApi 는 jest.mock 으로 대체한다.
import { renderHook, act } from '@testing-library/react';
import {
  TICKET_STATUS,
  TICKET_PRIORITY,
  type BoardData,
  type Ticket,
  type TicketWithMeta,
} from '@/shared/types';

jest.mock('@/client/api/ticketApi');
import * as ticketApi from '@/client/api/ticketApi';
import { useTickets } from '@/client/hooks/useTickets';

const mockedApi = ticketApi as jest.Mocked<typeof ticketApi>;

const card = (id: number, status: TicketWithMeta['status'], position: number): TicketWithMeta => ({
  id,
  title: `t${id}`,
  description: null,
  status,
  priority: TICKET_PRIORITY.MEDIUM,
  position,
  plannedStartDate: null,
  dueDate: null,
  startedAt: null,
  completedAt: null,
  createdAt: new Date('2026-06-01'),
  updatedAt: new Date('2026-06-01'),
  isOverdue: false,
});

const emptyBoard = (): BoardData => ({ BACKLOG: [], TODO: [], IN_PROGRESS: [], DONE: [] });
// reorder/complete 낙관적 이동을 관찰하려면 카드가 있는 board 가 필요하다
const boardWith = (): BoardData => ({ ...emptyBoard(), TODO: [card(1, TICKET_STATUS.TODO, 0)] });

const initialData: BoardData = emptyBoard();
const refreshedBoard: BoardData = emptyBoard(); // getBoard 재조회 결과 (다른 참조)

const sampleTicket: Ticket = {
  id: 1,
  title: '샘플',
  description: null,
  status: TICKET_STATUS.BACKLOG,
  priority: TICKET_PRIORITY.MEDIUM,
  position: 0,
  plannedStartDate: null,
  dueDate: null,
  startedAt: null,
  completedAt: null,
  createdAt: new Date('2026-06-01'),
  updatedAt: new Date('2026-06-01'),
};

beforeEach(() => {
  jest.clearAllMocks();
  mockedApi.getBoard.mockResolvedValue(refreshedBoard);
  mockedApi.create.mockResolvedValue(sampleTicket);
  mockedApi.update.mockResolvedValue(sampleTicket);
  mockedApi.remove.mockResolvedValue(undefined);
  mockedApi.reorder.mockResolvedValue({ ticket: sampleTicket, affected: [] });
  mockedApi.complete.mockResolvedValue(sampleTicket);
});

describe('useTickets', () => {
  it('initialData 로 board 를 초기화하고 isLoading=false, error=null 이다', () => {
    const { result } = renderHook(() => useTickets(initialData));
    expect(result.current.board).toBe(initialData);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('create: ticketApi.create 호출 후 getBoard 로 새로고침한다', async () => {
    const { result } = renderHook(() => useTickets(initialData));
    const data = { title: '새 티켓' };
    await act(async () => {
      await result.current.create(data);
    });
    expect(mockedApi.create).toHaveBeenCalledWith(data);
    expect(mockedApi.getBoard).toHaveBeenCalledTimes(1);
    expect(result.current.board).toBe(refreshedBoard);
  });

  it('update: ticketApi.update(id, data) 호출 후 새로고침한다', async () => {
    const { result } = renderHook(() => useTickets(initialData));
    const data = { title: '수정' };
    await act(async () => {
      await result.current.update(5, data);
    });
    expect(mockedApi.update).toHaveBeenCalledWith(5, data);
    expect(mockedApi.getBoard).toHaveBeenCalledTimes(1);
    expect(result.current.board).toBe(refreshedBoard);
  });

  it('remove: ticketApi.remove(id) 호출 후 새로고침한다', async () => {
    const { result } = renderHook(() => useTickets(initialData));
    await act(async () => {
      await result.current.remove(5);
    });
    expect(mockedApi.remove).toHaveBeenCalledWith(5);
    expect(mockedApi.getBoard).toHaveBeenCalledTimes(1);
    expect(result.current.board).toBe(refreshedBoard);
  });

  it('reorder: 낙관적으로 board 를 즉시 갱신하고 reorder 호출, getBoard 는 호출하지 않는다', async () => {
    const { result } = renderHook(() => useTickets(boardWith()));
    await act(async () => {
      await result.current.reorder(1, TICKET_STATUS.IN_PROGRESS, 1024);
    });
    expect(mockedApi.reorder).toHaveBeenCalledWith({
      ticketId: 1,
      status: TICKET_STATUS.IN_PROGRESS,
      position: 1024,
    });
    expect(mockedApi.getBoard).not.toHaveBeenCalled();
    expect(result.current.board.TODO).toHaveLength(0);
    expect(result.current.board.IN_PROGRESS.map((t) => t.id)).toEqual([1]);
  });

  it('reorder 실패 시 board 를 롤백하고 error 를 설정한다', async () => {
    mockedApi.reorder.mockRejectedValueOnce(new Error('이동 실패'));
    const { result } = renderHook(() => useTickets(boardWith()));
    await act(async () => {
      await result.current.reorder(1, TICKET_STATUS.IN_PROGRESS, 1024);
    });
    expect(result.current.board.TODO.map((t) => t.id)).toEqual([1]); // 롤백
    expect(result.current.board.IN_PROGRESS).toHaveLength(0);
    expect(result.current.error).toBe('이동 실패');
  });

  it('complete: 낙관적으로 DONE 으로 옮기고 complete 호출, getBoard 는 호출하지 않는다', async () => {
    const { result } = renderHook(() => useTickets(boardWith()));
    await act(async () => {
      await result.current.complete(1);
    });
    expect(mockedApi.complete).toHaveBeenCalledWith(1);
    expect(mockedApi.getBoard).not.toHaveBeenCalled();
    expect(result.current.board.TODO).toHaveLength(0);
    expect(result.current.board.DONE.map((t) => t.id)).toEqual([1]);
  });

  it('complete 실패 시 board 를 롤백하고 error 를 설정한다', async () => {
    mockedApi.complete.mockRejectedValueOnce(new Error('완료 실패'));
    const { result } = renderHook(() => useTickets(boardWith()));
    await act(async () => {
      await result.current.complete(1);
    });
    expect(result.current.board.TODO.map((t) => t.id)).toEqual([1]); // 롤백
    expect(result.current.board.DONE).toHaveLength(0);
    expect(result.current.error).toBe('완료 실패');
  });

  it('create 실패 시 error 를 설정하고 board(재조회) 를 변경하지 않는다', async () => {
    mockedApi.create.mockRejectedValueOnce(new Error('제목을 입력해주세요'));
    const { result } = renderHook(() => useTickets(initialData));
    await act(async () => {
      await result.current.create({ title: '' });
    });
    expect(result.current.error).toBe('제목을 입력해주세요');
    expect(mockedApi.getBoard).not.toHaveBeenCalled();
    expect(result.current.board).toBe(initialData);
  });

  it('create 호출 중에는 isLoading=true, 완료 후 false 이다', async () => {
    let resolveCreate!: (t: Ticket) => void;
    mockedApi.create.mockReturnValueOnce(
      new Promise<Ticket>((resolve) => {
        resolveCreate = resolve;
      }),
    );
    const { result } = renderHook(() => useTickets(initialData));

    let pending!: Promise<void>;
    act(() => {
      pending = result.current.create({ title: 'x' });
    });
    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolveCreate(sampleTicket);
      await pending;
    });
    expect(result.current.isLoading).toBe(false);
  });
});
