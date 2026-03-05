import { type ButtonHTMLAttributes, type ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'small';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
}

export function Button({ variant = 'primary', className = '', children, ...props }: ButtonProps) {
  const c = variant === 'primary' ? 'app-btn-primary' : 'app-btn-secondary';
  const small = variant === 'small';
  return (
    <button
      type="button"
      className={`${c} ${className}`}
      style={small ? { padding: '10px 16px', fontSize: 14 } : undefined}
      {...props}
    >
      {children}
    </button>
  );
}
