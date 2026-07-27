import React from 'react';
import { NlMessage } from '@workspace/api-client-react';

/**
 * Shared chat state + SSE streaming for pin threads and move rep sessions.
 * Callers load history with the matching generated query hook and pass it in.
 * `options` carries tap-to-answer chips for the latest assistant turn.
 */
export function useLeapChat({
  token,
  boardId,
  pinId,
  moveId,
  initialMessages,
}: {
  token: string;
  boardId: number;
  pinId?: number;
  moveId?: number;
  initialMessages?: NlMessage[];
}) {
  const [messages, setMessages] = React.useState<NlMessage[]>([]);
  const [streamContent, setStreamContent] = React.useState('');
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [options, setOptions] = React.useState<string[] | null>(null);
  const loadedRef = React.useRef(false);

  React.useEffect(() => {
    if (initialMessages && !loadedRef.current) {
      loadedRef.current = true;
      // Never clobber messages the user already sent while history was loading.
      setMessages(prev => {
        if (prev.length === 0) {
          const last = initialMessages[initialMessages.length - 1];
          if (last?.role === 'assistant' && last.options?.length) {
            setOptions(last.options);
          }
          return initialMessages;
        }
        return [...initialMessages, ...prev];
      });
    }
  }, [initialMessages]);

  const send = async (content: string) => {
    if (!content.trim() || isStreaming) return;
    setError(null);
    setIsStreaming(true);
    setStreamContent('');
    setOptions(null);
    setMessages(prev => [
      ...prev,
      { id: Date.now(), role: 'user', content, boardId, pinId: pinId ?? null, moveId: moveId ?? null, options: null, createdAt: new Date().toISOString() } as unknown as NlMessage,
    ]);

    try {
      const response = await fetch(`/api/nextleap/boards/${token}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, ...(pinId ? { pinId } : {}), ...(moveId ? { moveId } : {}) }),
      });

      if (!response.ok || !response.body) throw new Error(`Chat failed (${response.status})`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let done = false;
      let acc = '';
      let streamError: string | null = null;
      let streamOptions: string[] | null = null;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        buffer += decoder.decode(value ?? new Uint8Array(), { stream: !readerDone });

        const events = buffer.split('\n\n');
        buffer = events.pop() ?? '';

        for (const event of events) {
          for (const line of event.split('\n')) {
            if (!line.startsWith('data: ')) continue;
            let data: { done?: boolean; content?: string; error?: string; options?: string[] };
            try {
              data = JSON.parse(line.slice(6));
            } catch {
              continue;
            }
            if (data.error) {
              streamError = data.error;
            }
            if (Array.isArray(data.options) && data.options.length > 0) {
              streamOptions = data.options;
            }
            if (data.done) {
              done = true;
            } else if (data.content) {
              acc += data.content;
              setStreamContent(acc);
            }
          }
        }
      }

      const finalContent = acc.replace(/\s+$/, '');
      if (finalContent) {
        setMessages(prev => [
          ...prev,
          { id: Date.now() + 1, role: 'assistant', content: finalContent, boardId, pinId: pinId ?? null, moveId: moveId ?? null, options: streamOptions, createdAt: new Date().toISOString() } as unknown as NlMessage,
        ]);
      }
      if (streamOptions) setOptions(streamOptions);
      if (streamError) {
        setError(streamError);
      } else if (!finalContent) {
        setError('No answer came back — try again.');
      }
    } catch (err) {
      console.error(err);
      setError("Couldn't reach the other side of the conversation — try again.");
    } finally {
      setIsStreaming(false);
      setStreamContent('');
    }
  };

  return { messages, streamContent, isStreaming, error, options, send };
}
