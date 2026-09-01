import type { BoardKind } from "@/lib/vim/generators";
import type { TaskSpec } from "@/lib/vim/goals";

export interface TeachBlock {
  /** the keys this block introduces, rendered as keycaps */
  keys?: string[];
  /** the one-line meaning that sits beside the keycaps */
  label: string;
  /** a snippet shown behind "show example" */
  example?: string;
  /** a paragraph of explanation, for concept lessons */
  body?: string;
}

export interface DrillConfig {
  boards: BoardKind[];
  /** one task is drawn per goal — a review lesson simply has several */
  tasks: TaskSpec[];
  goals: number;
  motionsOnly?: boolean;
  readonly?: boolean;
  minimumLines?: number;
}

export type LessonKind = "concept" | "drill" | "review" | "game";

export interface Lesson {
  slug: string;
  title: string;
  /** keycaps shown on the sidebar row */
  keys: string[];
  kind: LessonKind;
  summary: string;
  /** commands this lesson unlocks; the emulator refuses everything not yet taught */
  teaches: string[];
  teach?: TeachBlock[];
  drill?: DrillConfig;
  /** closing note under the challenge */
  note?: string;
}

export interface Chapter {
  slug: string;
  title: string;
  lessons: Lesson[];
}
