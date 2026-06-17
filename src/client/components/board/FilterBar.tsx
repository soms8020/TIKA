// FilterBar — 이번주 업무 / 일정 초과 필터 버튼 (COMPONENT_SPEC §2.3, FR-014)
// 활성 필터를 다시 누르면 'all'(전체 보기)로 토글한다. 필터링은 클라이언트 사이드.
// 스타일: globals.css 의 .filter-bar / .filter-btn / .filter-btn--active / .filter-btn__count
'use client';

type Filter = 'all' | 'thisWeek' | 'overdue';

interface FilterBarProps {
  activeFilter: Filter;
  onFilterChange: (filter: Filter) => void;
  counts: { thisWeek: number; overdue: number };
}

const FILTERS = [
  { key: 'thisWeek', label: '이번주 업무' },
  { key: 'overdue', label: '일정 초과' },
] as const;

export const FilterBar = ({
  activeFilter,
  onFilterChange,
  counts,
}: FilterBarProps) => (
  <div className="filter-bar">
    {FILTERS.map(({ key, label }) => {
      const isActive = activeFilter === key;
      return (
        <button
          key={key}
          type="button"
          className={`filter-btn${isActive ? ' filter-btn--active' : ''}`}
          aria-pressed={isActive}
          // 이미 활성이면 해제(all), 아니면 해당 필터로 변경
          onClick={() => onFilterChange(isActive ? 'all' : key)}
        >
          {label}
          <span className="filter-btn__count">{counts[key]}</span>
        </button>
      );
    })}
  </div>
);
