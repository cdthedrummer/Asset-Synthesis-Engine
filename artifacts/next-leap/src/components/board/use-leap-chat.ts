import React from 'react';
import { NlMessage } from '@workspace/api-client-react';

/**
 * Shared chat state + SSE streaming for pin "argue" chats and move rep sessions.
 * Callers load history with the matching generated query hook and pass it in.
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
  const loadedRef = React.useRef(false);

  React.useEffect(() => {
    if (initialMessages && !loadedRef.current) {
      loadedRef.current = true;
      // Never clobber messages the user already sent while history was loading.
      setMessages(prev => (prev.length === 0 ? initialMessages : [...initialMessages, ...prev]));
    }
  }, [initialMessages]);

  const send = async (content: string) => {
    if (!content.trim() || isStreaming) return;
    setError(null);
    setIsStreaming(true);
    setStreamContent('');
    setMessages(prev => [
      ...prev,
      { id: Date.now(), role: 'user', content, boardId, pinId: pinId ?? null, moveId: moveId ?? null, createdAt: new Date().toISOString() } as NlMessage,
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

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        buffer += decoder.decode(value ?? new Uint8Array(), { stream: !readerDone });

        const events = buffer.split('\n\n');
        buffer = events.pop() ?? '';

        for (const event of events) {
          for (const line of event.split('\n')) {
            if (!line.startsWith('data: ')) continue;
            let data: { done?: boolean; content?: string; error?: string };
            try {
              data = JSON.parse(line.slice(6));
            } catch {
              continue;
            }
            if (data.error) {
              streamError = data.error;
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

      if (acc.trim()) {
        setMessages(prev => [
          ...prev,
          { id: Date.now() + 1, role: 'assistant', content: acc, boardId, pinId: pinId ?? null, moveId: moveId ?? null, createdAt: new Date().toISOString() } as NlMessage,
        ]);
      }
      if (streamError) {
        setError(streamError);
      } else if (!acc.trim()) {
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

  return { messages, streamContent, isStreaming, error, send };
}
