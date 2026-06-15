// TDD Red — Badge (PriorityBadge / DueDateBadge)
// 명세: COMPONENT_SPEC §3 Badge, REQUIREMENTS §6 / FRONTEND_TASKS Phase 1.1~1.2
// 대상(미구현): src/client/components/ui/Badge.tsx
//   PriorityBadge: { priority } → span.badge.badge--{low|medium|high} + 라벨
//   DueDateBadge:  { date: string|null; isOverdue? } → span.chip(.chip--overdue), date 없으면 null
import { render, screen } from '@testing-library/react';
import { PriorityBadge, DueDateBadge } from '@/client/components/ui/Badge';

describe('PriorityBadge', () => {
  it.each([
    ['LOW', 'badge--low', '낮음'],
    ['MEDIUM', 'badge--medium', '보통'],
    ['HIGH', 'badge--high', '높음'],
  ] as const)(
    'priority=%s 이면 %s 클래스와 "%s" 라벨을 렌더한다',
    (priority, expectedClass, label) => {
      render(<PriorityBadge priority={priority} />);
      const el = screen.getByText(label);
      expect(el).toHaveClass('badge', expectedClass);
    },
  );
});

describe('DueDateBadge', () => {
  it('날짜를 chip 으로 표시한다', () => {
    render(<DueDateBadge date="2026-06-20" />);
    expect(screen.getByText('2026-06-20')).toHaveClass('chip');
  });

  it('isOverdue=true 이면 chip--overdue 를 적용한다', () => {
    render(<DueDateBadge date="2026-06-01" isOverdue />);
    expect(screen.getByText('2026-06-01')).toHaveClass('chip', 'chip--overdue');
  });

  it('date 가 없으면 아무것도 렌더하지 않는다', () => {
    const { container } = render(<DueDateBadge date={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
