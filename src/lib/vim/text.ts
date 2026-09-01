import type { Position, Range } from "./types";

export const KEYWORD = /[A-Za-z0-9_]/;

export const isBlank = (c: string) => c === " " || c === "\t" || c === undefined;
export const isKeyword = (c: string) => !!c && KEYWORD.test(c);
export const isPunct = (c: string) => !!c && !KEYWORD.test(c) && !isBlank(c);

export const charClass = (c: string): 0 | 1 | 2 =>
  isBlank(c) ? 0 : isKeyword(c) ? 1 : 2;

export const toText = (lines: string[]) => lines.join("\n");
export const toLines = (text: string) => text.split("\n");

export const clone = (p: Position): Position => ({ x: p.x, y: p.y });

export const samePos = (a: Position, b: Position) => a.x === b.x && a.y === b.y;

export function comparePos(a: Position, b: Position): number {
  if (a.y !== b.y) return a.y - b.y;
  return a.x - b.x;
}

export function sortRange(a: Position, b: Position): [Position, Position] {
  return comparePos(a, b) <= 0 ? [a, b] : [b, a];
}

/** Last legal column in normal mode — Vim parks on the final character. */
export function lastCol(line: string, mode: "normal" | "insert"): number {
  if (mode === "insert") return line.length;
  return Math.max(0, line.length - 1);
}

export function clampCursor(
  lines: string[],
  cursor: Position,
  mode: "normal" | "insert",
): Position {
  const y = Math.max(0, Math.min(lines.length - 1, cursor.y));
  const x = Math.max(0, Math.min(lastCol(lines[y] ?? "", mode), cursor.x));
  return { x, y };
}

/* ------------------------------------------------------------------ */
/* Flat offsets — ranges are far easier to reason about as offsets      */
/* ------------------------------------------------------------------ */

export function posToOffset(lines: string[], p: Position): number {
  let off = 0;
  for (let i = 0; i < p.y; i++) off += lines[i].length + 1;
  return off + p.x;
}

export function offsetToPos(lines: string[], off: number): Position {
  let remaining = off;
  for (let y = 0; y < lines.length; y++) {
    const len = lines[y].length;
    if (remaining <= len) return { x: remaining, y };
    remaining -= len + 1;
  }
  const y = lines.length - 1;
  return { x: lines[y].length, y };
}

/** Character at a position, or "" past the end of a line. */
export function charAt(lines: string[], p: Position): string {
  return (lines[p.y] ?? "")[p.x] ?? "";
}

/** Step one character forward across line boundaries. */
export function nextPos(lines: string[], p: Position): Position | null {
  if (p.x < (lines[p.y] ?? "").length - 1) return { x: p.x + 1, y: p.y };
  if (p.y < lines.length - 1) return { x: 0, y: p.y + 1 };
  return null;
}

export function prevPos(lines: string[], p: Position): Position | null {
  if (p.x > 0) return { x: p.x - 1, y: p.y };
  if (p.y > 0) return { x: Math.max(0, lines[p.y - 1].length - 1), y: p.y - 1 };
  return null;
}

/* ------------------------------------------------------------------ */
/* Word motions                                                        */
/* ------------------------------------------------------------------ */

/** `w` / `W` — start of the next word. */
export function wordForward(
  lines: string[],
  from: Position,
  big: boolean,
): Position {
  let p: Position | null = clone(from);
  const startClass = big
    ? charClass(charAt(lines, p)) === 0
      ? 0
      : 1
    : charClass(charAt(lines, p));

  // step off the current word
  while (p) {
    const next = nextPos(lines, p);
    if (!next) return p;
    // an empty line is a word on its own
    if (next.y !== p.y && (lines[next.y] ?? "").length === 0) return next;
    p = next;
    const cls = big
      ? charClass(charAt(lines, p)) === 0
        ? 0
        : 1
      : charClass(charAt(lines, p));
    if (cls !== startClass || cls === 0) break;
  }
  // skip whitespace
  while (p && charClass(charAt(lines, p)) === 0) {
    if ((lines[p.y] ?? "").length === 0) return p;
    const next = nextPos(lines, p);
    if (!next) return p;
    p = next;
  }
  return p ?? clone(from);
}

/** `e` / `E` — end of the current or next word. */
export function wordEnd(
  lines: string[],
  from: Position,
  big: boolean,
): Position {
  let p = nextPos(lines, from);
  if (!p) return clone(from);
  while (charClass(charAt(lines, p)) === 0) {
    const next = nextPos(lines, p);
    if (!next) return p;
    p = next;
  }
  const cls = big ? 1 : charClass(charAt(lines, p));
  for (;;) {
    const next = nextPos(lines, p);
    if (!next || next.y !== p.y) break;
    const nc = big
      ? charClass(charAt(lines, next)) === 0
        ? 0
        : 1
      : charClass(charAt(lines, next));
    if (nc !== cls) break;
    p = next;
  }
  return p;
}

