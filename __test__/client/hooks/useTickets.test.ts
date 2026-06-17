// useTickets (COMPONENT_SPEC §4, FRONTEND_TASKS Phase 5.1)
//   create/update/remove : API 호출 → 반환 엔티티를 로컬 보드에 반영 (재조회 왕복 제거)
//   reorder/complete     : 낙관적 업데이트 + 성공 시 서버 응답으로 reconcile / 실패 시 롤백
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

// 보드 엔트리(TicketWithMeta)
const card = (id: number, status: TicketWithMeta['status'], position: number, overrides: Partial<TicketWithMeta> = {}): TicketWithMeta => ({
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
  ...overrides,
});

// 서버 반환 Ticket(파생값 isOverdue 없음)
const rawTicket = (id: number, status: Ticket['status'], position: number, overrides: Partial<Ticket> = {}): Ticket => ({
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
  ...overrides,
});

const emptyBoard = (): BoardData => ({ BACKLOG: [], TODO: [], IN_PROGRESS: [], DONE: [] });

beforeEach(() => {
  jest.clearAllMocks();
  mockedApi.getBoard.mockResolvedValue(emptyBoard());
  mockedApi.create.mockResolvedValue(rawTicket(99, TICKET_STATUS.BACKLOG, -1024));
  mockedApi.update.mockResolvedValue(rawTicket(1, TICKET_STATUS.TODO, 0));
  mockedApi.remove.mockResolvedValue(undefined);
  mockedApi.reorder.mockResolvedValue({ ticket: rawTicket(1, TICKET_STATUS.IN_PROGRESS, 0), affected: [] });
  mockedApi.complete.mockResolvedValue(rawTicket(1, TICKET_STATUS.DONE, -1024));
});

