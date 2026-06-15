'use client';

// Board — Backlog 사이드바 + TODO/In Progress/Done 3칼럼 메인 레이아웃
// 명세: COMPONENT_SPEC 2.4, TEST_CASES C003-1~3, FR-001/007/016
// 스타일: globals.css의 .board-layout / .board-main
// 참고: 드래그 이벤트(onDragStart/Over/End)는 상위(BoardContainer)에서 주입 — Phase 5.
import { DndContext, DragOverlay } from '@dnd-kit/core';
import {
  TICKET_STATUS,
  type BoardData,
  type TicketStatus,
  type TicketWithMeta,
} from '@/shared/types';
import { Column } from './Column';

interface BoardProps {
  board: BoardData;
  onTicketClick: (ticket: TicketWithMeta) => void;
}

const MAIN_STATUSES: TicketStatus[] = [
  TICKET_STATUS.TODO,
  TICKET_STATUS.IN_PROGRESS,
  TICKET_STATUS.DONE,
];

export const Board = ({ board, onTicketClick }: BoardProps) => (
  <DndContext>
    <div className="board-layout">
      <Column
        status={TICKET_STATUS.BACKLOG}
        tickets={board.BACKLOG}
        onTicketClick={onTicketClick}
      />
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
    <DragOverlay>{null}</DragOverlay>
  </DndContext>
);
