export type Mode = "normal" | "insert" | "visual" | "visual-line";

export interface Position {
  /** column, 0-indexed */
  x: number;
  /** line, 0-indexed */
  y: number;
}

/** An inclusive-start, exclusive-end span of the buffer. */
export interface Range {
  start: Position;
  end: Position;
  linewise: boolean;
}

export type Operator = "d" | "c" | "y";

export interface Pending {
  /** digits typed so far, e.g. "12" in `12j` */
  count: string;
  /** digits typed *before* the operator — `2d3w` multiplies the two */
  opCount: string;
  operator: Operator | null;
  /** `i` or `a` once a text-object prefix has been typed */
  textObject: "i" | "a" | null;
  /** waiting for the argument of f/F/t/T/r */
  awaitingChar: "f" | "F" | "t" | "T" | "r" | null;
  /** `g` typed, waiting for the second `g` */
  awaitingG: boolean;
}

export interface Register {
  text: string;
  linewise: boolean;
}

export interface Callout {
  id: number;
  text: string;
  tone: "negative" | "positive";
}

export interface Snapshot {
  lines: string[];
  cursor: Position;
}

export interface VimState {
  lines: string[];
  cursor: Position;
  mode: Mode;
  /** the fixed end of a visual selection */
  visualAnchor: Position | null;
  registers: Record<string, Register>;
  pending: Pending;
  /** sticky column so j/k keep their place through short lines */
  desiredX: number;
  /** the last search pattern, for n / N */
  lastSearch: { term: string; forward: boolean } | null;
  /** the pending `/` or `?` command line, null when not searching */
  searchInput: { term: string; forward: boolean } | null;
  lastFind: { char: string; kind: "f" | "F" | "t" | "T" } | null;
  history: Snapshot[];
  keystrokes: string[];
  callout: Callout | null;
}

/* ------------------------------------------------------------------ */
/* Goals                                                               */
/* ------------------------------------------------------------------ */

export type GoalStatus = "incomplete" | "completed" | "must_undo";

export type GoalKind =
  | "cursor"
  | "delete_range"
  | "change_range"
  | "text_match"
  | "visual_select"
  | "copy_range";

export interface Goal {
  kind: GoalKind;
  /** spans painted onto the buffer so the learner can see the target */
  highlights: Range[];
  /** target for `cursor` goals */
  target?: Position;
  /** the buffer as it looked when the goal was handed out */
  textBefore: string;
  /** the buffer once the goal is met (unused by cursor / visual goals) */
  textAfter?: string;
  /** buffer states that are legal on the way to textAfter (mid-insert) */
  intermediates?: string[];
  /** text that must end up in a register, for `copy_range` */
  registerText?: string;
  /** the optimal keystrokes — drives the accuracy score and the hint */
  solution: string[];
  /** shown under the editor while this goal is live */
  instruction: string;
}

export interface GoalCompletion {
  parMs: number;
  actualMs: number;
  solutionKeys: number;
  actualKeys: number;
  speedScore: number;
  accuracyScore: number;
  proficiency: number;
}

/* ------------------------------------------------------------------ */
/* Per-lesson engine configuration                                     */
/* ------------------------------------------------------------------ */

export interface GameConfig {
  /** commands the emulator will accept; everything else is refused politely */
  allowed: string[];
  /** how many goals end the set */
  goalsToComplete: number;
  /** reject every editing command — motion drills can't be broken */
  motionsOnly?: boolean;
  /** reject everything that mutates the buffer */
  readonly?: boolean;
  /** keep the buffer at least this tall so jump drills never run out of runway */
  minimumLines?: number;
  disableCallouts?: boolean;
}
