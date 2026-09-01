import type {
  GameConfig,
  Goal,
  GoalCompletion,
  GoalStatus,
  Position,
  Range,
  VimState,
} from "./types";
import { applyKey, createState, visualRange } from "./reducer";
import {
  bracketObject,
  charClass,
  clone,
  deleteRange,
  firstNonBlank,
  insertAt,
  paragraphObject,
  quoteObject,
  samePos,
  textInRange,
  toText,
  wordBack,
  wordEnd,
  wordForward,
  wordObject,
} from "./text";
import { pick, pickInt, type Rng } from "./generators";

/* ------------------------------------------------------------------ */
/* What a lesson asks for                                              */
/* ------------------------------------------------------------------ */

export type TargetSpec =
  | { kind: "word"; big?: boolean }
  | { kind: "line"; count?: number }
  | { kind: "toLineEnd" }
  | { kind: "textobject"; around: boolean; obj: string };

export type TaskSpec =
  | { type: "move"; via: string[]; reps?: [number, number] }
  | { type: "moveTo"; anchor: "lineStart" | "lineEnd" | "firstNonBlank" | "fileStart" | "fileEnd" | "paragraph" }
  | { type: "findChar"; till?: boolean; back?: boolean }
  | { type: "search"; quick?: boolean }
  | { type: "operate"; op: "d" | "c" | "y"; target: TargetSpec }
  | { type: "paste" }
  | { type: "select"; target: TargetSpec; linewise?: boolean }
  | { type: "insertAt"; where: "before" | "after" | "lineStart" | "lineEnd" | "openBelow" | "openAbove" }
  | { type: "smallEdit" }
  | { type: "bugFix" };

const REPLACEMENTS = ["result", "value", "payload", "output", "target"] as const;

/* ------------------------------------------------------------------ */
/* Picking somewhere interesting to send the learner                   */
/* ------------------------------------------------------------------ */

function wordStarts(lines: string[]): Position[] {
  const out: Position[] = [];
  lines.forEach((line, y) => {
    let prev = 0;
    for (let x = 0; x < line.length; x++) {
      const cls = charClass(line[x]);
      if (cls !== 0 && cls !== prev) out.push({ x, y });
      prev = cls;
    }
  });
  return out;
}

function farFrom(rng: Rng, options: Position[], from: Position, minDist = 4): Position | null {
  const far = options.filter(
    (p) => Math.abs(p.y - from.y) * 6 + Math.abs(p.x - from.x) >= minDist,
  );
  const pool = far.length ? far : options.filter((p) => !samePos(p, from));
  return pool.length ? pick(rng, pool) : null;
}

/**
 * The genuinely shortest keystroke route from one position to another, found by
 * searching with the emulator itself as the transition function. Because the
 * search and the editor share one implementation, the keys we print as
 * "optimal" are keys that provably work.
 */
const MOTION_EDGES: Array<{ keys: string[]; needs: string }> = [
  { keys: ["h"], needs: "h" },
  { keys: ["l"], needs: "l" },
  { keys: ["j"], needs: "j" },
  { keys: ["k"], needs: "k" },
  { keys: ["w"], needs: "w" },
  { keys: ["e"], needs: "e" },
  { keys: ["b"], needs: "b" },
  { keys: ["W"], needs: "W" },
  { keys: ["E"], needs: "E" },
  { keys: ["B"], needs: "B" },
  { keys: ["0"], needs: "0" },
  { keys: ["_"], needs: "_" },
  { keys: ["$"], needs: "$" },
  { keys: ["{"], needs: "{" },
  { keys: ["}"], needs: "}" },
  { keys: ["G"], needs: "G" },
  { keys: ["g", "g"], needs: "g" },
  { keys: ["<C-d>"], needs: "<C-d>" },
  { keys: ["<C-u>"], needs: "<C-u>" },
];

const MAX_SEARCH_NODES = 6000;

