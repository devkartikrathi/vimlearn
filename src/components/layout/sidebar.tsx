"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, Gamepad2, Repeat2 } from "lucide-react";
import { CHAPTERS } from "@/lib/curriculum/lessons";
import { useProgress } from "@/lib/use-progress";
import { Keycap } from "@/components/vim/keycap";
import { cn } from "@/lib/utils";

export function CurriculumNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const progress = useProgress();

  return (
    <nav className="space-y-6 pb-16" aria-label="Curriculum">
      {CHAPTERS.map((chapter, ci) => (
        <div key={chapter.slug}>
          <h2 className="mb-1.5 flex items-baseline gap-2 px-3">
            <span className="font-mono text-[10px] tabular-nums text-muted-foreground/60">
              {String(ci + 1).padStart(2, "0")}
            </span>
            <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {chapter.title}
            </span>
          </h2>
          <ul>
            {chapter.lessons.map((lesson) => {
              const href = `/lessons/${lesson.slug}`;
              const active = pathname === href;
              const done = progress[lesson.slug]?.completed;
              return (
                <li key={lesson.slug}>
                  <Link
                    href={href}
                    onClick={onNavigate}
                    className={cn(
                      "group flex items-center gap-2 rounded-md px-3 py-1.5 text-[13px] transition-colors",
                      active
                        ? "bg-primary/10 text-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-3.5 shrink-0 items-center justify-center rounded-full border",
                        done
                          ? "border-primary bg-primary text-primary-foreground"
                          : active
                            ? "border-primary"
                            : "border-border",
                      )}
                    >
                      {done ? <Check className="size-2.5" strokeWidth={3} /> : null}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{lesson.title}</span>
                    <span className="flex shrink-0 items-center gap-[3px]">
                      {lesson.kind === "review" ? (
                        <Repeat2 className="size-3.5 text-violet-500" />
                      ) : lesson.kind === "game" ? (
                        <Gamepad2 className="size-3.5 text-violet-500" />
                      ) : (
                        lesson.keys.map((k, i) => (
                          <Keycap
                            key={i}
                            k={k}
                            tone={active ? "accent" : "muted"}
                            className="opacity-80 group-hover:opacity-100"
                          />
                        ))
                      )}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
