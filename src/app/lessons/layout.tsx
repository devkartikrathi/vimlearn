import { SiteHeader } from "@/components/layout/site-header";
import { CurriculumNav } from "@/components/layout/sidebar";

export default function LessonsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader withNav />
      <div className="flex flex-1">
        <aside className="hidden w-[19rem] shrink-0 border-r border-border lg:block">
          <div className="sticky top-14 max-h-[calc(100vh-3.5rem)] overflow-y-auto p-3">
            <CurriculumNav />
          </div>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
