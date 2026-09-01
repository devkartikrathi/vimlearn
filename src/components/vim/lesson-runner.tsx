"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, RotateCcw, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { VimEditor } from "./vim-editor";
import { Keys } from "./keycap";
import { StatsPanel } from "./stats-panel";
import { applyKey, createState, settle } from "@/lib/vim/reducer";
import { buildGoal, judge, score } from "@/lib/vim/goals";
import { BUG_COUNT, generateBoard, infest, makeRng, pick, type Rng } from "@/lib/vim/generators";
import type {
  GameConfig,
  Goal,
  GoalCompletion,
  GoalStatus,
  VimState,
} from "@/lib/vim/types";
import type { DrillConfig, Lesson } from "@/lib/curriculum/types";
import { allowedKeysFor, neighbours } from "@/lib/curriculum/lessons";
import { recordCompletion, recordGoal } from "@/lib/progress";
import { cn } from "@/lib/utils";

const MODE_LABEL: Record<VimState["mode"], string> = {
  normal: "NORMAL",
  insert: "INSERT",
  visual: "VISUAL",
  "visual-line": "V-LINE",
};

const MODE_CLASS: Record<VimState["mode"], string> = {
  normal: "bg-sky-600 text-white",
  insert: "bg-emerald-600 text-white",
  visual: "bg-violet-600 text-white",
  "visual-line": "bg-violet-700 text-white",
};

