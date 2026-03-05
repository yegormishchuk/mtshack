import type { CSSProperties } from 'react';

/** Apple 26 design tokens — как в mini-app */
export const colors = {
  cardBg: 'rgba(255, 255, 255, 0.72)',
  cardBorder: 'rgba(0, 0, 0, 0.06)',
  cardHighlight: 'rgba(255, 255, 255, 0.5)',
  text: '#1c1c1e',
  textSecondary: '#55585f',
  primary: '#0088FF',
  success: '#34c759',
  error: '#FF3B30',
  warning: '#FF9500',
  divider: 'rgba(0, 0, 0, 0.08)',
  overlay: 'rgba(0, 0, 0, 0.4)',
};

export const cardStyle: CSSProperties = {
  background: colors.cardBg,
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  borderRadius: 28,
  padding: '24px 24px',
  marginBottom: 12,
  boxShadow: '0 8px 32px -8px rgba(0, 0, 0, 0.08), inset 0 0 0 1px rgba(255, 255, 255, 0.2)',
  border: `1px solid ${colors.cardBorder}`,
  borderTop: `1px solid ${colors.cardHighlight}`,
};

export const cardTitleStyle: CSSProperties = {
  margin: '0 0 12px',
  fontSize: 17,
  fontWeight: 600,
  color: colors.text,
  letterSpacing: '-0.3px',
};

export const primaryButtonStyle: CSSProperties = {
  padding: '16px 24px',
  fontSize: 17,
  fontWeight: 600,
  letterSpacing: '-0.3px',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  borderRadius: 9999,
  cursor: 'pointer',
  background: colors.primary,
  color: '#ffffff',
  boxShadow: '0 8px 24px -6px rgba(0, 136, 255, 0.4)',
  fontFamily: 'inherit',
  outline: 'none',
};

export const secondaryButtonStyle: CSSProperties = {
  padding: '16px 24px',
  fontSize: 17,
  fontWeight: 600,
  letterSpacing: '-0.3px',
  border: '1px solid rgba(142, 142, 147, 0.2)',
  borderRadius: 9999,
  cursor: 'pointer',
  background: 'rgba(142, 142, 147, 0.12)',
  color: colors.text,
  boxShadow: '0 2px 8px -4px rgba(0, 0, 0, 0.1)',
  fontFamily: 'inherit',
  outline: 'none',
};
