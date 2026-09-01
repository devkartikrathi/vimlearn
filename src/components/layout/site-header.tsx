import Link from "next/link";
import { BarChart3, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "./theme-toggle";
import { CurriculumNav } from "./sidebar";

export function SiteHeader({ withNav = false }: { withNav?: boolean }) {
  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur">
      {withNav ? (
        <Sheet>
          <SheetTrigger
            render={
              <Button variant="ghost" size="icon-sm" aria-label="Open curriculum" className="lg:hidden" />
            }
          >
            <Menu className="size-4" />
          </SheetTrigger>
          <SheetContent side="left" className="w-[22rem] overflow-y-auto p-4">
            <SheetTitle className="px-3 pb-3 font-mono text-sm">Curriculum</SheetTitle>
            <CurriculumNav />
          </SheetContent>
        </Sheet>
      ) : null}

      <Link href="/" className="flex items-center gap-2">
        <span className="flex size-6 items-center justify-center rounded bg-primary font-mono text-[11px] font-bold text-primary-foreground">
          :
        </span>
        <span className="font-mono text-sm font-semibold tracking-tight">VimLearn</span>
      </Link>

      <div className="ml-auto flex items-center gap-1">
        <Button variant="ghost" size="sm" render={<Link href="/dashboard" />}>
          <BarChart3 className="size-3.5" />
          <span className="hidden sm:inline">Progress</span>
        </Button>
        <ThemeToggle />
      </div>
    </header>
  );
}