/** A stable, non-random seed so the prerendered board matches the hydrated one. */
function seedFromSlug(slug: string): number {
  let h = 2166136261;
  for (let i = 0; i < slug.length; i++) {
    h ^= slug.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

interface Round {
  vim: VimState;
  goal: Goal | null;
  original?: string[];
}

/** Draw boards until one of them yields a legal goal for this lesson. */
function buildRound(drill: DrillConfig, allowed: string[], rng: Rng): Round {
  for (let attempt = 0; attempt < 40; attempt++) {
    const kind = pick(rng, drill.boards);
    let lines = generateBoard(kind, rng);
    while (drill.minimumLines && lines.length < drill.minimumLines) {
      lines = [...lines, ...generateBoard(kind, rng)];
    }

    // the bugs eat the finished board, so the repair target is what it was
    let original: string[] | undefined;
    if (drill.tasks.some((t) => t.type === "bugFix")) {
      const infested = infest(lines, rng, BUG_COUNT);
      original = infested.original;
      lines = infested.lines;
    }

    const vim = createState(lines);
    const goal = buildGoal({
      task: pick(rng, drill.tasks),
      lines,
      cursor: vim.cursor,
      rng,
      allowed,
      original,
    });
    if (goal) return { vim, goal, original };
  }
  return { vim: createState(generateBoard(drill.boards[0], rng)), goal: null };
}

export function LessonRunner({ lesson }: { lesson: Lesson }) {
  const drill = lesson.drill!;
  const config: GameConfig = useMemo(
    () => ({
      allowed: allowedKeysFor(lesson.slug),
      goalsToComplete: drill.goals,
      motionsOnly: drill.motionsOnly,
      readonly: drill.readonly,
      minimumLines: drill.minimumLines,
    }),
    [lesson.slug, drill],
  );

  // The first board is seeded from the slug so the server and the browser draw
  // the same one; every board after that is seeded from the clock.
  const rngRef = useRef<Rng>(makeRng(seedFromSlug(lesson.slug)));
  const [status, setStatus] = useState<GoalStatus>("incomplete");
  const [completions, setCompletions] = useState<GoalCompletion[]>([]);
  const [finished, setFinished] = useState(false);
  const [focused, setFocused] = useState(false);
  const goalStart = useRef(0);
  const keysAtStart = useRef(0);

  /* ---------------- building rounds ---------------- */

  const freshBoard = useCallback(
    () => buildRound(drill, config.allowed, rngRef.current),
    [drill, config.allowed],
  );

  const nextGoal = useCallback(
    (vim: VimState, original?: string[]): Round => {
      const rng = rngRef.current;
      for (let attempt = 0; attempt < 40; attempt++) {
        const goal = buildGoal({
          task: pick(rng, drill.tasks),
          lines: vim.lines,
          cursor: vim.cursor,
          rng,
          allowed: config.allowed,
          original,
        });
        if (goal) return { vim, goal, original };
      }
      return buildRound(drill, config.allowed, rng);
    },
    [drill, config.allowed],
  );

  const [round, setRound] = useState<Round>(() =>
    buildRound(drill, config.allowed, makeRng(seedFromSlug(lesson.slug))),
  );

  const start = useCallback(() => {
    rngRef.current = makeRng(Date.now() + Math.floor(Math.random() * 9999));
    setRound(freshBoard());
    setStatus("incomplete");
    setCompletions([]);
    setFinished(false);
    goalStart.current = 0;
    keysAtStart.current = 0;
  }, [freshBoard]);

  /* ---------------- the keystroke loop ---------------- */

  const handleKey = useCallback(
    (key: string) => {
      if (goalStart.current === 0) goalStart.current = Date.now();
      setRound((current) => {
        if (!current.goal || finished) return current;
        const vim = applyKey(current.vim, key, config);
        const verdict = judge(current.goal, vim);
        setStatus(verdict);

        if (verdict !== "completed") return { ...current, vim };

        const completion = score(
          current.goal,
          Date.now() - goalStart.current,
          vim.keystrokes.length - keysAtStart.current,
        );
        recordGoal(lesson.slug, completion);

        setCompletions((prev) => {
          const all = [...prev, completion];
          if (all.length >= config.goalsToComplete) {
            setFinished(true);
            recordCompletion(
              lesson.slug,
              all.reduce((s, c) => s + c.proficiency, 0) / all.length,
            );
          }
          return all;
        });

        if (completions.length + 1 >= config.goalsToComplete) {
          return { ...current, vim, goal: null };
        }

        const next = nextGoal(settle(vim), current.original);
        goalStart.current = Date.now();
        keysAtStart.current = next.vim.keystrokes.length;
        setStatus("incomplete");
        return next;
      });
    },
    [config, finished, lesson.slug, nextGoal, completions.length],
  );

  const { vim, goal } = round;
  const done = completions.length;
  const total = config.goalsToComplete;
  const average = done ? completions.reduce((s, c) => s + c.proficiency, 0) / done : 0;
  const { next } = neighbours(lesson.slug);

  return (
    <div className="space-y-3">
      {/* instruction */}
      <div className="flex min-h-[2.5rem] items-start gap-3 rounded-md border border-border bg-muted/40 px-4 py-2.5 text-sm">
        <span className="mt-[3px] font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Task
        </span>
        <p className="flex-1 text-foreground/90">
          {finished
            ? "Set complete. Play it again or move on."
            : (goal?.instruction ?? "Loading…")}
        </p>
      </div>

      <Tabs defaultValue="challenge">
        <TabsList>
          <TabsTrigger value="challenge">Challenge</TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
        </TabsList>

        <TabsContent value="challenge" className="mt-3 space-y-0">
          <div className="relative">
            <VimEditor
              state={vim}
              goal={goal}
              onKey={handleKey}
              focused={focused}
              onFocusChange={setFocused}
              className="max-h-[420px] min-h-[240px]"
            />

            {vim.callout ? (
              <div
                key={vim.callout.id}
                className="pointer-events-none absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-full border border-destructive/40 bg-destructive/10 px-3.5 py-1.5 font-sans text-xs text-destructive shadow-sm backdrop-blur"
              >
                {vim.callout.text}
              </div>
            ) : null}

            {finished ? <FinishedOverlay average={average} onReplay={start} nextSlug={next?.slug} /> : null}
          </div>

          {/* status bar */}
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-md border border-border bg-muted/40 px-3 py-2 font-mono text-xs">
            <span className={cn("rounded px-2 py-0.5 font-semibold tracking-wider", MODE_CLASS[vim.mode])}>
              {MODE_LABEL[vim.mode]}
            </span>
            <span className="text-muted-foreground tabular-nums">
              {vim.cursor.y + 1},{vim.cursor.x + 1}
            </span>
            {status === "must_undo" ? (
              <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-500">
                <Undo2 className="size-3.5" />
                That is not the target — press{" "}
                {vim.mode === "normal" ? "u" : "Esc, then u"} to undo
              </span>
            ) : null}
            <span className="ml-auto flex items-center gap-3">
              <Progress value={(done / total) * 100} className="h-1.5 w-24" />
              <span className="tabular-nums text-muted-foreground">
                {done} / {total} goals
              </span>
            </span>
          </div>

          {goal && !finished ? (
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-mono uppercase tracking-widest text-[10px]">Optimal</span>
              <Keys keys={goal.solution.slice(0, 8)} tone="muted" />
              {goal.solution.length > 8 ? <span>…</span> : null}
              <span className="tabular-nums">
                · {goal.solution.length} keystroke{goal.solution.length === 1 ? "" : "s"}
              </span>
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="stats" className="mt-3">
          <StatsPanel completions={completions} total={total} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function FinishedOverlay({
  average,
  onReplay,
  nextSlug,
}: {
  average: number;
  onReplay: () => void;
  nextSlug?: string;
}) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 rounded-md bg-background/85 backdrop-blur-sm">
      <div className="text-center">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Proficiency
        </p>
        <p className="font-mono text-5xl font-semibold tabular-nums">
          {Math.round(average)}
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onReplay}>
          <RotateCcw className="size-3.5" /> Practice again
        </Button>
        {nextSlug ? (
          <Button size="sm" render={<Link href={`/lessons/${nextSlug}`} />}>
            Next lesson <ArrowRight className="size-3.5" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
