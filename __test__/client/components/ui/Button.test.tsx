// TDD Red — Button 컴포넌트 명세 테스트 (구현 전).
// 명세: docs/COMPONENT_SPEC.md §3 Button, docs/FRONTEND_TASKS.md Phase 1.3
// 대상(미구현): src/client/components/ui/Button.tsx
//
// 계약(contract):
//   Props: { variant?: 'primary'|'secondary'|'danger'|'ghost' (기본 'primary'),
//            size?: 'sm'|'md'|'lg' (기본 'md'),
//            isLoading?: boolean, onClick?: () => void, children: ReactNode }
//   클래스: 기본 'btn' + 'btn--{variant}' + 'btn--{size}' (globals.css)
//   isLoading=true → 비활성화(disabled) + 로딩 텍스트 "처리중..." 표시, 클릭 무시
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/client/components/ui/Button';

describe('Button', () => {
  // --- variant별 CSS 클래스 ---
  it.each([
    ['primary', 'btn--primary'],
    ['secondary', 'btn--secondary'],
    ['danger', 'btn--danger'],
    ['ghost', 'btn--ghost'],
  ] as const)('variant=%s 이면 %s 클래스를 가진다', (variant, expectedClass) => {
    render(<Button variant={variant}>버튼</Button>);
    const button = screen.getByRole('button', { name: '버튼' });
    expect(button).toHaveClass('btn', expectedClass);
  });

  // --- size별 CSS 클래스 ---
  it.each([
    ['sm', 'btn--sm'],
    ['md', 'btn--md'],
    ['lg', 'btn--lg'],
  ] as const)('size=%s 이면 %s 클래스를 가진다', (size, expectedClass) => {
    render(<Button size={size}>버튼</Button>);
    const button = screen.getByRole('button', { name: '버튼' });
    expect(button).toHaveClass('btn', expectedClass);
  });

  // --- 기본값: variant=primary, size=md ---
  it('variant/size 미지정 시 기본값(primary, md) 클래스를 가진다', () => {
    render(<Button>버튼</Button>);
    const button = screen.getByRole('button', { name: '버튼' });
    expect(button).toHaveClass('btn', 'btn--primary', 'btn--md');
  });

  // --- children 렌더링 ---
  it('children을 정상 렌더링한다', () => {
    render(<Button>저장하기</Button>);
    expect(
      screen.getByRole('button', { name: '저장하기' }),
    ).toBeInTheDocument();
  });

  // --- onClick 핸들러 호출 ---
  it('클릭하면 onClick 핸들러를 호출한다', () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>버튼</Button>);
    fireEvent.click(screen.getByRole('button', { name: '버튼' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  // --- isLoading=true → 비활성화 + 로딩 텍스트 ---
  it('isLoading=true 이면 비활성화되고 "처리중..."을 표시한다', () => {
    render(
      <Button isLoading onClick={() => {}}>
        저장
      </Button>,
    );
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(screen.getByText(/처리중/)).toBeInTheDocument();
  });

  // --- isLoading=true 일 때 클릭 무시 ---
  it('isLoading=true 이면 클릭해도 onClick을 호출하지 않는다', () => {
    const onClick = jest.fn();
    render(
      <Button isLoading onClick={onClick}>
        저장
      </Button>,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });
});
