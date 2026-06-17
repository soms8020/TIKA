// useTickets — 티켓 CRUD/상태 관리 커스텀 훅 (COMPONENT_SPEC §4, FRONTEND_TASKS Phase 5.1)
// 모든 API 호출은 ticketApi 를 경유한다.
//   create/update/remove : 성공 후 getBoard 재조회
//   reorder/complete     : 낙관적 업데이트 (백업 → 즉시 반영 → API → 실패 시 롤백)
'use client';

import { useCallback, useRef, useState } from 'react';
import {
  type BoardData,
  type CreateTicketInput,
  type UpdateTicketInput,
  type ReorderableStatus,
} from '@/shared/types';
import * as ticketApi from '@/client/api/ticketApi';
import { moveTicket, completeOnBoard } from '@/client/lib/boardDnd';

interface UseTicketsReturn {
  board: BoardData;
  isLoading: boolean;
  error: string | null;
  create: (data: CreateTicketInput) => Promise<void>;
  update: (id: number, data: UpdateTicketInput) => Promise<void>;
  remove: (id: number) => Promise<void>;
  reorder: (
    ticketId: number,
    status: ReorderableStatus,
    position: number,
  ) => Promise<void>;
  complete: (id: number) => Promise<void>;
}

const messageOf = (e: unknown): string =>
  e instanceof Error ? e.message : '알 수 없는 오류가 발생했습니다';

export function useTickets(initialData: BoardData): UseTicketsReturn {
  const [board, setBoard] = useState<BoardData>(initialData);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 낙관적 업데이트의 백업/롤백을 위해 최신 board 를 ref 로 보관한다.
  const boardRef = useRef(board);
  boardRef.current = board;

  // 재조회 기반(create/update/remove): 로딩 토글 → 액션 → 성공 시 board 재조회
  const run = useCallback(async (action: () => Promise<void>) => {
    setLoading(true);
    setError(null);
    try {
      await action();
      const next = await ticketApi.getBoard();
      setBoard(next);
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setLoading(false);
    }
  }, []);

  // 낙관적 패턴(reorder/complete): 백업 → UI 즉시 반영 → API → 실패 시 롤백
  const optimistic = useCallback(
    async (apply: (b: BoardData) => BoardData, call: () => Promise<unknown>) => {
      const backup = boardRef.current;
      setError(null);
      setBoard(apply(backup));
      try {
        await call();
      } catch (e) {
        setBoard(backup);
        setError(messageOf(e));
      }
    },
    [],
  );

  const create = useCallback(
    (data: CreateTicketInput) => run(async () => void (await ticketApi.create(data))),
    [run],
  );

  const update = useCallback(
    (id: number, data: UpdateTicketInput) =>
      run(async () => void (await ticketApi.update(id, data))),
    [run],
  );

  const remove = useCallback(
    (id: number) => run(async () => void (await ticketApi.remove(id))),
    [run],
  );

  const reorder = useCallback(
    (ticketId: number, status: ReorderableStatus, position: number) =>
      optimistic(
        (b) => moveTicket(b, ticketId, status, position),
        () => ticketApi.reorder({ ticketId, status, position }),
      ),
    [optimistic],
  );

  const complete = useCallback(
    (id: number) =>
      optimistic(
        (b) => completeOnBoard(b, id),
        () => ticketApi.complete(id),
      ),
    [optimistic],
  );

  return { board, isLoading, error, create, update, remove, reorder, complete };
}
