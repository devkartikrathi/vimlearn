"use client";

import type { GoalCompletion } from "@/lib/vim/types";

const KEY = "vimlearn.progress.v1";

export interface LessonProgress {
  completed: boolean;
  bestProficiency: number;
  attempts: number;
  goalsCompleted: number;
  lastPlayed: number;
}

export type ProgressMap = Record<string, LessonProgress>;

const empty = (): LessonProgress => ({
  completed: false,
  bestProficiency: 0,
  attempts: 0,
  goalsCompleted: 0,
  lastPlayed: 0,
});

export function readProgress(): ProgressMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ProgressMap) : {};
  } catch {
    return {};
  }
}

function write(map: ProgressMap) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* storage can be unavailable — progress is a convenience, not the product */
  }
  invalidate();
}

/* ------------------------------------------------------------------ */
/* An external store, so components can read progress without effects  */
/* ------------------------------------------------------------------ */

let cache: ProgressMap | null = null;
const listeners = new Set<() => void>();

function invalidate() {
  cache = null;
  listeners.forEach((l) => l());
}

export function subscribeProgress(onChange: () => void): () => void {
  listeners.add(onChange);
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key === KEY) invalidate();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

/** Stable between changes, so useSyncExternalStore never loops. */
export function progressSnapshot(): ProgressMap {
  cache ??= readProgress();
  return cache;
}

const SERVER_SNAPSHOT: ProgressMap = {};
export const progressServerSnapshot = () => SERVER_SNAPSHOT;

export function recordGoal(slug: string, completion: GoalCompletion) {
  const map = readProgress();
  const entry = map[slug] ?? empty();
  const n = entry.goalsCompleted;
  map[slug] = {
    ...entry,
    goalsCompleted: n + 1,
    bestProficiency: Math.max(entry.bestProficiency, completion.proficiency),
    lastPlayed: Date.now(),
  };
  write(map);
}

export function recordCompletion(slug: string, averageProficiency: number) {
  const map = readProgress();
  const entry = map[slug] ?? empty();
  map[slug] = {
    ...entry,
    completed: true,
    attempts: entry.attempts + 1,
    bestProficiency: Math.max(entry.bestProficiency, averageProficiency),
    lastPlayed: Date.now(),
  };
  write(map);
}

export function markVisited(slug: string) {
  const map = readProgress();
  if (map[slug]?.completed) return;
  map[slug] = { ...(map[slug] ?? empty()), completed: true, lastPlayed: Date.now() };
  write(map);
}

export function resetProgress() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* nothing to clear */
  }
  invalidate();
}
