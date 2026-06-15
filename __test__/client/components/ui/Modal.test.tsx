// TDD Red — Modal (기반 모달)
// 명세: COMPONENT_SPEC §3 Modal, FR-015 / FRONTEND_TASKS Phase 1.4
// 대상(미구현): src/client/components/ui/Modal.tsx
//   Props: { isOpen; onClose; children }
//   오버레이(.modal-overlay, data-testid="modal-overlay") + 패널(role="dialog")
import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from '@/client/components/ui/Modal';

describe('Modal', () => {
  it('isOpen=true 면 dialog/children 을 렌더하고, false 면 렌더하지 않는다', () => {
    const { rerender } = render(
      <Modal isOpen={false} onClose={() => {}}>
        <p>모달 내용</p>
      </Modal>,
    );
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.queryByText('모달 내용')).toBeNull();

    rerender(
      <Modal isOpen onClose={() => {}}>
        <p>모달 내용</p>
      </Modal>,
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('모달 내용')).toBeInTheDocument();
  });

  it('ESC 키를 누르면 onClose 를 호출한다', () => {
    const onClose = jest.fn();
    render(
      <Modal isOpen onClose={onClose}>
        <p>모달 내용</p>
      </Modal>,
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('오버레이(바깥 영역)를 클릭하면 onClose 를 호출한다', () => {
    const onClose = jest.fn();
    render(
      <Modal isOpen onClose={onClose}>
        <p>모달 내용</p>
      </Modal>,
    );
    fireEvent.click(screen.getByTestId('modal-overlay'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('컨텐츠(패널)를 클릭하면 onClose 를 호출하지 않는다', () => {
    const onClose = jest.fn();
    render(
      <Modal isOpen onClose={onClose}>
        <p>모달 내용</p>
      </Modal>,
    );
    fireEvent.click(screen.getByRole('dialog'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('패널에 role="dialog" 가 있다', () => {
    render(
      <Modal isOpen onClose={() => {}}>
        <p>모달 내용</p>
      </Modal>,
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
