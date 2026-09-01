import type {
  GameConfig,
  Mode,
  Operator,
  Position,
  Range,
  VimState,
} from "./types";
import {
  charAt,
  clampCursor,
  clone,
  bracketObject,
  deleteRange,
  findChar,
  firstNonBlank,
  insertAt,
  lastCol,
  paragraphBack,
  paragraphForward,
  paragraphObject,
  quoteObject,
  sortRange,
  textInRange,
  toText,
  wordBack,
  wordEnd,
  wordForward,
  wordObject,
} from "./text";

export const ESC = "<Esc>";
export const CR = "<CR>";
export const BS = "<BS>";
export const C_U = "<C-u>";
export const C_D = "<C-d>";

export const SCROLL_LINES = 8;

export function createState(lines: string[], cursor?: Position): VimState {
  return {
    lines: lines.length ? lines : [""],
    cursor: cursor ?? { x: 0, y: 0 },
    mode: "normal",
    visualAnchor: null,
    registers: {},
    pending: {
      count: "",
      opCount: "",
      operator: null,
      textObject: null,
      awaitingChar: null,
      awaitingG: false,
    },
    desiredX: cursor?.x ?? 0,
    lastSearch: null,
    searchInput: null,
    lastFind: null,
    history: [],
    keystrokes: [],
    callout: null,
  };
}

const clearPending = (s: VimState) => {
  s.pending = {
    count: "",
    opCount: "",
    operator: null,
    textObject: null,
    awaitingChar: null,
    awaitingG: false,
  };
};

const pushHistory = (s: VimState) => {
  s.history = [...s.history.slice(-49), { lines: [...s.lines], cursor: clone(s.cursor) }];
};

const say = (s: VimState, text: string, tone: "negative" | "positive" = "negative") => {
  s.callout = { id: Date.now() + Math.random(), text, tone };
};

const EDITING_KEYS = new Set([
  "d", "c", "y", "p", "P", "x", "s", "r", "i", "a", "I", "A", "o", "O", "u",
]);

/** Commands the emulator never needs to be taught. */
const ALWAYS_ALLOWED = new Set([ESC, CR, BS]);

function isAllowed(key: string, config: GameConfig): boolean {
  if (ALWAYS_ALLOWED.has(key)) return true;
  if (config.allowed.includes(key)) return true;
  // counts are unlocked with the pseudo-key "{n}"
  if (/^[1-9]$/.test(key) && config.allowed.includes("{n}")) return true;
  if (key === "0" && config.allowed.includes("{n}")) return true;
  return false;
}

/* ------------------------------------------------------------------ */
/* Motions                                                             */
/* ------------------------------------------------------------------ */

interface MotionResult {
  pos: Position;
  /** the character under the target is included in an operator's range */
  inclusive?: boolean;
  linewise?: boolean;
  /** motion is defined but this particular one had no target */
  failed?: boolean;
}

