"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Keys } from "./keycap";
import { LessonRunner } from "./lesson-runner";
import type { Lesson, TeachBlock } from "@/lib/curriculum/types";
import { chapterOf, lessonIndex, neighbours, ALL_LESSONS } from "@/lib/curriculum/lessons";
import { markVisited } from "@/lib/progress";

const KIND_LABEL: Record<Lesson["kind"], string> = {
  concept: "Concept",
  drill: "Drill",
  review: "Review",
  game: "Game",
};

export function LessonView({ lesson }: { lesson: Lesson }) {
  const router = useRouter();
  const chapter = chapterOf(lesson.slug);
  const { prev, next } = neighbours(lesson.slug);
  const index = lessonIndex(lesson.slug);

  useEffect(() => {
    if (lesson.kind === "concept") markVisited(lesson.slug);
  }, [lesson.kind, lesson.slug]);

  // Ctrl+j / Ctrl+k walk the course without touching the mouse
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "j" && next) {
        e.preventDefault();
        router.push(`/lessons/${next.slug}`);
      }
      if (e.key === "k" && prev) {
        e.preventDefault();
        router.push(`/lessons/${prev.slug}`);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, router]);

  return (
    <article className="mx-auto max-w-4xl px-5 py-8 sm:px-8">
      <header className="mb-7">
        <div className="mb-2 flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          <span>{chapter?.title}</span>
          <span className="text-muted-foreground/40">/</span>
          <span className="tabular-nums">
            Lesson {index + 1} of {ALL_LESSONS.length}
          </span>
          <Badge variant="outline" className="ml-1 font-mono text-[10px]">
            {KIND_LABEL[lesson.kind]}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-mono text-2xl font-semibold tracking-tight sm:text-3xl">
            {lesson.title}
          </h1>
          {lesson.kind !== "review" && lesson.kind !== "game" ? (
            <Keys keys={lesson.keys} tone="accent" />
          ) : null}
        </div>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
          {lesson.summary}
        </p>
      </header>

      {lesson.teach?.length ? (
        <section className="mb-8 space-y-3">
          {lesson.teach.map((block, i) => (
            <TeachCard key={i} block={block} />
          ))}
        </section>
      ) : null}

      {lesson.drill ? (
        <section className="mb-8">
          <h2 className="mb-3 font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Now it&apos;s your turn
          </h2>
          <LessonRunner key={lesson.slug} lesson={lesson} />
        </section>
      ) : null}

      {lesson.note ? (
        <p className="mb-8 rounded-md border-l-2 border-primary bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Note. </span>
          {lesson.note}
        </p>
      ) : null}

      <nav className="flex items-center justify-between gap-3 border-t border-border pt-5">
        {prev ? (
          <Button variant="ghost" size="sm" render={<Link href={`/lessons/${prev.slug}`} />}>
            <ArrowLeft className="size-3.5" />
            <span className="max-w-[9rem] truncate">{prev.title}</span>
          </Button>
        ) : (
          <span />
        )}
        {next ? (
          <Button size="sm" render={<Link href={`/lessons/${next.slug}`} />}>
            <span className="max-w-[9rem] truncate">{next.title}</span>
            <ArrowRight className="size-3.5" />
            <kbd className="ml-1.5 hidden rounded border border-primary-foreground/25 px-1 font-mono text-[10px] sm:inline">
              Ctrl+j
            </kbd>
          </Button>
        ) : (
          <Button size="sm" variant="outline" render={<Link href="/dashboard" />}>
            See your progress <ArrowRight className="size-3.5" />
          </Button>
        )}
      </nav>
    </article>
  );
}

function TeachCard({ block }: { block: TeachBlock }) {
  const hasExample = Boolean(block.example);

  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
        {block.keys?.length ? <Keys keys={block.keys} /> : null}
        <span
          className={
            block.body
              ? "font-medium text-foreground"
              : "text-[15px] text-muted-foreground"
          }
        >
          {block.label}
        </span>
      </div>
      {block.body ? (
        <p className="mt-1.5 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
          {block.body}
        </p>
      ) : null}
      {hasExample ? (
        <Accordion className="mt-2">
          <AccordionItem value="example" className="border-none">
            <AccordionTrigger className="py-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground hover:no-underline">
              show example
            </AccordionTrigger>
            <AccordionContent className="pb-1">
              <pre className="overflow-x-auto rounded-md border border-border bg-muted/40 px-3 py-2.5 font-mono text-[12.5px] leading-relaxed">
                {block.example}
              </pre>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      ) : null}
    </div>
  );
}
