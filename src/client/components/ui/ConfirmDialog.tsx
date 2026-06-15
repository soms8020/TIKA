'use client';

// ConfirmDialog — 확인 다이얼로그 (Modal + Button 조합)
// 명세: COMPONENT_SPEC §3 ConfirmDialog, FR-013
import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmDialogProps {
  isOpen?: boolean;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog = ({
  isOpen = true,
  message,
  confirmLabel = '확인',
  cancelLabel = '취소',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => (
  <Modal isOpen={isOpen} onClose={onCancel}>
    <div className="p-5">
      <p className="text-sm">{message}</p>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button variant="danger" onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </div>
  </Modal>
);
