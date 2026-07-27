import React from 'react';
import { CheckCircle2, ExternalLink } from 'lucide-react';

// Common visual blocks

export const StatVisual = ({ value, label, sub }: any) => (
  <div className="bg-[var(--color-text-primary)] text-white rounded-[16px] p-4 text-center mt-2 shadow-[var(--shadow-sm)] relative overflow-hidden min-w-0">
    <div className="text-[28px] font-bold font-sans tracking-tight leading-none mb-1">
      {value}
      {sub && <span className="text-[14px] ml-1 opacity-70">{sub}</span>}
    </div>
    <div className="text-[10px] font-mono text-[var(--color-text-tertiary)] uppercase tracking-widest font-bold mb-4">{label}</div>
    {/* Optional booked/done indicator? Hardcoded in mockup, let's keep it clean or driven by data */}
  </div>
);

export const StepsVisual = ({ steps, caption }: any) => (
  <div className="relative pl-6 space-y-6 py-3 before:absolute before:left-[9px] before:top-4 before:bottom-4 before:w-[2px] before:bg-[var(--color-divider)] mt-1 min-w-0">
    {steps?.map((step: any, i: number) => {
      const isDone = step.state === 'done';
      const isActive = step.state === 'active';
      const colorClass = isDone ? 'bg-[#10B981]' : isActive ? 'bg-[#D97706]' : 'bg-[var(--color-text-tertiary)]';
      const opClass = (!isDone && !isActive) ? 'opacity-40' : '';
      return (
        <div key={i} className={`relative min-w-0 ${opClass}`}>
          <div className={`absolute -left-[31px] top-[2px] w-3 h-3 ${colorClass} border-[3px] border-surface rounded-full`}></div>
          <div className="text-[13px] font-bold text-[var(--color-text-primary)] leading-none font-sans tracking-tight truncate">
            {step.label}
          </div>
        </div>
      );
    })}
    {caption && <div className="text-[10px] font-mono text-[var(--color-text-tertiary)] uppercase tracking-widest font-bold mt-2">{caption}</div>}
  </div>
);

export const PipelineVisual = ({ items }: any) => (
  <div className="space-y-4 py-2 mt-2 w-full min-w-0">
    {items?.map((item: any, i: number) => {
      const isDone = item.state === 'done';
      const isActive = item.state === 'active';
      const bgClass = isDone ? 'bg-[#ECFDF5]' : isActive ? 'bg-[#FFFBEB]' : 'bg-gray-100';
      const textClass = isDone ? 'text-[#10B981]' : isActive ? 'text-[#D97706]' : 'text-gray-500';
      const opClass = (!isDone && !isActive) ? 'opacity-40' : '';
      return (
        <div key={i} className={`flex items-center gap-2.5 w-full min-w-0 ${opClass}`}>
          <div className={`w-9 h-9 rounded-[10px] ${bgClass} ${textClass} flex items-center justify-center shrink-0`}>
            {/* Using a generic dot or first letter since icon varies in mockup */}
            <div className="w-2.5 h-2.5 rounded-full bg-current"></div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[var(--color-text-primary)] text-[13px] font-bold truncate">{item.name}</p>
            <p className={`${textClass} text-[9px] font-mono font-bold uppercase tracking-widest truncate mt-0.5`}>{item.status}</p>
          </div>
        </div>
      );
    })}
  </div>
);

