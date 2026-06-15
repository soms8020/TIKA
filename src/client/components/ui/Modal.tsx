'use client';

// Modal — 기반 모달 (오버레이 + 중앙 패널)
// 명세: COMPONENT_SPEC §3 Modal, FR-015
// 스타일: globals.css의 .modal-overlay / .modal-panel
import { useEffect, type ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export const Modal = ({ isOpen, onClose, children }: ModalProps) => {
  // ESC 닫기 + 열림 동안 body 스크롤 잠금
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.classList.add('no-scroll');
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.classList.remove('no-scroll');
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      data-testid="modal-overlay"
      onClick={(e) => {
        // 오버레이 자신을 클릭한 경우에만 닫는다 (패널/컨텐츠 클릭은 무시)
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-panel" role="dialog" aria-modal="true">
        {children}
      </div>
    </div>
  );
};
