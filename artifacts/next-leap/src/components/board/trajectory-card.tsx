import React from 'react';
import { Maximize2 } from 'lucide-react';
import { NlBoardTrajectory } from '@workspace/api-client-react';
import { TrajectoryChart } from './trajectory-chart';

export const TrajectoryCard = ({ trajectory, onClick }: { trajectory: any, onClick: () => void }) => {
  if (!trajectory) return null;
  
  return (
    <button onClick={onClick} className="w-full text-left bg-card rounded-[24px] p-6 shadow-sm border border-border active:scale-[0.98] transition-transform overflow-hidden relative block min-w-0">
      <div className="flex justify-between items-end mb-2 gap-2">
        <div className="font-sans text-[20px] font-bold text-foreground leading-none truncate">{trajectory.title}</div>
        <div className="font-sans text-[26px] font-bold text-[#10B981] leading-none shrink-0">
          {trajectory.headline}
          {trajectory.unit && <span className="text-[14px] text-muted-foreground font-medium">{trajectory.unit}</span>}
        </div>
      </div>
      
      <div className="h-[120px] w-full relative mt-4">
        <TrajectoryChart series={trajectory.series || []} width={350} height={100} fillId="chartFill" />
      </div>
      
      <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-2 text-muted-foreground text-[10px] font-mono uppercase tracking-widest font-bold">
        <Maximize2 className="w-3 h-3" /> Tap to expand
      </div>
    </button>
  );
};
