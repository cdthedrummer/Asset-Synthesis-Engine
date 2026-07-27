/**
 * The chat protocol lets the model end a reply with trailing marker lines —
 * `ACTIONS: [...]` (board edits to apply) and/or `OPTIONS: [...]` (tap chips).
 * These helpers keep markers from ever reaching the user as prose:
 *
 * - `createMarkerLineFilter` streams prose through while holding back anything
 *   that could still turn out to be a trailing marker: completed lines that
 *   start with a marker prefix, and the current partial line while it is still
 *   a prefix-compatible fragment. Holding only the *unterminated* tail is not
 *   enough — models frequently end a marker with a newline, which would flush
 *   the raw marker to the client.
 * - `stripTrailingMarkerLines` cleans the persisted message even when the
 *   model misbehaves (duplicate markers, whitespace after them).
 */

export interface MarkerFilter {
  /** Append a model chunk; returns the text now safe to stream out. */
  push(chunk: string): string;
  /**
   * Stream ended. `rest` is leftover prose to flush; `markers` maps each
   * prefix to the raw text after it (last occurrence wins per prefix).
   */
  finish(): { rest: string; markers: Record<string, string> };
}

export function createMarkerLineFilter(prefixes: string[]): MarkerFilter {
  let partial = ""; // current line — no newline seen yet
  let heldLines: string[] = []; // completed trailing lines classified as markers (may include blanks between them)

  const markerPrefixOf = (line: string): string | null =>
    prefixes.find((p) => line.trim().startsWith(p)) ?? null;
  // A fragment that is still a prefix of some marker (or all whitespace)
  // cannot be flushed yet — the next chunk may complete the marker.
  const couldBecomeMarker = (fragment: string): boolean => {
    const t = fragment.trimStart();
    return prefixes.some((p) => p.startsWith(t) || t.startsWith(p));
  };

  return {
    push(chunk: string): string {
      let out = "";
      const parts = (partial + chunk).split("\n");
      partial = parts.pop()!;
      for (const line of parts) {
        if (markerPrefixOf(line)) {
          heldLines.push(line);
          continue;
        }
        if (heldLines.length > 0) {
          if (line.trim() === "") {
            // Blank line inside a trailing marker run stays held.
            heldLines.push(line);
            continue;
          }
          // Prose after a "marker": it wasn't trailing after all — release
          // everything held as ordinary prose, in order.
          out += heldLines.join("\n") + "\n";
          heldLines = [];
        }
        out += line + "\n";
      }
      // Flush the partial line early once it provably isn't a marker and no
      // marker run is pending beneath it.
      if (heldLines.length === 0 && partial && !couldBecomeMarker(partial)) {
        out += partial;
        partial = "";
      }
      return out;
    },

    finish(): { rest: string; markers: Record<string, string> } {
      if (partial) {
        heldLines.push(partial);
        partial = "";
      }
      const markers: Record<string, string> = {};
      const leftover: string[] = [];
      for (const line of heldLines) {
        const p = markerPrefixOf(line);
        if (p) markers[p] = line.trim().slice(p.length).trim();
        else if (line.trim() !== "") leftover.push(line);
      }
      heldLines = [];
      return { rest: leftover.join("\n"), markers };
    },
  };
}

/** Drop trailing marker lines (and trailing blank lines) from text. */
export function stripTrailingMarkerLines(
  text: string,
  prefixes: string[],
): string {
  const lines = text.split("\n");
  while (lines.length > 0) {
    const last = lines[lines.length - 1]!.trim();
    if (last !== "" && !prefixes.some((p) => last.startsWith(p))) break;
    lines.pop();
  }
  return lines.join("\n");
}
