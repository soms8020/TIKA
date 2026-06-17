// BoardHeader — 상단 영역: 타이틀 + 검색(MVP 비활성) + "새 업무" 버튼
// 명세: COMPONENT_SPEC §2.2, FR-005
// 스타일: globals.css 의 .board-header / .board-header__title / .board-header__actions / .search-input
'use client';

import { Button } from '@/client/components/ui/Button';

interface BoardHeaderProps {
  onCreateClick: () => void;
}

export const BoardHeader = ({ onCreateClick }: BoardHeaderProps) => (
  <header className="board-header">
    <h1 className="board-header__title">Tika</h1>
    <div className="board-header__actions">
      {/* SearchInput 2차 구현 예정 — MVP 에서는 비활성 placeholder */}
      <input
        type="search"
        className="search-input"
        placeholder="검색 (준비 중)"
        aria-label="검색"
        disabled
      />
      <Button onClick={onCreateClick}>새 업무</Button>
    </div>
  </header>
);
