"use client";

import type { GoalCompletion } from "@/lib/vim/types";
import { cn } from "@/lib/utils";

export function StatsPanel({
  completions,
  total,
}: {
  completions: GoalCompletion[];
  total: number;
}) {
  if (!completions.length) {
    return (
      <div className="rounded-md border border-dashed border-border px-5 py-10 text-center text-sm text-muted-foreground">
        Complete a goal and your speed and accuracy will show up here.
      </div>
    );
  }

  const avg = (fn: (c: GoalCompletion) => number) =>
    completions.reduce((s, c) => s + fn(c), 0) / completions.length;

  const speed = avg((c) => c.speedScore);
  const accuracy = avg((c) => c.accuracyScore);
  const proficiency = avg((c) => c.proficiency);
  const time = avg((c) => c.actualMs) / 1000;
  const extraKeys = completions.reduce((s, c) => s + (c.actualKeys - c.solutionKeys), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-4">
        <Stat label="Proficiency" value={Math.round(proficiency)} accent />
        <Stat label="Speed" value={Math.round(speed)} />
        <Stat label="Accuracy" value={Math.round(accuracy)} />
        <Stat label="Avg time" value={`${time.toFixed(1)}s`} />
      </div>

      <div className="rounded-md border border-border">
        <div className="flex items-center justify-between border-b border-border px-4 py-2 text-xs text-muted-foreground">
          <span className="font-mono uppercase tracking-widest text-[10px]">
            Per goal
          </span>
          <span className="tabular-nums">
            {completions.length} / {total} · {extraKeys >= 0 ? "+" : ""}
            {extraKeys} keystrokes over optimal
          </span>
        </div>
        <ul className="divide-y divide-border">
          {completions.map((c, i) => (
            <li key={i} className="flex items-center gap-4 px-4 py-2 font-mono text-xs">
              <span className="w-6 text-muted-foreground tabular-nums">{i + 1}</span>
              <span className="w-20 tabular-nums text-muted-foreground">
                {(c.actualMs / 1000).toFixed(1)}s
              </span>
              <span className="w-24 tabular-nums text-muted-foreground">
                {c.actualKeys}/{c.solutionKeys} keys
              </span>
              <span className="ml-auto flex items-center gap-2">
                <span className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                  <span
                    className={cn(
                      "block h-full rounded-full",
                      c.proficiency >= 85
                        ? "bg-emerald-500"
                        : c.proficiency >= 60
                          ? "bg-amber-500"
                          : "bg-destructive",
                    )}
                    style={{ width: `${Math.min(100, c.proficiency)}%` }}
                  />
                </span>
                <span className="w-8 text-right tabular-nums">
                  {Math.round(c.proficiency)}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent?: boolean;
}) {
  return (
    <div className="bg-card px-4 py-3">
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 font-mono text-2xl font-semibold tabular-nums",
          accent && "text-primary",
        )}
      >
        {value}
      </p>
    </div>
  );
}