function resolveMotion(
  s: VimState,
  key: string,
  count: number,
  arg?: string,
): MotionResult | null {
  const { lines } = s;
  const line = lines[s.cursor.y] ?? "";
  const editMode: "normal" | "insert" = s.mode === "insert" ? "insert" : "normal";
  let pos = clone(s.cursor);

  switch (key) {
    case "h":
      return { pos: { x: Math.max(0, pos.x - count), y: pos.y } };
    case "l":
      return {
        pos: { x: Math.min(lastCol(line, editMode), pos.x + count), y: pos.y },
      };
    case "j": {
      const y = Math.min(lines.length - 1, pos.y + count);
      return {
        pos: { x: Math.min(s.desiredX, lastCol(lines[y] ?? "", editMode)), y },
        linewise: true,
      };
    }
    case "k": {
      const y = Math.max(0, pos.y - count);
      return {
        pos: { x: Math.min(s.desiredX, lastCol(lines[y] ?? "", editMode)), y },
        linewise: true,
      };
    }
    case "w":
    case "W":
      for (let i = 0; i < count; i++) pos = wordForward(lines, pos, key === "W");
      return { pos };
    case "e":
    case "E":
      for (let i = 0; i < count; i++) pos = wordEnd(lines, pos, key === "E");
      return { pos, inclusive: true };
    case "b":
    case "B":
      for (let i = 0; i < count; i++) pos = wordBack(lines, pos, key === "B");
      return { pos };
    case "0":
      return { pos: { x: 0, y: pos.y } };
    case "_":
    case "^":
      return { pos: { x: firstNonBlank(line), y: pos.y } };
    case "$":
      return { pos: { x: lastCol(line, editMode), y: pos.y }, inclusive: true };
    case "G": {
      const y = lines.length - 1;
      return { pos: { x: firstNonBlank(lines[y]), y }, linewise: true };
    }
    case "gg": {
      const y = Math.max(0, count - 1);
      return { pos: { x: firstNonBlank(lines[y] ?? ""), y }, linewise: true };
    }
    case "}":
      for (let i = 0; i < count; i++) pos = paragraphForward(lines, pos);
      return { pos };
    case "{":
      for (let i = 0; i < count; i++) pos = paragraphBack(lines, pos);
      return { pos };
    case C_D: {
      const y = Math.min(lines.length - 1, pos.y + SCROLL_LINES);
      return { pos: { x: Math.min(pos.x, lastCol(lines[y], editMode)), y } };
    }
    case C_U: {
      const y = Math.max(0, pos.y - SCROLL_LINES);
      return { pos: { x: Math.min(pos.x, lastCol(lines[y], editMode)), y } };
    }
    case "f":
    case "F":
    case "t":
    case "T": {
      if (!arg) return null;
      let x = pos.x;
      for (let i = 0; i < count; i++) {
        const found = findChar(line, x, arg, key);
        if (found === null) return { pos, failed: true };
        x = found;
      }
      return { pos: { x, y: pos.y }, inclusive: key === "f" || key === "t" };
    }
    case ";": {
      if (!s.lastFind) return { pos, failed: true };
      return resolveMotion(s, s.lastFind.kind, count, s.lastFind.char);
    }
    case "n":
    case "N": {
      if (!s.lastSearch) return { pos, failed: true };
      const forward = key === "n" ? s.lastSearch.forward : !s.lastSearch.forward;
      const found = searchFrom(lines, pos, s.lastSearch.term, forward);
      return found ? { pos: found } : { pos, failed: true };
    }
    default:
      return null;
  }
}

