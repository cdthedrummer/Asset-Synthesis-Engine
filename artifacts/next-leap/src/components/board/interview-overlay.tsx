import React, { useEffect, useState } from 'react';
import { useAnswerLeapInterview, getGetLeapBoardQueryKey } from '@workspace/api-client-react';
import { Send } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { ChoiceChips } from './choice-chips';

export const InterviewOverlay = ({
  token,
  stage,
  say,
  options,
}: {
  token: string;
  stage: string;
  say: string;
  options?: string[] | null;
}) => {
  const [input, setInput] = useState('');
  const [displayedSay, setDisplayedSay] = useState('');
  const answerMutation = useAnswerLeapInterview();
  const queryClient = useQueryClient();

  // Typewriter effect for the question
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

  const submitAnswer = (content: string) => {
    if (!content.trim() || answerMutation.isPending) return;
    setInput('');
    answerMutation.mutate(
      { token, data: { content } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetLeapBoardQueryKey(token) });
        },
      },
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitAnswer(input);
  };

  if (stage === 'board') return null;

  const typingDone = displayedSay === say;
  const showChips = typingDone && !answerMutation.isPending && !!options?.length;

  return (
    <>
      {/* Phones: mute the board behind so the question stays readable. */}
      <div className="fixed inset-0 z-30 bg-background/60 backdrop-blur-[2px] sm:hidden" />
      <div className="fixed inset-x-0 bottom-0 top-1/2 sm:bg-gradient-to-t sm:from-background sm:via-background/95 sm:to-transparent z-40 flex flex-col justify-end p-4 pb-8 sm:p-6 sm:pb-12 pointer-events-none">
        <div className="w-full max-w-[500px] mx-auto pointer-events-auto space-y-5 sm:space-y-6 max-sm:bg-card max-sm:border max-sm:border-border max-sm:rounded-[28px] max-sm:p-5 max-sm:shadow-xl">
          <div className="font-sans text-[20px] sm:text-[22px] font-medium leading-snug text-foreground sm:drop-shadow-md">
            {displayedSay}
            {answerMutation.isPending && <span className="ml-2 inline-block w-2 h-5 bg-foreground/50 animate-pulse align-middle" />}
          </div>

          {showChips && (
            <ChoiceChips options={options!} onPick={submitAnswer} disabled={answerMutation.isPending} />
          )}

          <form onSubmit={handleSubmit} className="relative">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={showChips ? 'Tap one, or say it your way...' : 'Type your answer...'}
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
    </>
  );
};
