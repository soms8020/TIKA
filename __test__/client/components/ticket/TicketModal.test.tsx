// TDD Red — TicketModal (TC-COMP-005)
// 명세: docs/COMPONENT_SPEC.md §2.7, FR-011/012/013/015, US-007/US-008
// 대상(미구현): src/client/components/ticket/TicketModal.tsx
//
// 계약(contract):
//   Props:
//     ticket: TicketWithMeta
//     isOpen: boolean
//     onClose: () => void
//     onUpdate: (id: number, data: UpdateTicketInput) => void
//     onDelete: (id: number) => void
//
//   조합: Modal + TicketDetailView(읽기전용) + TicketForm(edit, 편집) + ConfirmDialog
//   삭제는 2단계: [삭제 버튼](data-testid="ticket-delete-button") → ConfirmDialog → 확인 시 onDelete
//   저장: TicketForm 제출 → onUpdate(ticket.id, data)
import { render, screen, fireEvent } from '@testing-library/react';
import {
  TICKET_STATUS,
  TICKET_PRIORITY,
  COLUMN_LABELS,
  type TicketWithMeta,
} from '@/shared/types';

import { TicketModal } from '@/client/components/ticket/TicketModal';

const ticket: TicketWithMeta = {
  id: 42,
  title: '모달 티켓',
  description: '모달 설명',
  status: TICKET_STATUS.TODO,
  priority: TICKET_PRIORITY.HIGH,
  position: 0,
  plannedStartDate: null,
  dueDate: null, // 검증 통과를 위해 종료예정일 없음
  startedAt: new Date('2026-06-02T00:00:00Z'),
  completedAt: null,
  createdAt: new Date('2026-06-01T00:00:00Z'),
  updatedAt: new Date('2026-06-01T00:00:00Z'),
  isOverdue: false,
};

const noop = () => {};

const renderModal = (
  overrides: Partial<React.ComponentProps<typeof TicketModal>> = {},
) =>
  render(
    <TicketModal
      ticket={ticket}
      isOpen
      onClose={noop}
      onUpdate={noop}
      onDelete={noop}
      {...overrides}
    />,
  );

describe('TicketModal (TC-COMP-005)', () => {
  // 1) 닫힘
  it('isOpen=false 면 렌더하지 않는다', () => {
    renderModal({ isOpen: false });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  // 2) 읽기 전용 상세(View) 표시
  it('isOpen=true 면 읽기 전용 상세(상태/생성일 등)를 표시한다', () => {
    renderModal();
    expect(screen.getByTestId('detail-status')).toHaveTextContent(
      COLUMN_LABELS[TICKET_STATUS.TODO],
    );
    expect(screen.getByTestId('detail-created-at')).toHaveTextContent('2026-06-01');
  });

  // 3) 편집 가능 폼(Form) 표시 — ticket 값 채움
  it('isOpen=true 면 편집 폼에 ticket 값이 채워진다', () => {
    renderModal();
    expect(screen.getByLabelText(/제목/)).toHaveValue('모달 티켓');
    expect(screen.getByLabelText(/설명/)).toHaveValue('모달 설명');
    expect(screen.getByLabelText(/우선순위/)).toHaveValue(TICKET_PRIORITY.HIGH);
  });

  // 4) ESC → onClose
  it('ESC 키를 누르면 onClose 를 호출한다', () => {
    const onClose = jest.fn();
    renderModal({ onClose });
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // 5) 삭제 1단계 — 삭제 버튼 클릭 시 ConfirmDialog 표시(아직 onDelete 미호출)
  it('삭제 버튼을 누르면 확인 다이얼로그를 띄우고 아직 onDelete 를 호출하지 않는다', () => {
    const onDelete = jest.fn();
    renderModal({ onDelete });

    expect(screen.queryByText('정말 삭제하시겠습니까?')).toBeNull();
    fireEvent.click(screen.getByTestId('ticket-delete-button'));

    expect(screen.getByText('정말 삭제하시겠습니까?')).toBeInTheDocument();
    expect(onDelete).not.toHaveBeenCalled();
  });

  // 6) 삭제 2단계 — 확인 클릭 시 onDelete(id) 호출
  it('확인 다이얼로그에서 확인하면 onDelete(ticket.id) 를 호출한다', () => {
    const onDelete = jest.fn();
    renderModal({ onDelete });

    fireEvent.click(screen.getByTestId('ticket-delete-button'));
    fireEvent.click(screen.getByRole('button', { name: '확인' }));

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith(42);
  });

  // 7) 저장 — 폼 제출 시 onUpdate(ticket.id, data) 호출
  it('폼을 제출하면 onUpdate(ticket.id, data) 를 호출한다', () => {
    const onUpdate = jest.fn();
    renderModal({ onUpdate });

    fireEvent.click(screen.getByTestId('ticket-form-submit'));

    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(onUpdate).toHaveBeenCalledWith(
      42,
      expect.objectContaining({ title: '모달 티켓', priority: TICKET_PRIORITY.HIGH }),
    );
  });
});
