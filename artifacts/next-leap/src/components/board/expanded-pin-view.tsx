import React from 'react';
import { Breadcrumb } from './breadcrumb';
import { ExternalLink } from 'lucide-react';
import { NlPin } from '@workspace/api-client-react';

export const ExpandedPinView = ({ pin, onBack, onHome }: { pin: NlPin, onBack: () => void, onHome: () => void }) => {
  const detail = pin.detail as any; // Cast to detail payload

  return (
    <div className="fixed inset-0 bg-background z-[60] flex flex-col animate-in slide-in-from-bottom-4 duration-300">
      <div className="px-4 pt-6 pb-4 border-b border-border bg-background/80 backdrop-blur-xl">
        <Breadcrumb onHome={onHome} onBack={onBack} title={pin.title} />
      </div>
      <div className="flex-1 overflow-y-auto p-6 pb-24 pt-8">
        {/* Render blocks dynamically if we have detail.blocks */}
        {detail?.blocks ? (
          <div className="space-y-8">
            {detail.blocks.map((block: any, i: number) => {
              if (block.type === 'text') {
                return (
                  <div key={i}>
                    {block.title && <h3 className="font-bold text-lg mb-2 font-sans">{block.title}</h3>}
                    <p className="text-muted-foreground leading-relaxed text-sm">{block.body}</p>
                  </div>
                );
              }
              if (block.type === 'steps') {
                return (
                  <div key={i} className="space-y-6 relative before:absolute before:inset-y-4 before:left-[19px] before:w-[2px] before:bg-border">
                    {block.title && <h3 className="font-bold text-lg mb-4 font-sans ml-11">{block.title}</h3>}
                    {block.steps?.map((step: any, j: number) => (
                      <div key={j} className="bg-card border border-border rounded-[20px] p-5 ml-11 relative shadow-sm min-w-0">
                        <div className="absolute top-6 -left-[35px] w-[16px] h-[16px] rounded-full bg-white border-[4px] border-border z-10 flex items-center justify-center">
                          {step.state === 'done' && <div className="w-2 h-2 bg-[#10B981] rounded-full"></div>}
                        </div>
                        <div className="flex flex-col gap-2 mb-4 min-w-0">
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-mono font-bold uppercase tracking-widest self-start truncate max-w-full ${step.state === 'done' ? 'bg-[#ECFDF5] text-[#10B981]' : step.state === 'active' ? 'bg-[#FFFBEB] text-[#D97706]' : 'bg-muted text-muted-foreground'}`}>
                            {step.status || step.state}
                          </span>
                          <h3 className="font-bold text-foreground text-[18px] leading-tight font-sans truncate max-w-full">{step.label}</h3>
                        </div>
                        {step.link && (
                          <button className={`flex items-center gap-2 ${step.state === 'done' ? 'text-[#10B981]' : 'text-muted-foreground'} text-[12px] font-mono font-bold uppercase tracking-widest active:opacity-70 transition-opacity min-w-0 max-w-full`}>
                            <ExternalLink className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{step.link}</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                );
              }
              // Add other block types here if necessary
              return <div key={i} className="text-sm text-muted-foreground">Block type {block.type} not implemented</div>
            })}
          </div>
        ) : (
          <div className="text-center text-muted-foreground">No detail provided for this pin.</div>
        )}
      </div>
    </div>
  );
};
