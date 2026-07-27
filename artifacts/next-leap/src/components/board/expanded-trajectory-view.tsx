import React from 'react';
import { Breadcrumb } from './breadcrumb';
import { NlBoardTrajectory } from '@workspace/api-client-react';
import { TrajectoryChart } from './trajectory-chart';

export const ExpandedTrajectoryView = ({ trajectory, onBack, onHome }: { trajectory: any, onBack: () => void, onHome: () => void }) => {
  if (!trajectory) return null;
  return (
    <div className="fixed inset-0 bg-background z-[60] flex flex-col animate-in slide-in-from-bottom-4 duration-300">
      <div className="px-4 pt-6 pb-4 border-b border-border bg-background/80 backdrop-blur-xl">
        <Breadcrumb onHome={onHome} onBack={onBack} title={trajectory.title || "Trajectory"} />
      </div>
      
      <div className="flex-1 p-6 overflow-y-auto pb-24 pt-8">
        <div className="w-full h-44 mb-12 relative">
          <TrajectoryChart series={trajectory.series || []} width={350} height={120} fillId="chartFillLarge" />
        </div>

        {trajectory.milestones && (
          <div className="space-y-8 relative before:absolute before:inset-y-2 before:left-[11px] before:w-[2px] before:bg-border">
            {trajectory.milestones.map((m: any, i: number) => {
              const isLast = i === trajectory.milestones.length - 1;
              const isMoney = /\$/.test(trajectory.headline || '');
              const point = [...(trajectory.series || [])].reverse().find((p: any) => p.x === m.x);
              const value = point ? `${isMoney ? '~$' : '~'}${Number(point.y).toLocaleString()}${trajectory.unit || ''}` : m.x;
              return (
                <div key={i} className="relative pl-10">
                  <div className={`absolute ${isLast ? 'left-[5.5px] top-0.5 w-[13px] h-[13px] rounded-full bg-[#10B981] border-2 border-white shadow-sm' : 'left-[6.5px] top-1 w-[11px] h-[11px] rounded-full bg-white border-2 border-[#10B981]'}`}></div>
                  <div className={`text-[11px] font-mono font-bold ${isLast ? 'text-[#10B981]' : 'text-muted-foreground'} mb-1 tracking-widest uppercase`}>{m.x} — {m.label}</div>
                  <div className="text-[20px] text-foreground font-bold font-sans">{value}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
