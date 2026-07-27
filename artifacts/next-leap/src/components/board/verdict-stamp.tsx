import React from 'react';

const STYLE_GUIDE = {
  colors: {
    canvas: '#F9F8F6',
    surface: '#FFFFFF',
    text: {
      primary: '#1C1917',
      secondary: '#57534E',
      tertiary: '#A8A29E',
    },
    border: '#E7E5E4',
    divider: '#F5F5F4',
    verdict: {
      "START": { text: '#15803D', bg: '#F0FDF4', border: '#BBF7D0' },
      "SCHEDULE": { text: '#B45309', bg: '#FFFBEB', border: '#FDE68A' },
      "GET HELP": { text: '#0369A1', bg: '#F0F9FF', border: '#BAE6FD' },
      "SKIP FOR NOW": { text: '#BE123C', bg: '#FFF1F2', border: '#FECDD3' }
    }
  },
  radii: {
    card: '24px',
    pill: '999px'
  },
  shadows: {
    card: '0 8px 24px rgba(28, 25, 23, 0.04)',
    float: '0 12px 32px rgba(28, 25, 23, 0.08)',
    sm: '0 2px 8px rgba(28, 25, 23, 0.03)'
  }
};

export const VERDICT_EXPLANATIONS: Record<string, string> = {
  "START": "Do it in the next 48 hours.",
  "SCHEDULE": "Real, but it has a trigger date.",
  "SKIP FOR NOW": "Costs more than it moves.",
  "GET HELP": "One conversation unblocks it."
};

/** Map raw verdict values from the API (start | schedule | skip | gethelp) to display labels. */
export function verdictLabel(verdict: string): keyof typeof STYLE_GUIDE.colors.verdict {
  switch (verdict.toLowerCase().replace(/[\s_-]/g, '')) {
    case 'schedule': return 'SCHEDULE';
    case 'skip':
    case 'skipfornow': return 'SKIP FOR NOW';
    case 'gethelp': return 'GET HELP';
    default: return 'START';
  }
}

export const VerdictStamp = ({ verdict, onClick, className = "" }: { verdict: string, onClick?: (e: React.MouseEvent, v: string) => void, className?: string }) => {
  const normVerdict = verdictLabel(verdict);
  const style = STYLE_GUIDE.colors.verdict[normVerdict];
  return (
    <button 
      onClick={(e) => onClick?.(e, normVerdict)}
      className={`inline-flex w-auto items-center px-1.5 py-1 rounded-[var(--radius-pill)] border font-mono text-[8px] uppercase tracking-[0.05em] font-bold relative z-10 shrink-0 whitespace-nowrap ${onClick ? 'active:scale-95 transition-transform' : ''} ${className}`}
      style={{
        backgroundColor: style.bg,
        color: style.text,
        borderColor: style.border,
        borderRadius: STYLE_GUIDE.radii.pill
      }}
    >
      <span>{normVerdict}</span>
    </button>
  );
};