/** `b` / `B` — start of the current or previous word. */
export function wordBack(
  lines: string[],
  from: Position,
  big: boolean,
): Position {
  let p = prevPos(lines, from);
  if (!p) return clone(from);
  while (charClass(charAt(lines, p)) === 0) {
    if ((lines[p.y] ?? "").length === 0) return p;
    const prev = prevPos(lines, p);
    if (!prev) return p;
    p = prev;
  }
  const cls = big ? 1 : charClass(charAt(lines, p));
  for (;;) {
    const prev = prevPos(lines, p);
    if (!prev || prev.y !== p.y) break;
    const pc = big
      ? charClass(charAt(lines, prev)) === 0
        ? 0
        : 1
      : charClass(charAt(lines, prev));
    if (pc !== cls) break;
    p = prev;
  }
  return p;
}

/* ------------------------------------------------------------------ */
/* Line motions                                                        */
/* ------------------------------------------------------------------ */

export function firstNonBlank(line: string): number {
  const i = line.search(/\S/);
  return i === -1 ? 0 : i;
}

export function paragraphForward(lines: string[], from: Position): Position {
  let y = from.y + 1;
  while (y < lines.length && lines[y].trim() !== "") y++;
  return { x: 0, y: Math.min(y, lines.length - 1) };
}

export function paragraphBack(lines: string[], from: Position): Position {
  let y = from.y - 1;
  while (y > 0 && lines[y].trim() !== "") y--;
  return { x: 0, y: Math.max(y, 0) };
}

/* ------------------------------------------------------------------ */
/* Find / till                                                         */
/* ------------------------------------------------------------------ */

export function findChar(
  line: string,
  from: number,
  char: string,
  kind: "f" | "F" | "t" | "T",
): number | null {
  if (kind === "f" || kind === "t") {
    const start = kind === "t" ? from + 2 : from + 1;
    const i = line.indexOf(char, Math.min(start, line.length));
    if (i === -1) return null;
    return kind === "t" ? i - 1 : i;
  }
  const start = kind === "T" ? from - 2 : from - 1;
  const i = line.lastIndexOf(char, Math.max(start, -1));
  if (i === -1) return null;
  return kind === "T" ? i + 1 : i;
}

/* ------------------------------------------------------------------ */
/* Text objects                                                        */
/* ------------------------------------------------------------------ */

const PAIRS: Record<string, [string, string]> = {
  "(": ["(", ")"],
  ")": ["(", ")"],
  b: ["(", ")"],
  "[": ["[", "]"],
  "]": ["[", "]"],
  "{": ["{", "}"],
  "}": ["{", "}"],
  B: ["{", "}"],
  "<": ["<", ">"],
  ">": ["<", ">"],
};

/** `i{` / `a{` and friends — searches outward from the cursor. */
export function bracketObject(
  lines: string[],
  cursor: Position,
  key: string,
  around: boolean,
): Range | null {
  const pair = PAIRS[key];
  if (!pair) return null;
  const [open, close] = pair;
  const text = toText(lines);
  const at = posToOffset(lines, cursor);

  let openIdx = -1;
  let depth = 0;
  for (let i = at; i >= 0; i--) {
    if (text[i] === close && i !== at) depth++;
    else if (text[i] === open) {
      if (depth === 0) {
        openIdx = i;
        break;
      }
      depth--;
    }
  }
  if (openIdx === -1) return null;

  let closeIdx = -1;
  depth = 0;
  for (let i = openIdx + 1; i < text.length; i++) {
    if (text[i] === open) depth++;
    else if (text[i] === close) {
      if (depth === 0) {
        closeIdx = i;
        break;
      }
      depth--;
    }
  }
  if (closeIdx === -1) return null;

  if (!around) {
    // Vim's rule: when the braces sit on their own lines, `i{` is the block of
    // lines between them, not a character range that would join them together.
    const innerStart = openIdx + 1;
    const tailStart = text.lastIndexOf("\n", closeIdx - 1) + 1;
    const tailIsBlank = text.slice(tailStart, closeIdx).trim() === "";
    if (text[innerStart] === "\n" && tailIsBlank && tailStart <= closeIdx) {
      const openLine = offsetToPos(lines, openIdx).y;
      const closeLine = offsetToPos(lines, closeIdx).y;
      if (closeLine - openLine < 2) return null; // nothing between the braces
      return {
        start: { x: 0, y: openLine + 1 },
        end: { x: (lines[closeLine - 1] ?? "").length, y: closeLine - 1 },
        linewise: true,
      };
    }
  }

  const s = around ? openIdx : openIdx + 1;
  const e = around ? closeIdx + 1 : closeIdx;
  return {
    start: offsetToPos(lines, s),
    end: offsetToPos(lines, e),
    linewise: false,
  };
}

