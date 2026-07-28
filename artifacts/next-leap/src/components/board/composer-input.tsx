import React from 'react';
import { Mic, Send, Square } from 'lucide-react';
import { useVoiceAnswer } from './use-voice-answer';

/**
 * The one place typing and talking live together.
 *
 * Used by the front door, the interview dock, and any text-shaped question. The
 * mic is an addition, never a mode: it only appears when the browser can do it
 * and permission hasn't been refused, and typing always works.
 */
export const ComposerInput = ({
  value,
  onChange,
  onSubmit,
  placeholder,
  disabled,
  token,
  autoFocus,
  rows = 1,
}: {
  value: string;
  onChange: (next: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  disabled?: boolean;
  /** Board token when there is one; the front door posts audio without it. */
  token?: string;
  autoFocus?: boolean;
  rows?: number;
}) => {
  const ref = React.useRef<HTMLTextAreaElement>(null);

  const voice = useVoiceAnswer({
    token,
    onTranscript: text => {
      // Editable, not auto-sent — see the note in use-voice-answer.
      onChange(value ? `${value} ${text}` : text);
      requestAnimationFrame(() => {
        const el = ref.current;
        if (!el) return;
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
      });
    },
  });

  // Grow with the content, up to four lines.
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 132)}px`;
  }, [value]);

  const showMic = voice.available;
  const recording = voice.status === 'recording';
  const busy = disabled || voice.status === 'transcribing';
  const seconds = Math.floor(voice.elapsedMs / 1000);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || !value.trim()) return;
    onSubmit();
  };

  return (
    <div>
      <form onSubmit={submit} className="relative">
        <textarea
          ref={ref}
          rows={rows}
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (!busy && value.trim()) onSubmit();
            }
          }}
          placeholder={
            recording
              ? 'Listening…'
              : voice.status === 'transcribing'
                ? 'Writing that down…'
                : placeholder
          }
          disabled={busy}
          autoFocus={autoFocus}
          className={`w-full resize-none bg-card shadow-lg border border-border rounded-[24px] py-3.5 pl-5 outline-none focus:ring-2 focus:ring-[#10B981] font-sans text-[15px] placeholder:text-muted-foreground disabled:opacity-60 ${
            showMic ? 'pr-24' : 'pr-14'
          }`}
        />

        <div className="absolute right-2 bottom-2 flex items-center gap-1.5">
          {showMic && (
            <button
              type="button"
              onClick={voice.toggle}
              disabled={disabled}
              aria-label={recording ? 'Stop recording' : 'Answer out loud'}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors disabled:opacity-40 ${
                recording
                  ? 'bg-[#BE123C] text-white'
                  : 'border border-border bg-card text-muted-foreground hover:text-foreground'
              }`}
            >
              {recording ? <Square className="w-4 h-4" /> : <Mic className="w-4.5 h-4.5" />}
            </button>
          )}
          <button
            type="submit"
            disabled={busy || !value.trim()}
            aria-label="Send"
            className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center transition-colors disabled:opacity-30"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>

      {recording && (
        <div className="mt-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-[#BE123C] font-bold">
          <span className="flex items-end gap-[2px] h-3">
            {[0, 1, 2].map(i => (
              <span
                key={i}
                className="w-[3px] bg-[#BE123C] animate-pulse rounded-full"
                style={{ height: `${6 + i * 3}px`, animationDelay: `${i * 120}ms` }}
              />
            ))}
          </span>
          {String(Math.floor(seconds / 60))}:{String(seconds % 60).padStart(2, '0')}
        </div>
      )}

      {voice.message && !recording && (
        <div className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
          {voice.message}
        </div>
      )}
    </div>
  );
};
