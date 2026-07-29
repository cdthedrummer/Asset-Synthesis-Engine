import React from 'react';
import { Maximize2 } from 'lucide-react';
import { NlBoardTrajectory } from '@workspace/api-client-react';
import { TrajectoryChart } from './trajectory-chart';

export const TrajectoryCard = ({ trajectory, onClick }: { trajectory: any, onClick: () => void }) => {
  if (!trajectory) return null;
  
  return (
    <button onClick={onClick} className="w-full text-left bg-card rounded-xl p-6 shadow-sm border border-border active:scale-[0.98] transition-transform overflow-hidden relative block min-w-0">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-2 gap-1 sm:gap-2">
        <div className="kicker text-ink-3 sm:order-none">{trajectory.title}</div>
        <div className="metric text-heading text-moss leading-none shrink-0">
          {trajectory.headline}
          {trajectory.unit && <span className="text-body text-muted-foreground font-medium">{trajectory.unit}</span>}
        </div>
      </div>
      
      <div className="h-[120px] w-full relative mt-4">
        <TrajectoryChart series={trajectory.series || []} width={350} height={100} fillId="chartFill" />
      </div>
      
      <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-2 text-muted-foreground text-kicker font-mono uppercase tracking-widest font-bold">
        <Maximize2 className="w-3 h-3" /> Tap to expand
      </div>
    </button>
  );
};
