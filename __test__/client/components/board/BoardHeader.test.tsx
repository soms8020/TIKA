// TDD Red — BoardHeader (COMPONENT_SPEC §2.2, FRONTEND_TASKS 3.2)
// 대상(미구현): src/client/components/board/BoardHeader.tsx
//
// 계약(contract):
//   Props: { onCreateClick: () => void }
//   - "Tika" 타이틀(heading)
//   - "새 업무" 버튼 → 클릭 시 onCreateClick
//   - 검색 입력: MVP 비활성(disabled) placeholder (role="searchbox")
import { render, screen, fireEvent } from '@testing-library/react';
import { BoardHeader } from '@/client/components/board/BoardHeader';

describe('BoardHeader', () => {
  it('"Tika" 타이틀을 렌더한다', () => {
    render(<BoardHeader onCreateClick={() => {}} />);
    expect(screen.getByRole('heading', { name: 'Tika' })).toBeInTheDocument();
  });

  it('"새 업무" 버튼을 렌더한다', () => {
    render(<BoardHeader onCreateClick={() => {}} />);
    expect(screen.getByRole('button', { name: '새 업무' })).toBeInTheDocument();
  });

  it('"새 업무" 버튼 클릭 시 onCreateClick 을 호출한다', () => {
    const onCreateClick = jest.fn();
    render(<BoardHeader onCreateClick={onCreateClick} />);
    fireEvent.click(screen.getByRole('button', { name: '새 업무' }));
    expect(onCreateClick).toHaveBeenCalledTimes(1);
  });

  it('검색 입력은 placeholder 가 있고 비활성(disabled)으로 렌더한다', () => {
    render(<BoardHeader onCreateClick={() => {}} />);
    const search = screen.getByRole('searchbox');
    expect(search).toBeDisabled();
    expect(search).toHaveAttribute('placeholder');
  });
});
