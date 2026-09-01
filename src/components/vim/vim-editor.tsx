"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import { visualRange } from "@/lib/vim/reducer";
import { rangeCells } from "@/lib/vim/text";
import type { Goal, VimState } from "@/lib/vim/types";

export interface EditorProps {
  state: VimState;
  goal: Goal | null;
  onKey: (key: string) => void;
  /** dimmed until the learner clicks in, so stray keys never disappear into it */
  focused: boolean;
  onFocusChange: (focused: boolean) => void;
  className?: string;
}

/** Turn a browser key event into the token the reducer speaks. */
export function normalizeKey(e: React.KeyboardEvent): string | null {
  if (e.key === "Escape") return "<Esc>";
  if (e.key === "Enter") return "<CR>";
  if (e.key === "Backspace") return "<BS>";
  if (e.ctrlKey && (e.key === "u" || e.key === "d")) return `<C-${e.key}>`;
  if (e.metaKey || e.ctrlKey || e.altKey) return null;
  if (e.key.length === 1) return e.key;
  return null;
}

type CellKind = "plain" | "goal" | "select" | "cursor" | "cursor-goal";

export function VimEditor({
  state,
  goal,
  onKey,
  focused,
  onFocusChange,
  className,
}: EditorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Tab") return; // leave a way out for keyboard users
      const key = normalizeKey(e);
      if (key === null) return;
      e.preventDefault();
      onKey(key);
    },
    [onKey],
  );

  useEffect(() => {
    cursorRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [state.cursor.x, state.cursor.y]);

  const decoration = useMemo(() => {
    const map = new Map<string, CellKind>();
    const put = (y: number, from: number, to: number, kind: CellKind) => {
      for (let x = from; x < to; x++) map.set(`${y}:${x}`, kind);
    };

    goal?.highlights.forEach((r) => {
      rangeCells(state.lines, r).forEach(({ y, from, to }) => put(y, from, to, "goal"));
    });

    if (state.mode === "visual" || state.mode === "visual-line") {
      rangeCells(state.lines, visualRange(state)).forEach(({ y, from, to }) =>
        put(y, from, to, "select"),
      );
    }

    const key = `${state.cursor.y}:${state.cursor.x}`;
    map.set(key, map.get(key) === "goal" ? "cursor-goal" : "cursor");
    return map;
  }, [goal, state]);

  const gutterWidth = String(state.lines.length).length;

  return (
    <div
      ref={ref}
      tabIndex={0}
      role="application"
      aria-label="Vim practice editor"
      onKeyDown={handleKeyDown}
      onFocus={() => onFocusChange(true)}
      onBlur={() => onFocusChange(false)}
      className={cn(
        "relative overflow-auto rounded-md border bg-card font-mono text-[13px] leading-[1.65] outline-none transition-colors",
        focused ? "border-primary/50 ring-2 ring-primary/15" : "border-border",
        className,
      )}
    >
      <div className="min-w-max py-3">
        {state.lines.map((line, y) => (
          <div key={y} className="flex whitespace-pre">
            <span
              className="sticky left-0 select-none bg-card pr-4 pl-4 text-right text-muted-foreground/40 tabular-nums"
              style={{ minWidth: `${gutterWidth + 3}ch` }}
            >
              {y + 1}
            </span>
            <span className="pr-6">
              {renderLine(line, y, decoration, cursorRef, state.cursor.y === y)}
            </span>
          </div>
        ))}
      </div>

      {state.searchInput ? (
        <div className="sticky bottom-0 left-0 border-t border-border bg-muted/80 px-4 py-1.5 text-[13px] backdrop-blur">
          <span className="text-primary">{state.searchInput.forward ? "/" : "?"}</span>
          <span>{state.searchInput.term}</span>
          <span className="ml-px inline-block h-[1.1em] w-[7px] translate-y-[2px] animate-pulse bg-foreground/70" />
        </div>
      ) : null}

      {!focused ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[1px]">
          <span className="rounded-full border border-border bg-card px-4 py-1.5 font-sans text-xs text-muted-foreground shadow-sm">
            Click here to start typing
          </span>
        </div>
      ) : null}
    </div>
  );
}

function renderLine(
  line: string,
  y: number,
  decoration: Map<string, CellKind>,
  cursorRef: React.RefObject<HTMLSpanElement | null>,
  hasCursor: boolean,
) {
  // an empty line still needs a cell so the cursor has somewhere to sit
  const chars = line.length ? line.split("") : [" "];
  return chars.map((ch, x) => {
    const kind = decoration.get(`${y}:${x}`) ?? "plain";
    const isCursor = kind === "cursor" || kind === "cursor-goal";
    return (
      <span
        key={x}
        ref={isCursor && hasCursor ? cursorRef : undefined}
        className={cn(
          kind === "goal" && "bg-destructive/25 text-foreground",
          kind === "select" && "bg-primary/30 text-foreground",
          kind === "cursor" && "bg-foreground text-background",
          kind === "cursor-goal" && "bg-destructive text-background",
        )}
      >
        {ch}
      </span>
    );
  });
}
