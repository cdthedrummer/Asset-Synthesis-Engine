import React from 'react';
import { Breadcrumb } from './breadcrumb';
import { Send } from 'lucide-react';
import { NlPin, useListLeapPinMessages } from '@workspace/api-client-react';
import { useLeapChat } from './use-leap-chat';

export const PinChatView = ({ pin, token, onBack, onHome }: { pin: NlPin, token: string, onBack: () => void, onHome: () => void }) => {
  const [input, setInput] = React.useState('');
  const { data: history } = useListLeapPinMessages(token, pin.id);
  const { messages, streamContent, isStreaming, error, send } = useLeapChat({
    token,
    boardId: pin.boardId,
    pinId: pin.id,
    initialMessages: history,
  });

  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamContent]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    const content = input;
    setInput('');
    void send(content);
  };

  return (
    <div className="fixed inset-0 bg-background z-[70] flex flex-col animate-in slide-in-from-right duration-300">
      <div className="px-4 pt-6 pb-4 border-b border-border bg-background/80 backdrop-blur-xl">
        <Breadcrumb onHome={onHome} onBack={onBack} title={pin.title} />
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 && !isStreaming && (
          <p className="text-center text-muted-foreground text-sm pt-8">Think a verdict is wrong? Say so.</p>
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

      <div className="p-4 bg-background border-t border-border">
        <form onSubmit={handleSend} className="relative">
          <input 
            type="text" 
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type your response..." 
            disabled={isStreaming}
            className="w-full bg-card border border-border rounded-full py-4 pl-6 pr-14 outline-none focus:ring-2 focus:ring-[#10B981] font-sans text-[15px]"
          />
          <button 
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="absolute right-2 top-2 bottom-2 aspect-square bg-[#10B981] hover:bg-[#059669] text-white rounded-full flex items-center justify-center transition-colors disabled:opacity-50"
          >
            <Send className="w-5 h-5 ml-1" />
          </button>
        </form>
      </div>
    </div>
  );
};