export function shortestKeyPath(
  lines: string[],
  from: Position,
  to: Position,
  allowed: string[],
): string[] {
  if (samePos(from, to)) return [];
  const config: GameConfig = { allowed, goalsToComplete: 0, motionsOnly: true };
  const edges = MOTION_EDGES.filter((e) => allowed.includes(e.needs));
  if (!edges.length) return [];

  const key = (p: Position) => `${p.x},${p.y}`;
  const best = new Map<string, number>([[key(from), 0]]);
  const via = new Map<string, string[]>([[key(from), []]]);
  const frontier: Position[] = [from];
  let visited = 0;

  // costs are 1 or 2 keys, so a two-bucket sweep is enough to stay optimal
  while (frontier.length && visited < MAX_SEARCH_NODES) {
    frontier.sort((a, b) => (best.get(key(a)) ?? 0) - (best.get(key(b)) ?? 0));
    const current = frontier.shift()!;
    const ck = key(current);
    visited++;
    if (samePos(current, to)) return via.get(ck)!;

    const cost = best.get(ck) ?? 0;
    const path = via.get(ck) ?? [];

    for (const edge of edges) {
      let state = createState(lines, current);
      for (const k of edge.keys) state = applyKey(state, k, config);
      const nk = key(state.cursor);
      const nextCost = cost + edge.keys.length;
      if ((best.get(nk) ?? Infinity) <= nextCost) continue;
      best.set(nk, nextCost);
      via.set(nk, [...path, ...edge.keys]);
      frontier.push({ ...state.cursor });
    }
  }
  return via.get(key(to)) ?? [];
}

/* ------------------------------------------------------------------ */
/* Goal construction                                                   */
/* ------------------------------------------------------------------ */

function resolveTarget(
  lines: string[],
  at: Position,
  target: TargetSpec,
  op?: "d" | "c" | "y",
): Range | null {
  switch (target.kind) {
    case "word": {
      if (op === "c") {
        const e = wordEnd(lines, at, !!target.big);
        if (e.y !== at.y) return null;
        return { start: at, end: { x: e.x + 1, y: e.y }, linewise: false };
      }
      const end = wordForward(lines, at, !!target.big);
      if (end.y !== at.y) {
        return { start: at, end: { x: (lines[at.y] ?? "").length, y: at.y }, linewise: false };
      }
      return { start: at, end, linewise: false };
    }
    case "line": {
      const n = target.count ?? 1;
      const endY = Math.min(lines.length - 1, at.y + n - 1);
      return { start: { x: 0, y: at.y }, end: { x: 0, y: endY }, linewise: true };
    }
    case "toLineEnd":
      return {
        start: at,
        end: { x: (lines[at.y] ?? "").length, y: at.y },
        linewise: false,
      };
    case "textobject": {
      const { obj, around } = target;
      if (obj === "w" || obj === "W")
        return wordObject(lines, at, obj === "W", around);
      if (obj === "p") return paragraphObject(lines, at, around);
      if (obj === '"' || obj === "'") return quoteObject(lines, at, obj, around);
      return bracketObject(lines, at, obj, around);
    }
  }
}

/** Every position from which the given text object resolves to a real range. */
function objectAnchors(lines: string[], target: TargetSpec): Position[] {
  const out: Position[] = [];
  lines.forEach((line, y) => {
    for (let x = 0; x < Math.max(line.length, 1); x++) {
      const r = resolveTarget(lines, { x, y }, target);
      if (r && (r.linewise || r.end.x > r.start.x || r.end.y > r.start.y)) {
        out.push({ x, y });
      }
    }
  });
  return out;
}

function applyRangeEdit(
  lines: string[],
  range: Range,
  replacement: string | null,
): string {
  if (replacement !== null && range.linewise) {
    // `cip` clears the block and leaves a single line under the cursor
    const next = [...lines];
    next.splice(range.start.y, range.end.y - range.start.y + 1, replacement);
    return toText(next);
  }
  const removed = deleteRange(lines, range);
  if (replacement === null) return toText(removed.lines);
  return toText(insertAt(removed.lines, range.start, replacement).lines);
}

function prefixes(
  lines: string[],
  range: Range,
  replacement: string,
): string[] {
  const out: string[] = [];
  for (let i = 0; i <= replacement.length; i++) {
    out.push(applyRangeEdit(lines, range, replacement.slice(0, i)));
  }
  return out;
}

