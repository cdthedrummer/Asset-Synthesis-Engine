import React from 'react';
import { X, MessageSquare } from 'lucide-react';
import { VerdictStamp, VERDICT_EXPLANATIONS, verdictLabel } from './verdict-stamp';
import { NlPin } from '@workspace/api-client-react';

export const VerdictPopover = ({ 
  pin, 
  onClose, 
  onArgue 
}: { 
  pin: NlPin, 
  onClose: () => void, 
  onArgue: () => void 
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose}></div>
      <div className="bg-card w-full max-w-[320px] rounded-2xl p-6 shadow-xl relative z-10 animate-in zoom-in-95 duration-200">
        <button onClick={onClose} className="absolute right-4 top-4 p-2 text-muted-foreground hover:bg-muted rounded-full transition-colors">
          <X className="w-4 h-4" />
        </button>
        
        <div className="mb-4">
          <VerdictStamp verdict={pin.verdict} className="text-kicker px-2 py-1" />
        </div>
        
        <h3 className="font-sans font-bold text-heading leading-tight mb-2 text-foreground">{pin.title}</h3>
        <p className="text-foreground text-body-lg leading-relaxed mb-6 font-medium">{pin.verdictWhy || VERDICT_EXPLANATIONS[verdictLabel(pin.verdict)]}</p>
        
        <div className="flex gap-4 mb-8">
          <div>
            <div className="text-kicker font-mono text-muted-foreground uppercase font-bold tracking-widest mb-1">Impact</div>
            <div className="font-sans font-bold text-body-lg text-foreground">{pin.impact}/10</div>
          </div>
          <div>
            <div className="text-kicker font-mono text-muted-foreground uppercase font-bold tracking-widest mb-1">Difficulty</div>
            <div className="font-sans font-bold text-body-lg text-foreground">{pin.difficulty}/10</div>
          </div>
        </div>
        
        <button 
          onClick={onArgue}
          className="w-full py-4 bg-muted hover:bg-muted/80 text-foreground font-sans font-bold rounded-pill active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <MessageSquare className="w-4 h-4" /> Argue with it
        </button>
      </div>
    </div>
  );
};
