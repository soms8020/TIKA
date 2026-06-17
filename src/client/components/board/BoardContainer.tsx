// BoardContainer — 최상위 클라이언트 오케스트레이터 (COMPONENT_SPEC §2.1/§5, FRONTEND_TASKS 5.3)
// useTickets 상태 + BoardHeader(생성) + FilterBar(필터) + Board(DnD) + TicketModal(상세/수정/삭제)
'use client';

import { useMemo, useState } from 'react';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import {
  TICKET_STATUS,
  type BoardData,
  type CreateTicketInput,
  type ReorderableStatus,
  type TicketWithMeta,
} from '@/shared/types';
import { useTickets } from '@/client/hooks/useTickets';
import { resolveDrop, findTicket } from '@/client/lib/boardDnd';
import { applyFilter, filterCounts, type FilterKey } from '@/client/lib/filters';
import { BoardHeader } from './BoardHeader';
import { FilterBar } from './FilterBar';
import { Board } from './Board';
import { Modal } from '../ui/Modal';
import { TicketForm } from '../ticket/TicketForm';
import { TicketModal } from '../ticket/TicketModal';

interface BoardContainerProps {
  initialData: BoardData;
}

export const BoardContainer = ({ initialData }: BoardContainerProps) => {
  const { board, error, create, update, remove, reorder, complete } =
    useTickets(initialData);

  const [activeTicket, setActiveTicket] = useState<TicketWithMeta | null>(null);
  const [selected, setSelected] = useState<TicketWithMeta | null>(null);
  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState<FilterKey>('all');

  // 필터는 파생 상태로만 적용 — Backlog 제외 메인 칼럼에만 반영된다.
  const visibleBoard = useMemo(() => applyFilter(board, filter), [board, filter]);
  const counts = useMemo(() => filterCounts(board), [board]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveTicket(findTicket(board, Number(event.active.id)) ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTicket(null);
    if (!event.over) return;

    const activeId = Number(event.active.id);
    const target = resolveDrop(board, activeId, event.over.id);
    if (!target) return;

    // 대상이 Done 이면 완료 처리, 그 외에는 순서/상태 변경
    if (target.status === TICKET_STATUS.DONE) {
      complete(activeId);
    } else {
      reorder(activeId, target.status as ReorderableStatus, target.position);
    }
  };

  return (
    <div className="board-container">
      <BoardHeader onCreateClick={() => setCreating(true)} />
      <FilterBar activeFilter={filter} onFilterChange={setFilter} counts={counts} />

      {error && (
        <p role="alert" className="board-error">
          {error}
        </p>
      )}

      <Board
        board={visibleBoard}
        onTicketClick={setSelected}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        activeTicket={activeTicket}
      />

      {creating && (
        <Modal isOpen onClose={() => setCreating(false)}>
          <div className="p-6">
            <h3 className="mb-4 text-lg font-bold">새 티켓 생성</h3>
            <TicketForm
              mode="create"
              onSubmit={(data) => {
                create(data as CreateTicketInput);
                setCreating(false);
              }}
              onCancel={() => setCreating(false)}
            />
          </div>
        </Modal>
      )}

      {selected && (
        <TicketModal
          ticket={selected}
          isOpen
          onClose={() => setSelected(null)}
          onUpdate={(id, data) => {
            update(id, data);
            setSelected(null);
          }}
          onDelete={(id) => {
            remove(id);
            setSelected(null);
          }}
        />
      )}
    </div>
  );
};
