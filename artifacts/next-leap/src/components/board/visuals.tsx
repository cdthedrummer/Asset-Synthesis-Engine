import React from 'react';

/**
 * The pin infographics — "Visual Capitalist-like, but simple like a health app".
 *
 * These carry the pin's whole identity: pin cards render no title, so cover the
 * verdict chip and one of these still has to say what the pin is in a second.
 * One accent, no chart junk, no sentences.
 */

export const StatVisual = ({ value, label, sub, muted }: any) => (
  // The one surface here that inverts to an ink ground, so its label uses the
  // inverse ink ramp — pointing that at --ink-3 (correct on paper) would put it
  // at 3.19:1 on ink and fail.
  //
  // `muted` drops the inversion entirely on a dropped pin. An ink-filled block
  // is the loudest object on the board, and on a SKIP FOR NOW card it made the
  // thing you were told to drop shout the loudest — exactly backwards, and the
  // one place the "verdicts are not peers" rule was still being broken.
  <div
    className={`rounded-md p-4 text-center mt-2 shadow-sm relative overflow-hidden min-w-0 ${
      muted ? 'bg-sunken text-ink-2' : 'bg-ink-1 text-on-ink'
    }`}
  >
    <div className="metric text-heading font-bold leading-none mb-1">
      {value}
      {sub && <span className="text-body ml-1 opacity-70">{sub}</span>}
    </div>
    <div className={`kicker mb-4 ${muted ? 'text-ink-3' : 'text-on-ink-dim'}`}>{label}</div>
  </div>
);

export const StepsVisual = ({ steps, caption }: any) => (
  <div className="relative pl-6 space-y-6 py-3 before:absolute before:left-[9px] before:top-4 before:bottom-4 before:w-[2px] before:bg-rule-soft mt-1 min-w-0">
    {steps?.map((step: any, i: number) => {
      const isDone = step.state === 'done';
      const isActive = step.state === 'active';
      const colorClass = isDone ? 'bg-moss' : isActive ? 'bg-ochre' : 'bg-ink-4';
      const opClass = !isDone && !isActive ? 'opacity-40' : '';
      return (
        <div key={i} className={`relative min-w-0 ${opClass}`}>
          <div
            className={`absolute -left-[31px] top-[2px] w-3 h-3 ${colorClass} border-[3px] border-surface rounded-full`}
          />
          <div className="text-caption font-bold text-ink-1 leading-none tracking-tight truncate">
            {step.label}
          </div>
        </div>
      );
    })}
    {caption && <div className="kicker text-ink-3 mt-2">{caption}</div>}
  </div>
);

export const PipelineVisual = ({ items }: any) => (
  <div className="space-y-4 py-2 mt-2 w-full min-w-0">
    {items?.map((item: any, i: number) => {
      const isDone = item.state === 'done';
      const isActive = item.state === 'active';
      // Was bg-gray-100 / text-gray-500 — cool Tailwind greys, which read as
      // dirt against warm paper.
      const bgClass = isDone ? 'bg-moss-tint' : isActive ? 'bg-ochre-tint' : 'bg-sunken';
      const textClass = isDone ? 'text-moss' : isActive ? 'text-ochre' : 'text-ink-3';
      const opClass = !isDone && !isActive ? 'opacity-40' : '';
      return (
        <div key={i} className={`flex items-center gap-2.5 w-full min-w-0 ${opClass}`}>
          <div
            className={`w-9 h-9 rounded-sm ${bgClass} ${textClass} flex items-center justify-center shrink-0`}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-current" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-ink-1 text-caption font-bold truncate">{item.name}</p>
            <p className={`${textClass} kicker-sm truncate mt-0.5`}>{item.status}</p>
          </div>
        </div>
      );
    })}
  </div>
);

export const MenuVisual = ({ heading, items }: any) => (
  <div className="bg-sunken border border-rule p-3 rounded-md shadow-sm font-mono text-kicker-lg leading-relaxed mt-2 relative min-w-0">
    {heading && (
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-surface px-2 kicker-sm text-ink-3">
        {heading}
      </div>
    )}
    <div className="space-y-3 pt-1">
      {items?.map((item: any, i: number) => (
        <div key={i} className="flex justify-between items-baseline gap-1">
          <span className="text-ink-1 font-bold truncate">{item.name}</span>
          <span className="border-b-2 border-dotted border-rule flex-1 mx-1 min-w-[8px]" />
          <span className="text-ink-2 font-bold shrink-0 tabular-nums">{item.price}</span>
        </div>
      ))}
    </div>
  </div>
);

