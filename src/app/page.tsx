import Link from "next/link";
import { ArrowRight, Gauge, Keyboard, ListOrdered } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/layout/site-header";
import { Playground } from "@/components/vim/playground";
import { Keycap } from "@/components/vim/keycap";
import { ALL_LESSONS, CHAPTERS } from "@/lib/curriculum/lessons";

const HOW_IT_WORKS = [
  {
    icon: Keyboard,
    title: "Learn by pressing keys",
    body:
      "Every lesson puts you inside a real modal editor. No videos to pause, no snippets to copy — you are typing Vim commands from the very first screen.",
  },
  {
    icon: Gauge,
    title: "Build real muscle memory",
    body:
      "Challenges are generated fresh every time, so you can repeat a lesson until it sticks. Each goal is scored on speed and on how close you came to the optimal keystrokes.",
  },
  {
    icon: ListOrdered,
    title: "Structured from zero",
    body:
      "Motions, then operators, then text objects, then visual mode. Every lesson is a new combination of things already in your fingers — never a new idea and a new key at once.",
  },
];

export default function Home() {
  const chapterCount = CHAPTERS.length;

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />

      {/* hero */}
      <section className="mx-auto w-full max-w-6xl px-5 pt-14 pb-16 sm:px-8 sm:pt-20">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-center">
          <div>
            <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              {ALL_LESSONS.length} lessons · {chapterCount} chapters · free
            </p>
            <h1 className="text-balance font-mono text-4xl leading-[1.05] font-semibold tracking-tight sm:text-5xl">
              Learn Vim.
              <br />
              <span className="text-muted-foreground">Finally make it stick.</span>
            </h1>
            <p className="mt-5 max-w-lg text-[17px] leading-relaxed text-muted-foreground">
              VimLearn is the hands-on Vim course that actually builds muscle
              memory. Master motions, operators and text objects through
              interactive drills on real code.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Button size="lg" render={<Link href="/lessons/intro-to-modes" />}>
                Start learning Vim <ArrowRight className="size-4" />
              </Button>
              <Button size="lg" variant="ghost" render={<Link href="/dashboard" />}>
                See the curriculum
              </Button>
            </div>
            <p className="mt-5 flex flex-wrap items-center gap-2 font-mono text-xs text-muted-foreground">
              No setup, no config files.
              <span className="inline-flex items-center gap-1">
                Just press <Keycap k="j" /> <Keycap k="k" />.
              </span>
            </p>
          </div>

          <Playground />
        </div>
      </section>

      {/* how it works */}
      <section className="border-t border-border bg-muted/25">
        <div className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-8">
          <h2 className="mb-8 font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            How it works
          </h2>
          <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-3">
            {HOW_IT_WORKS.map(({ icon: Icon, title, body }, i) => (
              <div key={title} className="bg-card p-6">
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icon className="size-4" />
                  </span>
                  <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="mb-2 font-mono text-[15px] font-semibold">{title}</h3>
                <p className="text-[14.5px] leading-relaxed text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* curriculum */}
      <section className="border-t border-border">
        <div className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-8">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                The curriculum
              </h2>
              <p className="mt-2 max-w-xl text-[15px] text-muted-foreground">
                Start at the beginning or jump straight to the command you keep
                forgetting. Every lesson is independent.
              </p>
            </div>
            <Button variant="outline" size="sm" render={<Link href="/lessons/intro-to-modes" />}>
              Start from lesson one <ArrowRight className="size-3.5" />
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CHAPTERS.map((chapter, ci) => (
              <div key={chapter.slug} className="rounded-lg border border-border bg-card">
                <div className="flex items-baseline gap-2 border-b border-border px-4 py-2.5">
                  <span className="font-mono text-[11px] tabular-nums text-muted-foreground/60">
                    {String(ci + 1).padStart(2, "0")}
                  </span>
                  <h3 className="font-mono text-[13px] font-semibold">{chapter.title}</h3>
                </div>
                <ul className="px-2 py-1.5">
                  {chapter.lessons.map((lesson) => (
                    <li key={lesson.slug}>
                      <Link
                        href={`/lessons/${lesson.slug}`}
                        className="flex items-center gap-2 rounded-md px-2 py-1 text-[13px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <span className="min-w-0 flex-1 truncate">{lesson.title}</span>
                        <span className="flex shrink-0 gap-[3px]">
                          {lesson.keys.map((k, i) => (
                            <Keycap key={i} k={k} tone="muted" />
                          ))}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* closing */}
      <section className="border-t border-border bg-muted/25">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 text-center sm:px-8">
          <h2 className="font-mono text-2xl font-semibold tracking-tight sm:text-3xl">
            Free to start.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[15px] text-muted-foreground">
            No setup. No config files. Open the browser and move.
          </p>
          <Button size="lg" className="mt-6" render={<Link href="/lessons/intro-to-modes" />}>
            Start learning Vim <ArrowRight className="size-4" />
          </Button>
        </div>
      </section>

      <footer className="border-t border-border px-5 py-6 sm:px-8">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 font-mono text-[11px] text-muted-foreground">
          <span>VimLearn</span>
          <span>{ALL_LESSONS.length} lessons · built with the keyboard</span>
        </div>
      </footer>
    </div>
  );
}