/** `i"` / `a"` — quotes only match inside one line, as in Vim. */
export function quoteObject(
  lines: string[],
  cursor: Position,
  quote: string,
  around: boolean,
): Range | null {
  const line = lines[cursor.y] ?? "";
  const positions: number[] = [];
  for (let i = 0; i < line.length; i++) {
    if (line[i] === quote && line[i - 1] !== "\\") positions.push(i);
  }
  for (let i = 0; i + 1 < positions.length; i += 2) {
    const open = positions[i];
    const close = positions[i + 1];
    if (cursor.x <= close) {
      const s = around ? open : open + 1;
      const e = around ? close + 1 : close;
      return {
        start: { x: s, y: cursor.y },
        end: { x: e, y: cursor.y },
        linewise: false,
      };
    }
  }
  return null;
}

/** `iw` / `aw` — `aw` swallows the trailing whitespace. */
export function wordObject(
  lines: string[],
  cursor: Position,
  big: boolean,
  around: boolean,
): Range | null {
  const line = lines[cursor.y] ?? "";
  if (!line.length) return null;
  const cls = (i: number) =>
    big ? (charClass(line[i]) === 0 ? 0 : 1) : charClass(line[i]);

  const here = cls(cursor.x);
  let s = cursor.x;
  let e = cursor.x;
  while (s > 0 && cls(s - 1) === here) s--;
  while (e < line.length - 1 && cls(e + 1) === here) e++;
  let end = e + 1;
  if (around) {
    let after = end;
    while (after < line.length && charClass(line[after]) === 0) after++;
    if (after > end) end = after;
    else while (s > 0 && charClass(line[s - 1]) === 0) s--;
  }
  return {
    start: { x: s, y: cursor.y },
    end: { x: end, y: cursor.y },
    linewise: false,
  };
}

/** `ip` / `ap` — paragraphs are linewise. */
export function paragraphObject(
  lines: string[],
  cursor: Position,
  around: boolean,
): Range | null {
  const blank = (y: number) => (lines[y] ?? "").trim() === "";
  if (blank(cursor.y)) return null;
  let top = cursor.y;
  let bottom = cursor.y;
  while (top > 0 && !blank(top - 1)) top--;
  while (bottom < lines.length - 1 && !blank(bottom + 1)) bottom++;
  if (around) {
    while (bottom < lines.length - 1 && blank(bottom + 1)) bottom++;
  }
  return {
    start: { x: 0, y: top },
    end: { x: (lines[bottom] ?? "").length, y: bottom },
    linewise: true,
  };
}

/* ------------------------------------------------------------------ */
/* Range editing                                                       */
/* ------------------------------------------------------------------ */

export function textInRange(lines: string[], range: Range): string {
  if (range.linewise) {
    return lines.slice(range.start.y, range.end.y + 1).join("\n");
  }
  const text = toText(lines);
  return text.slice(posToOffset(lines, range.start), posToOffset(lines, range.end));
}

export function deleteRange(
  lines: string[],
  range: Range,
): { lines: string[]; cursor: Position } {
  if (range.linewise) {
    const next = [...lines];
    next.splice(range.start.y, range.end.y - range.start.y + 1);
    if (!next.length) next.push("");
    const y = Math.min(range.start.y, next.length - 1);
    return { lines: next, cursor: { x: firstNonBlank(next[y]), y } };
  }
  const text = toText(lines);
  const s = posToOffset(lines, range.start);
  const e = posToOffset(lines, range.end);
  const nextLines = toLines(text.slice(0, s) + text.slice(e));
  return { lines: nextLines, cursor: offsetToPos(nextLines, s) };
}

export function insertAt(
  lines: string[],
  at: Position,
  insert: string,
): { lines: string[]; cursor: Position } {
  const text = toText(lines);
  const off = posToOffset(lines, at);
  const nextText = text.slice(0, off) + insert + text.slice(off);
  const nextLines = toLines(nextText);
  return { lines: nextLines, cursor: offsetToPos(nextLines, off + insert.length) };
}

/** Every cell covered by a range — used to paint goal highlights. */
export function rangeCells(
  lines: string[],
  range: Range,
): Array<{ y: number; from: number; to: number }> {
  const out: Array<{ y: number; from: number; to: number }> = [];
  if (range.linewise) {
    for (let y = range.start.y; y <= range.end.y; y++) {
      out.push({ y, from: 0, to: Math.max((lines[y] ?? "").length, 1) });
    }
    return out;
  }
  for (let y = range.start.y; y <= range.end.y; y++) {
    const from = y === range.start.y ? range.start.x : 0;
    const to = y === range.end.y ? range.end.x : (lines[y] ?? "").length;
    if (to > from) out.push({ y, from, to });
  }
  return out;
}