export interface GoalBuildInput {
  task: TaskSpec;
  lines: string[];
  cursor: Position;
  rng: Rng;
  allowed: string[];
  /** for bugFix goals — the buffer as it should end up */
  original?: string[];
}

export function buildGoal(input: GoalBuildInput): Goal | null {
  const { task, lines, cursor, rng, allowed } = input;
  const before = toText(lines);

  switch (task.type) {
    /* ---------------- pure motion ---------------- */
    case "move": {
      const [lo, hi] = task.reps ?? [1, 3];
      // some motions cannot move from where the cursor happens to be — h at
      // column 0, k on line 1 — so try each of the lesson's keys before giving up
      const order = [...task.via].sort(() => rng() - 0.5);
      for (const key of order) {
        for (let attempt = 0; attempt < 4; attempt++) {
          const reps = pickInt(rng, lo, hi);
          let p = clone(cursor);
          for (let i = 0; i < reps; i++) p = stepMotion(lines, p, key);
          if (samePos(p, cursor)) continue;
          return {
            kind: "cursor",
            highlights: [{ start: p, end: { x: p.x + 1, y: p.y }, linewise: false }],
            target: p,
            textBefore: before,
            solution: Array.from({ length: reps }, () => key),
            instruction: `Move the cursor onto the highlighted character with ${describeKeys([key])}.`,
          };
        }
      }
      return null;
    }

    case "moveTo": {
      const targets: Position[] = [];
      const push = (p: Position) => targets.push(p);
      lines.forEach((line, y) => {
        if (task.anchor === "paragraph") {
          if (line.trim() === "" && y > 0) push({ x: 0, y });
          return;
        }
        if (!line.length) return;
        if (task.anchor === "lineStart") push({ x: 0, y });
        if (task.anchor === "firstNonBlank") push({ x: firstNonBlank(line), y });
        if (task.anchor === "lineEnd") push({ x: line.length - 1, y });
      });
      if (task.anchor === "fileStart") push({ x: 0, y: 0 });
      if (task.anchor === "fileEnd") push({ x: 0, y: lines.length - 1 });
      const target = farFrom(rng, targets, cursor, 2);
      if (!target) return null;
      return {
        kind: "cursor",
        highlights: [{ start: target, end: { x: target.x + 1, y: target.y }, linewise: false }],
        target,
        textBefore: before,
        solution: shortestKeyPath(lines, cursor, target, allowed),
        instruction: `Jump to the highlighted spot.`,
      };
    }

    case "findChar": {
      const line = lines[cursor.y] ?? "";
      const after = line.slice(cursor.x + 2);
      const candidates = Array.from(new Set(after.split("").filter((c) => /\S/.test(c))));
      if (!candidates.length) return null;
      const ch = pick(rng, candidates);
      const idx = line.indexOf(ch, cursor.x + 2);
      if (idx === -1) return null;
      const target = { x: task.till ? idx - 1 : idx, y: cursor.y };
      return {
        kind: "cursor",
        highlights: [{ start: target, end: { x: target.x + 1, y: target.y }, linewise: false }],
        target,
        textBefore: before,
        solution: [task.till ? "t" : "f", ch],
        instruction: `Use ${task.till ? "t" : "f"} to land on the highlighted character — the target character is "${ch}".`,
      };
    }

    case "search": {
      const occurrences = new Map<string, Position[]>();
      lines.forEach((line, y) => {
        for (const m of line.matchAll(/[A-Za-z_][A-Za-z0-9_]{3,}/g)) {
          const list = occurrences.get(m[0]) ?? [];
          list.push({ x: m.index, y });
          occurrences.set(m[0], list);
        }
      });

      if (task.quick) {
        // * searches the word under the cursor, so the learner must stand on one
        const repeated = [...occurrences.entries()].filter(([, v]) => v.length >= 2);
        if (!repeated.length) return null;
        const [term, spots] = pick(rng, repeated);
        const i = pickInt(rng, 0, spots.length - 2);
        const from = spots[i];
        const target = spots[i + 1];
        return {
          kind: "cursor",
          highlights: [
            { start: target, end: { x: target.x + term.length, y: target.y }, linewise: false },
          ],
          target,
          textBefore: before,
          solution: [...shortestKeyPath(lines, cursor, from, allowed), "*"],
          instruction: `Put the cursor on a "${term}" and press * to jump to the next one.`,
        };
      }

      const pool = [...occurrences.entries()].filter(
        ([, v]) => !v.every((p) => p.y === cursor.y && p.x === cursor.x),
      );
      if (!pool.length) return null;
      const [term, spots] = pick(rng, pool);
      const found = spots.find((p) => !(p.y === cursor.y && p.x === cursor.x));
      if (!found) return null;
      return {
        kind: "cursor",
        highlights: [
          { start: found, end: { x: found.x + term.length, y: found.y }, linewise: false },
        ],
        target: found,
        textBefore: before,
        solution: ["/", ...term.split(""), "<CR>"],
        instruction: `Search for "${term}" with / and press Enter.`,
      };
    }

    /* ---------------- operators ---------------- */
    case "operate": {
      const anchors =
        task.target.kind === "textobject"
          ? objectAnchors(lines, task.target)
          : task.target.kind === "line"
            ? lines.map((_, y) => ({ x: 0, y })).filter((p) => (lines[p.y] ?? "").trim() !== "")
            : wordStarts(lines);
      const at = farFrom(rng, anchors, cursor, task.target.kind === "line" ? 1 : 4);
      if (!at) return null;
      const range = resolveTarget(lines, at, task.target, task.op);
      if (!range) return null;
      const text = textInRange(lines, range);
      if (!text.trim()) return null;

      // A text object resolves from wherever the cursor is inside it, so the
      // route has to end at that anchor — not at the range's first character.
      const landing = task.target.kind === "textobject" ? at : range.start;
      const path = shortestKeyPath(lines, cursor, landing, allowed);
      const opKeys = operatorKeys(task.op, task.target, allowed);
      if (!opKeys) return null;

      if (task.op === "y") {
        return {
          kind: "copy_range",
          highlights: [range],
          textBefore: before,
          registerText: text,
          solution: [...path, ...opKeys],
          instruction: `Yank the highlighted text with ${describeKeys(opKeys)}.`,
        };
      }
      if (task.op === "d") {
        return {
          kind: "delete_range",
          highlights: [range],
          textBefore: before,
          textAfter: applyRangeEdit(lines, range, null),
          solution: [...path, ...opKeys],
          instruction: `Delete the highlighted text with ${describeKeys(opKeys)}.`,
        };
      }
      const replacement = pick(rng, REPLACEMENTS);
      return {
        kind: "change_range",
        highlights: [range],
        textBefore: before,
        textAfter: applyRangeEdit(lines, range, replacement),
        intermediates: prefixes(lines, range, replacement),
        solution: [...path, ...opKeys, ...replacement.split(""), "<Esc>"],
        instruction: `Change the highlighted text to "${replacement}" using ${describeKeys(opKeys)}.`,
      };
    }

    case "paste": {
      const anchors = lines.map((_, y) => ({ x: 0, y })).filter((p) => (lines[p.y] ?? "").trim() !== "");
      const at = farFrom(rng, anchors, cursor, 1);
      if (!at || lines.length < 3) return null;
      const range: Range = { start: { x: 0, y: at.y }, end: { x: 0, y: at.y }, linewise: true };
      const copied = lines[at.y];
      const after = [...lines];
      after.splice(at.y + 1, 0, copied);
      return {
        kind: "text_match",
        highlights: [range],
        textBefore: before,
        textAfter: toText(after),
        solution: [...shortestKeyPath(lines, cursor, { x: 0, y: at.y }, allowed), "y", "y", "p"],
        instruction: `Duplicate the highlighted line: yank it with yy, then paste it below with p.`,
      };
    }

    /* ---------------- visual ---------------- */
    case "select": {
      const anchors =
        task.target.kind === "textobject"
          ? objectAnchors(lines, task.target)
          : wordStarts(lines);
      const at = farFrom(rng, anchors, cursor, 3);
      if (!at) return null;
      const range = resolveTarget(lines, at, task.target);
      if (!range) return null;
      const landing =
        task.target.kind === "textobject"
          ? at
          : task.linewise
            ? { x: 0, y: range.start.y }
            : range.start;
      return {
        kind: "visual_select",
        highlights: [range],
        textBefore: before,
        solution: [
          ...shortestKeyPath(lines, cursor, landing, allowed),
          task.linewise ? "V" : "v",
          ...selectionKeys(task.target),
        ],
        instruction: task.linewise
          ? `Select the highlighted lines with V.`
          : `Select exactly the highlighted text in visual mode.`,
      };
    }

    /* ---------------- insert ---------------- */
    case "insertAt": {
      const anchors = lines.map((_, y) => ({ x: 0, y })).filter((p) => (lines[p.y] ?? "").trim() !== "");
      const at = farFrom(rng, anchors, cursor, 1);
      if (!at) return null;
      const marker = pick(rng, ["// TODO", "// FIXME", "// NOTE"]);
      const next = [...lines];
      const path = shortestKeyPath(lines, cursor, { x: 0, y: at.y }, allowed);
      // o, O and I all respect the existing indentation, so the target text must too
      const indent = (lines[at.y].match(/^\s*/) ?? [""])[0];
      let solution: string[];
      let instruction: string;
      switch (task.where) {
        case "lineEnd":
          next[at.y] = `${next[at.y]} ${marker}`;
          solution = [...path, "A", " ", ...marker.split(""), "<Esc>"];
          instruction = `Append " ${marker}" to the end of the highlighted line with A.`;
          break;
        case "lineStart":
          next[at.y] = `${indent}${marker} ${next[at.y].trimStart()}`;
          solution = [...path, "I", ...marker.split(""), " ", "<Esc>"];
          instruction = `Insert "${marker} " at the start of the highlighted line with I.`;
          break;
        case "openBelow":
          next.splice(at.y + 1, 0, indent + marker);
          solution = [...path, "o", ...marker.split(""), "<Esc>"];
          instruction = `Open a new line below the highlighted one with o and type "${marker}".`;
          break;
        case "openAbove":
          next.splice(at.y, 0, indent + marker);
          solution = [...path, "O", ...marker.split(""), "<Esc>"];
          instruction = `Open a new line above the highlighted one with O and type "${marker}".`;
          break;
        default:
          next[at.y] = `${indent}${marker} ${next[at.y].trimStart()}`;
          solution = [...path, "_", "i", ...marker.split(""), " ", "<Esc>"];
          instruction = `Insert "${marker} " at the start of the highlighted line with i.`;
      }
      return {
        kind: "text_match",
        highlights: [{ start: { x: 0, y: at.y }, end: { x: 0, y: at.y }, linewise: true }],
        textBefore: before,
        textAfter: toText(next),
        intermediates: [],
        solution,
        instruction,
      };
    }

    case "smallEdit": {
      const starts = wordStarts(lines);
      const at = farFrom(rng, starts, cursor, 3);
      if (!at) return null;
      const line = lines[at.y];
      const next = [...lines];
      next[at.y] = line.slice(0, at.x) + line.slice(at.x + 1);
      return {
        kind: "delete_range",
        highlights: [{ start: at, end: { x: at.x + 1, y: at.y }, linewise: false }],
        textBefore: before,
        textAfter: toText(next),
        solution: [...shortestKeyPath(lines, cursor, at, allowed), "x"],
        instruction: `Delete the single highlighted character with x.`,
      };
    }

    case "bugFix": {
      if (!input.original) return null;
      return {
        kind: "text_match",
        highlights: [],
        textBefore: before,
        textAfter: toText(input.original),
        intermediates: [],
        solution: ["i", "?", "<Esc>"],
        instruction: `Restore every character the bugs ate. Use insert mode to type them back.`,
      };
    }
  }
}

