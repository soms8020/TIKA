// TDD Red — ColumnHeader (칼럼명 + 티켓 수)
// 명세: COMPONENT_SPEC 2.5, TEST_CASES C002-3
// 대상(미구현): src/client/components/board/ColumnHeader.tsx
//   Props: { title: string; count: number }
//   카운트 요소 클래스: column__count
import { render, screen } from '@testing-library/react';
import { ColumnHeader } from '@/client/components/board/ColumnHeader';

describe('ColumnHeader', () => {
  it('칼럼명을 표시한다', () => {
    render(<ColumnHeader title="In Progress" count={3} />);
    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });

  it('티켓 수를 표시한다', () => {
    render(<ColumnHeader title="TODO" count={5} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('티켓 수 요소는 column__count 클래스를 가진다', () => {
    render(<ColumnHeader title="TODO" count={5} />);
    expect(screen.getByText('5')).toHaveClass('column__count');
  });

  it('count=0 이면 0을 표시한다', () => {
    render(<ColumnHeader title="Done" count={0} />);
    expect(screen.getByText('0')).toHaveClass('column__count');
  });
});
