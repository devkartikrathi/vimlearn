"use client";

import Link from "next/link";
import { ArrowRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Keycap } from "./keycap";
import { CHAPTERS, ALL_LESSONS } from "@/lib/curriculum/lessons";
import { resetProgress } from "@/lib/progress";
import { useProgress } from "@/lib/use-progress";
import { cn } from "@/lib/utils";

export function ProgressDashboard() {
  const progress = useProgress();

  const completed = ALL_LESSONS.filter((l) => progress[l.slug]?.completed);
  const scored = ALL_LESSONS.filter((l) => (progress[l.slug]?.bestProficiency ?? 0) > 0);
  const average = scored.length
    ? scored.reduce((s, l) => s + (progress[l.slug]?.bestProficiency ?? 0), 0) / scored.length
    : 0;
  const weakest = [...scored]
    .sort(
      (a, b) =>
        (progress[a.slug]?.bestProficiency ?? 0) - (progress[b.slug]?.bestProficiency ?? 0),
    )
    .slice(0, 5);
  const nextUp = ALL_LESSONS.find((l) => !progress[l.slug]?.completed);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-mono text-2xl font-semibold tracking-tight">Your progress</h1>
          <p className="mt-1.5 text-[15px] text-muted-foreground">
            Proficiency is speed and keystroke economy combined — 100 means you
            matched the optimal solution at par pace.
          </p>
        </div>
        {completed.length ? (
          <Button variant="ghost" size="sm" onClick={resetProgress}>
            <RotateCcw className="size-3.5" /> Reset progress
          </Button>
        ) : null}
      </header>

      <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3">
        <Tile label="Lessons completed" value={`${completed.length} / ${ALL_LESSONS.length}`} />
        <Tile label="Average proficiency" value={average ? String(Math.round(average)) : "—"} accent />
        <Tile label="Lessons practised" value={String(scored.length)} />
      </div>

      {nextUp ? (
        <div className="flex flex-wrap items-center gap-4 rounded-lg border border-primary/30 bg-primary/5 px-5 py-4">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Pick up where you left off
            </p>
            <p className="mt-1 font-mono text-[15px] font-semibold">{nextUp.title}</p>
          </div>
          <Button size="sm" render={<Link href={`/lessons/${nextUp.slug}`} />}>
            Continue <ArrowRight className="size-3.5" />
          </Button>
        </div>
      ) : null}

      {weakest.length ? (
        <section>
          <h2 className="mb-3 font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Practise these next
          </h2>
          <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
            {weakest.map((lesson) => {
              const p = progress[lesson.slug]?.bestProficiency ?? 0;
              return (
                <li key={lesson.slug}>
                  <Link
                    href={`/lessons/${lesson.slug}`}
                    className="flex items-center gap-4 bg-card px-4 py-3 transition-colors hover:bg-muted/50"
                  >
                    <span className="min-w-0 flex-1 truncate text-[14px]">{lesson.title}</span>
                    <span className="hidden shrink-0 gap-[3px] sm:flex">
                      {lesson.keys.map((k, i) => (
                        <Keycap key={i} k={k} tone="muted" />
                      ))}
                    </span>
                    <Progress value={Math.min(100, p)} className="h-1.5 w-24 shrink-0" />
                    <span className="w-8 shrink-0 text-right font-mono text-xs tabular-nums text-muted-foreground">
                      {Math.round(p)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <section>
        <h2 className="mb-3 font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Every chapter
        </h2>
        <div className="space-y-3">
          {CHAPTERS.map((chapter) => {
            const done = chapter.lessons.filter((l) => progress[l.slug]?.completed).length;
            return (
              <div key={chapter.slug} className="rounded-lg border border-border bg-card">
                <div className="flex items-center gap-3 border-b border-border px-4 py-2.5">
                  <h3 className="font-mono text-[13px] font-semibold">{chapter.title}</h3>
                  <span className="ml-auto font-mono text-xs tabular-nums text-muted-foreground">
                    {done} / {chapter.lessons.length}
                  </span>
                  <Progress
                    value={(done / chapter.lessons.length) * 100}
                    className="h-1.5 w-20"
                  />
                </div>
                <ul className="flex flex-wrap gap-1.5 px-3 py-2.5">
                  {chapter.lessons.map((lesson) => {
                    const p = progress[lesson.slug];
                    return (
                      <li key={lesson.slug}>
                        <Link
                          href={`/lessons/${lesson.slug}`}
                          className={cn(
                            "block rounded-md border px-2.5 py-1 font-mono text-[11.5px] transition-colors",
                            p?.completed
                              ? "border-primary/40 bg-primary/10 text-foreground"
                              : "border-border text-muted-foreground hover:bg-muted",
                          )}
                        >
                          {lesson.title}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Tile({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-card px-5 py-4">
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-1.5 font-mono text-3xl font-semibold tabular-nums",
          accent && "text-primary",
        )}
      >
        {value}
      </p>
    </div>
  );
}
