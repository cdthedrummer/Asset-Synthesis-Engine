import React from 'react';
import { Breadcrumb } from './breadcrumb';
import { CheckCircle2, ChevronRight, Send, X } from 'lucide-react';
import { NlMove, useUpdateLeapMove, useListLeapMoveMessages, getGetLeapBoardQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useLeapChat } from './use-leap-chat';

export const MovesOverlay = ({ moves, onClose, token }: { moves: NlMove[], onClose: () => void, token: string }) => {
  const [activeMove, setActiveMove] = React.useState<NlMove | null>(null);

  if (activeMove) {
    return <MoveRepSession move={activeMove} token={token} onBack={() => setActiveMove(null)} onHome={onClose} />;
  }

  return (
    <div className="fixed inset-0 bg-background z-[70] flex flex-col animate-in slide-in-from-bottom-4 duration-300">
      <div className="px-4 pt-6 pb-4 border-b border-border bg-background/80 backdrop-blur-xl flex justify-between items-center">
        <Breadcrumb onHome={onClose} title="Next Moves" />
        <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground bg-muted rounded-full">
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 pt-8 bg-background">
        <div className="max-w-[400px] mx-auto space-y-4">
          <p className="text-muted-foreground font-medium mb-6">Here are the three concrete steps to take in the next 48 hours.</p>
          
          {[...moves].sort((a, b) => a.orderIndex - b.orderIndex).map(move => (
            <div 
              key={move.id}
              onClick={() => setActiveMove(move)}
              className="bg-card border border-border p-5 rounded-[20px] shadow-sm cursor-pointer hover:shadow-md transition-all active:scale-[0.98] group flex justify-between items-center"
            >
              <div>
                <div className="text-[11px] font-mono text-muted-foreground uppercase font-bold tracking-widest mb-1.5">{move.title}</div>
                <div className="font-sans font-bold text-[16px] text-foreground leading-snug">{move.first48}</div>
                {move.state === 'done' && <div className="mt-3 flex items-center gap-1.5 text-[10px] font-mono font-bold text-[#10B981] uppercase tracking-widest"><CheckCircle2 className="w-3.5 h-3.5" /> Done</div>}
                {move.state === 'skipped' && <div className="mt-3 text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest">Skipped</div>}
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const MoveRepSession = ({ move, token, onBack, onHome }: { move: NlMove, token: string, onBack: () => void, onHome: () => void }) => {
  const updateMove = useUpdateLeapMove();
  const queryClient = useQueryClient();
  const [input, setInput] = React.useState('');
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const isDemo = token.startsWith('demo-');

  const { data: history } = useListLeapMoveMessages(token, move.id);
  const { messages, streamContent, isStreaming, error, send } = useLeapChat({
    token,
    boardId: move.boardId,
    moveId: move.id,
    initialMessages: history,
  });

  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamContent]);

  const setState = (state: 'done' | 'skipped') => {
    setSaveError(null);
    updateMove.mutate({ token, moveId: move.id, data: { state } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetLeapBoardQueryKey(token) });
        onBack();
      },
      onError: () => {
        setSaveError(isDemo ? 'Demo boards are read-only — start your own from the front door.' : "Couldn't save — try again.");
      }
    });
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    const content = input;
    setInput('');
    void send(content);
  };

  return (
    <div className="fixed inset-0 bg-background z-[80] flex flex-col animate-in slide-in-from-right duration-300">
      <div className="px-4 pt-6 pb-4 border-b border-border bg-background/80 backdrop-blur-xl">
        <Breadcrumb onHome={onHome} onBack={onBack} title={move.title} />
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 bg-muted/30">
        <div className="bg-card border border-border p-5 rounded-[20px] shadow-sm mb-6 max-w-[600px] mx-auto">
          <div className="text-[11px] font-mono text-muted-foreground uppercase font-bold tracking-widest mb-1.5">First 48 Hours</div>
          <div className="font-sans font-bold text-[18px] text-foreground leading-snug">{move.first48}</div>
        </div>

        <div className="space-y-4 mb-8 max-w-[600px] mx-auto">
          {move.repDraft && (
             <div className="bg-white border border-border p-4 rounded-[16px] shadow-sm font-sans text-sm whitespace-pre-wrap relative">
               <div className="absolute -top-3 left-4 bg-background px-2 text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest">Draft</div>
               {move.repDraft}
             </div>
          )}
          {messages.length === 0 && !isStreaming && !move.repDraft && (
            <p className="text-center text-muted-foreground text-sm pt-4">Want a hand? Ask, and you'll draft it together — it does nothing behind your back.</p>
          )}
          {messages.map((m, i) => (
            <div key={m.id || i} className={`flex flex-col max-w-[85%] ${m.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
              <div className={`p-4 rounded-[20px] ${m.role === 'user' ? 'bg-[#1C1917] text-white rounded-tr-[4px]' : 'bg-card border border-border text-foreground rounded-tl-[4px]'}`}>
                <p className="text-[15px] leading-relaxed font-sans whitespace-pre-wrap">{m.content}</p>
              </div>
            </div>
          ))}
          {isStreaming && (
            <div className="flex flex-col max-w-[85%] mr-auto items-start">
              <div className="p-4 rounded-[20px] bg-card border border-border text-foreground rounded-tl-[4px]">
                <p className="text-[15px] leading-relaxed font-sans whitespace-pre-wrap">
                  {streamContent}<span className="inline-block w-1.5 h-3.5 bg-current ml-1 animate-pulse" />
                </p>
              </div>
            </div>
          )}
          {error && <p className="text-center text-[#BE123C] text-sm">{error}</p>}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="p-4 bg-background border-t border-border flex flex-col gap-3 max-w-[640px] mx-auto w-full">
        <form onSubmit={handleSend} className="relative">
          <input 
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={`Draft this ${move.repKind || 'move'} together...`}
            disabled={isStreaming}
            className="w-full bg-card border border-border rounded-full py-3 pl-5 pr-12 outline-none focus:ring-2 focus:ring-[#10B981] font-sans text-sm disabled:opacity-50"
          />
          <button 
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="absolute right-1.5 top-1.5 bottom-1.5 aspect-square bg-[#10B981] hover:bg-[#059669] text-white rounded-full flex items-center justify-center transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </form>
        
        {saveError && <p className="text-center text-[#BE123C] text-xs">{saveError}</p>}
        <div className="flex gap-2">
          <button 
            onClick={() => setState('skipped')}
            disabled={updateMove.isPending}
            className="flex-1 py-3 bg-muted text-foreground font-sans font-bold rounded-xl active:scale-95 transition-transform disabled:opacity-50"
          >
            Skip for now
          </button>
          <button 
            onClick={() => setState('done')}
            disabled={updateMove.isPending}
            className="flex-[2] py-3 bg-[#10B981] text-white font-sans font-bold rounded-xl active:scale-95 transition-transform shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <CheckCircle2 className="w-5 h-5" /> Done
          </button>
        </div>
      </div>
    </div>
  );
};
