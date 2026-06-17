// TDD Red — FilterBar (COMPONENT_SPEC §2.3, FRONTEND_TASKS 3.1)
// 대상(미구현): src/client/components/board/FilterBar.tsx
//
// 계약(contract):
//   Props: {
//     activeFilter: 'all' | 'thisWeek' | 'overdue';
//     onFilterChange: (filter: 'all' | 'thisWeek' | 'overdue') => void;
//     counts: { thisWeek: number; overdue: number };
//   }
//   - "이번주 업무"(thisWeek) / "일정 초과"(overdue) 버튼 + 각 카운트 표시
//   - 클릭 → onFilterChange(키); 이미 활성인 필터 재클릭 → onFilterChange('all') (토글)
//   - 활성 필터 버튼에 filter-btn--active 클래스
import { render, screen, fireEvent } from '@testing-library/react';
import { FilterBar } from '@/client/components/board/FilterBar';

const counts = { thisWeek: 3, overdue: 5 };

describe('FilterBar', () => {
  it('두 필터 버튼과 각 카운트를 표시한다', () => {
    render(
      <FilterBar activeFilter="all" onFilterChange={() => {}} counts={counts} />,
    );
    const thisWeek = screen.getByRole('button', { name: /이번주 업무/ });
    const overdue = screen.getByRole('button', { name: /일정 초과/ });
    expect(thisWeek).toHaveTextContent('3');
    expect(overdue).toHaveTextContent('5');
  });

  it('"이번주 업무" 클릭 시 onFilterChange("thisWeek") 를 호출한다', () => {
    const onFilterChange = jest.fn();
    render(
      <FilterBar activeFilter="all" onFilterChange={onFilterChange} counts={counts} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /이번주 업무/ }));
    expect(onFilterChange).toHaveBeenCalledWith('thisWeek');
  });

  it('"일정 초과" 클릭 시 onFilterChange("overdue") 를 호출한다', () => {
    const onFilterChange = jest.fn();
    render(
      <FilterBar activeFilter="all" onFilterChange={onFilterChange} counts={counts} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /일정 초과/ }));
    expect(onFilterChange).toHaveBeenCalledWith('overdue');
  });

  it('이미 활성인 필터를 다시 클릭하면 onFilterChange("all") 로 토글한다', () => {
    const onFilterChange = jest.fn();
    render(
      <FilterBar
        activeFilter="thisWeek"
        onFilterChange={onFilterChange}
        counts={counts}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /이번주 업무/ }));
    expect(onFilterChange).toHaveBeenCalledWith('all');
  });

  it('활성 필터 버튼에 filter-btn--active 클래스를 적용한다', () => {
    render(
      <FilterBar
        activeFilter="overdue"
        onFilterChange={() => {}}
        counts={counts}
      />,
    );
    expect(screen.getByRole('button', { name: /일정 초과/ })).toHaveClass(
      'filter-btn--active',
    );
    expect(screen.getByRole('button', { name: /이번주 업무/ })).not.toHaveClass(
      'filter-btn--active',
    );
  });

  it('activeFilter="all" 이면 어떤 버튼도 활성 스타일이 아니다', () => {
    render(
      <FilterBar activeFilter="all" onFilterChange={() => {}} counts={counts} />,
    );
    expect(screen.getByRole('button', { name: /이번주 업무/ })).not.toHaveClass(
      'filter-btn--active',
    );
    expect(screen.getByRole('button', { name: /일정 초과/ })).not.toHaveClass(
      'filter-btn--active',
    );
  });
});
