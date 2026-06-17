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
}: BoardProps) => {
  // 작은 이동은 클릭으로 처리되도록 활성화 거리(distance)를 둔다.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
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
      <DragOverlay>
        {activeTicket ? (
          <TicketCard ticket={activeTicket} onClick={() => {}} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
