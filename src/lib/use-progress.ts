"use client";

import { useSyncExternalStore } from "react";
import {
  progressServerSnapshot,
  progressSnapshot,
  subscribeProgress,
  type ProgressMap,
} from "./progress";

/** Read saved progress without an effect — the store notifies on every write. */
export function useProgress(): ProgressMap {
  return useSyncExternalStore(
    subscribeProgress,
    progressSnapshot,
    progressServerSnapshot,
  );
}
