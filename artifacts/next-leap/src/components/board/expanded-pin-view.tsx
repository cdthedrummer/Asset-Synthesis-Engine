import React from 'react';
import { Breadcrumb } from './breadcrumb';
import { ExternalLink, ListTodo, Pencil, Send, Sparkles, Trash2 } from 'lucide-react';
import {
  NlPin,
  NlTask,
  useListLeapPinMessages,
  useUpdateLeapPin,
  useDeleteLeapPin,
  useAppendLeapPin,
  useCreateLeapPinTask,
  getGetLeapBoardQueryKey,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useLeapChat } from './use-leap-chat';
import { VerdictStamp } from './verdict-stamp';
import { Visualizer } from './visuals';
import { PinChecklist } from './pin-checklist';
import { ChoiceChips } from './choice-chips';
import { starterPrompts } from './starter-prompts';
import { formatRecency } from './pin-item';

type ManageMode = 'none' | 'edit' | 'append' | 'delete';

const ACTION_BTN =
  'flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-border bg-card text-[11px] font-mono font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground hover:border-foreground/40 active:scale-95 transition-all';

/**
 * Every pin opens into this: recap of why it exists, its visual, deeper
 * detail, a Keep-style checklist, and a chat thread scoped to the pin.
 */
export const ExpandedPinView = ({
  pin,
  token,
  tasks,
  onBack,
  onHome,
}: {
  pin: NlPin;
  token: string;
  tasks: NlTask[];
  onBack: () => void;
  onHome: () => void;
}) => {
  const detail = pin.detail as any;
  const isDemo = token.startsWith('demo-');
  const queryClient = useQueryClient();
  const invalidateBoard = () =>
    queryClient.invalidateQueries({ queryKey: getGetLeapBoardQueryKey(token) });

  const [mode, setMode] = React.useState<ManageMode>('none');
  const [notice, setNotice] = React.useState<string | null>(null);
  const [editTitle, setEditTitle] = React.useState(pin.title);
  const [editWhy, setEditWhy] = React.useState(pin.verdictWhy);
  const [appendText, setAppendText] = React.useState('');
  const [input, setInput] = React.useState('');
  const [checkMode, setCheckMode] = React.useState(false);

  const updatePin = useUpdateLeapPin();
  const deletePin = useDeleteLeapPin();
  const appendPin = useAppendLeapPin();
  const createTask = useCreateLeapPinTask();

  const { data: history } = useListLeapPinMessages(token, pin.id);
  const { messages, streamContent, isStreaming, error, options, send } = useLeapChat({
    token,
    boardId: pin.boardId,
    pinId: pin.id,
    initialMessages: history,
  });

  const endRef = React.useRef<HTMLDivElement>(null);
  const scrollToEnd = () =>
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);
  React.useEffect(() => {
    if (streamContent) endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [streamContent]);

  React.useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  const blocked = () =>
    setNotice(
      isDemo
        ? 'Demo boards are read-only — start your own from the front door.'
        : "That didn't stick — try again.",
    );

  const openMode = (next: ManageMode) => {
    setNotice(null);
    if (next === 'edit') {
      setEditTitle(pin.title);
      setEditWhy(pin.verdictWhy);
    }
    setMode(m => (m === next ? 'none' : next));
  };

  const sendChat = (content: string) => {
    void send(content);
    scrollToEnd();
  };

  const handleComposer = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    if (checkMode) {
      if (createTask.isPending) return;
      setInput('');
      createTask.mutate(
        { token, pinId: pin.id, data: { label: text } },
        { onSuccess: invalidateBoard, onError: blocked },
      );
    } else {
      if (isStreaming) return;
      setInput('');
      sendChat(text);
    }
  };

  const saveEdit = () => {
    if (updatePin.isPending) return;
    updatePin.mutate(
      { token, pinId: pin.id, data: { title: editTitle.trim(), verdictWhy: editWhy.trim() } },
      {
        onSuccess: () => {
          invalidateBoard();
          setMode('none');
        },
        onError: blocked,
      },
    );
  };

  const submitAppend = (e: React.FormEvent) => {
    e.preventDefault();
    const text = appendText.trim();
    if (!text || appendPin.isPending) return;
    appendPin.mutate(
      { token, pinId: pin.id, data: { text } },
      {
        onSuccess: () => {
          invalidateBoard();
          setAppendText('');
          setMode('none');
        },
        onError: blocked,
      },
    );
  };

  const confirmDelete = () => {
    if (deletePin.isPending) return;
    deletePin.mutate(
      { token, pinId: pin.id },
      {
        onSuccess: () => {
          invalidateBoard();
          onBack();
        },
        onError: blocked,
      },
    );
  };

  return (
    <div className="fixed inset-0 bg-background z-[60] flex flex-col animate-in slide-in-from-bottom-4 duration-300">
      <div className="px-4 pt-6 pb-4 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="max-w-[640px] mx-auto">
          <Breadcrumb onHome={onHome} onBack={onBack} title={pin.title} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[640px] mx-auto p-5 sm:p-6 space-y-5 pb-10">
          {/* The pin itself */}
          <div className="bg-card border border-border rounded-[24px] p-5 shadow-sm">
            <Visualizer kind={pin.kind} data={pin.vizData} />
          </div>

          {/* Why it's on the board */}
          <div className="bg-card border border-border rounded-[24px] p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-3">
              <VerdictStamp verdict={pin.verdict} className="text-[10px] px-2 py-1" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {formatRecency(pin.lastTouchedAt)}
              </span>
            </div>
            <p className="text-foreground text-[16px] leading-relaxed font-medium">{pin.verdictWhy}</p>
            <div className="flex items-end gap-5 mt-4">
              <div>
                <div className="text-[10px] font-mono text-muted-foreground uppercase font-bold tracking-widest mb-1">Impact</div>
                <div className="font-sans font-bold text-[18px] text-foreground leading-none">{pin.impact}/10</div>
              </div>
              <div>
                <div className="text-[10px] font-mono text-muted-foreground uppercase font-bold tracking-widest mb-1">Difficulty</div>
                <div className="font-sans font-bold text-[18px] text-foreground leading-none">{pin.difficulty}/10</div>
              </div>
              {pin.verifyYourself && (
                <span className="ml-auto px-2.5 py-1 rounded-full bg-[#FFFBEB] text-[#D97706] text-[9px] font-mono font-bold uppercase tracking-widest">
                  Verify yourself
                </span>
              )}
            </div>
          </div>

          {/* Manage the pin */}
          <div className="flex flex-wrap gap-2">
            <button onClick={() => openMode('edit')} className={ACTION_BTN}>
              <Pencil className="w-3 h-3" /> Edit
            </button>
            <button onClick={() => openMode('append')} className={ACTION_BTN}>
              <Sparkles className="w-3 h-3" /> Add info
            </button>
            <button
              onClick={() => openMode('delete')}
              className={`${ACTION_BTN} hover:text-[#BE123C] hover:border-[#BE123C]/40`}
            >
              <Trash2 className="w-3 h-3" /> Delete
            </button>
          </div>

          {mode === 'edit' && (
            <div className="bg-card border border-border rounded-[20px] p-4 space-y-3">
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Name</label>
                <input
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  maxLength={80}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 font-sans text-[15px] outline-none focus:ring-2 focus:ring-[#10B981]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Why this verdict</label>
                <textarea
                  value={editWhy}
                  onChange={e => setEditWhy(e.target.value)}
                  maxLength={240}
                  rows={3}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 font-sans text-[15px] outline-none focus:ring-2 focus:ring-[#10B981] resize-none"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setMode('none')} className={ACTION_BTN}>Cancel</button>
                <button
                  onClick={saveEdit}
                  disabled={updatePin.isPending || !editTitle.trim() || !editWhy.trim()}
                  className="px-4 py-2 rounded-full bg-[#10B981] hover:bg-[#059669] text-white text-[11px] font-mono font-bold uppercase tracking-widest disabled:opacity-50 active:scale-95 transition-all"
                >
                  {updatePin.isPending ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          )}

          {mode === 'append' && (
            <form onSubmit={submitAppend} className="bg-card border border-border rounded-[20px] p-4 space-y-3">
              <p className="text-[13px] text-muted-foreground font-sans leading-relaxed">
                Tell it something new — a number, a call you made, a change of plan. The pin reworks itself around it.
              </p>
              <textarea
                value={appendText}
                onChange={e => setAppendText(e.target.value)}
                rows={2}
                placeholder="Got quoted $1,400 for the popcorn machine..."
                className="w-full bg-background border border-border rounded-xl px-4 py-3 font-sans text-[15px] outline-none focus:ring-2 focus:ring-[#10B981] resize-none"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!appendText.trim() || appendPin.isPending}
                  className="px-4 py-2 rounded-full bg-[#10B981] hover:bg-[#059669] text-white text-[11px] font-mono font-bold uppercase tracking-widest disabled:opacity-50 active:scale-95 transition-all"
                >
                  {appendPin.isPending ? 'Reworking the pin…' : 'Fold it in'}
                </button>
              </div>
            </form>
          )}

          {mode === 'delete' && (
            <div className="bg-[#FFF1F2] border border-[#FECDD3] rounded-[20px] p-4">
              <p className="text-[14px] font-sans font-medium text-[#9F1239] mb-3">
                Take this off the board? Its chat and checklist go with it.
              </p>
              <div className="flex justify-end gap-2">
                <button onClick={() => setMode('none')} className={ACTION_BTN}>Keep it</button>
                <button
                  onClick={confirmDelete}
                  disabled={deletePin.isPending}
                  className="px-4 py-2 rounded-full bg-[#BE123C] hover:bg-[#9F1239] text-white text-[11px] font-mono font-bold uppercase tracking-widest disabled:opacity-50 active:scale-95 transition-all"
                >
                  {deletePin.isPending ? 'Deleting…' : 'Delete pin'}
                </button>
              </div>
            </div>
          )}

          {/* Deeper detail, when the pin has it */}
          {detail?.blocks && (
            <div className="space-y-8 pt-2">
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
                return null;
              })}
            </div>
          )}

          <PinChecklist token={token} pin={pin} tasks={tasks} onBlocked={blocked} />

          {/* The pin talks back */}
          <div className="pt-2">
            <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Talk it out</h3>
            <div className="space-y-4">
              {messages.length === 0 && !isStreaming && (
                <div className="space-y-3">
                  <p className="text-muted-foreground text-sm">Poke at it — the board talks back.</p>
                  <ChoiceChips options={starterPrompts(pin)} onPick={sendChat} />
                </div>
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
              {!isStreaming && messages.length > 0 && options && (
                <ChoiceChips options={options} onPick={sendChat} className="pt-1" />
              )}
              {error && <p className="text-center text-[#BE123C] text-sm">{error}</p>}
              <div ref={endRef} />
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 bg-background border-t border-border">
        <div className="max-w-[640px] mx-auto">
          {notice && <p className="text-center text-[#BE123C] text-xs mb-2">{notice}</p>}
          <form onSubmit={handleComposer} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCheckMode(v => !v)}
              aria-pressed={checkMode}
              aria-label="Toggle checklist mode"
              title={checkMode ? 'Back to chat' : 'Add checklist items'}
              className={`w-[52px] h-[52px] shrink-0 rounded-full border flex items-center justify-center transition-colors ${
                checkMode
                  ? 'bg-[#10B981] border-[#10B981] text-white'
                  : 'bg-card border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              <ListTodo className="w-5 h-5" />
            </button>
            <div className="relative flex-1">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={checkMode ? 'Add a checklist item...' : 'Ask about this pin...'}
                disabled={checkMode ? createTask.isPending : isStreaming}
                className="w-full bg-card border border-border rounded-full py-4 pl-5 pr-14 outline-none focus:ring-2 focus:ring-[#10B981] font-sans text-[15px] placeholder:text-muted-foreground disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || (checkMode ? createTask.isPending : isStreaming)}
                className="absolute right-2 top-2 bottom-2 aspect-square bg-[#10B981] hover:bg-[#059669] text-white rounded-full flex items-center justify-center transition-colors disabled:opacity-50"
              >
                <Send className="w-5 h-5 ml-0.5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
