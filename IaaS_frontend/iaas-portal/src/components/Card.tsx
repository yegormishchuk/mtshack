import { type ReactNode } from 'react';
import { colors, cardTitleStyle } from '../theme';

interface CardProps {
  title?: string;
  children: ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

export function Card({ title, children, style, className = '' }: CardProps) {
  return (
    <div
      className={`app-card ${className}`}
      style={style}
    >
      {title && <h2 style={cardTitleStyle}>{title}</h2>}
      <div style={{ color: '#111111', fontSize: 15 }}>{children}</div>
    </div>
  );
}