describe('useTickets', () => {
  it('initialData 로 board 를 초기화하고 isLoading=false, error=null 이다', () => {
    const init = emptyBoard();
    const { result } = renderHook(() => useTickets(init));
    expect(result.current.board).toBe(init);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('create: 반환 티켓을 BACKLOG 에 반영하고 getBoard 는 호출하지 않는다', async () => {
    mockedApi.create.mockResolvedValueOnce(rawTicket(99, TICKET_STATUS.BACKLOG, -1024, { title: '새 티켓' }));
    const { result } = renderHook(() => useTickets(emptyBoard()));
    await act(async () => {
      await result.current.create({ title: '새 티켓' });
    });
    expect(mockedApi.create).toHaveBeenCalledWith({ title: '새 티켓' });
    expect(mockedApi.getBoard).not.toHaveBeenCalled();
    expect(result.current.board.BACKLOG.map((t) => t.id)).toEqual([99]);
  });

  it('update: 반환 티켓으로 교체하고 getBoard 는 호출하지 않는다', async () => {
    mockedApi.update.mockResolvedValueOnce(rawTicket(1, TICKET_STATUS.TODO, 0, { title: '새 제목' }));
    const { result } = renderHook(() =>
      useTickets({ ...emptyBoard(), TODO: [card(1, TICKET_STATUS.TODO, 0, { title: '옛 제목' })] }),
    );
    await act(async () => {
      await result.current.update(1, { title: '새 제목' });
    });
    expect(mockedApi.update).toHaveBeenCalledWith(1, { title: '새 제목' });
    expect(mockedApi.getBoard).not.toHaveBeenCalled();
    expect(result.current.board.TODO.find((t) => t.id === 1)?.title).toBe('새 제목');
  });

  it('remove: 로컬에서 제거하고 getBoard 는 호출하지 않는다', async () => {
    const { result } = renderHook(() =>
      useTickets({
        ...emptyBoard(),
        TODO: [card(1, TICKET_STATUS.TODO, 0), card(2, TICKET_STATUS.TODO, 1024)],
      }),
    );
    await act(async () => {
      await result.current.remove(1);
    });
    expect(mockedApi.remove).toHaveBeenCalledWith(1);
    expect(mockedApi.getBoard).not.toHaveBeenCalled();
    expect(result.current.board.TODO.map((t) => t.id)).toEqual([2]);
  });

  it('reorder: 낙관적 반영 후 성공 시 서버 응답(position/affected)으로 reconcile 한다', async () => {
    mockedApi.reorder.mockResolvedValueOnce({
      ticket: rawTicket(1, TICKET_STATUS.IN_PROGRESS, 1024),
      affected: [{ id: 3, position: 512 }],
    });
    const { result } = renderHook(() =>
      useTickets({
        ...emptyBoard(),
        TODO: [card(1, TICKET_STATUS.TODO, 0)],
        IN_PROGRESS: [card(3, TICKET_STATUS.IN_PROGRESS, 0)],
      }),
    );
    await act(async () => {
      // 낙관적 position(999)과 서버 position(1024)을 다르게 하여 reconcile 확인
      await result.current.reorder(1, TICKET_STATUS.IN_PROGRESS, 999);
    });
    expect(mockedApi.reorder).toHaveBeenCalledWith({ ticketId: 1, status: TICKET_STATUS.IN_PROGRESS, position: 999 });
    expect(mockedApi.getBoard).not.toHaveBeenCalled();
    expect(result.current.board.TODO).toHaveLength(0);
    expect(result.current.board.IN_PROGRESS.map((t) => t.id)).toEqual([3, 1]);
    expect(result.current.board.IN_PROGRESS.find((t) => t.id === 1)?.position).toBe(1024);
    expect(result.current.board.IN_PROGRESS.find((t) => t.id === 3)?.position).toBe(512);
  });

  it('reorder 실패 시 board 를 롤백하고 error 를 설정한다', async () => {
    mockedApi.reorder.mockRejectedValueOnce(new Error('이동 실패'));
    const { result } = renderHook(() =>
      useTickets({ ...emptyBoard(), TODO: [card(1, TICKET_STATUS.TODO, 0)] }),
    );
    await act(async () => {
      await result.current.reorder(1, TICKET_STATUS.IN_PROGRESS, 1024);
    });
    expect(result.current.board.TODO.map((t) => t.id)).toEqual([1]);
    expect(result.current.board.IN_PROGRESS).toHaveLength(0);
    expect(result.current.error).toBe('이동 실패');
  });

  it('complete: 낙관적 반영 후 성공 시 서버 티켓으로 reconcile 한다', async () => {
    mockedApi.complete.mockResolvedValueOnce(rawTicket(1, TICKET_STATUS.DONE, -2048));
    const { result } = renderHook(() =>
      useTickets({ ...emptyBoard(), TODO: [card(1, TICKET_STATUS.TODO, 0)] }),
    );
    await act(async () => {
      await result.current.complete(1);
    });
    expect(mockedApi.complete).toHaveBeenCalledWith(1);
    expect(mockedApi.getBoard).not.toHaveBeenCalled();
    expect(result.current.board.TODO).toHaveLength(0);
    expect(result.current.board.DONE.map((t) => t.id)).toEqual([1]);
    expect(result.current.board.DONE.find((t) => t.id === 1)?.position).toBe(-2048);
  });

  it('complete 실패 시 board 를 롤백하고 error 를 설정한다', async () => {
    mockedApi.complete.mockRejectedValueOnce(new Error('완료 실패'));
    const { result } = renderHook(() =>
      useTickets({ ...emptyBoard(), TODO: [card(1, TICKET_STATUS.TODO, 0)] }),
    );
    await act(async () => {
      await result.current.complete(1);
    });
    expect(result.current.board.TODO.map((t) => t.id)).toEqual([1]);
    expect(result.current.board.DONE).toHaveLength(0);
    expect(result.current.error).toBe('완료 실패');
  });

  it('create 실패 시 error 를 설정하고 board 를 변경하지 않는다', async () => {
    mockedApi.create.mockRejectedValueOnce(new Error('제목을 입력해주세요'));
    const init = emptyBoard();
    const { result } = renderHook(() => useTickets(init));
    await act(async () => {
      await result.current.create({ title: '' });
    });
    expect(result.current.error).toBe('제목을 입력해주세요');
    expect(result.current.board.BACKLOG).toHaveLength(0);
  });

  it('create 호출 중에는 isLoading=true, 완료 후 false 이다', async () => {
    let resolveCreate!: (t: Ticket) => void;
    mockedApi.create.mockReturnValueOnce(
      new Promise<Ticket>((resolve) => {
        resolveCreate = resolve;
      }),
    );
    const { result } = renderHook(() => useTickets(emptyBoard()));

    let pending!: Promise<void>;
    act(() => {
      pending = result.current.create({ title: 'x' });
    });
    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolveCreate(rawTicket(99, TICKET_STATUS.BACKLOG, -1024));
      await pending;
    });
    expect(result.current.isLoading).toBe(false);
  });
});