export const MenuVisual = ({ heading, items }: any) => (
  <div className="bg-[#FFFDFB] border border-border p-3 rounded-[16px] shadow-sm font-mono text-[11px] leading-relaxed mt-2 relative min-w-0">
    {heading && <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-surface px-2 text-[9px] font-bold text-[var(--color-text-tertiary)] tracking-widest uppercase">{heading}</div>}
    <div className="space-y-3 pt-1">
      {items?.map((item: any, i: number) => (
        <div key={i} className="flex justify-between items-baseline gap-1">
          <span className="text-[var(--color-text-primary)] font-bold truncate">{item.name}</span>
          <span className="border-b-2 border-dotted border-[var(--color-divider)] flex-1 mx-1 min-w-[8px]"></span>
          <span className="text-[var(--color-text-secondary)] font-bold shrink-0">{item.price}</span>
        </div>
      ))}
    </div>
  </div>
);

const MARK_COLOR: Record<string, string> = {
  post: 'bg-[#10B981]',
  event: 'bg-[#1C1917]',
  due: 'bg-[#E11D48]',
};

export const CalendarVisual = ({ month, marks, caption }: any) => {
  const maxMarked = Math.max(0, ...(marks?.map((m: any) => m.day) ?? []));
  const dayCount = maxMarked > 30 ? 31 : 30;
  const days = Array.from({ length: dayCount }).map((_, i) => i + 1);
  return (
    <div className="py-2 mt-1">
      {month && <div className="text-[9px] font-mono text-[var(--color-text-tertiary)] uppercase tracking-widest font-bold mb-1.5 text-center">{month}</div>}
      <div className="grid grid-cols-7 gap-1 text-center font-mono text-[9px] font-bold">
        {days.map((d) => {
          const mark = marks?.find((m: any) => m.day === d);
          return (
            <div key={d} className={`rounded-[7px] aspect-square flex items-center justify-center relative ${mark ? 'bg-surface border border-border text-[var(--color-text-primary)] shadow-[var(--shadow-sm)]' : 'bg-canvas text-[var(--color-text-tertiary)]'}`}>
              {d}
              {mark && <div className={`w-1 h-1 rounded-full absolute bottom-[3px] ${MARK_COLOR[mark.kind] || 'bg-[#10B981]'}`}></div>}
            </div>
          );
        })}
      </div>
      {caption && <div className="text-[10px] text-center font-mono text-[var(--color-text-tertiary)] uppercase tracking-widest font-bold mt-2">{caption}</div>}
    </div>
  );
};

export const BarsVisual = ({ unit, bars, capLine }: any) => {
  const values = bars?.map((b: any) => b.value) ?? [];
  const max = Math.max(1, ...values, capLine?.value ?? 0) * 1.2;
  return (
    <div className="py-2 mt-2 min-w-0">
      <div className="relative h-24 w-full">
        {capLine && (
          <div className="absolute inset-x-0 border-t-[2px] border-dashed border-[#BE123C] z-10" style={{ bottom: `${(capLine.value / max) * 100}%` }}>
            <span className="absolute -top-4 right-0 text-[9px] font-mono text-[#BE123C] uppercase tracking-widest font-bold">{capLine.label} {capLine.value}</span>
          </div>
        )}
        <div className="absolute inset-0 flex items-end justify-center gap-2.5 border-b border-[var(--color-divider)]">
          {bars?.map((bar: any, i: number) => {
            const atCap = capLine && bar.value >= capLine.value;
            return (
              <div key={i} className={`w-8 max-w-[40px] ${atCap ? 'bg-[#BE123C]' : 'bg-[#FECDD3]'} rounded-t-[8px]`} style={{ height: `${(bar.value / max) * 100}%` }}></div>
            );
          })}
        </div>
      </div>
      <div className="flex justify-center gap-2.5 mt-1.5">
        {bars?.map((bar: any, i: number) => (
          <div key={i} className="w-8 max-w-[40px] text-center text-[8px] font-mono font-bold text-[var(--color-text-tertiary)] uppercase truncate">{bar.label}</div>
        ))}
      </div>
      {unit && <div className="text-[9px] text-center font-mono text-[var(--color-text-tertiary)] uppercase tracking-widest font-bold mt-1.5">{unit}</div>}
    </div>
  );
};

export const TableVisual = ({ rows }: any) => (
  <div className="bg-[#FFFDFB] border border-border p-3 rounded-[16px] shadow-sm font-mono text-[11px] leading-relaxed mt-2 relative min-w-0 space-y-2">
    {rows?.map((row: any, i: number) => (
      <div key={i} className="flex justify-between items-center gap-2">
        <span className={`truncate font-bold ${row.state === 'done' ? 'text-[#10B981]' : row.state === 'active' ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-tertiary)]'}`}>{row.label}</span>
        {row.note && <span className="text-[9px] uppercase tracking-widest opacity-50 shrink-0">{row.note}</span>}
      </div>
    ))}
  </div>
);

export const Visualizer = ({ kind, data }: { kind: string, data: any }) => {
  if (!data) return null;
  switch (kind) {
    case 'stat': return <StatVisual {...data} />;
    case 'steps': return <StepsVisual {...data} />;
    case 'pipeline': return <PipelineVisual {...data} />;
    case 'menu': return <MenuVisual {...data} />;
    case 'calendar': return <CalendarVisual {...data} />;
    case 'bars': return <BarsVisual {...data} />;
    case 'table': return <TableVisual {...data} />;
    default: return <div className="text-xs text-muted-foreground">Unknown visual {kind}</div>;
  }
};