function stepMotion(lines: string[], from: Position, key: string): Position {
  switch (key) {
    case "h":
      return { x: Math.max(0, from.x - 1), y: from.y };
    case "l":
      return { x: Math.min(Math.max(0, (lines[from.y] ?? "").length - 1), from.x + 1), y: from.y };
    case "j": {
      const y = Math.min(lines.length - 1, from.y + 1);
      return { x: Math.min(from.x, Math.max(0, (lines[y] ?? "").length - 1)), y };
    }
    case "k": {
      const y = Math.max(0, from.y - 1);
      return { x: Math.min(from.x, Math.max(0, (lines[y] ?? "").length - 1)), y };
    }
    default: {
      // word motions delegate to the real implementation so goals and the
      // emulator can never disagree about where `w` lands
      const big = key === key.toUpperCase();
      const lower = key.toLowerCase();
      if (lower === "w") return wordForward(lines, from, big);
      if (lower === "e") return wordEnd(lines, from, big);
      if (lower === "b") return wordBack(lines, from, big);
      return from;
    }
  }
}

function operatorKeys(
  op: "d" | "c" | "y",
  target: TargetSpec,
  allowed: string[],
): string[] | null {
  switch (target.kind) {
    case "word":
      return [op, target.big ? "W" : "w"];
    case "line": {
      const n = target.count ?? 1;
      if (n === 1) return [op, op];
      if (n === 2) return [op, "j"];
      // `d3j` needs counts; a lesson that has not taught them cannot pose this
      return allowed.includes("{n}") ? [op, String(n - 1), "j"] : null;
    }
    case "toLineEnd":
      return op === "d" ? ["D"] : [op, "$"];
    case "textobject":
      return [op, target.around ? "a" : "i", target.obj];
  }
}