const MARK_COLOR: Record<string, string> = {
  post: 'bg-moss',
  event: 'bg-ink-1',
  due: 'bg-danger',
};

export const CalendarVisual = ({ month, marks, caption }: any) => {
  const maxMarked = Math.max(0, ...(marks?.map((m: any) => m.day) ?? []));
  const dayCount = maxMarked > 30 ? 31 : 30;
  const days = Array.from({ length: dayCount }).map((_, i) => i + 1);
  return (
    <div className="py-2 mt-1">
      {month && <div className="kicker-sm text-ink-3 mb-1.5 text-center">{month}</div>}
      <div className="grid grid-cols-7 gap-1 text-center font-mono text-kicker-sm tabular-nums">
        {days.map(d => {
          const mark = marks?.find((m: any) => m.day === d);
          return (
            <div
              key={d}
              className={`rounded-xs aspect-square flex items-center justify-center relative ${
                mark
                  ? 'bg-surface border border-rule text-ink-1 shadow-sm'
                  : 'bg-sunken text-ink-3'
              }`}
            >
              {d}
              {mark && (
                <div
                  className={`w-1 h-1 rounded-full absolute bottom-[3px] ${
                    MARK_COLOR[mark.kind] || 'bg-moss'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
      {caption && <div className="kicker text-ink-3 mt-2 text-center">{caption}</div>}
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
          <div
            className="absolute inset-x-0 border-t-[2px] border-dashed border-danger z-10"
            style={{ bottom: `${(capLine.value / max) * 100}%` }}
          >
            <span className="absolute -top-4 right-0 kicker-sm text-danger">
              {capLine.label} {capLine.value}
            </span>
          </div>
        )}
        <div className="absolute inset-0 flex items-end justify-center gap-2.5 border-b border-rule">
          {bars?.map((bar: any, i: number) => {
            const atCap = capLine && bar.value >= capLine.value;
            // Bars are quantities, so they are neutral. They used to be rose,
            // which painted the board's most numeric pin type in the error hue
            // and made every bar chart look like a problem. Now only the bar
            // that actually breaches the cap is red.
            return (
              <div
                key={i}
                className={`w-8 max-w-[40px] ${atCap ? 'bg-danger' : 'bg-ink-1/25'} rounded-t-xs`}
                style={{ height: `${(bar.value / max) * 100}%` }}
              />
            );
          })}
        </div>
      </div>
      <div className="flex justify-center gap-2.5 mt-1.5">
        {bars?.map((bar: any, i: number) => (
          <div key={i} className="w-8 max-w-[40px] text-center kicker-sm text-ink-3 truncate">
            {bar.label}
          </div>
        ))}
      </div>
      {unit && <div className="kicker-sm text-ink-3 mt-1.5 text-center">{unit}</div>}
    </div>
  );
};

export const TableVisual = ({ rows }: any) => (
  <div className="bg-sunken border border-rule p-3 rounded-md shadow-sm font-mono text-kicker-lg leading-relaxed mt-2 relative min-w-0 space-y-2">
    {rows?.map((row: any, i: number) => (
      <div key={i} className="flex justify-between items-center gap-2">
        <span
          className={`truncate font-bold ${
            row.state === 'done'
              ? 'text-moss'
              : row.state === 'active'
                ? 'text-ink-1'
                : 'text-ink-3'
          }`}
        >
          {row.label}
        </span>
        {row.note && <span className="kicker-sm text-ink-3 shrink-0">{row.note}</span>}
      </div>
    ))}
  </div>
);

export const Visualizer = ({
  kind,
  data,
  muted,
}: {
  kind: string;
  data: any;
  /** The pin is dropped — nothing in here should be the loudest thing on screen. */
  muted?: boolean;
}) => {
  if (!data) return null;
  switch (kind) {
    case 'stat':
      return <StatVisual {...data} muted={muted} />;
    case 'steps':
      return <StepsVisual {...data} />;
    case 'pipeline':
      return <PipelineVisual {...data} />;
    case 'menu':
      return <MenuVisual {...data} />;
    case 'calendar':
      return <CalendarVisual {...data} />;
    case 'bars':
      return <BarsVisual {...data} />;
    case 'table':
      return <TableVisual {...data} />;
    default:
      return <div className="text-caption text-ink-3">Unknown visual {kind}</div>;
  }
};
