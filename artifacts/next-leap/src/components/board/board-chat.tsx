import React from 'react';
import { ArrowUp, MessageSquare, Plus, X } from 'lucide-react';
import {
  NlBoardState,
  useQuickAddLeapPin,
  getGetLeapBoardQueryKey,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useLeapChat } from './use-leap-chat';
import { ChoiceChips } from './choice-chips';
import { ComposerInput } from './composer-input';

/**
 * The board-wide thread.
 *
 * The server has always had this: chatSystem's board-wide branch, plus the whole
 * ACTIONS protocol for merging, deleting and renaming pins, allowlisted
 * server-side. None of it was reachable, because useLeapChat was only ever
 * mounted inside a pin or a move — the bar on the board was quick-add, which
 * can't hold a conversation. So after the interview nobody could ask "what
 * should I focus on?", and the self-healing the product promises had no user-
 * facing door at all. This is that door.
 *
 * Two modes on one bar, per the locked taste direction that the persistent input
 * is context-aware: Ask (conversation, can edit the board) and Add (quick-add,
 * a different and cheaper server path — kept rather than replaced).
 */

const STARTERS = [
  'What should I do first?',
  'Cut something for me',
  'Merge the duplicates',
];

export const BoardChat = ({
  boardState,
  token,
}: {
  boardState: NlBoardState;
  token: string;
}) => {
  const [mode, setMode] = React.useState<'ask' | 'add'>('ask');
  const [open, setOpen] = React.useState(false);
  const [input, setInput] = React.useState('');
  const [addError, setAddError] = React.useState<string | null>(null);
  const queryClient = useQueryClient();
  const quickAdd = useQuickAddLeapPin();
  const isDemo = token.startsWith('demo-');

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getGetLeapBoardQueryKey(token) });

  const { messages, streamContent, isStreaming, error, options, send } = useLeapChat({
    token,
    boardId: boardState.board.id,
  });

  const endRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamContent, open]);

  const ask = (content: string) => {
    if (!content.trim() || isStreaming) return;
    setInput('');
    setOpen(true);
    void send(content);
  };

  const add = (content: string) => {
    if (!content.trim() || quickAdd.isPending) return;
    setAddError(null);
    setInput('');
    quickAdd.mutate(
      { token, data: { text: content } },
      {
        onSuccess: invalidate,
        onError: () =>
          setAddError(
            isDemo
              ? 'Demo boards are read-only — start your own from the front door.'
              : "Couldn't add that — try again.",
          ),
      },
    );
  };

  const submit = () => (mode === 'ask' ? ask(input) : add(input));
  const hasThread = messages.length > 0 || !!streamContent;

  return (
    <>
      {/* The thread, opened on demand so the board stays the main surface. */}
      {open && hasThread && (
        <div className="fixed inset-0 z-[60] bg-background flex flex-col">
          <div className="px-4 pt-6 pb-4 border-b border-border flex items-center justify-between">
            <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground font-bold">
              This board
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-2 text-muted-foreground hover:text-foreground bg-muted rounded-full"
              aria-label="Close the thread"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            <div className="max-w-[520px] mx-auto space-y-4">
              {messages.map(m => (
                <div
                  key={m.id}
                  className={
                    m.role === 'user'
                      ? 'ml-auto max-w-[85%] bg-foreground text-background rounded-[20px] rounded-br-md px-4 py-3 text-[14px] leading-relaxed'
                      : 'max-w-[95%] text-[15px] leading-relaxed text-foreground whitespace-pre-wrap'
                  }
                >
                  {m.content}
                </div>
              ))}
              {streamContent && (
                <div className="max-w-[95%] text-[15px] leading-relaxed text-foreground whitespace-pre-wrap">
                  {streamContent}
                </div>
              )}
              {!!error && (
                <div className="font-mono text-[10px] uppercase tracking-widest text-[#BE123C] font-bold">
                  {String(error)}
                </div>
              )}
              {!!options?.length && !isStreaming && (
                <ChoiceChips options={options} onPick={ask} disabled={isStreaming} />
              )}
              <div ref={endRef} />
            </div>
          </div>
        </div>
      )}

      {/* The persistent bar. */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-6 bg-gradient-to-t from-background via-background to-transparent z-40 pointer-events-none">
        <div className="max-w-[520px] mx-auto pointer-events-auto space-y-2">
          {addError && (
            <p className="text-center text-[11px] text-[#BE123C] bg-background/90 rounded-full px-3 py-1">
              {addError}
            </p>
          )}

          <div className="flex items-center gap-2">
            <div className="flex shrink-0 rounded-full border border-border bg-card p-1 shadow-sm">
              <button
                onClick={() => setMode('ask')}
                aria-label="Ask about the board"
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  mode === 'ask' ? 'bg-foreground text-background' : 'text-muted-foreground'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
              </button>
              <button
                onClick={() => setMode('add')}
                aria-label="Add something to the board"
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  mode === 'add' ? 'bg-foreground text-background' : 'text-muted-foreground'
                }`}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 min-w-0">
              <ComposerInput
                value={input}
                onChange={setInput}
                onSubmit={submit}
                placeholder={mode === 'ask' ? 'Ask about the board…' : 'Add something…'}
                disabled={mode === 'ask' ? isStreaming : quickAdd.isPending}
                token={token}
              />
            </div>

            {hasThread && !open && (
              <button
                onClick={() => setOpen(true)}
                aria-label="Open the thread"
                className="shrink-0 w-10 h-10 rounded-full border border-border bg-card text-muted-foreground flex items-center justify-center shadow-sm hover:text-foreground"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Tap starters make the board-editing protocol discoverable at all. */}
          {mode === 'ask' && !hasThread && (
            <ChoiceChips
              options={STARTERS}
              onPick={ask}
              disabled={isStreaming}
              className="justify-center"
            />
          )}
        </div>
      </div>
    </>
  );
};