function searchFrom(
  lines: string[],
  from: Position,
  term: string,
  forward: boolean,
): Position | null {
  if (!term) return null;
  const total = lines.length;
  if (forward) {
    for (let i = 0; i <= total; i++) {
      const y = (from.y + i) % total;
      const startX = i === 0 ? from.x + 1 : 0;
      const idx = (lines[y] ?? "").indexOf(term, startX);
      if (idx !== -1) return { x: idx, y };
    }
  } else {
    for (let i = 0; i <= total; i++) {
      const y = (from.y - i + total * 2) % total;
      const line = lines[y] ?? "";
      const before = i === 0 ? from.x - 1 : line.length;
      const idx = line.lastIndexOf(term, Math.max(before, -1));
      if (idx !== -1) return { x: idx, y };
    }
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Operators                                                           */
/* ------------------------------------------------------------------ */

function rangeFromMotion(
  s: VimState,
  op: Operator,
  motionKey: string,
  m: MotionResult,
): Range {
  const [a, b] = sortRange(clone(s.cursor), clone(m.pos));
  if (m.linewise) {
    return { start: { x: 0, y: a.y }, end: { x: 0, y: b.y }, linewise: true };
  }
  const end = clone(b);
  if (m.inclusive) end.x += 1;
  // `cw` acts like `ce` — Vim's one famous inconsistency, and learners meet it early
  if (op === "c" && (motionKey === "w" || motionKey === "W")) {
    const e = wordEnd(s.lines, s.cursor, motionKey === "W");
    if (e.y === s.cursor.y) return { start: clone(s.cursor), end: { x: e.x + 1, y: e.y }, linewise: false };
  }
  // `dw` on the last word of a line stops at the line end rather than swallowing
  // the newline — otherwise every `dw` at the end of a line joins two lines
  if ((motionKey === "w" || motionKey === "W") && end.y > s.cursor.y) {
    return {
      start: a,
      end: { x: (s.lines[s.cursor.y] ?? "").length, y: s.cursor.y },
      linewise: false,
    };
  }
  return { start: a, end, linewise: false };
}

function applyOperator(s: VimState, op: Operator, range: Range): void {
  const text = textInRange(s.lines, range);
  s.registers['"'] = { text, linewise: range.linewise };
  if (op === "y") {
    s.cursor = clone(range.start);
    return;
  }
  pushHistory(s);
  if (op === "c" && range.linewise) {
    // `cc` clears the lines but keeps one to type on
    const next = [...s.lines];
    next.splice(range.start.y, range.end.y - range.start.y + 1, "");
    s.lines = next;
    s.cursor = { x: 0, y: range.start.y };
    s.mode = "insert";
    return;
  }
  const result = deleteRange(s.lines, range);
  s.lines = result.lines;
  s.cursor = result.cursor;
  if (op === "c") {
    s.mode = "insert";
    s.cursor = clone(range.linewise ? result.cursor : range.start);
  } else {
    s.cursor = clampCursor(s.lines, s.cursor, "normal");
  }
}

function resolveTextObject(
  s: VimState,
  around: boolean,
  key: string,
): Range | null {
  if (key === "w") return wordObject(s.lines, s.cursor, false, around);
  if (key === "W") return wordObject(s.lines, s.cursor, true, around);
  if (key === "p") return paragraphObject(s.lines, s.cursor, around);
  if (key === '"' || key === "'" || key === "`")
    return quoteObject(s.lines, s.cursor, key, around);
  return bracketObject(s.lines, s.cursor, key, around);
}

/* ------------------------------------------------------------------ */
/* The reducer                                                         */
/* ------------------------------------------------------------------ */

export function applyKey(
  prev: VimState,
  key: string,
  config: GameConfig,
): VimState {
  const s: VimState = {
    ...prev,
    lines: [...prev.lines],
    cursor: clone(prev.cursor),
    pending: { ...prev.pending },
    registers: { ...prev.registers },
    callout: null,
    keystrokes: [...prev.keystrokes, key],
  };

  /* ---------- search command line ---------- */
  if (s.searchInput) {
    if (key === ESC) {
      s.searchInput = null;
      return s;
    }
    if (key === CR) {
      const { term, forward } = s.searchInput;
      s.searchInput = null;
      if (term) {
        s.lastSearch = { term, forward };
        const found = searchFrom(s.lines, s.cursor, term, forward);
        if (found) s.cursor = found;
        else say(s, `Pattern not found: ${term}`);
      }
      return s;
    }
    if (key === BS) {
      s.searchInput = { ...s.searchInput, term: s.searchInput.term.slice(0, -1) };
      return s;
    }
    if (key.length === 1) {
      s.searchInput = { ...s.searchInput, term: s.searchInput.term + key };
    }
    return s;
  }

  /* ---------- insert mode ---------- */
  if (s.mode === "insert") {
    if (key === ESC) {
      s.mode = "normal";
      s.cursor = clampCursor(s.lines, { x: s.cursor.x - 1, y: s.cursor.y }, "normal");
      s.desiredX = s.cursor.x;
      return s;
    }
    if (key === BS) {
      if (s.cursor.x > 0) {
        const line = s.lines[s.cursor.y];
        s.lines[s.cursor.y] = line.slice(0, s.cursor.x - 1) + line.slice(s.cursor.x);
        s.cursor = { x: s.cursor.x - 1, y: s.cursor.y };
      } else if (s.cursor.y > 0) {
        const above = s.lines[s.cursor.y - 1];
        const merged = above + s.lines[s.cursor.y];
        s.lines.splice(s.cursor.y - 1, 2, merged);
        s.cursor = { x: above.length, y: s.cursor.y - 1 };
      }
      return s;
    }
    if (key === CR) {
      const line = s.lines[s.cursor.y];
      s.lines.splice(s.cursor.y, 1, line.slice(0, s.cursor.x), line.slice(s.cursor.x));
      s.cursor = { x: 0, y: s.cursor.y + 1 };
      return s;
    }
    if (key.length === 1) {
      const r = insertAt(s.lines, s.cursor, key);
      s.lines = r.lines;
      s.cursor = r.cursor;
      s.desiredX = s.cursor.x;
    }
    return s;
  }

  /* ---------- awaiting the argument of f/F/t/T/r ---------- */
  if (s.pending.awaitingChar) {
    const kind = s.pending.awaitingChar;
    if (key === ESC || key.length !== 1) {
      clearPending(s);
      return s;
    }
    if (kind === "r") {
      pushHistory(s);
      const line = s.lines[s.cursor.y];
      s.lines[s.cursor.y] = line.slice(0, s.cursor.x) + key + line.slice(s.cursor.x + 1);
      clearPending(s);
      return s;
    }
    const count =
      parseInt(s.pending.count || "1", 10) * parseInt(s.pending.opCount || "1", 10);
    const op = s.pending.operator;
    const m = resolveMotion(s, kind, count, key);
    s.lastFind = { char: key, kind };
    clearPending(s);
    if (!m || m.failed) {
      say(s, `'${key}' not found on this line`);
      return s;
    }
    if (op) applyOperator(s, op, rangeFromMotion(s, op, kind, m));
    else {
      s.cursor = m.pos;
      s.desiredX = s.cursor.x;
    }
    return s;
  }

  /* ---------- gg ---------- */
  if (s.pending.awaitingG) {
    s.pending.awaitingG = false;
    if (key !== "g") {
      clearPending(s);
      return s;
    }
    const count =
      parseInt(s.pending.count || "1", 10) * parseInt(s.pending.opCount || "1", 10);
    const op = s.pending.operator;
    const m = resolveMotion(s, "gg", count);
    clearPending(s);
    if (m) {
      if (op) applyOperator(s, op, rangeFromMotion(s, op, "gg", m));
      else {
        s.cursor = m.pos;
        s.desiredX = s.cursor.x;
      }
    }
    return s;
  }

  /* ---------- text object prefix (i / a after an operator) ---------- */
  if (s.pending.textObject) {
    const around = s.pending.textObject === "a";
    const op = s.pending.operator;
    const range = resolveTextObject(s, around, key);
    clearPending(s);
    if (!range) {
      say(s, "No text object here");
      return s;
    }
    if (op) applyOperator(s, op, range);
    else {
      s.mode = "visual";
      s.visualAnchor = clone(range.start);
      s.cursor = { x: Math.max(range.start.x, range.end.x - 1), y: range.end.y };
    }
    return s;
  }

  /* ---------- escape ---------- */
  if (key === ESC) {
    if (s.mode === "visual" || s.mode === "visual-line") {
      s.mode = "normal";
      s.visualAnchor = null;
    }
    clearPending(s);
    return s;
  }

  /* ---------- gating ---------- */
  if (!isAllowed(key, config)) {
    if (!config.disableCallouts) {
      say(s, `You haven't learned "${key === " " ? "space" : key}" yet`);
    }
    clearPending(s);
    return s;
  }
  if (config.readonly && EDITING_KEYS.has(key)) {
    say(s, "Read-only — no editing in this lesson");
    clearPending(s);
    return s;
  }
  if (config.motionsOnly && EDITING_KEYS.has(key)) {
    say(s, "Motions only — this drill is about moving, not editing");
    clearPending(s);
    return s;
  }

  /* ---------- counts ---------- */
  if (/^[1-9]$/.test(key) || (key === "0" && s.pending.count)) {
    s.pending.count += key;
    return s;
  }

  const count =
    parseInt(s.pending.count || "1", 10) * parseInt(s.pending.opCount || "1", 10);
  const op = s.pending.operator;
  const visual = s.mode === "visual" || s.mode === "visual-line";

  /* ---------- motions ---------- */
  if (key === "g") {
    s.pending.awaitingG = true;
    return s;
  }
  if (key === "f" || key === "F" || key === "t" || key === "T" || key === "r") {
    s.pending.awaitingChar = key;
    return s;
  }
  if (key === "/" || key === "?") {
    s.searchInput = { term: "", forward: key === "/" };
    clearPending(s);
    return s;
  }
  if (key === "*" || key === "#") {
    const wordRange = wordObject(s.lines, s.cursor, false, false);
    if (wordRange) {
      const term = textInRange(s.lines, wordRange);
      s.lastSearch = { term, forward: key === "*" };
      const found = searchFrom(s.lines, s.cursor, term, key === "*");
      if (found) s.cursor = found;
    }
    clearPending(s);
    return s;
  }

  const motion = resolveMotion(s, key, count);
  if (motion) {
    clearPending(s);
    if (motion.failed) return s;
    if (op) {
      applyOperator(s, op, rangeFromMotion(s, op, key, motion));
    } else {
      s.cursor = clampCursor(s.lines, motion.pos, "normal");
      if (key !== "j" && key !== "k") s.desiredX = s.cursor.x;
    }
    return s;
  }

  /* ---------- operators & commands ---------- */
  switch (key) {
    case "d":
    case "c":
    case "y": {
      if (visual) {
        const range = visualRange(s);
        applyOperator(s, key, range);
        if ((s.mode as Mode) !== "insert") s.mode = "normal";
        s.visualAnchor = null;
        clearPending(s);
        return s;
      }
      if (op === key) {
        // dd / cc / yy — linewise on `count` lines
        const endY = Math.min(s.lines.length - 1, s.cursor.y + count - 1);
        applyOperator(s, key, {
          start: { x: 0, y: s.cursor.y },
          end: { x: 0, y: endY },
          linewise: true,
        });
        clearPending(s);
        return s;
      }
      s.pending.operator = key;
      s.pending.opCount = s.pending.count;
      s.pending.count = "";
      return s;
    }
    case "i":
    case "a": {
      if (op) {
        s.pending.textObject = key;
        return s;
      }
      if (visual) {
        s.pending.textObject = key;
        return s;
      }
      pushHistory(s);
      s.mode = "insert";
      if (key === "a") s.cursor = { x: Math.min(s.cursor.x + 1, (s.lines[s.cursor.y] ?? "").length), y: s.cursor.y };
      clearPending(s);
      return s;
    }
    case "I":
      pushHistory(s);
      s.mode = "insert";
      s.cursor = { x: firstNonBlank(s.lines[s.cursor.y] ?? ""), y: s.cursor.y };
      clearPending(s);
      return s;
    case "A":
      pushHistory(s);
      s.mode = "insert";
      s.cursor = { x: (s.lines[s.cursor.y] ?? "").length, y: s.cursor.y };
      clearPending(s);
      return s;
    case "o":
    case "O": {
      if (visual) {
        // swap which end of the selection the cursor sits on
        const anchor = s.visualAnchor ?? clone(s.cursor);
        s.visualAnchor = clone(s.cursor);
        s.cursor = anchor;
        clearPending(s);
        return s;
      }
      pushHistory(s);
      const indent = (s.lines[s.cursor.y] ?? "").match(/^\s*/)?.[0] ?? "";
      const at = key === "o" ? s.cursor.y + 1 : s.cursor.y;
      s.lines.splice(at, 0, indent);
      s.cursor = { x: indent.length, y: at };
      s.mode = "insert";
      clearPending(s);
      return s;
    }
    case "D": {
      pushHistory(s);
      const line = s.lines[s.cursor.y];
      s.registers['"'] = { text: line.slice(s.cursor.x), linewise: false };
      s.lines[s.cursor.y] = line.slice(0, s.cursor.x);
      s.cursor = clampCursor(s.lines, s.cursor, "normal");
      clearPending(s);
      return s;
    }
    case "x": {
      pushHistory(s);
      const line = s.lines[s.cursor.y];
      if (line.length) {
        s.registers['"'] = { text: line[s.cursor.x] ?? "", linewise: false };
        s.lines[s.cursor.y] = line.slice(0, s.cursor.x) + line.slice(s.cursor.x + count);
        s.cursor = clampCursor(s.lines, s.cursor, "normal");
      }
      clearPending(s);
      return s;
    }
    case "s": {
      pushHistory(s);
      const line = s.lines[s.cursor.y];
      s.lines[s.cursor.y] = line.slice(0, s.cursor.x) + line.slice(s.cursor.x + count);
      s.mode = "insert";
      clearPending(s);
      return s;
    }
    case "p":
    case "P": {
      const reg = s.registers['"'];
      if (!reg) {
        say(s, "Nothing to paste yet — yank or delete something first");
        clearPending(s);
        return s;
      }
      pushHistory(s);
      if (reg.linewise) {
        const at = key === "p" ? s.cursor.y + 1 : s.cursor.y;
        s.lines.splice(at, 0, ...reg.text.split("\n"));
        s.cursor = { x: firstNonBlank(s.lines[at]), y: at };
      } else {
        const at = key === "p"
          ? { x: Math.min(s.cursor.x + 1, (s.lines[s.cursor.y] ?? "").length), y: s.cursor.y }
          : clone(s.cursor);
        const r = insertAt(s.lines, at, reg.text);
        s.lines = r.lines;
        s.cursor = { x: Math.max(0, r.cursor.x - 1), y: r.cursor.y };
      }
      clearPending(s);
      return s;
    }
    case "v":
    case "V": {
      const wanted: Mode = key === "v" ? "visual" : "visual-line";
      if (s.mode === wanted) {
        s.mode = "normal";
        s.visualAnchor = null;
      } else {
        s.mode = wanted;
        s.visualAnchor ??= clone(s.cursor);
      }
      clearPending(s);
      return s;
    }
    case "u": {
      const last = s.history[s.history.length - 1];
      if (last) {
        s.history = s.history.slice(0, -1);
        s.lines = [...last.lines];
        s.cursor = clone(last.cursor);
      }
      clearPending(s);
      return s;
    }
    default:
      clearPending(s);
      return s;
  }
}

export function visualRange(s: VimState): Range {
  const anchor = s.visualAnchor ?? clone(s.cursor);
  const [a, b] = sortRange(anchor, clone(s.cursor));
  if (s.mode === "visual-line") {
    return { start: { x: 0, y: a.y }, end: { x: 0, y: b.y }, linewise: true };
  }
  return { start: a, end: { x: b.x + 1, y: b.y }, linewise: false };
}

export const bufferText = (s: VimState) => toText(s.lines);

export function charUnderCursor(s: VimState): string {
  return charAt(s.lines, s.cursor);
}
