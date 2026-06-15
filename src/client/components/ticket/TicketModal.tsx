// TicketModal — 티켓 상세/수정/삭제 모달 (COMPONENT_SPEC §2.7, TC-COMP-005)
// 조합: Modal(P1) + TicketDetailView(읽기전용) + TicketForm(edit, 편집) + ConfirmDialog(P1)
// 삭제는 2단계 확인: 삭제 버튼 → ConfirmDialog → 확인 시 onDelete
'use client';

import { useState } from 'react';
import {
  type TicketWithMeta,
  type CreateTicketInput,
  type UpdateTicketInput,
} from '@/shared/types';
import { Modal } from '@/client/components/ui/Modal';
import { ConfirmDialog } from '@/client/components/ui/ConfirmDialog';
import { Button } from '@/client/components/ui/Button';
import { TicketDetailView } from './TicketDetailView';
import { TicketForm } from './TicketForm';

interface TicketModalProps {
  ticket: TicketWithMeta;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: number, data: UpdateTicketInput) => void;
  onDelete: (id: number) => void;
}

export const TicketModal = ({
  ticket,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
}: TicketModalProps) => {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const handleSubmit = (data: CreateTicketInput | UpdateTicketInput) => {
    onUpdate(ticket.id, data);
  };

  const handleConfirmDelete = () => {
    setConfirmingDelete(false);
    onDelete(ticket.id);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="ticket-modal p-5">
        <TicketDetailView ticket={ticket} />

        <TicketForm
          mode="edit"
          initialData={ticket}
          onSubmit={handleSubmit}
          onCancel={onClose}
        />

        <div className="mt-4 flex justify-end">
          <Button
            variant="danger"
            onClick={() => setConfirmingDelete(true)}
            data-testid="ticket-delete-button"
          >
            삭제
          </Button>
        </div>
      </div>

      {confirmingDelete && (
        <ConfirmDialog
          message="정말 삭제하시겠습니까?"
          confirmLabel="확인"
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </Modal>
  );
};
