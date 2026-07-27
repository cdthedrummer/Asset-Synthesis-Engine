import React, { useEffect, useState, useRef } from 'react';
import { useAnswerLeapInterview, getGetLeapBoardQueryKey, NlInterviewTurn } from '@workspace/api-client-react';
import { Send } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export const InterviewOverlay = ({ token, stage, say }: { token: string, stage: string, say: string }) => {
  const [input, setInput] = useState('');
  const [displayedSay, setDisplayedSay] = useState('');
  const answerMutation = useAnswerLeapInterview();
  const queryClient = useQueryClient();
  
  // Typewriter effect for coach speech
  useEffect(() => {
    setDisplayedSay('');
    let i = 0;
    const interval = setInterval(() => {
      setDisplayedSay(say.substring(0, i));
      i++;
      if (i > say.length) clearInterval(interval);
    }, 20); // Fast typing
    return () => clearInterval(interval);
  }, [say]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || answerMutation.isPending) return;
    
    const content = input;
    setInput('');
    
    answerMutation.mutate({ token, data: { content } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetLeapBoardQueryKey(token) });
      }
    });
  };

  if (stage === 'board') return null;

  return (
    <div className="fixed inset-x-0 bottom-0 top-1/2 bg-gradient-to-t from-background via-background/95 to-transparent z-40 flex flex-col justify-end p-6 pb-12 pointer-events-none">
      <div className="w-full max-w-[500px] mx-auto pointer-events-auto space-y-6">
        <div className="font-sans text-[22px] font-medium leading-snug text-foreground drop-shadow-md">
          {displayedSay}
          {answerMutation.isPending && <span className="ml-2 inline-block w-2 h-5 bg-foreground/50 animate-pulse align-middle" />}
        </div>
        
        <form onSubmit={handleSubmit} className="relative">
          <input 
            type="text" 
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type your answer..." 
            disabled={answerMutation.isPending}
            className="w-full bg-card shadow-lg border border-border rounded-full py-4 pl-6 pr-14 outline-none focus:ring-2 focus:ring-[#10B981] font-sans text-[15px] placeholder:text-muted-foreground disabled:opacity-50"
            autoFocus
          />
          <button 
            type="submit"
            disabled={!input.trim() || answerMutation.isPending}
            className="absolute right-2 top-2 bottom-2 aspect-square bg-primary hover:bg-primary/90 text-primary-foreground rounded-full flex items-center justify-center transition-colors disabled:opacity-50"
          >
            <Send className="w-5 h-5 ml-1" />
          </button>
        </form>
      </div>
    </div>
  );
};
