// Button — 공통 버튼 컴포넌트 (COMPONENT_SPEC §3 Button)
// 스타일: globals.css의 .btn / .btn--{variant} / .btn--{size}
import { type ButtonHTMLAttributes, type ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  onClick?: () => void;
  children: ReactNode;
}

export const Button = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  onClick,
  children,
  ...rest
}: ButtonProps) => {
  return (
    <button
      type="button"
      className={`btn btn--${variant} btn--${size}`}
      {...rest}
      disabled={isLoading}
      onClick={isLoading ? undefined : onClick}
    >
      {isLoading ? '처리중...' : children}
    </button>
  );
};