function selectionKeys(target: TargetSpec): string[] {
  if (target.kind === "textobject") return [target.around ? "a" : "i", target.obj];
  if (target.kind === "line") {
    return Array.from({ length: (target.count ?? 1) - 1 }, () => "j");
  }
  return ["i", "w"];
}

export function describeKeys(keys: string[]): string {
  return keys.join("");
}

/* ------------------------------------------------------------------ */
/* Judging — a pure function of editor state, never of keystrokes      */
/* ------------------------------------------------------------------ */

export function judge(goal: Goal, state: VimState): GoalStatus {
  const text = toText(state.lines);

  switch (goal.kind) {
    case "cursor":
      if (text !== goal.textBefore) return "must_undo";
      return goal.target && samePos(state.cursor, goal.target) ? "completed" : "incomplete";

    case "visual_select": {
      if (text !== goal.textBefore) return "must_undo";
      if (state.mode !== "visual" && state.mode !== "visual-line") return "incomplete";
      const sel = visualRange(state);
      const want = goal.highlights[0];
      if (!want) return "incomplete";
      if (want.linewise) {
        return sel.linewise && sel.start.y === want.start.y && sel.end.y === want.end.y
          ? "completed"
          : "incomplete";
      }
      return !sel.linewise &&
        samePos(sel.start, want.start) &&
        samePos(sel.end, want.end)
        ? "completed"
        : "incomplete";
    }

    case "copy_range": {
      if (text !== goal.textBefore) return "must_undo";
      const reg = state.registers['"'];
      return reg && reg.text === goal.registerText ? "completed" : "incomplete";
    }

    default: {
      if (text === goal.textAfter) return "completed";
      if (text === goal.textBefore) return "incomplete";
      if (goal.intermediates?.includes(text)) return "incomplete";
      return "must_undo";
    }
  }
}

/* ------------------------------------------------------------------ */
/* Scoring                                                             */
/* ------------------------------------------------------------------ */

export const parMs = (goal: Goal) => 800 + goal.solution.length * 430;

export function score(
  goal: Goal,
  elapsedMs: number,
  actualKeys: number,
): GoalCompletion {
  const par = parMs(goal);
  const actual = Math.max(elapsedMs, 200);
  const speedScore = Math.min((par / actual) * 100, 110);
  const accuracyScore = Math.min(
    (goal.solution.length / Math.max(actualKeys, 1)) * 100,
    100,
  );
  return {
    parMs: par,
    actualMs: actual,
    solutionKeys: goal.solution.length,
    actualKeys,
    speedScore,
    accuracyScore,
    proficiency: (speedScore + accuracyScore) / 2,
  };
}
