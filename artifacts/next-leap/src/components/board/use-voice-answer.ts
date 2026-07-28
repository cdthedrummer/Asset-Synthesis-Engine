import React from 'react';
import { useVoiceRecorder } from '@workspace/integrations-openai-ai-react/audio';

/**
 * Talking instead of typing.
 *
 * The transcript lands in the text box as editable text rather than sending
 * itself. That's deliberate: transcription mangles names and numbers, and this
 * interview exists to harvest numbers — a wrong figure auto-sent becomes a pin,
 * and VIZ_SPEC is explicit that a pin with invented data is worse than no pin.
 * One extra tap is the right price.
 *
 * Typing is always available, so this is purely an addition. If the browser
 * can't do it, or permission is refused, the mic disappears — it never becomes
 * a mode the owner can get stuck in.
 */

const MAX_BLOB_BYTES = 6 * 1024 * 1024;
/** A forgotten recording must never upload minutes of audio. */
const AUTO_STOP_MS = 60_000;

export type VoiceStatus = 'unsupported' | 'idle' | 'recording' | 'transcribing' | 'error';

export function useVoiceAnswer({
  token,
  onTranscript,
}: {
  /** Omit on the front door — question one is asked before a board exists. */
  token?: string;
  onTranscript: (text: string) => void;
}) {
  const supported =
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== 'undefined';

  const { startRecording, stopRecording } = useVoiceRecorder();
  const [status, setStatus] = React.useState<VoiceStatus>(
    supported ? 'idle' : 'unsupported',
  );
  const [message, setMessage] = React.useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = React.useState(0);
  // A refused mic stays refused for the session rather than nagging.
  const [blocked, setBlocked] = React.useState(false);
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStopRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = React.useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (autoStopRef.current) clearTimeout(autoStopRef.current);
    timerRef.current = null;
    autoStopRef.current = null;
  }, []);

  React.useEffect(() => clearTimers, [clearTimers]);

  const stop = React.useCallback(async () => {
    clearTimers();
    setElapsedMs(0);
    let blob: Blob;
    try {
      blob = await stopRecording();
    } catch {
      setStatus('idle');
      return;
    }
    if (blob.size < 1024) {
      setStatus('idle');
      setMessage("Didn't catch that — hold it a beat longer.");
      return;
    }
    if (blob.size > MAX_BLOB_BYTES) {
      setStatus('idle');
      setMessage('That was a long one. Try again, shorter.');
      return;
    }

    setStatus('transcribing');
    setMessage(null);
    try {
      // Plain fetch rather than the generated hook: a binary body is simpler to
      // hand-roll than to route through the shared mutator, same precedent as
      // the SSE chat stream in use-leap-chat.
      const url = token
        ? `/api/nextleap/boards/${token}/transcriptions`
        : '/api/nextleap/transcriptions';
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': blob.type || 'application/octet-stream' },
        body: blob,
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { text?: string };
      const text = (data.text ?? '').trim();
      if (!text) {
        setMessage("Couldn't make that out. Type it instead.");
      } else {
        onTranscript(text);
      }
      setStatus('idle');
    } catch {
      setStatus('idle');
      setMessage("Couldn't make that out. Type it instead.");
    }
  }, [clearTimers, onTranscript, stopRecording, token]);

  const start = React.useCallback(async () => {
    if (!supported || blocked) return;
    setMessage(null);
    try {
      await startRecording();
    } catch (err) {
      const name = (err as { name?: string } | null)?.name;
      if (name === 'NotAllowedError' || name === 'NotFoundError') {
        setBlocked(true);
        setStatus('unsupported');
        setMessage('No mic access. Type it instead.');
      } else {
        setStatus('error');
        setMessage("Mic didn't start. Type it instead.");
      }
      return;
    }
    setStatus('recording');
    setElapsedMs(0);
    const startedAt = Date.now();
    timerRef.current = setInterval(() => setElapsedMs(Date.now() - startedAt), 200);
    autoStopRef.current = setTimeout(() => void stop(), AUTO_STOP_MS);
  }, [blocked, startRecording, stop, supported]);

  const toggle = React.useCallback(() => {
    // Tap to start, tap to stop. Press-and-hold fights the scroll container on
    // mobile web.
    if (status === 'recording') void stop();
    else void start();
  }, [start, status, stop]);

  return {
    /** Hide the mic entirely when this is false — never show a dead control. */
    available: supported && !blocked,
    status,
    message,
    elapsedMs,
    toggle,
  };
}