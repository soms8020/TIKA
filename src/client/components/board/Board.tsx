'use client';

// Board — Backlog 사이드바 + TODO/In Progress/Done 3칼럼 메인 레이아웃
// 명세: COMPONENT_SPEC 2.4, TEST_CASES C003-1~3, FR-001/007/016
// 스타일: globals.css의 .board-layout / .board-main
// 드래그 이벤트(onDragStart/onDragEnd)는 상위(BoardContainer)에서 주입한다.
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { type ReactNode } from 'react';
import {
  TICKET_STATUS,
  type BoardData,
  type TicketStatus,
  type TicketWithMeta,
} from '@/shared/types';
import { Column } from './Column';
import { TicketCard } from '../ticket/TicketCard';

interface BoardProps {
  board: BoardData;
  onTicketClick: (ticket: TicketWithMeta) => void;
  onDragStart?: (event: DragStartEvent) => void;
  onDragEnd?: (event: DragEndEvent) => void;
  // 드래그 중인 티켓 — DragOverlay 에 복제 표시
  activeTicket?: TicketWithMeta | null;
  // 우측 상단 필터 영역(48px). 와이어프레임: 좌측 Backlog 전체 높이 + 우측[필터 + 3칼럼]
  filterSlot?: ReactNode;
}

const MAIN_STATUSES: TicketStatus[] = [
  TICKET_STATUS.TODO,
  TICKET_STATUS.IN_PROGRESS,
  TICKET_STATUS.DONE,
];

export const Board = ({
  board,
  onTicketClick,
  onDragStart,
  onDragEnd,
  activeTicket,
  filterSlot,
}: BoardProps) => {
  // 작은 이동은 클릭으로 처리되도록 활성화 거리(distance)를 둔다.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="board-layout">
        {/* 좌측: Backlog — 우측 영역 전체 높이에 맞춰 stretch */}
        <Column
          status={TICKET_STATUS.BACKLOG}
          tickets={board.BACKLOG}
          onTicketClick={onTicketClick}
        />
        {/* 우측: 상단 필터(48px) + 하단 3칼럼 */}
        <div className="board-right">
          {filterSlot ? <div className="board-filter">{filterSlot}</div> : null}
          <div className="board-main">
            {MAIN_STATUSES.map((status) => (
              <Column
                key={status}
                status={status}
                tickets={board[status]}
                onTicketClick={onTicketClick}
              />
            ))}
          </div>
        </div>
      </div>
      <DragOverlay>
        {activeTicket ? (
          <TicketCard ticket={activeTicket} onSelect={() => {}} overlay />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
