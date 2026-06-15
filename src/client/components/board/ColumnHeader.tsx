// ColumnHeader — 칼럼명 + 티켓 수 뱃지
// 명세: COMPONENT_SPEC 2.5, TEST_CASES C002-3
// 스타일: globals.css의 .column__header / .column__count

interface ColumnHeaderProps {
  title: string;
  count: number;
}

export const ColumnHeader = ({ title, count }: ColumnHeaderProps) => (
  <div className="column__header">
    <span className="column__title">{title}</span>
    <span className="column__count">{count}</span>
  </div>
);
