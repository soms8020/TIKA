// TDD Red — ConfirmDialog (확인 다이얼로그)
// 명세: COMPONENT_SPEC §3 ConfirmDialog, FR-013 / FRONTEND_TASKS Phase 1.5
// 대상(미구현): src/client/components/ui/ConfirmDialog.tsx
//   Modal + Button 조합. 위험 동작(확인)은 danger 스타일.
//   Props: { isOpen?; message; confirmLabel?='확인'; cancelLabel?='취소'; onConfirm; onCancel }
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmDialog } from '@/client/components/ui/ConfirmDialog';

const setup = (override = {}) => {
  const onConfirm = jest.fn();
  const onCancel = jest.fn();
  render(
    <ConfirmDialog
      message="정말 삭제하시겠습니까?"
      onConfirm={onConfirm}
      onCancel={onCancel}
      {...override}
    />,
  );
  return { onConfirm, onCancel };
};

describe('ConfirmDialog', () => {
  it('메시지를 표시한다', () => {
    setup();
    expect(screen.getByText('정말 삭제하시겠습니까?')).toBeInTheDocument();
  });

  it('확인/취소 버튼을 렌더한다', () => {
    setup();
    expect(screen.getByRole('button', { name: '확인' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '취소' })).toBeInTheDocument();
  });

  it('확인을 클릭하면 onConfirm 을 호출한다', () => {
    const { onConfirm } = setup();
    fireEvent.click(screen.getByRole('button', { name: '확인' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('취소를 클릭하면 onCancel 을 호출한다', () => {
    const { onCancel } = setup();
    fireEvent.click(screen.getByRole('button', { name: '취소' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('확인 버튼은 위험(danger) 스타일이다', () => {
    setup();
    expect(screen.getByRole('button', { name: '확인' })).toHaveClass('btn--danger');
  });
});
