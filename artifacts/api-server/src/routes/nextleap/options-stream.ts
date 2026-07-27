/**
 * The pin/move chat protocol lets the model end a reply with one final line
 * `OPTIONS: ["...", "..."]` that becomes tap chips instead of prose. These
 * helpers keep that marker from ever reaching the user as text:
 *
 * - `createOptionsLineFilter` withholds the last non-empty line of the stream
 *   (plus any trailing whitespace) until either more text follows it — proving
 *   it was ordinary prose — or the stream ends, at which point `finish()`
 *   inspects it for the marker. Holding only the *unterminated* tail is not
 *   enough: models frequently end `OPTIONS: [...]` with a newline, which would
 *   flush the raw marker to the client.
 * - `stripTrailingOptionsLines` cleans the persisted message even when the
 *   model misbehaves (two OPTIONS lines in a row, whitespace after the marker).
 */

/** Matches the start of the last line that contains any non-whitespace. */
const LAST_NONEMPTY_LINE = /\n[^\n]*\S[^\n]*\s*$/;

export function createOptionsLineFilter() {
  let buffer = "";
  return {
    /** Append a model chunk; returns the prefix now safe to stream out. */
    push(chunk: string): string {
      buffer += chunk;
      const match = buffer.match(LAST_NONEMPTY_LINE);
      // Hold from the start of the last non-empty line; if the buffer has no
      // completed non-empty line before the end, hold everything.
      const holdStart = match?.index !== undefined ? match.index + 1 : 0;
      const safe = buffer.slice(0, holdStart);
      buffer = buffer.slice(holdStart);
      return safe;
    },
    /**
     * Stream ended. Returns leftover prose to flush (empty if the held text
     * was an OPTIONS marker) and the raw JSON text after `OPTIONS:`, or null
     * when the reply had no marker.
     */
    finish(): { rest: string; optionsJson: string | null } {
      const held = buffer;
      buffer = "";
      const line = held.trim();
      if (line.startsWith("OPTIONS:")) {
        return { rest: "", optionsJson: line.slice("OPTIONS:".length).trim() };
      }
      return { rest: held, optionsJson: null };
    },
  };
}

/** Drop trailing OPTIONS marker lines (and trailing blank lines) from text. */
export function stripTrailingOptionsLines(text: string): string {
  const lines = text.split("\n");
  while (lines.length > 0) {
    const last = lines[lines.length - 1]!.trim();
    if (last !== "" && !last.startsWith("OPTIONS:")) break;
    lines.pop();
  }
  return lines.join("\n");
}
